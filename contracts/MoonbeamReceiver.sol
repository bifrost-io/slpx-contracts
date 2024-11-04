// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.8.10;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/Create2.sol";
import "./interfaces/IOFTReceiverV2.sol";
import "./interfaces/IOFTV2.sol";
import "./interfaces/ISlpx.sol";
import "./DerivativeContract.sol";

contract MoonbeamReceiver is Ownable, IOFTReceiverV2 {
    uint16 public constant destChainId = 217;

    address public constant VMANTA = 0xFFfFFfFfdA2a05FB50e7ae99275F4341AEd43379;
    address public constant MANTA = 0xfFFffFFf7D3875460d4509eb8d0362c611B4E841;
    address public constant slpx = 0xF1d4797E51a4640a76769A50b57abE7479ADd3d8;
    address public constant mantaOFT =
    0x17313cE6e47D796E61fDeAc34Ab1F58e3e089082;
    address public constant vMantaProxyOFT =
    0xDeBBb9309d95DaBbFb82411a9C6Daa3909B164A4;
    address public mantaPacificSlpx;
    uint256 public layerZeroFee;
    address public scriptTrigger;
    mapping(address => address) public callerToDerivativeAddress;

    event SetDerivativeAddress(
        address indexed caller,
        address indexed derivativeAddress
    );
    event SetLayerZeroFee(
        address indexed scriptTrigger,
        uint256 indexed layerZeroFee
    );
    event SetScriptTrigger(address indexed scriptTrigger);

    function setRemoteContract(address _mantaPacificSlpx) public onlyOwner {
        require(_mantaPacificSlpx != address(0), "Invalid mantaPacificSlpx");
        mantaPacificSlpx = _mantaPacificSlpx;
    }

    function onOFTReceived(
        uint16 srcChainId,
        bytes calldata,
        uint64,
        bytes32 from,
        uint amount,
        bytes calldata payload
    ) external override {
        require(
            srcChainId == destChainId,
            "only receive msg from manta pacific"
        );
        require(
            _msgSender() == mantaOFT || _msgSender() == vMantaProxyOFT,
            "only native oft can call"
        );
        require(
            address(uint160(uint(from))) == mantaPacificSlpx,
            "only receive msg from mantaPacificSlpx"
        );
        (address caller, uint32 channel_id) = abi.decode(
            payload,
            (address, uint32)
        );

        if (callerToDerivativeAddress[caller] == address(0)) {
            setDerivativeAddress(caller);
        }

        // vManta:
        // msg.sender = vMantaProxyOFT, from = mantaPacificSlpx,
        // Manta:
        // msg.sender = mantaOFT, from = mantaPacificSlpx
        address asset_address;
        if (_msgSender() == mantaOFT) {
            bool success = IERC20(MANTA).transfer(scriptTrigger, layerZeroFee);
            require(success, "failed to charge");
            asset_address = MANTA;
        } else if(_msgSender() == vMantaProxyOFT) {
            bool success = IERC20(VMANTA).transfer(scriptTrigger, layerZeroFee);
            require(success, "failed to charge");
            asset_address = VMANTA;
        } else {
            revert("invalid msg.sender");
        }

        IERC20(asset_address).approve(slpx, amount - layerZeroFee);
        ISlpx(slpx).create_order(
            asset_address,
            uint128(amount - layerZeroFee),
            uint64(block.chainid),
            abi.encodePacked(callerToDerivativeAddress[caller]),
            "MantaPacificV2",
            channel_id
        );
    }

    function claimVManta(
        address addr,
        bytes calldata _adapterParams
    ) external payable {
        require(_msgSender() == scriptTrigger, "must be scriptTrigger");
        address derivativeAddress = callerToDerivativeAddress[addr];
        require(derivativeAddress != address(0), "invalid address");
        uint256 amount = DerivativeContract(derivativeAddress)
            .withdrawErc20Token(VMANTA);
        IERC20(VMANTA).approve(vMantaProxyOFT, amount);
        ICommonOFT.LzCallParams memory callParams = ICommonOFT.LzCallParams(
            payable(_msgSender()),
            address(0),
            _adapterParams
        );
        bytes32 toAddress = bytes32(uint256(uint160(addr)));
        (uint256 estimateFee, ) = IOFTV2(vMantaProxyOFT).estimateSendFee(
            destChainId,
            toAddress,
            amount,
            false,
            _adapterParams
        );
        require(msg.value >= estimateFee, "too small fee");
        if (msg.value != estimateFee) {
            uint256 refundAmount = msg.value - estimateFee;
            (bool success, ) = _msgSender().call{value: refundAmount}("");
            require(success, "failed to refund");
        }
        IOFTV2(vMantaProxyOFT).sendFrom{value: estimateFee}(
            address(this),
            destChainId,
            toAddress,
            amount,
            callParams
        );
    }

    function claimManta(
        address addr,
        bytes calldata _adapterParams
    ) external payable {
        require(_msgSender() == scriptTrigger, "must be scriptTrigger");
        address derivativeAddress = callerToDerivativeAddress[addr];
        require(derivativeAddress != address(0), "invalid address");
        uint256 amount = DerivativeContract(derivativeAddress)
            .withdrawErc20Token(MANTA);
        IERC20(MANTA).approve(mantaOFT, amount);
        ICommonOFT.LzCallParams memory callParams = ICommonOFT.LzCallParams(
            payable(_msgSender()),
            address(0),
            _adapterParams
        );
        bytes32 toAddress = bytes32(uint256(uint160(addr)));
        (uint256 estimateFee, ) = IOFTV2(mantaOFT).estimateSendFee(
            destChainId,
            toAddress,
            amount,
            false,
            _adapterParams
        );
        require(msg.value >= estimateFee, "too small fee");
        if (msg.value != estimateFee) {
            uint256 refundAmount = msg.value - estimateFee;
            (bool success, ) = _msgSender().call{value: refundAmount}("");
            require(success, "failed to refund");
        }
        IOFTV2(mantaOFT).sendFrom{value: estimateFee}(
            address(this),
            destChainId,
            toAddress,
            amount,
            callParams
        );
    }

    function setDerivativeAddress(address addr) public {
        require(
            callerToDerivativeAddress[addr] == address(0),
            "already set derivativeAddress"
        );
        bytes memory bytecode = type(DerivativeContract).creationCode;
        bytes32 salt = bytes32(uint256(uint160(addr)));
        address derivativeAddress = Create2.deploy(0, salt, bytecode);
        callerToDerivativeAddress[addr] = derivativeAddress;
        emit SetDerivativeAddress(addr, derivativeAddress);
    }

    function setLayerZeroFee(uint256 _layerZeroFee) external {
        require(_msgSender() == scriptTrigger, "must be scriptTrigger");
        layerZeroFee = _layerZeroFee;
        emit SetLayerZeroFee(scriptTrigger, _layerZeroFee);
    }

    function setScriptTrigger(address _scriptTrigger) external onlyOwner {
        require(_scriptTrigger != address(0), "invalid address");
        scriptTrigger = _scriptTrigger;
        emit SetScriptTrigger(_scriptTrigger);
    }
}

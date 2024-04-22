// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.8.10;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/Create2.sol";
import "./interfaces/IOFTReceiverV2.sol";
import "./interfaces/IOFTV2.sol";
import "./interfaces/Types.sol";
import "./utils/BuildCallData.sol";
import "./utils/AddressToAccount.sol";
import "./MoonbeamSlpx.sol";
import "./DerivativeContract.sol";
import "./interfaces/Xtokens.sol";
import "./interfaces/XcmTransactorV2.sol";

contract MoonbeamReceiver is Ownable, IOFTReceiverV2 {
    bytes1 private constant MOONBEAM_CHAIN_TYPE = 0x01;
    bytes2 private constant MANTA_CURRENCY_ID = 0x0808;
    bytes2 private constant VMANTA_CURRENCY_ID = 0x0908;
    uint256 private constant BIFROST_PARA_ID = 2030;
    bool private constant IS_RELAY_CHAIN = false;
    uint16 public constant destChainId = 217;
    address internal constant XTOKENS =
        0x0000000000000000000000000000000000000804;
    address internal constant NATIVE_ASSET_ADDRESS =
        0x0000000000000000000000000000000000000802;
    address internal constant XCM_TRANSACTORV2_ADDRESS =
        0x000000000000000000000000000000000000080D;

    address public constant BNC = 0xFFffffFf7cC06abdF7201b350A1265c62C8601d2;
    address public constant VMANTA = 0xFFfFFfFfdA2a05FB50e7ae99275F4341AEd43379;
    address public constant MANTA = 0xfFFffFFf7D3875460d4509eb8d0362c611B4E841;
    address public constant moonbeamSlpx =
        0xF1d4797E51a4640a76769A50b57abE7479ADd3d8;
    address public constant mantaOFT =
        0x17313cE6e47D796E61fDeAc34Ab1F58e3e089082;
    address public constant vMantaProxyOFT =
        0xDeBBb9309d95DaBbFb82411a9C6Daa3909B164A4;
    address public mantaPacificSlpx;
    uint256 public layerZeroFee;
    address public scriptTrigger;
    mapping(address => address) public callerToDerivativeAddress;

    event Mint(
        address indexed caller,
        address indexed derivativeAddress,
        uint256 indexed amount
    );
    event Redeem(
        address indexed caller,
        address indexed derivativeAddress,
        uint256 indexed amount
    );
    event SetDerivativeAddress(
        address indexed caller,
        address indexed derivativeAddress
    );
    event Receive(address indexed sender, uint256 indexed amount);
    event SetLayerZeroFee(
        address indexed scriptTrigger,
        uint256 indexed layerZeroFee
    );
    event SetScriptTrigger(address indexed scriptTrigger);

    function setRemoteContract(address _mantaPacificSlpx) public onlyOwner {
        require(_mantaPacificSlpx != address(0), "Invalid mantaPacificSlpx");
        mantaPacificSlpx = _mantaPacificSlpx;
    }

    function bifrostSlpxMint(
        address _from,
        address _to,
        uint256 _amount
    ) internal {
        require(_from != address(0), "Invalid from");
        require(_to != address(0), "Invalid to");
        require(_amount != 0, "Invalid amount");
        xcmTransferAsset(MANTA, _from, _amount);

        bytes memory targetChain = abi.encodePacked(MOONBEAM_CHAIN_TYPE, _to);
        bytes memory callData = BuildCallData.buildMintCallBytes(
            _from,
            MANTA_CURRENCY_ID,
            targetChain,
            "MantaPacific"
        );
        (
            uint64 transactRequiredWeightAtMost,
            uint256 feeAmount,
            uint64 overallWeight
        ) = MoonbeamSlpx(moonbeamSlpx).operationToFeeInfo(
                MoonbeamSlpx.Operation.Mint
            );

        // xcm transact
        XcmTransactorV2(XCM_TRANSACTORV2_ADDRESS).transactThroughSigned(
            getXcmTransactorDestination(),
            BNC,
            transactRequiredWeightAtMost,
            callData,
            feeAmount,
            overallWeight
        );
        emit Mint(_from, _to, _amount);
    }

    function bifrostSlpxRedeem(
        address _from,
        address _to,
        uint256 _amount
    ) internal {
        require(_from != address(0), "Invalid from");
        require(_to != address(0), "Invalid to");
        require(_amount != 0, "Invalid amount");
        xcmTransferAsset(VMANTA, _from, _amount);

        bytes memory targetChain = abi.encodePacked(MOONBEAM_CHAIN_TYPE, _to);
        bytes memory callData = BuildCallData.buildRedeemCallBytes(
            _from,
            VMANTA_CURRENCY_ID,
            targetChain
        );

        (
            uint64 transactRequiredWeightAtMost,
            uint256 feeAmount,
            uint64 overallWeight
        ) = MoonbeamSlpx(moonbeamSlpx).operationToFeeInfo(
                MoonbeamSlpx.Operation.Redeem
            );
        XcmTransactorV2(XCM_TRANSACTORV2_ADDRESS).transactThroughSigned(
            getXcmTransactorDestination(),
            BNC,
            transactRequiredWeightAtMost,
            callData,
            feeAmount,
            overallWeight
        );
        emit Redeem(_from, _to, _amount);
    }

    function onOFTReceived(
        uint16 _srcChainId,
        bytes calldata,
        uint64,
        bytes32 _from,
        uint _amount,
        bytes calldata _payload
    ) external override {
        require(
            _srcChainId == destChainId,
            "only receive msg from manta pacific"
        );
        require(
            _msgSender() == mantaOFT || _msgSender() == vMantaProxyOFT,
            "only native oft can call"
        );
        require(
            address(uint160(uint(_from))) == mantaPacificSlpx,
            "only receive msg from mantaPacificSlpx"
        );
        (address caller, Types.Operation operation) = abi.decode(
            _payload,
            (address, Types.Operation)
        );
        if (callerToDerivativeAddress[caller] == address(0)) {
            setDerivativeAddress(caller);
        }

        if (operation == Types.Operation.Mint) {
            bool success = IERC20(MANTA).transfer(scriptTrigger, layerZeroFee);
            require(success, "failed to charge");
            bifrostSlpxMint(
                caller,
                callerToDerivativeAddress[caller],
                _amount - layerZeroFee
            );
        } else if (operation == Types.Operation.Redeem) {
            bool success = IERC20(VMANTA).transfer(scriptTrigger, layerZeroFee);
            require(success, "failed to charge");
            bifrostSlpxRedeem(
                caller,
                callerToDerivativeAddress[caller],
                _amount - layerZeroFee
            );
        }
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

    function xcmTransferAsset(
        address assetAddress,
        address to,
        uint256 amount
    ) internal {
        require(assetAddress != address(0), "Invalid assetAddress");
        bytes32 publicKey = AddressToAccount.AddressToSubstrateAccount(to);

        Xtokens.Multilocation memory dest_account = getXtokensDestination(
            publicKey
        );
        Xtokens(XTOKENS).transfer(
            assetAddress,
            amount,
            dest_account,
            type(uint64).max
        );
    }

    function getXtokensDestination(
        bytes32 publicKey
    ) internal pure returns (Xtokens.Multilocation memory) {
        bytes[] memory interior = new bytes[](2);
        interior[0] = bytes.concat(hex"00", bytes4(uint32(2030)));
        interior[1] = bytes.concat(hex"01", publicKey, hex"00");
        Xtokens.Multilocation memory dest = Xtokens.Multilocation({
            parents: 1,
            interior: interior
        });
        return dest;
    }

    function getXcmTransactorDestination()
        internal
        pure
        returns (XcmTransactorV2.Multilocation memory)
    {
        bytes[] memory interior = new bytes[](1);
        interior[0] = bytes.concat(hex"00", bytes4(uint32(2030)));
        XcmTransactorV2.Multilocation
            memory xcmTransactorDestination = XcmTransactorV2.Multilocation({
                parents: 1,
                interior: interior
            });
        return xcmTransactorDestination;
    }
}

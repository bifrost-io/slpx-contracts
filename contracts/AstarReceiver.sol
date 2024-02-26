// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.8.10;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/Create2.sol";
import "./interfaces/IOFTReceiverV2.sol";
import "./interfaces/IOFTV2.sol";
import "./interfaces/IOFTWithFee.sol";
import "./interfaces/XCM.sol";
import "./interfaces/XCM_v2.sol";
import "./interfaces/Types.sol";
import "./utils/BuildCallData.sol";
import "./utils/AddressToAccount.sol";
import "./AstarSlpx.sol";
import "./DerivativeContract.sol";

contract AstarReceiver is Ownable, IOFTReceiverV2 {
    bytes1 private constant ASTAR_CHAIN_TYPE = 0x00;
    bytes2 private constant ASTR_CURRENCY_ID = 0x0803;
    bytes2 private constant VASTR_CURRENCY_ID = 0x0903;
    uint256 private constant BIFROST_PARA_ID = 2030;
    bool private constant IS_RELAY_CHAIN = false;
    address public constant BNC = 0xfFffFffF00000000000000010000000000000007;
    address public constant astarSlpx =
        0x2fD8bbF5dc8b342C09ABF34f211b3488e2d9d691;
    address public constant polkadotXcm =
        0x0000000000000000000000000000000000005004;
    address public constant astrNativeOFT =
        0xEaFAF3EDA029A62bCbE8a0C9a4549ef0fEd5a400;
    address public constant vAstrProxyOFT =
        0xF1d4797E51a4640a76769A50b57abE7479ADd3d8;
    address public astarZkSlpx;
    address public VASTR;
    uint16 public destChainId;
    mapping(address => address) public callerToDerivativeAddress;
    mapping(address => bool) public isDerivativeAddress;

    event Mint(address caller, address derivativeAddress, uint256 amount);
    event Redeem(address caller, address derivativeAddress, uint256 amount);

    constructor(address _astarZkSlpx, address vastr, uint16 _destChainId) {
        require(_astarZkSlpx != address(0), "Invalid _astarZkSlpx");
        require(vastr != address(0), "Invalid vastr");
        astarZkSlpx = _astarZkSlpx;
        VASTR = vastr;
        destChainId = _destChainId;
    }

    function zkSlpxMint(address _from, address _to, uint256 _amount) internal {
        require(_from != address(0), "Invalid from");
        require(_to != address(0), "Invalid to");
        require(_amount != 0, "Invalid amount");
        xcmTransferNativeAsset(_from, _amount);

        bytes memory targetChain = abi.encodePacked(ASTAR_CHAIN_TYPE, _to);
        bytes memory callData = BuildCallData.buildMintCallBytes(
            _from,
            ASTR_CURRENCY_ID,
            targetChain,
            "AstarZkEvm"
        );
        (uint64 transactWeight, uint256 feeAmount) = AstarSlpx(astarSlpx)
            .operationToFeeInfo(AstarSlpx.Operation.Mint);

        // xcm transact
        require(
            XCM(polkadotXcm).remote_transact(
                BIFROST_PARA_ID,
                IS_RELAY_CHAIN,
                BNC,
                feeAmount,
                callData,
                transactWeight
            ),
            "Failed to send xcm"
        );
        emit Mint(_from, _to, _amount);
    }

    function zkSlpxRedeem(
        address _from,
        address _to,
        uint256 _amount
    ) internal {
        require(_from != address(0), "Invalid from");
        require(_to != address(0), "Invalid to");
        require(_amount != 0, "Invalid amount");
        xcmTransferAsset(VASTR, _from, _amount);

        bytes memory targetChain = abi.encodePacked(ASTAR_CHAIN_TYPE, _to);
        bytes memory callData = BuildCallData.buildRedeemCallBytes(
            _from,
            VASTR_CURRENCY_ID,
            targetChain
        );
        (uint64 transactWeight, uint256 feeAmount) = AstarSlpx(astarSlpx)
            .operationToFeeInfo(AstarSlpx.Operation.Redeem);

        // xcm transact
        require(
            XCM(polkadotXcm).remote_transact(
                BIFROST_PARA_ID,
                IS_RELAY_CHAIN,
                BNC,
                feeAmount,
                callData,
                transactWeight
            ),
            "Failed to send xcm"
        );
        emit Redeem(_from, _to, _amount);
    }

    function onOFTReceived(
        uint16,
        bytes calldata,
        uint64,
        bytes32 _from,
        uint _amount,
        bytes calldata _payload
    ) external override {
        require(
            _msgSender() == astrNativeOFT || _msgSender() == vAstrProxyOFT,
            "only native oft can call"
        );
        require(
            address(uint160(uint(_from))) == astarZkSlpx,
            "only receive msg from astarZkSlpx"
        );
        (address caller, Types.Operation operation) = abi.decode(
            _payload,
            (address, Types.Operation)
        );
        if (callerToDerivativeAddress[caller] == address(0)) {
            setDerivativeAddress(caller);
        }

        if (operation == Types.Operation.Mint) {
            IOFTWithFee(astrNativeOFT).withdraw(_amount);
            zkSlpxMint(caller, callerToDerivativeAddress[caller], _amount);
        } else if (operation == Types.Operation.Redeem) {
            zkSlpxRedeem(caller, callerToDerivativeAddress[caller], _amount);
        }
    }

    function claimVAstr(
        address addr,
        bytes calldata _adapterParams
    ) external payable {
        address derivativeAddress = callerToDerivativeAddress[addr];
        require(derivativeAddress != address(0), "invalid address");
        uint256 amount = DerivativeContract(derivativeAddress).withdraw(VASTR);
        IERC20(VASTR).approve(vAstrProxyOFT, amount);
        ICommonOFT.LzCallParams memory callParams = ICommonOFT.LzCallParams(
            payable(_msgSender()),
            address(0),
            _adapterParams
        );
        bytes32 toAddress = bytes32(uint256(uint160(addr)));
        (uint256 estimateFee, ) = IOFTV2(vAstrProxyOFT).estimateSendFee(
            destChainId,
            toAddress,
            amount,
            false,
            _adapterParams
        );
        require(msg.value >= estimateFee, "too small fee");
        if (msg.value != estimateFee) {
            uint256 refundAmount = msg.value - estimateFee;
            payable(_msgSender()).transfer(refundAmount);
        }
        IOFTV2(vAstrProxyOFT).sendFrom{value: estimateFee}(
            address(this),
            destChainId,
            toAddress,
            amount,
            callParams
        );
    }

    function claimAstr(
        address addr,
        uint256 _amount,
        uint256 _minAmount,
        bytes calldata _adapterParams
    ) external payable {
        DerivativeContract(callerToDerivativeAddress[addr]).withdrawAstr(
            _amount
        );
        ICommonOFT.LzCallParams memory callParams = ICommonOFT.LzCallParams(
            payable(_msgSender()),
            address(0),
            _adapterParams
        );
        bytes32 toAddress = bytes32(uint256(uint160(addr)));
        (uint256 estimateFee, ) = IOFTWithFee(astrNativeOFT).estimateSendFee(
            destChainId,
            toAddress,
            _amount,
            false,
            _adapterParams
        );
        require(msg.value >= estimateFee, "too small fee");
        if (msg.value != estimateFee) {
            uint256 refundAmount = msg.value - estimateFee;
            payable(_msgSender()).transfer(refundAmount);
        }
        IOFTWithFee(astrNativeOFT).sendFrom{value: _amount + estimateFee}(
            address(this),
            destChainId,
            toAddress,
            _amount,
            _minAmount,
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
        isDerivativeAddress[derivativeAddress] = true;
    }

    function xcmTransferNativeAsset(address to, uint256 amount) internal {
        bytes32 publicKey = AddressToAccount.AddressToSubstrateAccount(to);
        address[] memory assetId = new address[](1);
        uint256[] memory assetAmount = new uint256[](1);
        assetId[0] = address(0);
        assetAmount[0] = amount;
        require(
            XCM(polkadotXcm).assets_reserve_transfer(
                assetId,
                assetAmount,
                publicKey,
                IS_RELAY_CHAIN,
                BIFROST_PARA_ID,
                0
            ),
            "Failed to send xcm"
        );
    }

    function xcmTransferAsset(
        address assetAddress,
        address to,
        uint256 amount
    ) internal {
        require(assetAddress != address(0), "Invalid assetAddress");
        bytes32 publicKey = AddressToAccount.AddressToSubstrateAccount(to);

        address[] memory assetId = new address[](1);
        uint256[] memory assetAmount = new uint256[](1);
        assetId[0] = assetAddress;
        assetAmount[0] = amount;
        require(
            XCM(polkadotXcm).assets_withdraw(
                assetId,
                assetAmount,
                publicKey,
                IS_RELAY_CHAIN,
                BIFROST_PARA_ID,
                0
            ),
            "Failed to send xcm"
        );
    }

    function getXtokensDestination(
        bytes32 publicKey
    ) internal pure returns (XCM_v2.Multilocation memory) {
        bytes[] memory interior = new bytes[](2);
        interior[0] = bytes.concat(hex"00", bytes4(uint32(2030)));
        interior[1] = bytes.concat(hex"01", publicKey, hex"00");
        XCM_v2.Multilocation memory dest = XCM_v2.Multilocation({
            parents: 1,
            interior: interior
        });
        return dest;
    }

    receive() external payable {
        require(
            isDerivativeAddress[_msgSender()],
            "sender is not a derivativeAddress"
        );
    }
}

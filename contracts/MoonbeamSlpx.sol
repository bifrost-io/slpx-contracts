// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.8.10;

import "./interfaces/XcmTransactorV2.sol";
import "./interfaces/Xtokens.sol";
import "./interfaces/ISlpx.sol";
import "./utils/AddressToAccount.sol";
import "./utils/BuildCallData.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";

contract MoonbeamSlpx is ISlpx, OwnableUpgradeable, PausableUpgradeable {
    address internal constant NATIVE_ASSET_ADDRESS =
        0x0000000000000000000000000000000000000802;
    address internal constant XCM_TRANSACTORV2_ADDRESS =
        0x000000000000000000000000000000000000080D;
    address internal constant XTOKENS =
        0x0000000000000000000000000000000000000804;
    bytes1 internal constant MOONBEAM_CHAIN = 0x01;

    XcmTransactorV2.Multilocation internal xcmTransactorDestination;

    address public BNCAddress;
    uint32 public bifrostParaId;

    enum Operation {
        Mint,
        Redeem,
        ZenlinkSwap,
        StableSwap
    }

    struct AssetInfo {
        bytes2 currencyId;
        uint256 operationalMin;
    }

    struct FeeInfo {
        uint64 transactRequiredWeightAtMost;
        uint256 feeAmount;
        uint64 overallWeight;
    }

    mapping(address => AssetInfo) public addressToAssetInfo;
    mapping(Operation => FeeInfo) public operationToFeeInfo;

    struct DestChainInfo {
        bool is_evm;
        bool is_substrate;
        bytes1 raw_chain_index;
    }
    mapping(uint64 => DestChainInfo) public destChainInfo;

    function checkAssetIsExist(
        address assetAddress
    ) internal view returns (bytes2) {
        AssetInfo memory assetInfo = addressToAssetInfo[assetAddress];
        require(assetInfo.operationalMin > 0, "Asset is not exist");
        require(assetInfo.currencyId != bytes2(0), "Invalid asset");
        return assetInfo.currencyId;
    }

    function checkFeeInfo(
        Operation operation
    ) internal view returns (FeeInfo memory) {
        FeeInfo memory feeInfo = operationToFeeInfo[operation];
        require(
            feeInfo.transactRequiredWeightAtMost > 0,
            "Invalid transactRequiredWeightAtMost"
        );
        require(feeInfo.feeAmount > 0, "Invalid feeAmount");
        require(feeInfo.overallWeight > 0, "Invalid overallWeight");
        return feeInfo;
    }

    function initialize(
        address _BNCAddress,
        uint32 _bifrostParaId,
        bytes2 _nativeCurrencyId
    ) public initializer {
        __Ownable_init();
        __Pausable_init();
        require(_BNCAddress != address(0), "Invalid address");
        require(
            _bifrostParaId == 2001 || _bifrostParaId == 2030,
            "Invalid bifrostParaId"
        );
        require(
            _nativeCurrencyId == 0x020a || _nativeCurrencyId == 0x0801,
            "Invalid nativeCurrencyId"
        );

        setAssetAddressInfo(_BNCAddress, 0x0001, 1_000_000_000_000);
        setAssetAddressInfo(
            NATIVE_ASSET_ADDRESS,
            _nativeCurrencyId,
            1_000_000_000_000_000_000
        );

        BNCAddress = _BNCAddress;
        bifrostParaId = _bifrostParaId;

        // Init xcmTransactorDestination
        bytes[] memory interior = new bytes[](1);
        // Parachain: 2001/2030
        interior[0] = bytes.concat(hex"00", bytes4(_bifrostParaId));
        xcmTransactorDestination = XcmTransactorV2.Multilocation({
            parents: 1,
            interior: interior
        });
    }

    function setOperationToFeeInfo(
        Operation _operation,
        uint64 _transactRequiredWeightAtMost,
        uint64 _overallWeight,
        uint256 _feeAmount
    ) public onlyOwner {
        operationToFeeInfo[_operation] = FeeInfo(
            _transactRequiredWeightAtMost,
            _feeAmount,
            _overallWeight
        );
    }

    function setAssetAddressInfo(
        address assetAddress,
        bytes2 currencyId,
        uint256 minimumValue
    ) public onlyOwner {
        require(assetAddress != address(0), "Invalid assetAddress");
        require(minimumValue != 0, "Invalid minimumValue");
        require(currencyId != bytes2(0), "Invalid currencyId");
        AssetInfo storage assetInfo = addressToAssetInfo[assetAddress];
        assetInfo.currencyId = currencyId;
        assetInfo.operationalMin = minimumValue;
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function xcmTransferAsset(address assetAddress, uint256 amount) internal {
        require(assetAddress != address(0), "Invalid assetAddress");
        require(
            amount >= addressToAssetInfo[assetAddress].operationalMin,
            "Less than MinimumValue"
        );
        bytes32 publicKey = AddressToAccount.AddressToSubstrateAccount(
            _msgSender()
        );
        Xtokens.Multilocation memory dest_account = getXtokensDestination(
            publicKey
        );
        IERC20 asset = IERC20(assetAddress);
        asset.transferFrom(_msgSender(), address(this), amount);
        Xtokens(XTOKENS).transfer(
            assetAddress,
            amount,
            dest_account,
            type(uint64).max
        );
    }

    function xcmTransferNativeAsset(uint256 amount) internal {
        require(
            amount >= addressToAssetInfo[NATIVE_ASSET_ADDRESS].operationalMin,
            "Less than MinimumValue"
        );
        bytes32 publicKey = AddressToAccount.AddressToSubstrateAccount(
            _msgSender()
        );

        Xtokens.Multilocation memory dest_account = getXtokensDestination(
            publicKey
        );
        Xtokens(XTOKENS).transfer(
            NATIVE_ASSET_ADDRESS,
            amount,
            dest_account,
            type(uint64).max
        );
    }

    function mintVNativeAsset(
        address receiver,
        string memory remark
    ) external payable override whenNotPaused {
        require(bytes(remark).length <= 32, "remark too long");
        bytes2 nativeToken = checkAssetIsExist(NATIVE_ASSET_ADDRESS);
        // xtokens call
        xcmTransferNativeAsset(msg.value);

        // Build bifrost xcm-action mint call data
        bytes memory targetChain = abi.encodePacked(MOONBEAM_CHAIN, receiver);
        bytes memory callData = BuildCallData.buildMintCallBytes(
            _msgSender(),
            nativeToken,
            targetChain,
            remark
        );
        // XCM Transact
        FeeInfo memory feeInfo = checkFeeInfo(Operation.Mint);
        XcmTransactorV2(XCM_TRANSACTORV2_ADDRESS).transactThroughSigned(
            xcmTransactorDestination,
            BNCAddress,
            feeInfo.transactRequiredWeightAtMost,
            callData,
            feeInfo.feeAmount,
            feeInfo.overallWeight
        );
        emit Mint(
            _msgSender(),
            NATIVE_ASSET_ADDRESS,
            msg.value,
            receiver,
            callData,
            remark
        );
    }

    function mintVAsset(
        address assetAddress,
        uint256 amount,
        address receiver,
        string memory remark
    ) external override whenNotPaused {
        require(bytes(remark).length <= 32, "remark too long");

        bytes2 token = checkAssetIsExist(assetAddress);

        // xtokens call
        xcmTransferAsset(assetAddress, amount);

        // Build bifrost xcm-action mint call data
        bytes memory targetChain = abi.encodePacked(MOONBEAM_CHAIN, receiver);
        bytes memory callData = BuildCallData.buildMintCallBytes(
            _msgSender(),
            token,
            targetChain,
            remark
        );
        // XCM Transact
        FeeInfo memory feeInfo = checkFeeInfo(Operation.Mint);
        XcmTransactorV2(XCM_TRANSACTORV2_ADDRESS).transactThroughSigned(
            xcmTransactorDestination,
            BNCAddress,
            feeInfo.transactRequiredWeightAtMost,
            callData,
            feeInfo.feeAmount,
            feeInfo.overallWeight
        );
        emit Mint(
            _msgSender(),
            assetAddress,
            amount,
            receiver,
            callData,
            remark
        );
    }

    function mintVNativeAssetWithChannelId(
        address receiver,
        string memory remark,
        uint32 channel_id
    ) external payable override whenNotPaused {
        require(bytes(remark).length <= 32, "remark too long");
        bytes2 nativeToken = checkAssetIsExist(NATIVE_ASSET_ADDRESS);
        // xtokens call
        xcmTransferNativeAsset(msg.value);

        // Build bifrost xcm-action mint call data
        bytes memory targetChain = abi.encodePacked(MOONBEAM_CHAIN, receiver);
        bytes memory callData = BuildCallData.buildMintWithChannelIdCallBytes(
            _msgSender(),
            nativeToken,
            targetChain,
            remark,
            channel_id
        );
        // XCM Transact
        FeeInfo memory feeInfo = checkFeeInfo(Operation.Mint);
        XcmTransactorV2(XCM_TRANSACTORV2_ADDRESS).transactThroughSigned(
            xcmTransactorDestination,
            BNCAddress,
            feeInfo.transactRequiredWeightAtMost,
            callData,
            feeInfo.feeAmount,
            feeInfo.overallWeight
        );
        emit Mint(
            _msgSender(),
            NATIVE_ASSET_ADDRESS,
            msg.value,
            receiver,
            callData,
            remark
        );
    }

    function mintVAssetWithChannelId(
        address assetAddress,
        uint256 amount,
        address receiver,
        string memory remark,
        uint32 channel_id
    ) external override whenNotPaused {
        require(bytes(remark).length <= 32, "remark too long");

        bytes2 token = checkAssetIsExist(assetAddress);

        // xtokens call
        xcmTransferAsset(assetAddress, amount);

        // Build bifrost xcm-action mint call data
        bytes memory targetChain = abi.encodePacked(MOONBEAM_CHAIN, receiver);
        bytes memory callData = BuildCallData.buildMintWithChannelIdCallBytes(
            _msgSender(),
            token,
            targetChain,
            remark,
            channel_id
        );
        // XCM Transact
        FeeInfo memory feeInfo = checkFeeInfo(Operation.Mint);
        XcmTransactorV2(XCM_TRANSACTORV2_ADDRESS).transactThroughSigned(
            xcmTransactorDestination,
            BNCAddress,
            feeInfo.transactRequiredWeightAtMost,
            callData,
            feeInfo.feeAmount,
            feeInfo.overallWeight
        );
        emit Mint(
            _msgSender(),
            assetAddress,
            amount,
            receiver,
            callData,
            remark
        );
    }

    function redeemAsset(
        address vAssetAddress,
        uint256 amount,
        address receiver
    ) external override whenNotPaused {
        bytes2 vtoken = checkAssetIsExist(vAssetAddress);

        // xtokens call
        xcmTransferAsset(vAssetAddress, amount);

        // xcm transactor call
        bytes memory targetChain = abi.encodePacked(MOONBEAM_CHAIN, receiver);
        bytes memory callData = BuildCallData.buildRedeemCallBytes(
            _msgSender(),
            vtoken,
            targetChain
        );
        FeeInfo memory feeInfo = checkFeeInfo(Operation.Redeem);
        XcmTransactorV2(XCM_TRANSACTORV2_ADDRESS).transactThroughSigned(
            xcmTransactorDestination,
            BNCAddress,
            feeInfo.transactRequiredWeightAtMost,
            callData,
            feeInfo.feeAmount,
            feeInfo.overallWeight
        );
        emit Redeem(_msgSender(), vAssetAddress, amount, receiver, callData);
    }

    function getXtokensDestination(
        bytes32 publicKey
    ) internal view returns (Xtokens.Multilocation memory) {
        bytes[] memory interior = new bytes[](2);
        // Parachain: 2001/2030
        interior[0] = bytes.concat(hex"00", bytes4(bifrostParaId));
        // AccountId32: { id: public_key , network: any }
        interior[1] = bytes.concat(hex"01", publicKey, hex"00");
        Xtokens.Multilocation memory dest = Xtokens.Multilocation({
            parents: 1,
            interior: interior
        });

        return dest;
    }

    function setDestChainInfo(
        uint64 dest_chain_id,
        bool is_evm,
        bool is_substrate,
        bytes1 raw_chain_index
    ) public onlyOwner {
        require(
            !(is_evm && is_substrate),
            "Both is_evm and is_substrate cannot be true"
        );
        DestChainInfo storage chainInfo = destChainInfo[dest_chain_id];
        chainInfo.is_evm = is_evm;
        chainInfo.is_substrate = is_substrate;
        chainInfo.raw_chain_index = raw_chain_index;
    }

    /**
     * @dev Create order to mint vAsset or redeem vAsset on bifrost chain
     * @param assetAddress The address of the asset to mint or redeem
     * @param amount The amount of the asset to mint or redeem
     * @param dest_chain_id When order is executed, Asset/vAsset will be transferred to this chain
     * @param receiver The receiver address on the destination chain, 20 bytes for EVM, 32 bytes for Substrate
     * @param remark The remark of the order, less than 32 bytes. For example, "OmniLS"
     * @param channel_id The channel id of the order, you can set it. Bifrost chain will use it to share reward.
     **/
    function create_order(
        address assetAddress,
        uint128 amount,
        uint64 dest_chain_id,
        bytes memory receiver,
        string memory remark,
        uint32 channel_id
    ) external payable override {
        require(
            bytes(remark).length > 0 && bytes(remark).length <= 32,
            "remark must be less than 32 bytes and not empty"
        );
        require(amount > 0, "amount must be greater than 0");

        DestChainInfo memory chainInfo = destChainInfo[dest_chain_id];
        if (chainInfo.is_evm) {
            require(receiver.length == 20, "evm address must be 20 bytes");
        } else if (chainInfo.is_substrate) {
            require(
                receiver.length == 32,
                "substrate public key must be 32 bytes"
            );
        } else {
            revert("Destination chain is not supported");
        }

        bytes2 token = checkAssetIsExist(assetAddress);

        // Transfer asset to bifrost chain
        if (assetAddress == NATIVE_ASSET_ADDRESS) {
            amount = uint128(msg.value);
            xcmTransferNativeAsset(uint256(amount));
        } else {
            xcmTransferAsset(assetAddress, uint256(amount));
        }

        // Build bifrost slpx create order call data
        bytes memory callData = BuildCallData.buildCreateOrderCallBytes(
            _msgSender(),
            block.chainid,
            block.number,
            token,
            amount,
            abi.encodePacked(chainInfo.raw_chain_index, receiver),
            remark,
            channel_id
        );
        // XCM Transact
        FeeInfo memory feeInfo = checkFeeInfo(Operation.Mint);
        XcmTransactorV2(XCM_TRANSACTORV2_ADDRESS).transactThroughSigned(
            xcmTransactorDestination,
            BNCAddress,
            feeInfo.transactRequiredWeightAtMost,
            callData,
            feeInfo.feeAmount,
            feeInfo.overallWeight
        );
        emit CreateOrder(
            assetAddress,
            amount,
            dest_chain_id,
            receiver,
            remark,
            channel_id
        );
    }
}

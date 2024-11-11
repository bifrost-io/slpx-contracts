// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.8.10;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "./interfaces/XCM.sol";
import "./interfaces/XCM_v2.sol";
import "./interfaces/ISlpx.sol";
import "./utils/BuildCallData.sol";
import "./utils/AddressToAccount.sol";

contract AstarSlpx is ISlpx, OwnableUpgradeable, PausableUpgradeable {
    address private constant NATIVE_ASSET_ADDRESS =
        0x0000000000000000000000000000000000000000;
    address private constant BNC_ADDRESS =
        0xfFffFffF00000000000000010000000000000007;
    address private constant XCM_ADDRESS =
        0x0000000000000000000000000000000000005004;
    bytes1 private constant ASTAR_CHAIN = 0x00;
    uint32 private constant BIFROST_PARA_ID = 2030;

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
        return feeInfo;
    }

    function initialize() public initializer {
        __Ownable_init();
        __Pausable_init();
        setAssetAddressInfo(NATIVE_ASSET_ADDRESS, 0x0803, 1000000000000000000);
    }

    function setOperationToFeeInfo(
        Operation _operation,
        uint64 _transactRequiredWeightAtMost,
        uint256 _feeAmount
    ) public onlyOwner {
        require(
            _transactRequiredWeightAtMost <= 10000000000,
            "transactRequiredWeightAtMost too large"
        );
        require(_feeAmount <= 1000000000000, "feeAmount too large");
        operationToFeeInfo[_operation] = FeeInfo(
            _transactRequiredWeightAtMost,
            _feeAmount
        );
    }

    function setAssetAddressInfo(
        address assetAddress,
        bytes2 currencyId,
        uint256 minimumValue
    ) public onlyOwner {
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

    function xcmTransferNativeAsset(uint256 amount) internal {
        require(
            amount >= addressToAssetInfo[NATIVE_ASSET_ADDRESS].operationalMin,
            "Less than MinimumValue"
        );
        bytes32 publicKey = AddressToAccount.AddressToSubstrateAccount(
            _msgSender()
        );
        address[] memory assetId = new address[](1);
        uint256[] memory assetAmount = new uint256[](1);
        assetId[0] = NATIVE_ASSET_ADDRESS;
        assetAmount[0] = amount;
        require(
            XCM(XCM_ADDRESS).assets_reserve_transfer(
                assetId,
                assetAmount,
                publicKey,
                false,
                BIFROST_PARA_ID,
                0
            ),
            "Failed to send xcm"
        );
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

        XCM_v2.Multilocation memory dest_account = getXtokensDestination(
            publicKey
        );
        IERC20 asset = IERC20(assetAddress);
        asset.transferFrom(_msgSender(), address(this), amount);
        require(
            XCM_v2(XCM_ADDRESS).transfer(
                assetAddress,
                amount,
                dest_account,
                XCM_v2.WeightV2(0, 0)
            ),
            "Failed to send xcm"
        );
    }

    function mintVNativeAsset(
        address receiver,
        string memory remark
    ) external payable override whenNotPaused {
        require(bytes(remark).length <= 32, "remark too long");
        bytes2 nativeToken = checkAssetIsExist(NATIVE_ASSET_ADDRESS);

        xcmTransferNativeAsset(msg.value);

        bytes memory targetChain = abi.encodePacked(ASTAR_CHAIN, receiver);
        bytes memory callData = BuildCallData.buildMintCallBytes(
            _msgSender(),
            nativeToken,
            targetChain,
            remark
        );

        // xcm transact
        FeeInfo memory feeInfo = checkFeeInfo(Operation.Mint);
        require(
            XCM(XCM_ADDRESS).remote_transact(
                BIFROST_PARA_ID,
                false,
                BNC_ADDRESS,
                feeInfo.feeAmount,
                callData,
                feeInfo.transactRequiredWeightAtMost
            ),
            "Failed to send xcm"
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
    ) external override {
        require(bytes(remark).length <= 32, "remark too long");

        bytes2 token = checkAssetIsExist(assetAddress);

        // xtokens call
        xcmTransferAsset(assetAddress, amount);

        bytes memory targetChain = abi.encodePacked(ASTAR_CHAIN, receiver);
        bytes memory callData = BuildCallData.buildMintCallBytes(
            _msgSender(),
            token,
            targetChain,
            remark
        );

        // xcm transact
        FeeInfo memory feeInfo = checkFeeInfo(Operation.Mint);
        require(
            XCM(XCM_ADDRESS).remote_transact(
                BIFROST_PARA_ID,
                false,
                BNC_ADDRESS,
                feeInfo.feeAmount,
                callData,
                feeInfo.transactRequiredWeightAtMost
            ),
            "Failed to send xcm"
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

        xcmTransferNativeAsset(msg.value);

        bytes memory targetChain = abi.encodePacked(ASTAR_CHAIN, receiver);
        bytes memory callData = BuildCallData.buildMintWithChannelIdCallBytes(
            _msgSender(),
            nativeToken,
            targetChain,
            remark,
            channel_id
        );

        // xcm transact
        FeeInfo memory feeInfo = checkFeeInfo(Operation.Mint);
        require(
            XCM(XCM_ADDRESS).remote_transact(
                BIFROST_PARA_ID,
                false,
                BNC_ADDRESS,
                feeInfo.feeAmount,
                callData,
                feeInfo.transactRequiredWeightAtMost
            ),
            "Failed to send xcm"
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
    ) external override {
        require(bytes(remark).length <= 32, "remark too long");

        bytes2 token = checkAssetIsExist(assetAddress);

        // xtokens call
        xcmTransferAsset(assetAddress, amount);

        bytes memory targetChain = abi.encodePacked(ASTAR_CHAIN, receiver);
        bytes memory callData = BuildCallData.buildMintWithChannelIdCallBytes(
            _msgSender(),
            token,
            targetChain,
            remark,
            channel_id
        );

        // xcm transact
        FeeInfo memory feeInfo = checkFeeInfo(Operation.Mint);
        require(
            XCM(XCM_ADDRESS).remote_transact(
                BIFROST_PARA_ID,
                false,
                BNC_ADDRESS,
                feeInfo.feeAmount,
                callData,
                feeInfo.transactRequiredWeightAtMost
            ),
            "Failed to send xcm"
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

        xcmTransferAsset(vAssetAddress, amount);

        bytes memory targetChain = abi.encodePacked(ASTAR_CHAIN, receiver);
        bytes memory callData = BuildCallData.buildRedeemCallBytes(
            _msgSender(),
            vtoken,
            targetChain
        );
        // xcm transact
        FeeInfo memory feeInfo = checkFeeInfo(Operation.Redeem);
        require(
            XCM(XCM_ADDRESS).remote_transact(
                BIFROST_PARA_ID,
                false,
                BNC_ADDRESS,
                feeInfo.feeAmount,
                callData,
                feeInfo.transactRequiredWeightAtMost
            ),
            "Failed to send xcm"
        );
        emit Redeem(_msgSender(), vAssetAddress, amount, receiver, callData);
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
        // xcm transact
        FeeInfo memory feeInfo = checkFeeInfo(Operation.Mint);
        require(
            XCM(XCM_ADDRESS).remote_transact(
                BIFROST_PARA_ID,
                false,
                BNC_ADDRESS,
                feeInfo.feeAmount,
                callData,
                feeInfo.transactRequiredWeightAtMost
            ),
            "Failed to send xcm"
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

    function getXtokensDestination(
        bytes32 publicKey
    ) internal pure returns (XCM_v2.Multilocation memory) {
        bytes[] memory interior = new bytes[](2);
        // Parachain: 2001/2030
        interior[0] = bytes.concat(hex"00", bytes4(BIFROST_PARA_ID));
        // AccountId32: { id: public_key , network: any }
        interior[1] = bytes.concat(hex"01", publicKey, hex"00");
        XCM_v2.Multilocation memory dest = XCM_v2.Multilocation({
            parents: 1,
            interior: interior
        });

        return dest;
    }
}

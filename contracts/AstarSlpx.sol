// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.8.10;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "./interfaces/XCM.sol";
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
        addressToAssetInfo[assetAddress] = AssetInfo(currencyId, minimumValue);
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
        address[] memory assetId = new address[](1);
        uint256[] memory assetAmount = new uint256[](1);
        IERC20 erc20 = IERC20(assetAddress);
        erc20.transferFrom(_msgSender(), address(this), amount);
        assetId[0] = assetAddress;
        assetAmount[0] = amount;
        require(
            XCM(XCM_ADDRESS).assets_withdraw(
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
        address,
        uint256,
        address,
        string memory
    ) external pure override {
        require(false, "Not support");
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

    function stablePoolSwap(
        uint32,
        address,
        address,
        uint256,
        uint128,
        address
    ) external pure override {
        require(false, "Not support");
    }

    function swapAssetsForExactAssets(
        address assetInAddress,
        address assetOutAddress,
        uint256 assetInAmount,
        uint128 assetOutMin,
        address receiver
    ) external override whenNotPaused {
        bytes2 assetIn = checkAssetIsExist(assetInAddress);
        bytes2 assetOut = checkAssetIsExist(assetOutAddress);
        require(
            assetIn != bytes2(0) && assetOut != bytes2(0),
            "Invalid currencyId"
        );

        xcmTransferAsset(assetInAddress, assetInAmount);

        bytes memory targetChain = abi.encodePacked(ASTAR_CHAIN, receiver);
        bytes memory callData = BuildCallData.buildSwapCallBytes(
            _msgSender(),
            assetIn,
            assetOut,
            assetOutMin,
            targetChain
        );
        // xcm transact
        FeeInfo memory feeInfo = checkFeeInfo(Operation.ZenlinkSwap);
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
        emit Swap(
            _msgSender(),
            assetInAddress,
            assetOutAddress,
            assetInAmount,
            assetOutMin,
            receiver,
            callData
        );
    }

    function swapAssetsForExactNativeAssets(
        address assetInAddress,
        uint256 assetInAmount,
        uint128 assetOutMin,
        address receiver
    ) external override whenNotPaused {
        bytes2 assetIn = checkAssetIsExist(assetInAddress);
        bytes2 nativeToken = checkAssetIsExist(NATIVE_ASSET_ADDRESS);

        xcmTransferAsset(assetInAddress, assetInAmount);

        bytes memory targetChain = abi.encodePacked(ASTAR_CHAIN, receiver);
        bytes memory callData = BuildCallData.buildSwapCallBytes(
            _msgSender(),
            assetIn,
            nativeToken,
            assetOutMin,
            targetChain
        );
        // xcm transact
        FeeInfo memory feeInfo = checkFeeInfo(Operation.ZenlinkSwap);
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
        emit Swap(
            _msgSender(),
            assetInAddress,
            NATIVE_ASSET_ADDRESS,
            assetInAmount,
            assetOutMin,
            receiver,
            callData
        );
    }

    function swapNativeAssetsForExactAssets(
        address assetOutAddress,
        uint128 assetOutMin,
        address receiver
    ) external payable override whenNotPaused {
        bytes2 assetOut = checkAssetIsExist(assetOutAddress);
        bytes2 nativeToken = checkAssetIsExist(NATIVE_ASSET_ADDRESS);

        xcmTransferNativeAsset(msg.value);

        bytes memory targetChain = abi.encodePacked(ASTAR_CHAIN, receiver);
        bytes memory callData = BuildCallData.buildSwapCallBytes(
            _msgSender(),
            nativeToken,
            assetOut,
            assetOutMin,
            targetChain
        );
        // xcm transact
        FeeInfo memory feeInfo = checkFeeInfo(Operation.ZenlinkSwap);
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
        emit Swap(
            _msgSender(),
            NATIVE_ASSET_ADDRESS,
            assetOutAddress,
            msg.value,
            assetOutMin,
            receiver,
            callData
        );
    }
}

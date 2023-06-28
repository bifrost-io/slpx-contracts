// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "./interfaces/XcmTransactorV2.sol";
import "./interfaces/Xtokens.sol";
import "./interfaces/IXcmAction.sol";
import "./utils/AddressToAccount.sol";
import "./utils/BuildCallData.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";

contract MoonbeamXcmAction is
    IXcmAction,
    OwnableUpgradeable,
    PausableUpgradeable
{
    address public constant NATIVE_ASSET_ADDRESS =
        0x0000000000000000000000000000000000000802;
    address public constant XCM_TRANSACTORV2_ADDRESS =
        0x000000000000000000000000000000000000080D;
    address public constant XTOKENS =
        0x0000000000000000000000000000000000000804;
    bytes1 public constant TARGETCHAIN = 0x01;

    uint64 public xtokenWeight;
    uint64 public transactRequiredWeightAtMost;
    uint64 public overallWeight;
    uint256 public feeAmount;

    address public BNCAddress;
    uint32 public bifrostParaId;
    bytes2 public nativeCurrencyId;

    mapping(address => bytes2) public assetAddressToCurrencyId;
    mapping(address => uint256) public assetAddressToMinimumValue;

    function initialize(
        address _BNCAddress,
        uint32 _bifrostParaId,
        bytes2 _nativeCurrencyId
    ) public initializer {
        super.__Ownable_init();
        super.__Pausable_init();
        require(_BNCAddress != address(0), "Invalid address");
        require(
            _bifrostParaId == 2001 || _bifrostParaId == 2030,
            "Invalid bifrostParaId"
        );
        require(
            _nativeCurrencyId == 0x020a || _nativeCurrencyId == 0x0801,
            "Invalid nativeCurrencyId"
        );
        setFee(10000000000, 10000000000, 10000000000, 1000000000000);
        BNCAddress = _BNCAddress;
        bifrostParaId = _bifrostParaId;
        nativeCurrencyId = _nativeCurrencyId;
    }

    function setFee(
        uint64 _xtokenWeight,
        uint64 _transactRequiredWeightAtMost,
        uint64 _overallWeight,
        uint256 _feeAmount
    ) public onlyOwner {
        require(_xtokenWeight <= 10000000000, "xtokenWeight too large");
        require(
            _transactRequiredWeightAtMost <= 10000000000,
            "transactRequiredWeightAtMost too large"
        );
        require(_overallWeight <= 10000000000, "OverallWeight too large");
        require(_feeAmount <= 1000000000000, "feeAmount too large");
        xtokenWeight = _xtokenWeight;
        transactRequiredWeightAtMost = _transactRequiredWeightAtMost;
        overallWeight = _overallWeight;
        feeAmount = _feeAmount;
    }

    function setAssetAddressToMinimumValue(
        address assetAddress,
        uint256 minimumValue
    ) external onlyOwner {
        require(assetAddress != address(0), "Invalid assetAddress");
        assetAddressToMinimumValue[assetAddress] = minimumValue;
    }

    function setAssetAddressToCurrencyId(
        address assetAddress,
        bytes2 currencyId
    ) external onlyOwner {
        require(assetAddress != address(0), "Invalid assetAddress");
        require(currencyId != bytes2(0), "Invalid currencyId");
        assetAddressToCurrencyId[assetAddress] = currencyId;
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
            assetAddressToMinimumValue[assetAddress] <= amount,
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
            xtokenWeight
        );
    }

    function xcmTransferNativeAsset(uint256 amount) internal {
        require(
            assetAddressToMinimumValue[NATIVE_ASSET_ADDRESS] <= amount,
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
            xtokenWeight
        );
    }

    function mintVNativeAsset() external payable override whenNotPaused {
        // xtokens call
        xcmTransferNativeAsset(msg.value);

        // xcm transactor call
        XcmTransactorV2.Multilocation
            memory dest = getXcmTransactorDestination();
        // Build bifrost xcm-action mint call data
        bytes memory callData = BuildCallData.buildMintCallBytes(
            _msgSender(),
            nativeCurrencyId,
            TARGETCHAIN
        );
        // XCM Transact
        XcmTransactorV2(XCM_TRANSACTORV2_ADDRESS).transactThroughSigned(
            dest,
            BNCAddress,
            transactRequiredWeightAtMost,
            callData,
            feeAmount,
            overallWeight
        );
        emit Mint(_msgSender(), NATIVE_ASSET_ADDRESS, msg.value, callData);
    }

    function mintVAsset(
        address assetAddress,
        uint256 amount
    ) external override whenNotPaused {
        bytes2 token = assetAddressToCurrencyId[assetAddress];
        require(token != bytes2(0), "Invalid assetAddress");

        // xtokens call
        xcmTransferAsset(assetAddress, amount);

        // xcm transactor call
        XcmTransactorV2.Multilocation
            memory dest = getXcmTransactorDestination();
        // Build bifrost xcm-action mint call data
        bytes memory callData = BuildCallData.buildMintCallBytes(
            _msgSender(),
            token,
            TARGETCHAIN
        );
        // XCM Transact
        XcmTransactorV2(XCM_TRANSACTORV2_ADDRESS).transactThroughSigned(
            dest,
            BNCAddress,
            transactRequiredWeightAtMost,
            callData,
            feeAmount,
            overallWeight
        );
        emit Mint(_msgSender(), assetAddress, amount, callData);
    }

    function redeemAsset(
        address vAssetAddress,
        uint256 amount
    ) external override whenNotPaused {
        bytes2 vtoken = assetAddressToCurrencyId[vAssetAddress];
        require(vtoken != bytes2(0), "Invalid vAssetAddress");

        // xtokens call
        xcmTransferAsset(vAssetAddress, amount);

        // xcm transactor call
        XcmTransactorV2.Multilocation
            memory dest = getXcmTransactorDestination();

        bytes memory callData = BuildCallData.buildRedeemCallBytes(
            _msgSender(),
            vtoken,
            TARGETCHAIN
        );
        XcmTransactorV2(XCM_TRANSACTORV2_ADDRESS).transactThroughSigned(
            dest,
            BNCAddress,
            transactRequiredWeightAtMost,
            callData,
            feeAmount,
            overallWeight
        );
        emit Redeem(_msgSender(), vAssetAddress, amount, callData);
    }

    function swapAssetsForExactAssets(
        address assetInAddress,
        address assetOutAddress,
        uint256 assetInAmount,
        uint128 assetOutMin
    ) external override whenNotPaused {
        bytes2 assetIn = assetAddressToCurrencyId[assetInAddress];
        bytes2 assetOut = assetAddressToCurrencyId[assetOutAddress];
        require(assetIn != bytes2(0) && assetOut != bytes2(0), "Invalid asset");

        xcmTransferAsset(assetInAddress, assetInAmount);

        // xcm transactor call
        XcmTransactorV2.Multilocation
            memory dest = getXcmTransactorDestination();

        bytes memory callData = BuildCallData.buildSwapCallBytes(
            _msgSender(),
            assetIn,
            assetOut,
            assetOutMin,
            TARGETCHAIN
        );
        XcmTransactorV2(XCM_TRANSACTORV2_ADDRESS).transactThroughSigned(
            dest,
            BNCAddress,
            transactRequiredWeightAtMost,
            callData,
            feeAmount,
            overallWeight
        );
        emit Swap(
            _msgSender(),
            assetInAddress,
            assetOutAddress,
            assetInAmount,
            assetOutMin,
            callData
        );
    }

    function swapAssetsForExactNativeAssets(
        address assetInAddress,
        uint256 assetInAmount,
        uint128 assetOutMin
    ) external override whenNotPaused {
        bytes2 assetIn = assetAddressToCurrencyId[assetInAddress];
        require(assetIn != bytes2(0), "Invalid assetIn");

        xcmTransferAsset(assetInAddress, assetInAmount);

        // xcm transactor call
        XcmTransactorV2.Multilocation
            memory dest = getXcmTransactorDestination();

        bytes memory callData = BuildCallData.buildSwapCallBytes(
            _msgSender(),
            assetIn,
            nativeCurrencyId,
            assetOutMin,
            TARGETCHAIN
        );
        XcmTransactorV2(XCM_TRANSACTORV2_ADDRESS).transactThroughSigned(
            dest,
            BNCAddress,
            transactRequiredWeightAtMost,
            callData,
            feeAmount,
            overallWeight
        );
        emit Swap(
            _msgSender(),
            assetInAddress,
            NATIVE_ASSET_ADDRESS,
            assetInAmount,
            assetOutMin,
            callData
        );
    }

    function swapNativeAssetsForExactAssets(
        address assetOutAddress,
        uint128 assetOutMin
    ) external payable override whenNotPaused {
        bytes2 assetOut = assetAddressToCurrencyId[assetOutAddress];
        require(assetOut != bytes2(0), "Invalid assetOut");

        xcmTransferNativeAsset(msg.value);

        // xcm transactor call
        XcmTransactorV2.Multilocation
            memory dest = getXcmTransactorDestination();

        bytes memory callData = BuildCallData.buildSwapCallBytes(
            _msgSender(),
            nativeCurrencyId,
            assetOut,
            assetOutMin,
            TARGETCHAIN
        );
        XcmTransactorV2(XCM_TRANSACTORV2_ADDRESS).transactThroughSigned(
            dest,
            BNCAddress,
            transactRequiredWeightAtMost,
            callData,
            feeAmount,
            overallWeight
        );
        emit Swap(
            _msgSender(),
            NATIVE_ASSET_ADDRESS,
            assetOutAddress,
            msg.value,
            assetOutMin,
            callData
        );
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

    function getXcmTransactorDestination()
        internal
        view
        returns (XcmTransactorV2.Multilocation memory)
    {
        bytes[] memory interior = new bytes[](1);
        // Parachain: 2001/2030
        interior[0] = bytes.concat(hex"00", bytes4(bifrostParaId));
        XcmTransactorV2.Multilocation memory dest = XcmTransactorV2
            .Multilocation({parents: 1, interior: interior});
        return dest;
    }
}

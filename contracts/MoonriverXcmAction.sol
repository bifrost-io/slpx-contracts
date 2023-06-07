// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "./interfaces/XcmTransactorV2.sol";
import "./interfaces/Xtokens.sol";
import "./interfaces/IXcmAction.sol";
import "./utils/ScaleCodec.sol";
import "./utils/AddressToAccount.sol";
import "./utils/Constants.sol";
import "./utils/BuildCallData.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract MoonriverXcmAction is IXcmAction, Ownable {

  uint64 xtokenWeight = 10000000000;
  uint64 transactRequiredWeightAtMost = 10000000000;
  uint256 feeAmount = 1000000000000;
  uint64 overallWeight = 10000000000;

  // pre-compiled contract address
  XcmTransactorV2 xcmtransactor = XcmTransactorV2(0x000000000000000000000000000000000000080D);
  Xtokens xtokens = Xtokens(0x0000000000000000000000000000000000000804);

    mapping (address => bytes2) public assetAddressToCurrencyId;

    event Mint(address minter, address assetAddress, uint256 amount, bytes callcode);
    event Redeem(address redeemer, address assetAddress, uint256 amount, bytes callcode);
    event Swap(address swapper, address assetInAddress,address assetOutAddress, uint256 assetInAmount, uint128 assetOutMin, bytes callcode);
    
   function setBifrostXcmExecutionfee(uint256 fee) onlyOwner external {
        feeAmount = fee;
    }

    function setAssetAddressToCurrencyId(address assetAddress,bytes2 currencyId) onlyOwner external {
        assetAddressToCurrencyId[assetAddress] = currencyId;
    }

    function xcmTransferAsset(address assetAddress, uint256 amount) internal  {
        bytes32 publicKey = AddressToAccount.AddressToSubstrateAccount(msg.sender);
        Xtokens.Multilocation memory dest_account = getXtokensDestination(publicKey);
        IERC20 asset = IERC20(assetAddress);
        asset.transferFrom(msg.sender, address(this), amount);
        xtokens.transfer(assetAddress, amount, dest_account, xtokenWeight);
    }

  function xcmTransferNativeAsset(uint256 amount) internal {
    bytes32 publicKey = AddressToAccount.AddressToSubstrateAccount(msg.sender);

    Xtokens.Multilocation memory dest_account = getXtokensDestination(publicKey);
    xtokens.transfer(Constants.MOVR_ADDRESS, amount, dest_account, xtokenWeight);
  }

  function mintVNativeAsset() payable external override {
    // xtokens call
    xcmTransferNativeAsset(msg.value);

    // xcm transactor call
    XcmTransactorV2.Multilocation memory dest = getXcmTransactorDestination();
    // Build bifrost xcm-action mint call data
    bytes memory callData = BuildCallData.buildMintCallBytes(msg.sender, Constants.MOVR_BYTES,Constants.MOOBEAM_CHAIN);
    // XCM Transact
    xcmtransactor.transactThroughSigned(
        dest,
        Constants.MOONRIVER_BNC_ADDRESS,
        transactRequiredWeightAtMost,
        callData,
        feeAmount,
        overallWeight
    );
    emit Mint(msg.sender, Constants.MOVR_ADDRESS, msg.value, callData);
  }

    function mintVAsset(address assetAddress,uint256 amount) external  override {
        bytes2 token = assetAddressToCurrencyId[assetAddress];
        require(token != bytes2(0), "MoonriverXcmAction: The input token does not exist");

        // xtokens call
        xcmTransferAsset(assetAddress,amount);

        // xcm transactor call
        XcmTransactorV2.Multilocation memory dest = getXcmTransactorDestination();
        // Build bifrost xcm-action mint call data
        bytes memory callData = BuildCallData.buildMintCallBytes(msg.sender, token,Constants.MOOBEAM_CHAIN);
        // XCM Transact
        xcmtransactor.transactThroughSigned(
            dest,
            Constants.MOONRIVER_BNC_ADDRESS,
            transactRequiredWeightAtMost,
            callData,
            feeAmount,
            overallWeight
        );
         emit Mint(msg.sender, assetAddress, amount, callData);
    }

  function redeemAsset(address vAssetAddress, uint256 amount) external  override {
    bytes2 vtoken = assetAddressToCurrencyId[vAssetAddress];
    require(vtoken != bytes2(0), "MoonbeamXcmAction: The input token does not exist");

    // xtokens call
    xcmTransferAsset(vAssetAddress,amount);

    // xcm transactor call
    XcmTransactorV2.Multilocation memory dest = getXcmTransactorDestination();

    bytes memory callData = BuildCallData.buildRedeemCallBytes(msg.sender, vtoken,Constants.MOOBEAM_CHAIN);
    xcmtransactor.transactThroughSigned(
        dest,
        Constants.MOONRIVER_BNC_ADDRESS,
        transactRequiredWeightAtMost,
        callData,
        feeAmount,
        overallWeight
    );
    emit Redeem(msg.sender, vAssetAddress, amount, callData);
  }

  function swapAssetsForExactAssets(address assetInAddress, address assetOutAddress,uint256 assetInAmount, uint128 assetOutMin) external override {
        bytes2 assetIn = assetAddressToCurrencyId[assetInAddress];
        bytes2 assetOut = assetAddressToCurrencyId[assetOutAddress];
        require(assetIn != bytes2(0) &&  assetOut != bytes2(0), "MoonbeamXcmAction: The input token does not exist");

        xcmTransferAsset(assetInAddress,assetInAmount);

        // xcm transactor call
       XcmTransactorV2.Multilocation memory dest = getXcmTransactorDestination();

        bytes memory callData =  BuildCallData.buildSwapCallBytes(msg.sender , assetIn,assetOut,assetOutMin,Constants.MOOBEAM_CHAIN);
        xcmtransactor.transactThroughSigned(
            dest,
            Constants.MOONRIVER_BNC_ADDRESS,
            transactRequiredWeightAtMost,
            callData,
            feeAmount,
            overallWeight
        );
        emit Swap(msg.sender, assetInAddress, assetOutAddress, assetInAmount,assetOutMin,callData);
    }

    function swapAssetsForExactNativeAssets(address assetInAddress, uint256 assetInAmount, uint128 assetOutMin) external override {
        bytes2 assetIn = assetAddressToCurrencyId[assetInAddress];
        require(assetIn != bytes2(0), "MoonbeamXcmAction: The input token does not exist");

        xcmTransferAsset(assetInAddress,assetInAmount);

        // xcm transactor call
        XcmTransactorV2.Multilocation memory dest = getXcmTransactorDestination();

        bytes memory callData =  BuildCallData.buildSwapCallBytes(msg.sender , assetIn,Constants.MOVR_BYTES,assetOutMin,Constants.MOOBEAM_CHAIN);
        xcmtransactor.transactThroughSigned(
            dest,
            Constants.MOONRIVER_BNC_ADDRESS,
            transactRequiredWeightAtMost,
            callData,
            feeAmount,
            overallWeight
        );
        emit Swap(msg.sender, assetInAddress, Constants.ASTR_ADDRESS, assetInAmount,assetOutMin,callData);
    }

    function swapNativeAssetsForExactAssets(address assetOutAddress, uint128 assetOutMin) payable external override {
        bytes2 assetOut = assetAddressToCurrencyId[assetOutAddress];
        require(assetOut != bytes2(0), "MoonbeamXcmAction: The input token does not exist");

        xcmTransferNativeAsset(msg.value);

        // xcm transactor call
       XcmTransactorV2.Multilocation memory dest = getXcmTransactorDestination();

        bytes memory callData =  BuildCallData.buildSwapCallBytes(msg.sender , Constants.MOVR_BYTES,assetOut,assetOutMin,Constants.MOOBEAM_CHAIN);
        xcmtransactor.transactThroughSigned(
            dest,
            Constants.MOONRIVER_BNC_ADDRESS,
            transactRequiredWeightAtMost,
            callData,
            feeAmount,
            overallWeight
        );
        emit Swap(msg.sender, Constants.ASTR_ADDRESS, assetOutAddress, msg.value,assetOutMin, callData);
    }

    function getXtokensDestination(bytes32 publicKey) internal pure returns (Xtokens.Multilocation memory) {
      bytes[] memory interior = new bytes[](2);
      // Parachain: 2001/2030
        interior[0] = bytes.concat(hex"00", bytes4(Constants.BIFROST_KUSAMA_PARA_ID));
          // AccountId32: { id: public_key , network: any }
        interior[1] = bytes.concat(hex"01", publicKey , hex"00");
         Xtokens.Multilocation memory dest = Xtokens.Multilocation({
      parents: 1, interior: interior
    });

    return dest;
    }

    function getXcmTransactorDestination() internal pure returns (XcmTransactorV2.Multilocation memory) {
      bytes[] memory interior = new bytes[](1);
      // Parachain: 2001/2030
      interior[0] = bytes.concat(hex"00", bytes4(Constants.BIFROST_KUSAMA_PARA_ID));
      XcmTransactorV2.Multilocation memory dest = XcmTransactorV2.Multilocation({
      parents: 1, interior: interior
    });
    return dest;
    }
}

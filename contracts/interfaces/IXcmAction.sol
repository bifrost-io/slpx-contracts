// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

interface IXcmAction {
    /// Minted vNative assets such as vASTR, vGLMR, vMOVR
    function mintVNativeAsset() payable external;

    /// Minted vAssets
    function mintVAsset(address assetAddress,uint256 amount) external;

    /// Redeem assets
    function redeemAsset(address vAssetAddress, uint256 amount) external;

    /// Swap one asset for another
    function swapAssetsForExactAssets(address assetInAddress, address assetOutAddress,uint256 assetInAmount, uint128 assetOutMin) external;

    /// Swap one asset for native asset
    function swapAssetsForExactNativeAssets(address assetInAddress, uint256 assetInAmount, uint128 assetOutMin) external;

    /// Swap native asset for another
    function swapNativeAssetsForExactAssets(address assetOutAddress, uint128 assetOutMin) payable external;
}

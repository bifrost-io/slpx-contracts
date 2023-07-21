// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

interface ISlpx {
    event Mint(
        address minter,
        address assetAddress,
        uint256 amount,
        address receiver,
        bytes callcode
    );
    event Redeem(
        address redeemer,
        address assetAddress,
        uint256 amount,
        address receiver,
        bytes callcode
    );
    event Swap(
        address swapper,
        address assetInAddress,
        address assetOutAddress,
        uint256 assetInAmount,
        uint128 assetOutMin,
        address receiver,
        bytes callcode
    );

    /// Minted vNative assets such as vASTR, vGLMR, vMOVR
    function mintVNativeAsset(address receiver) external payable;

    /// Minted vAssets
    function mintVAsset(address assetAddress, uint256 amount, address receiver) external;

    /// Redeem assets
    function redeemAsset(address vAssetAddress, uint256 amount, address receiver) external;

    /// Swap one asset for another
    function swapAssetsForExactAssets(
        address assetInAddress,
        address assetOutAddress,
        uint256 assetInAmount,
        uint128 assetOutMin,
        address receiver
    ) external;

    /// Swap one asset for native asset
    function swapAssetsForExactNativeAssets(
        address assetInAddress,
        uint256 assetInAmount,
        uint128 assetOutMin,
        address receiver
    ) external;

    /// Swap native asset for another
    function swapNativeAssetsForExactAssets(
        address assetOutAddress,
        uint128 assetOutMin,
        address receiver
    ) external payable;
}

// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.8.10;

interface ISlpx {
    event Mint(
        address minter,
        address assetAddress,
        uint256 amount,
        address receiver,
        bytes callcode,
        string remark
    );
    event Redeem(
        address redeemer,
        address assetAddress,
        uint256 amount,
        address receiver,
        bytes callcode
    );
    event CreateOrder(
        address assetAddress,
        uint128 amount,
        uint64 dest_chain_id,
        bytes receiver,
        string remark,
        uint32 channel_id
    );

    /// Minted vNative assets such as vASTR, vGLMR, vMOVR
    function mintVNativeAsset(
        address receiver,
        string memory remark
    ) external payable;

    /// Minted vAssets
    function mintVAsset(
        address assetAddress,
        uint256 amount,
        address receiver,
        string memory remark
    ) external;

    /// Minted vNative assets such as vASTR, vGLMR, vMOVR
    function mintVNativeAssetWithChannelId(
        address receiver,
        string memory remark,
        uint32 channel_id
    ) external payable;

    /// Minted vAssets
    function mintVAssetWithChannelId(
        address assetAddress,
        uint256 amount,
        address receiver,
        string memory remark,
        uint32 channel_id
    ) external;

    /// Redeem assets
    function redeemAsset(
        address vAssetAddress,
        uint256 amount,
        address receiver
    ) external;

    /**
     * @dev Create order to mint vAsset or redeem vAsset on bifrost chain
     * @param assetAddress The address of the asset to mint or redeem
     * @param amount The amount of the asset to mint or redeem
     * @param dest_chain_id When order is executed on Bifrost, Asset/vAsset will be transferred to this chain
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
    ) external payable;
}

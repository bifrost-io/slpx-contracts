// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./interfaces/XCM.sol";
import "./interfaces/IXcmAction.sol";
import "./utils/Constants.sol";
import "./utils/BuildCallData.sol";
import "./utils/AddressToAccount.sol";

contract AstarXcmAction is IXcmAction, Ownable {
    uint256 public bifrost_transaction_fee = 1000000000000;

    XCM xcm = XCM(0x0000000000000000000000000000000000005004);
    
    mapping (address => bytes2) public assetAddressToCurrencyId;

    event Mint(address minter, address assetAddress, uint256 amount, bytes callcode);
    event Redeem(address redeemer, address assetAddress, uint256 amount, bytes callcode);
    event Swap(address swapper, address assetInAddress,address assetOutAddress, uint256 assetInAmount, uint128 assetOutMin, bytes callcode);

    function set_bifrost_transaction_fee(uint256 fee) onlyOwner external {
        bifrost_transaction_fee = fee;
    }

    function setAssetAddressToCurrencyId(address assetAddress,bytes2 currencyId) onlyOwner external {
        assetAddressToCurrencyId[assetAddress] = currencyId;
    }

    function xcmTransferAsset(address assetAddress,uint256 amount) internal {
        bytes32 publicKey = AddressToAccount.AddressToSubstrateAccount(msg.sender);
        address[] memory assetId = new address[](1);
        uint256[] memory assetAmount = new uint256[](1);
        IERC20 erc20 = IERC20(assetAddress);
        erc20.transferFrom(msg.sender, address(this), amount);
        assetId[0] = assetAddress;
        assetAmount[0] = amount;
        xcm.assets_withdraw(assetId, assetAmount, publicKey, false, Constants.BIFROST_POLKADOT_PARA_ID, 0);
    }

    function xcmTransferNativeAsset(uint256 amount) internal {
        bytes32 publicKey = AddressToAccount.AddressToSubstrateAccount(msg.sender);
        address[] memory assetId = new address[](1);
        uint256[] memory assetAmount = new uint256[](1);
        assetId[0] = Constants.ASTR_ADDRESS;
        assetAmount[0] = amount;
        xcm.assets_reserve_transfer(assetId, assetAmount, publicKey, false, Constants.BIFROST_POLKADOT_PARA_ID, 0);
    }

    function mintVNativeAsset() payable external override {
        xcmTransferNativeAsset(msg.value);

        bytes memory callcode =  BuildCallData.buildMintCallBytes(msg.sender , Constants.ASTR_BYTES,Constants.ASTAR_CHAIN);

        // xcm transact
        xcm.remote_transact(Constants.BIFROST_POLKADOT_PARA_ID, false, Constants.ASTAR_BNC_ADDRESS, bifrost_transaction_fee / 10, callcode, 10000000000);
        emit Mint(msg.sender, Constants.ASTR_ADDRESS, msg.value, callcode);
    }

    function mintVAsset(address, uint256) external pure override {
        require(false , "AstarXcmAction: This operation is not currently supported");
    }

    function redeemAsset(address vAssetAddress, uint256 amount) external override {
        bytes2 vtoken = assetAddressToCurrencyId[vAssetAddress];
        require(vtoken == 0x0903, "AstarXcmAction: Only supports redeem ASTR");

        xcmTransferAsset(vAssetAddress, amount);

        bytes memory callcode = BuildCallData.buildRedeemCallBytes(msg.sender,vtoken,Constants.ASTAR_CHAIN);
        // xcm transact
        xcm.remote_transact(Constants.BIFROST_POLKADOT_PARA_ID, false, Constants.ASTAR_BNC_ADDRESS, bifrost_transaction_fee / 10, callcode, 10000000000);
        emit Redeem(msg.sender, vAssetAddress, amount, callcode);
    }


    function swapAssetsForExactAssets(address assetInAddress, address assetOutAddress,uint256 assetInAmount, uint128 assetOutMin) external override {
        bytes2 assetIn = assetAddressToCurrencyId[assetInAddress];
        bytes2 assetOut = assetAddressToCurrencyId[assetOutAddress];
        require(assetIn != bytes2(0) &&  assetOut != bytes2(0), "AstarXcmAction: The input token does not exist");

        xcmTransferAsset(assetInAddress, assetInAmount);

        bytes memory callcode =  BuildCallData.buildSwapCallBytes(msg.sender, assetIn,assetOut,assetOutMin,Constants.ASTAR_CHAIN);
        // xcm transact
        xcm.remote_transact(Constants.BIFROST_POLKADOT_PARA_ID, false, Constants.ASTAR_BNC_ADDRESS, bifrost_transaction_fee / 10, callcode, 10000000000);
        emit Swap(msg.sender, assetInAddress, assetOutAddress, assetInAmount,assetOutMin,callcode);
    }

    function swapAssetsForExactNativeAssets(address assetInAddress, uint256 assetInAmount, uint128 assetOutMin) external override {
        bytes2 assetIn = assetAddressToCurrencyId[assetInAddress];
        require(assetIn != bytes2(0), "AstarXcmAction: The input token does not exist");

        xcmTransferAsset(assetInAddress, assetInAmount);

        bytes memory callcode =  BuildCallData.buildSwapCallBytes(msg.sender , assetIn,Constants.ASTR_BYTES,assetOutMin,Constants.ASTAR_CHAIN);
        // xcm transact
        xcm.remote_transact(Constants.BIFROST_POLKADOT_PARA_ID, false, Constants.ASTAR_BNC_ADDRESS, bifrost_transaction_fee / 10, callcode, 10000000000);
        emit Swap(msg.sender, assetInAddress, Constants.ASTR_ADDRESS, assetInAmount,assetOutMin,callcode);
    }

    function swapNativeAssetsForExactAssets(address assetOutAddress, uint128 assetOutMin) payable external override {
        bytes2 assetOut = assetAddressToCurrencyId[assetOutAddress];
        require(assetOut != bytes2(0), "AstarXcmAction: The input token does not exist");
        
        xcmTransferNativeAsset(msg.value);

        bytes memory callcode = BuildCallData.buildSwapCallBytes(msg.sender , Constants.ASTR_BYTES,assetOut,assetOutMin,Constants.ASTAR_CHAIN);
        // xcm transact
        xcm.remote_transact(Constants.BIFROST_POLKADOT_PARA_ID, false, Constants.ASTAR_BNC_ADDRESS, bifrost_transaction_fee / 10, callcode, 10000000000);
        emit Swap(msg.sender, Constants.ASTR_ADDRESS, assetOutAddress, msg.value,assetOutMin,callcode);
    }
}
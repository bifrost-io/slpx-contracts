// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "./interfaces/XCM.sol";
import "./interfaces/IXcmAction.sol";
import "./utils/BuildCallData.sol";
import "./utils/AddressToAccount.sol";

contract AstarXcmAction is IXcmAction, Ownable , Pausable {
    address constant public NATIVE_ASSET_ADDRESS = 0x0000000000000000000000000000000000000000;
    address constant public BNC_ADDRESS = 0xfFffFffF00000000000000010000000000000007;
    bytes2 constant public ASTR_BYTES = 0x0803;
    bytes2 constant public VASTR_BYTES = 0x0903;
    bytes1 constant public ASTAR_CHAIN = 0x00;
    uint32 constant public BIFROST_PARA_ID = 2030;
    
    uint256 public bifrostTransactionFee;
    uint64 public transactWeight;

    XCM xcm = XCM(0x0000000000000000000000000000000000005004);
    
    mapping (address => bytes2) public assetAddressToCurrencyId;
    mapping (address => uint256) public assetAddressToMinimumValue;

    constructor(uint256 _bifrostTransactionFee,uint64 _transactWeight) {
        require(_bifrostTransactionFee <= 1000000000000, "AstarXcmAction: Transaction Fee too large");
        require(_transactWeight <= 10000000000, "AstarXcmAction: TransactWeight too large");
        bifrostTransactionFee = _bifrostTransactionFee;
        transactWeight = _transactWeight;
    }

    function setBifrostTransactionFee(uint256 _bifrostTransactionFee,uint64 _transactWeight) onlyOwner external {
        require(_bifrostTransactionFee <= 1000000000000, "AstarXcmAction: Transaction Fee too large");
        require(_transactWeight <= 10000000000, "AstarXcmAction: TransactWeight too large");
        bifrostTransactionFee = _bifrostTransactionFee;
        transactWeight = _transactWeight;
    }

    function setAssetAddressToMinimumValue(address assetAddress,uint256 minimunValue) onlyOwner external {
        require(minimunValue > 0, "AstarXcmAction: minimunValue too small");
        assetAddressToMinimumValue[assetAddress] = minimunValue;
    }

    function setAssetAddressToCurrencyId(address assetAddress,bytes2 currencyId) onlyOwner external {
        require(currencyId != bytes2(0), "AstarXcmAction: The input token does not exist");
        assetAddressToCurrencyId[assetAddress] = currencyId;
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function xcmTransferAsset(address assetAddress,uint256 amount) internal {
        require(assetAddress != address(0), "AstarXcmAction: cannot be an invalid address");
        require(assetAddressToMinimumValue[assetAddress] <= amount, "AstarXcmAction: less than the minimum operand value");
        bytes32 publicKey = AddressToAccount.AddressToSubstrateAccount(msg.sender);
        address[] memory assetId = new address[](1);
        uint256[] memory assetAmount = new uint256[](1);
        IERC20 erc20 = IERC20(assetAddress);
        erc20.transferFrom(msg.sender, address(this), amount);
        assetId[0] = assetAddress;
        assetAmount[0] = amount;
        xcm.assets_withdraw(assetId, assetAmount, publicKey, false, BIFROST_PARA_ID, 0);
    }

    function xcmTransferNativeAsset(uint256 amount) internal {
        require(assetAddressToMinimumValue[NATIVE_ASSET_ADDRESS] <= amount, "AstarXcmAction: less than the minimum operand value");
        bytes32 publicKey = AddressToAccount.AddressToSubstrateAccount(msg.sender);
        address[] memory assetId = new address[](1);
        uint256[] memory assetAmount = new uint256[](1);
        assetId[0] = NATIVE_ASSET_ADDRESS;
        assetAmount[0] = amount;
        xcm.assets_reserve_transfer(assetId, assetAmount, publicKey, false, BIFROST_PARA_ID, 0);
    }

    function mintVNativeAsset() payable external override whenNotPaused {
        xcmTransferNativeAsset(msg.value);

        bytes memory callcode =  BuildCallData.buildMintCallBytes(msg.sender , ASTR_BYTES,ASTAR_CHAIN);

        // xcm transact
        xcm.remote_transact(BIFROST_PARA_ID, false, BNC_ADDRESS, bifrostTransactionFee, callcode, transactWeight);
        emit Mint(msg.sender, NATIVE_ASSET_ADDRESS, msg.value, callcode);
    }

    function mintVAsset(address, uint256) external pure override {
        require(false , "AstarXcmAction: This operation is not currently supported");
    }

    function redeemAsset(address vAssetAddress, uint256 amount) external override whenNotPaused {
        bytes2 vtoken = assetAddressToCurrencyId[vAssetAddress];
        require(vtoken == VASTR_BYTES, "AstarXcmAction: Only supports redeem ASTR");

        xcmTransferAsset(vAssetAddress, amount);

        bytes memory callcode = BuildCallData.buildRedeemCallBytes(msg.sender,vtoken,ASTAR_CHAIN);
        // xcm transact
        xcm.remote_transact(BIFROST_PARA_ID, false, BNC_ADDRESS, bifrostTransactionFee, callcode, transactWeight);
        emit Redeem(msg.sender, vAssetAddress, amount, callcode);
    }


    function swapAssetsForExactAssets(address assetInAddress, address assetOutAddress,uint256 assetInAmount, uint128 assetOutMin) external override whenNotPaused {
        bytes2 assetIn = assetAddressToCurrencyId[assetInAddress];
        bytes2 assetOut = assetAddressToCurrencyId[assetOutAddress];
        require(assetIn != bytes2(0) &&  assetOut != bytes2(0), "AstarXcmAction: The input token does not exist");

        xcmTransferAsset(assetInAddress, assetInAmount);

        bytes memory callcode =  BuildCallData.buildSwapCallBytes(msg.sender, assetIn,assetOut,assetOutMin,ASTAR_CHAIN);
        // xcm transact
        xcm.remote_transact(BIFROST_PARA_ID, false, BNC_ADDRESS, bifrostTransactionFee, callcode, transactWeight);
        emit Swap(msg.sender, assetInAddress, assetOutAddress, assetInAmount,assetOutMin,callcode);
    }

    function swapAssetsForExactNativeAssets(address assetInAddress, uint256 assetInAmount, uint128 assetOutMin) external override whenNotPaused {
        bytes2 assetIn = assetAddressToCurrencyId[assetInAddress];
        require(assetIn != bytes2(0), "AstarXcmAction: The input token does not exist");

        xcmTransferAsset(assetInAddress, assetInAmount);

        bytes memory callcode =  BuildCallData.buildSwapCallBytes(msg.sender , assetIn,ASTR_BYTES,assetOutMin,ASTAR_CHAIN);
        // xcm transact
        xcm.remote_transact(BIFROST_PARA_ID, false, BNC_ADDRESS, bifrostTransactionFee, callcode, transactWeight);
        emit Swap(msg.sender, assetInAddress, NATIVE_ASSET_ADDRESS, assetInAmount,assetOutMin,callcode);
    }

    function swapNativeAssetsForExactAssets(address assetOutAddress, uint128 assetOutMin) payable external override whenNotPaused {
        bytes2 assetOut = assetAddressToCurrencyId[assetOutAddress];
        require(assetOut != bytes2(0), "AstarXcmAction: The input token does not exist");
        
        xcmTransferNativeAsset(msg.value);

        bytes memory callcode = BuildCallData.buildSwapCallBytes(msg.sender , ASTR_BYTES,assetOut,assetOutMin,ASTAR_CHAIN);
        // xcm transact
        xcm.remote_transact(BIFROST_PARA_ID, false, BNC_ADDRESS, bifrostTransactionFee, callcode, transactWeight);
        emit Swap(msg.sender, NATIVE_ASSET_ADDRESS, assetOutAddress, msg.value,assetOutMin,callcode);
    }
}
// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "./interfaces/XcmTransactorV2.sol";
import "./interfaces/Xtokens.sol";
import "./interfaces/IXcmAction.sol";
import "./utils/AddressToAccount.sol";
import "./utils/BuildCallData.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

contract MoonbeamXcmAction is IXcmAction, Ownable, Pausable {

  address constant public NATIVE_ASSET_ADDRESS = 0x0000000000000000000000000000000000000802;

  uint64 public  xtokenWeight = 10000000000;
  uint64 public  transactRequiredWeightAtMost = 10000000000;
  uint64 public  overallWeight = 10000000000;
  uint256 public  feeAmount = 1000000000000;

  bytes1 public targetChain;
  address public BNCAddress;
  uint32 public bifrostParaId;
  bytes2 public nativeCurrencyId;


  // pre-compiled contract address
  XcmTransactorV2 xcmtransactor = XcmTransactorV2(0x000000000000000000000000000000000000080D);
  Xtokens xtokens = Xtokens(0x0000000000000000000000000000000000000804);

    mapping (address => bytes2) public assetAddressToCurrencyId;
    mapping (address => uint256) public assetAddressToMinimumValue;

    constructor(bytes1 _targetChain,address _BNCAddress,uint32 _bifrostParaId, bytes2 _nativeCurrencyId) {
        require(_BNCAddress != address(0), "MoonbeamXcmAction: cannot be an invalid address");
        require(_bifrostParaId == 2001 || _bifrostParaId == 2030, "MoonbeamXcmAction: bifrostParaId is incorrect");
        require(_nativeCurrencyId == 0x020a || _nativeCurrencyId == 0x0801, "MoonbeamXcmAction: nativeCurrencyId is incorrect");
        targetChain = _targetChain;
        BNCAddress = _BNCAddress;
        bifrostParaId = _bifrostParaId;
        nativeCurrencyId = _nativeCurrencyId;
    }
    
   function setFee(uint64 _xtokenWeight,uint64 _transactRequiredWeightAtMost,uint64 _overallWeight,uint256 _feeAmount) onlyOwner external {
        require(_xtokenWeight <= 10000000000, "MoonbeamXcmAction: xtokenWeight too large");
        require(_transactRequiredWeightAtMost <= 10000000000, "MoonbeamXcmAction: transactRequiredWeightAtMost too large");
        require(_overallWeight <= 10000000000, "MoonbeamXcmAction: transactRequiredWeightAtMost too large");
        require(_feeAmount <= 1000000000000, "MoonbeamXcmAction: feeAmount too large");
        xtokenWeight = _xtokenWeight;
        transactRequiredWeightAtMost = _transactRequiredWeightAtMost;
        overallWeight = _overallWeight;
        feeAmount = _feeAmount;
    }

    function setAssetAddressToMinimumValue(address assetAddress,uint256 minimunValue) onlyOwner external {
        require(assetAddress != address(0), "MoonbeamXcmAction: cannot be an invalid address");
        require(minimunValue > 0, "AstarXcmAction: minimunValue too small");
        assetAddressToMinimumValue[assetAddress] = minimunValue;
    }

    function setAssetAddressToCurrencyId(address assetAddress,bytes2 currencyId) onlyOwner external {
        require(assetAddress != address(0), "MoonbeamXcmAction: cannot be an invalid address");
        require(currencyId != bytes2(0), "MoonbeamXcmAction: The input token does not exist");
        assetAddressToCurrencyId[assetAddress] = currencyId;
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function xcmTransferAsset(address assetAddress, uint256 amount) internal  {
        require(assetAddress != address(0), "MoonbeamXcmAction: cannot be an invalid address");
        require(assetAddressToMinimumValue[assetAddress] <= amount, "MoonbeamXcmAction: less than the minimum operand value");
        bytes32 publicKey = AddressToAccount.AddressToSubstrateAccount(msg.sender);
        Xtokens.Multilocation memory dest_account = getXtokensDestination(publicKey);
        IERC20 asset = IERC20(assetAddress);
        asset.transferFrom(msg.sender, address(this), amount);
        xtokens.transfer(assetAddress, amount, dest_account, xtokenWeight);
    }

  function xcmTransferNativeAsset(uint256 amount) internal {
    require(assetAddressToMinimumValue[NATIVE_ASSET_ADDRESS] <= amount, "MoonbeamXcmAction: less than the minimum operand value");
    bytes32 publicKey = AddressToAccount.AddressToSubstrateAccount(msg.sender);

    Xtokens.Multilocation memory dest_account = getXtokensDestination(publicKey);
    xtokens.transfer(NATIVE_ASSET_ADDRESS, amount, dest_account, xtokenWeight);
  }

  function mintVNativeAsset() payable external override whenNotPaused {
    // xtokens call
    xcmTransferNativeAsset(msg.value);

    // xcm transactor call
    XcmTransactorV2.Multilocation memory dest = getXcmTransactorDestination();
    // Build bifrost xcm-action mint call data
    bytes memory callData = BuildCallData.buildMintCallBytes(msg.sender, nativeCurrencyId,targetChain);
    // XCM Transact
    xcmtransactor.transactThroughSigned(
        dest,
        BNCAddress,
        transactRequiredWeightAtMost,
        callData,
        feeAmount,
        overallWeight
    );
    emit Mint(msg.sender, NATIVE_ASSET_ADDRESS, msg.value, callData);
  }

    function mintVAsset(address assetAddress,uint256 amount) external  override whenNotPaused {
        bytes2 token = assetAddressToCurrencyId[assetAddress];
        require(token != bytes2(0), "MoonriverXcmAction: The input token does not exist");

        // xtokens call
        xcmTransferAsset(assetAddress,amount);

        // xcm transactor call
        XcmTransactorV2.Multilocation memory dest = getXcmTransactorDestination();
        // Build bifrost xcm-action mint call data
        bytes memory callData = BuildCallData.buildMintCallBytes(msg.sender, token,targetChain);
        // XCM Transact
        xcmtransactor.transactThroughSigned(
            dest,
            BNCAddress,
            transactRequiredWeightAtMost,
            callData,
            feeAmount,
            overallWeight
        );
         emit Mint(msg.sender, assetAddress, amount, callData);
    }

  function redeemAsset(address vAssetAddress, uint256 amount) external  override whenNotPaused {
    bytes2 vtoken = assetAddressToCurrencyId[vAssetAddress];
    require(vtoken != bytes2(0), "MoonbeamXcmAction: The input token does not exist");

    // xtokens call
    xcmTransferAsset(vAssetAddress,amount);

    // xcm transactor call
    XcmTransactorV2.Multilocation memory dest = getXcmTransactorDestination();

    bytes memory callData = BuildCallData.buildRedeemCallBytes(msg.sender, vtoken,targetChain);
    xcmtransactor.transactThroughSigned(
        dest,
        BNCAddress,
        transactRequiredWeightAtMost,
        callData,
        feeAmount,
        overallWeight
    );
    emit Redeem(msg.sender, vAssetAddress, amount, callData);
  }

  function swapAssetsForExactAssets(address assetInAddress, address assetOutAddress,uint256 assetInAmount, uint128 assetOutMin) external override whenNotPaused {
        bytes2 assetIn = assetAddressToCurrencyId[assetInAddress];
        bytes2 assetOut = assetAddressToCurrencyId[assetOutAddress];
        require(assetIn != bytes2(0) &&  assetOut != bytes2(0), "MoonbeamXcmAction: The input token does not exist");

        xcmTransferAsset(assetInAddress,assetInAmount);

        // xcm transactor call
       XcmTransactorV2.Multilocation memory dest = getXcmTransactorDestination();

        bytes memory callData =  BuildCallData.buildSwapCallBytes(msg.sender , assetIn,assetOut,assetOutMin,targetChain);
        xcmtransactor.transactThroughSigned(
            dest,
            BNCAddress,
            transactRequiredWeightAtMost,
            callData,
            feeAmount,
            overallWeight
        );
        emit Swap(msg.sender, assetInAddress, assetOutAddress, assetInAmount,assetOutMin,callData);
    }

    function swapAssetsForExactNativeAssets(address assetInAddress, uint256 assetInAmount, uint128 assetOutMin) external override whenNotPaused {
        bytes2 assetIn = assetAddressToCurrencyId[assetInAddress];
        require(assetIn != bytes2(0), "MoonbeamXcmAction: The input token does not exist");

        xcmTransferAsset(assetInAddress,assetInAmount);

        // xcm transactor call
        XcmTransactorV2.Multilocation memory dest = getXcmTransactorDestination();

        bytes memory callData =  BuildCallData.buildSwapCallBytes(msg.sender , assetIn,nativeCurrencyId,assetOutMin,targetChain);
        xcmtransactor.transactThroughSigned(
            dest,
            BNCAddress,
            transactRequiredWeightAtMost,
            callData,
            feeAmount,
            overallWeight
        );
        emit Swap(msg.sender, assetInAddress, NATIVE_ASSET_ADDRESS, assetInAmount,assetOutMin,callData);
    }

    function swapNativeAssetsForExactAssets(address assetOutAddress, uint128 assetOutMin) payable external override whenNotPaused {
        bytes2 assetOut = assetAddressToCurrencyId[assetOutAddress];
        require(assetOut != bytes2(0), "MoonbeamXcmAction: The input token does not exist");

        xcmTransferNativeAsset(msg.value);

        // xcm transactor call
       XcmTransactorV2.Multilocation memory dest = getXcmTransactorDestination();

        bytes memory callData =  BuildCallData.buildSwapCallBytes(msg.sender , nativeCurrencyId,assetOut,assetOutMin,targetChain);
        xcmtransactor.transactThroughSigned(
            dest,
            BNCAddress,
            transactRequiredWeightAtMost,
            callData,
            feeAmount,
            overallWeight
        );
        emit Swap(msg.sender, NATIVE_ASSET_ADDRESS, assetOutAddress, msg.value,assetOutMin, callData);
    }

    function getXtokensDestination(bytes32 publicKey) internal view returns (Xtokens.Multilocation memory) {
      bytes[] memory interior = new bytes[](2);
      // Parachain: 2001/2030
        interior[0] = bytes.concat(hex"00", bytes4(bifrostParaId));
          // AccountId32: { id: public_key , network: any }
        interior[1] = bytes.concat(hex"01", publicKey , hex"00");
         Xtokens.Multilocation memory dest = Xtokens.Multilocation({
      parents: 1, interior: interior
    });

    return dest;
    }

    function getXcmTransactorDestination() internal view returns (XcmTransactorV2.Multilocation memory) {
      bytes[] memory interior = new bytes[](1);
      // Parachain: 2001/2030
      interior[0] = bytes.concat(hex"00", bytes4(bifrostParaId));
      XcmTransactorV2.Multilocation memory dest = XcmTransactorV2.Multilocation({
      parents: 1, interior: interior
    });
    return dest;
    }
}

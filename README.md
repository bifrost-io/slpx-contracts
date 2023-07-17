# Slpx contracts

Slpx contracts contract to do xcm call to Bifrost's xcm-action pallet.

| Network        | Slpx Address |
|----------------|--------------|
| Astar Rococo   | 0x82745827D0B8972eC0583B3100eCb30b81Db0072          |
| Moonbase Alpha | 0xA3C7AE227B41CcDF34f38D408Fb7fFD37395553A          |

- mintVNativeAsset() payable external: Cast the original Token on the parachain into VToken
- mintVAsset(address assetAddress,uint256 amount) external: Cast the non-native Token on the parachain into VToken, such as DOT->vDOT
- redeemAsset(address vAssetAddress, uint256 amount) external: Redeem your own VToken into Token. The redemption period varies according to the Token. For example, vDOT redemption is 0-28 days
- swapAssetsForExactAssets(address assetInAddress, address assetOutAddress,uint256 assetInAmount, uint128 assetOutMin) external：Swap one Token into another Token, such as BNC Swap into DOT
- swapAssetsForExactNativeAssets(address assetInAddress, uint256 assetInAmount, uint128 assetOutMin) external: Swap a Token into a parachain native Token, such as BNC Swap into GLMR
- swapNativeAssetsForExactAssets(address assetOutAddress, uint128 assetOutMin) payable external: Swap the original Token of the parachain into other Tokens, such as GLMR Swap into BNC

## Astar precompiled contracts

* [XCM.sol](https://github.com/AstarNetwork/astar-frame/blob/polkadot-v0.9.39/precompiles/xcm/XCM.sol) - xcm precompiled contract.

## Moonbeam precompiled contracts

* [XcmTransactorV2.sol](https://github.com/PureStake/moonbeam/blob/master/precompiles/xcm-transactor/src/v2/XcmTransactorV2.sol) - xcm-transactorV2 precompiled contract.
* [Xtokens.sol](https://github.com/PureStake/moonbeam/blob/master/precompiles/xtokens/Xtokens.sol) - xtokens precompiled contract.
* [Batch.sol](https://github.com/PureStake/moonbeam/blob/master/precompiles/batch/Batch.sol) - batch precompiled contract.

## Hardhat tasks

```sh
npx hardhat help
npx hardhat test
REPORT_GAS=true npx hardhat test
npx hardhat node
npx hardhat run scripts/deploy.ts
```

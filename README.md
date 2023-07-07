# XCM Action contracts

XCM Action contracts contract to do xcm call to Bifrost's xcm-action pallet.

| Network        | Slpx Address |
|----------------|--------------|
| Astar Rococo   | 0x82745827D0B8972eC0583B3100eCb30b81Db0072          |
| Moonbase Alpha | 0xe11028392f672507ac3A001642817217Bc8e238A          |

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

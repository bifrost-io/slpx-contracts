# Moonbeam XCM Action

[![Hardhat CI](https://github.com/bifrost-finance/moonbeam-xcm-action/actions/workflows/ci.yml/badge.svg)](https://github.com/bifrost-finance/moonbeam-xcm-action/actions/workflows/ci.yml)

Moonbeam contract to do xcm call to Bifrost's xcm-action pallet.

## Moonbeam precompiled contracts

* [XcmTransactorV2.sol](https://github.com/PureStake/moonbeam/blob/master/precompiles/xcm-transactor/src/v2/XcmTransactorV2.sol) - xcm-transactor precompiled contract.
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

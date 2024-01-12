# Slpx contracts

## Depoly && Upgrade contracts

```shell
cp .env.example .env
yarn deployToAstar
yarn deployToMoonbeam
yarn deployToMoonriver
```

| Network        | Slpx Address |
|----------------|--------------|
| Astar          | 0xc6bf0C5C78686f1D0E2E54b97D6de6e2cEFAe9fD          |
| Moonrbeam      | 0xF1d4797E51a4640a76769A50b57abE7479ADd3d8          |
| Moonriver      | 0x6b0A44c64190279f7034b77c13a566E914FE5Ec4          |
| Astar Rococo   | 0xf8B6c4Ec654e4fDCB8f5B58094D93BE268B18fAc          |


| Network        | XcmOracle Address                          |
|----------------|--------------------------------------------|
| Moonrbeam      | 0xEF81930Aa8ed07C17948B2E26b7bfAF20144eF2a |
| Moonriver      | 0x682D05cD8D96b9904eC2b1B97BD1eb640B10fC2d |


## Contract info

- mintVNativeAsset(address receiver, string memory remark) payable external: Cast the original Token on the parachain into VToken
- mintVAsset(address assetAddress,uint256 amount, address receiver, string memory remark) external: Cast the non-native Token on the parachain into VToken, such as DOT->vDOT
- redeemAsset(address vAssetAddress, uint256 amount) external: Redeem your own VToken into Token. The redemption period varies according to the Token. For example, vDOT redemption is 0-28 days
- swapAssetsForExactAssets(address assetInAddress, address assetOutAddress,uint256 assetInAmount, uint128 assetOutMin, address receiver) external：Swap one Token into another Token, such as BNC Swap into DOT
- swapAssetsForExactNativeAssets(address assetInAddress, uint256 assetInAmount, uint128 assetOutMin, address receiver) external: Swap a Token into a parachain native Token, such as BNC Swap into GLMR
- swapNativeAssetsForExactAssets(address assetOutAddress, uint128 assetOutMin, address receiver) payable external: Swap the original Token of the parachain into other Tokens, such as GLMR Swap into BNC

## CurrencyId

### Astar

| Token                | Address                                    | CurrencyId | operationalMin          |
|:---------------------| :----------------------------------------- |:-----------|:------------------------|
| BNC                  | 0xfFffFffF00000000000000010000000000000007 | 0x0001     | 1_000_000_000_000       |
| DOT                  | 0xFFfFfFffFFfffFFfFFfFFFFFffFFFffffFfFFFfF | 0x0800     | 1_000_000_000_000       |
| Bifrost_Voucher_DOT  | 0xFfFfFfff00000000000000010000000000000008 | 0x0900     | 6_000_000_000           |
| Bifrost_Voucher_ASTR | 0xfffFffff00000000000000010000000000000010 | 0x0903     | 800_000_000_000_000_000 |


### Moonbeam

| Token                         | Address                                    | CurrencyId | operationalMin            |
| :---------------------------- | :----------------------------------------- | :--------- | :------------------------ |
| BNC                           | 0xFFffffFf7cC06abdF7201b350A1265c62C8601d2 | 0x0001     | 1_000_000_000_000         |
| xcDOT                         | 0xFfFFfFff1FcaCBd218EDc0EbA20Fc2308C778080 | 0x0800     | 10_000_000_000            |
| GLMR                          | 0x0000000000000000000000000000000000000802 | 0x0801     | 5_000_000_000_000_000_000 |
| Bifrost_Filecoin_Native_Token | 0xfFFfFFFF6C57e17D210DF507c82807149fFd70B2 | 0x0804     | 1_000_000_000_000_000_000 |
| Bifrost_Voucher_DOT           | 0xFFFfffFf15e1b7E3dF971DD813Bc394deB899aBf | 0x0900     | 8_000_000_000             |
| Bifrost_Voucher_GLMR          | 0xFfFfFFff99dABE1a8De0EA22bAa6FD48fdE96F6c | 0x0901     | 4_000_000_000_000_000_000 |
| Bifrost_Voucher_FIL           | 0xFffffFffCd0aD0EA6576B7b285295c85E94cf4c1 | 0x0904     | 800_000_000_000_000_000   |

## Moonriver

| Token                | Address                                    | CurrencyId | operationalMin          |
| :------------------- | :----------------------------------------- | :--------- | :---------------------- |
| xcBNC                | 0xFFfFFfFFF075423be54811EcB478e911F22dDe7D | 0x0001     | 1_000_000_000_000       |
| xcKSM                | 0xFfFFfFff1FcaCBd218EDc0EbA20Fc2308C778080 | 0x0204     | 500_000_000_000         |
| MOVR                 | 0x0000000000000000000000000000000000000802 | 0x020a     | 500_000_000_000_000_000 |
| Bifrost_Voucher_BNC  | 0xFFffffff3646A00f78caDf8883c5A2791BfCDdc4 | 0x0101     | 800_000_000_000         |
| Bifrost_Voucher_KSM  | 0xFFffffFFC6DEec7Fc8B11A2C8ddE9a59F8c62EFe | 0x0104     | 400_000_000_000         |
| Bifrost_Voucher_MOVR | 0xfFfffFfF98e37bF6a393504b5aDC5B53B4D0ba11 | 0x010a     | 400_000_000_000_000_000 |

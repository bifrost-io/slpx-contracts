# Slpx contracts

## Depoly && Upgrade contracts

```shell
cp .env.example .env
yarn deployMoonbeam
yarn deployMoonriver
```

| Network        | Slpx Address |
|----------------|--------------|
| Astar Rococo   | 0x82745827D0B8972eC0583B3100eCb30b81Db0072          |
| Moonbase Alpha | 0xA3C7AE227B41CcDF34f38D408Fb7fFD37395553A          |

## Contract info

- mintVNativeAsset() payable external: Cast the original Token on the parachain into VToken
- mintVAsset(address assetAddress,uint256 amount) external: Cast the non-native Token on the parachain into VToken, such as DOT->vDOT
- redeemAsset(address vAssetAddress, uint256 amount) external: Redeem your own VToken into Token. The redemption period varies according to the Token. For example, vDOT redemption is 0-28 days
- swapAssetsForExactAssets(address assetInAddress, address assetOutAddress,uint256 assetInAmount, uint128 assetOutMin) external：Swap one Token into another Token, such as BNC Swap into DOT
- swapAssetsForExactNativeAssets(address assetInAddress, uint256 assetInAmount, uint128 assetOutMin) external: Swap a Token into a parachain native Token, such as BNC Swap into GLMR
- swapNativeAssetsForExactAssets(address assetOutAddress, uint128 assetOutMin) payable external: Swap the original Token of the parachain into other Tokens, such as GLMR Swap into BNC

## FeeInfo

| Operation   | transactRequiredWeightAtMost | feeAmount       | overallWeight  |
| ----------- | ---------------------------- | --------------- | -------------- |
| Mint        | 10_000_000_000               | 100_000_000_000 | 10_000_000_000 |
| Redeem      | 10_000_000_000               | 100_000_000_000 | 10_000_000_000 |
| ZenlinkSwap | 10_000_000_000               | 100_000_000_000 | 10_000_000_000 |
| StableSwap  | 10_000_000_000               | 100_000_000_000 | 10_000_000_000 |

## CurrencyId

### Moonbeam

|             Token             |                  Address                   | CurrencyId |      operationalMin       |
|:-----------------------------:| :----------------------------------------: | :--------: | :-----------------------: |
|              BNC              | 0xFFffffFf7cC06abdF7201b350A1265c62C8601d2 |   0x0001   |     1_000_000_000_000     |
|             xcDOT             | 0xFfFFfFff1FcaCBd218EDc0EbA20Fc2308C778080 |   0x0800   |      10_000_000_000       |
|             GLMR              | 0x0000000000000000000000000000000000000802 |   0x0801   | 5_000_000_000_000_000_000 |
| Bifrost_Filecoin_Native_Token | 0xfFFfFFFF6C57e17D210DF507c82807149fFd70B2 |   0x0804   | 1_000_000_000_000_000_000 |
|      Bifrost_Voucher_DOT      | 0xFFFfffFf15e1b7E3dF971DD813Bc394deB899aBf |   0x0900   |       8_000_000_000       |
|     Bifrost_Voucher_GLMR      | 0xFfFfFFff99dABE1a8De0EA22bAa6FD48fdE96F6c |   0x0901   | 4_000_000_000_000_000_000 |
|      Bifrost_Voucher_FIL      | 0xFffffFffCd0aD0EA6576B7b285295c85E94cf4c1 |   0x0904   |  800_000_000_000_000_000  |

## Moonriver

|        Token         |                  Address                   | CurrencyId |     operationalMin      |
|:--------------------:| :----------------------------------------: | :--------: | :---------------------: |
|        xcBNC         | 0xFFfFFfFFF075423be54811EcB478e911F22dDe7D |   0x0001   |    1_000_000_000_000    |
|        xcKSM         | 0xFfFFfFff1FcaCBd218EDc0EbA20Fc2308C778080 |   0x0204   |     500_000_000_000     |
|         MOVR         | 0x0000000000000000000000000000000000000802 |   0x020a   | 500_000_000_000_000_000 |
| Bifrost_Voucher_BNC  | 0xFFffffff3646A00f78caDf8883c5A2791BfCDdc4 |   0x0101   |     800_000_000_000     |
| Bifrost_Voucher_KSM  | 0xFFffffFFC6DEec7Fc8B11A2C8ddE9a59F8c62EFe |   0x0104   |     400_000_000_000     |
| Bifrost_Voucher_MOVR | 0xfFfffFfF98e37bF6a393504b5aDC5B53B4D0ba11 |   0x010a   | 400_000_000_000_000_000 |

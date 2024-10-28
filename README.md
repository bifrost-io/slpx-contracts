# Slpx

| Network       | Slpx Address |
|---------------|--------------|
| Astar         | 0xc6bf0C5C78686f1D0E2E54b97D6de6e2cEFAe9fD          |
| Moonbeam      | 0xF1d4797E51a4640a76769A50b57abE7479ADd3d8          |
| Moonriver     | 0x6b0A44c64190279f7034b77c13a566E914FE5Ec4          |

## Contract info

```solidity
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
```

## CurrencyId && Destination Chain Id

### Astar

| Token                | Address                                    | CurrencyId | operationalMin            |
|:---------------------| :----------------------------------------- |:-----------|:--------------------------|
| BNC                  | 0xfFffFffF00000000000000010000000000000007 | 0x0001     | 1_000_000_000_000         |
| DOT                  | 0xFFfFfFffFFfffFFfFFfFFFFFffFFFffffFfFFFfF | 0x0800     | 1_000_000_000_000         |
| ASTR                 | 0x0000000000000000000000000000000000000000 | 0x0803     | 1_000_000_000_000_000_000         |
| GLMR                 | 0xFFFFFFFF00000000000000010000000000000003 | 0x0801     | 1_000_000_000_000_000_000 |
| Bifrost_Voucher_DOT  | 0xFfFfFfff00000000000000010000000000000008 | 0x0900     | 6_000_000_000             |
| Bifrost_Voucher_GLMR | 0xFFFFFFFF00000000000000010000000000000015 | 0x0901     | 800_000_000_000_000_000   |
| Bifrost_Voucher_ASTR | 0xfffFffff00000000000000010000000000000010 | 0x0903     | 800_000_000_000_000_000   |

| Chains      | Dest_Chain_Id | Receiver Type                      | 
|:------------|:--------------|:-----------------------------------|
| Astar       | 592           | Ethereum Address(Byets20)          |
| Moonbeam    | 1284          | Ethereum Address(Byets20)          |
| Hydration   | 2034          | Substrate Account(Byets32)         |
| Interlay    | 2032          | Substrate Account(Byets32)         |

### Moonbeam

| Token                         | Address                                    | CurrencyId | operationalMin            |
|:------------------------------| :----------------------------------------- |:-----------|:--------------------------|
| BNC                           | 0xFFffffFf7cC06abdF7201b350A1265c62C8601d2 | 0x0001     | 1_000_000_000_000         |
| xcDOT                         | 0xFfFFfFff1FcaCBd218EDc0EbA20Fc2308C778080 | 0x0800     | 10_000_000_000            |
| GLMR                          | 0x0000000000000000000000000000000000000802 | 0x0801     | 5_000_000_000_000_000_000 |
| ASTR                          | 0xFfFFFfffA893AD19e540E172C10d78D4d479B5Cf | 0x0803     | 5_000_000_000_000_000_000 |
| Bifrost_Filecoin_Native_Token | 0xfFFfFFFF6C57e17D210DF507c82807149fFd70B2 | 0x0804     | 1_000_000_000_000_000_000 |
| Bifrost_Voucher_DOT           | 0xFFFfffFf15e1b7E3dF971DD813Bc394deB899aBf | 0x0900     | 8_000_000_000             |
| Bifrost_Voucher_GLMR          | 0xFfFfFFff99dABE1a8De0EA22bAa6FD48fdE96F6c | 0x0901     | 4_000_000_000_000_000_000 |
| Bifrost_Voucher_ASTR          | 0xFffFffff55C732C47639231a4C4373245763d26E | 0x0903     | 4_000_000_000_000_000_000 |
| Bifrost_Voucher_FIL           | 0xFffffFffCd0aD0EA6576B7b285295c85E94cf4c1 | 0x0904     | 800_000_000_000_000_000   |

| Chains      | Dest_Chain_Id | Receiver Type                      | 
|:------------|:--------------|:-----------------------------------|
| Astar       | 592           | Ethereum Address(Byets20)          |
| Moonbeam    | 1284          | Ethereum Address(Byets20)          |
| Hydration   | 2034          | Substrate Account(Byets32)         |
| Interlay    | 2032          | Substrate Account(Byets32)         |

## Moonriver

| Token                | Address                                    | CurrencyId | operationalMin          |
| :------------------- | :----------------------------------------- | :--------- | :---------------------- |
| xcBNC                | 0xFFfFFfFFF075423be54811EcB478e911F22dDe7D | 0x0001     | 1_000_000_000_000       |
| xcKSM                | 0xFfFFfFff1FcaCBd218EDc0EbA20Fc2308C778080 | 0x0204     | 500_000_000_000         |
| MOVR                 | 0x0000000000000000000000000000000000000802 | 0x020a     | 500_000_000_000_000_000 |
| Bifrost_Voucher_BNC  | 0xFFffffff3646A00f78caDf8883c5A2791BfCDdc4 | 0x0101     | 800_000_000_000         |
| Bifrost_Voucher_KSM  | 0xFFffffFFC6DEec7Fc8B11A2C8ddE9a59F8c62EFe | 0x0104     | 400_000_000_000         |
| Bifrost_Voucher_MOVR | 0xfFfffFfF98e37bF6a393504b5aDC5B53B4D0ba11 | 0x010a     | 400_000_000_000_000_000 |

# Astar ZkSlpx
Astar ZkSlpx -> AstarReceiver -> Bifrost -> AstarReceiver -> Astar ZkSlpx
* function mint(uint256 _amount, uint64 _dstGasForCall, bytes calldata _adapterParams) external payable
* function redeem(uint256 _amount, uint64 _dstGasForCall, bytes calldata _adapterParams) external payable

| Name                           | Address                                                                                                                             | 
|--------------------------------|-------------------------------------------------------------------------------------------------------------------------------------|
| Astar Receiver                 | [0xC9fb7DC52b0FB92C417D481442D2641637483881](https://astar.blockscout.com/address/0xdf41220C7e322bFEF933D85D01821ad277f90172) | 
| Astar ZK Slpx                  | [0x2fD8bbF5dc8b342C09ABF34f211b3488e2d9d691](https://astar-zkevm.blockscout.com/address/0xdf41220C7e322bFEF933D85D01821ad277f90172) | 
| ASTR Native OFT                | [0xdf41220C7e322bFEF933D85D01821ad277f90172](https://astar.blockscout.com/address/0xdf41220C7e322bFEF933D85D01821ad277f90172) | 
| ASTR OFT                       | [0xdf41220C7e322bFEF933D85D01821ad277f90172](https://astar-zkevm.blockscout.com/address/0xdf41220C7e322bFEF933D85D01821ad277f90172)                                                                                      |
| Bifrost Voucher ASTR Proxy OFT | [0xba273b7Fa296614019c71Dcc54DCa6C922A93BcF](https://astar.blockscout.com/address/0xba273b7Fa296614019c71Dcc54DCa6C922A93BcF)            | 
| Bifrost Voucher ASTR OFT       | [0x7746ef546d562b443AE4B4145541a3b1a3D75717](https://astar-zkevm.blockscout.com/address/0x7746ef546d562b443AE4B4145541a3b1a3D75717) |
| Bifrost Voucher DOT Proxy OFT  | [0x523c134B054d3cd8fd075bf3672A127E38C0a344](https://astar.blockscout.com/address/0x523c134B054d3cd8fd075bf3672A127E38C0a344)            | 
| Bifrost Voucher DOT OFT        | [0x3239C38d7eD39EA24Bcf30A6CFAF2E38c87a79EB](https://astar-zkevm.blockscout.com/address/0x3239C38d7eD39EA24Bcf30A6CFAF2E38c87a79EB) |
| Bifrost Native Coin Proxy OFT  | [0xDf2217C883C01b027D71b801Bb484D851BbE92bd](https://astar.blockscout.com/address/0xDf2217C883C01b027D71b801Bb484D851BbE92bd)            | 
| Bifrost Native Coin OFT       | [0xBa6F3053D3E1eaB84a8237A46409DF6C2D569ab9](https://astar-zkevm.blockscout.com/address/0xBa6F3053D3E1eaB84a8237A46409DF6C2D569ab9) |

# XcmOracle

| Network       | XcmOracle Address                          | Support Asset    |
|---------------|--------------------------------------------|------------------|
| Moonbeam      | 0xEF81930Aa8ed07C17948B2E26b7bfAF20144eF2a | DOT / GLMR / FIL |
| Moonriver     | 0x682D05cD8D96b9904eC2b1B97BD1eb640B10fC2d | KSM / MOVR / BNC |

## Contract info

```solidity
// _assetAddress: Asset address, e.g. DOT, KSM
// _assetAmount: Input asset amount, get vAsset amount
// _vAssetAmount: Input vAsset amount, get asset amount
function getVTokenByToken(address _assetAddress, uint256 _assetAmount) public view returns (uint256);
function getTokenByVToken(address _assetAddress, uint256 _vAssetAmount) public view returns (uint256);
```
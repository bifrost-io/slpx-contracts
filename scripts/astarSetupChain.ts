import {ApiPromise, Keyring, WsProvider} from '@polkadot/api'
import { SubmittableExtrinsic } from '@polkadot/api/types';
import { blake2AsHex } from '@polkadot/util-crypto'
import {KeyringPair} from '@polkadot/keyring/types'
import {ISubmittableResult} from '@polkadot/types/types';
import {
    ASSET_ASTR_LOCATION,
    ASSET_VASTR_LOCATION,
    ASTR, ASTR_DECIMALS,
    ASTR_METADATA,
    BNC,
    BNC_DECIMALS, TEST_ACCOUNT, VASTR,
    VASTR_METADATA
} from "./constants";
import {getWsProviderInstance,councilPropose,sudo,democracyForCallNeedRootOrigin,addLiquidity,waitFor,mintVtoken,crossAssetToAstar,crossAstrToBifrost} from "./utils"

const main = async () => {
    const parachain_api = await getWsProviderInstance("ws://127.0.0.1:9910")
    const bifrost_api = await getWsProviderInstance("ws://127.0.0.1:9920")
    const keyring = new Keyring({ type: 'sr25519', ss58Format: 5 })
    const alice = keyring.addFromUri('//Alice')

    const bifrost_set_up_calls = bifrost_api.tx.utility.batchAll([
        bifrost_api.tx.assetRegistry.registerTokenMetadata(ASTR_METADATA),
        bifrost_api.tx.assetRegistry.registerTokenMetadata(ASTR_METADATA),
        bifrost_api.tx.assetRegistry.registerTokenMetadata(ASTR_METADATA),
        bifrost_api.tx.assetRegistry.registerMultilocation(ASTR,ASSET_ASTR_LOCATION,0),
        bifrost_api.tx.assetRegistry.registerVtokenMetadata(3),
        bifrost_api.tx.assetRegistry.registerMultilocation(VASTR,ASSET_VASTR_LOCATION,0),
    ])

    await councilPropose(bifrost_api,alice,1,bifrost_set_up_calls,bifrost_set_up_calls.encodedLength)

    const set_up_calls = parachain_api.tx.utility.batchAll([
        parachain_api.tx.balances.forceTransfer(alice.address, TEST_ACCOUNT, 1000n * ASTR_DECIMALS),
        // create bnc
        parachain_api.tx.assets.forceCreate(
            18446744073709551623n,
            'ajYMsCKsEAhEvHpeA4XqsfiA9v1CdzZPrCfS6pEfeGHW9j8',
            false,
            1000n
        ),
        // set bnc metadata
        parachain_api.tx.assets.forceSetMetadata(18446744073709551623n, 'Bifrost Native Coin', 'BNC', 12, false),

        // register asset to location
        parachain_api.tx.xcAssetConfig.registerAssetLocation(
            { V3: { parents: 1, interior: { X2: [{ Parachain: 2030 }, { GeneralKey: { length: 2, data: '0x0001000000000000000000000000000000000000000000000000000000000000' } }] } } },
            18446744073709551623n
        ),
        // set asset to fee
        parachain_api.tx.xcAssetConfig.setAssetUnitsPerSecond(
            { V3: { parents: 1, interior: { X2: [{ Parachain: 2030 }, { GeneralKey: { length: 2, data: '0x0001000000000000000000000000000000000000000000000000000000000000' } }] } } },
            1000000000n
        ),

        // create bnc
        parachain_api.tx.assets.forceCreate(
            18446744073709551624n,
            'ajYMsCKsEAhEvHpeA4XqsfiA9v1CdzZPrCfS6pEfeGHW9j8',
            false,
            1000n
        ),
        // set bnc metadata
        parachain_api.tx.assets.forceSetMetadata(18446744073709551624n, 'Voucher ASTR', 'VASTR', 18, false),

        // register asset to location
        parachain_api.tx.xcAssetConfig.registerAssetLocation(
            { V3: { parents: 1, interior: { X2: [{ Parachain: 2030 }, { GeneralKey: { length: 2, data: '0x0901000000000000000000000000000000000000000000000000000000000000' } }] } } },
            18446744073709551624n
        ),
        // set asset to fee
        parachain_api.tx.xcAssetConfig.setAssetUnitsPerSecond(
            { V3: { parents: 1, interior: { X2: [{ Parachain: 2030 }, { GeneralKey: { length: 2, data: '0x0901000000000000000000000000000000000000000000000000000000000000' } }] } } },
            1000000000n
        )
    ]);

    await sudo(parachain_api, alice, set_up_calls)

    await crossAssetToAstar(bifrost_api, alice, BNC, 1000n * BNC_DECIMALS)
    await crossAstrToBifrost(parachain_api, alice, 1000n * ASTR_DECIMALS)
    await waitFor(12 * 1000);
    await mintVtoken(bifrost_api,alice,ASTR, 500n * ASTR_DECIMALS)

    let astr = {
        chainId: 2030,
        assetType: 2,
        assetIndex: 2051,
    }

    let vastr = {
        chainId: 2030,
        assetType: 2,
        assetIndex:2307,
    }

    let bnc = {
        chainId: 2030,
        assetType: 0,
        assetIndex: 0,
    }

    await democracyForCallNeedRootOrigin(bifrost_api, alice, bifrost_api.tx.zenlinkProtocol.createPair(bnc,vastr))
    await democracyForCallNeedRootOrigin(bifrost_api, alice, bifrost_api.tx.zenlinkProtocol.createPair(bnc,astr))
    await addLiquidity(bifrost_api,alice,bnc,vastr,1000n * BNC_DECIMALS,100n * ASTR_DECIMALS);
    await addLiquidity(bifrost_api,alice,bnc,astr,1000n * BNC_DECIMALS,100n * ASTR_DECIMALS);
}
main()
    .then()
    .catch((err) => console.log(err))
    .finally(() => process.exit())
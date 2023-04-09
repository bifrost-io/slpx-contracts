import {ApiPromise, Keyring, WsProvider} from '@polkadot/api'
import { SubmittableExtrinsic } from '@polkadot/api/types';
import {KeyringPair} from '@polkadot/keyring/types'
import {ISubmittableResult} from '@polkadot/types/types';
import {ASSET_STAR_LOCATION, ASTR, ASTR_METADATA, BNC, BNC_DECIMALS} from "./constants";

async function getWsProviderInstance(wss: string) {
    const wsProvider = new WsProvider(wss)
    return await ApiPromise.create({provider: wsProvider})
}

async function registerTokenMetadata(api: ApiPromise, signer: KeyringPair, metadata: any) {
    return new Promise((resolve) => {
        api.tx.council
            .propose(
                1,
                api.tx.assetRegistry.registerTokenMetadata(metadata),
                api.tx.assetRegistry.registerTokenMetadata(metadata).encodedLength
            )
            .signAndSend(signer, ({status}) => {
                if (status.isFinalized) {
                    console.log(`✔️  - RegisterTokenMetadata finalized at block hash #${status.asFinalized.toString()}`)
                    resolve(status.asFinalized.toString())
                }
            })
    })
}

async function registerMultilocation(api: ApiPromise, signer: KeyringPair, token: any, location: any) {
    return new Promise((resolve) => {
        api.tx.council
            .propose(
                1,
                api.tx.assetRegistry.registerMultilocation(token, location, 0),
                api.tx.assetRegistry.registerMultilocation(token, location, 0).encodedLength
            )
            .signAndSend(signer, ({status}) => {
                if (status.isFinalized) {
                    console.log(`✔️  - RegisterMultilocation finalized at block hash #${status.asFinalized.toString()}`)
                    resolve(status.asFinalized.toString())
                }
            })
    })
}

async function sudo(api: ApiPromise, signer: KeyringPair, call: SubmittableExtrinsic<"promise", ISubmittableResult>) {
    return new Promise((resolve) => {
        api.tx.sudo.sudo(call).signAndSend(signer, ({ status }) => {
            if (status.isFinalized) {
                console.log(`✔️  - sudoCall finalized at block hash #${status.asFinalized.toString()}`)
                resolve(status.asFinalized.toString())
            }
        })
    })
}

const cross_asset_to_astar = async (api: ApiPromise, signer: KeyringPair, token: any, amount: bigint) => {
    return new Promise((resolve) => {
        api.tx.xTokens
            .transfer(
                token,
                amount,
                {
                    V3: {
                        parents: 1,
                        interior: { X2: [{ Parachain: 2006 }, { AccountId32: { network: null, id: signer.addressRaw } }] },
                    },
                },
                5000000000n
            )
            .signAndSend(signer, ({ status }) => {
                if (status.isFinalized) {
                    console.log(`✔️  - cross_asset_to_astar finalized at block hash #${status.asFinalized.toString()}`)
                    resolve(status.asFinalized.toString())
                }
            })
    })
}
const cross_bnc_to_bifrost = async (api: ApiPromise, signer: KeyringPair, amount: bigint) => {
    return new Promise((resolve) => {
        api.tx.polkadotXcm
            .reserveWithdrawAssets(
                { V1: { parents: 1, interior: { X1: { Parachain: 2030 } } } },
                { V1: { parents: 0, interior: { X1: { AccountId32: { network: 'Any', id: signer.addressRaw } } } } },
                {
                    V1: [
                        {
                            id: { Concrete: { parents: 1, interior: { X2: [{ Parachain: 2030 }, { GeneralKey: '0x0001' }] } } },
                            fun: { Fungible: amount },
                        },
                    ],
                },
                0
            )
            .signAndSend(signer, ({ status }) => {
                if (status.isFinalized) {
                    console.log(`✔️  - cross_bnc_to_moonbease finalized at block hash #${status.asFinalized.toString()}`)
                    resolve(status.asFinalized.toString())
                }
            })
    })
}

const cross_star_to_bifrost = async (api: ApiPromise, signer: KeyringPair, amount: bigint) => {
    return new Promise((resolve) => {
        api.tx.polkadotXcm
            .reserveTransferAssets(
                { V1: { parents: 1, interior: { X1: { Parachain: 2030 } } } },
                { V1: { parents: 0, interior: { X1: { AccountId32: { network: 'Any', id: signer.addressRaw } } } } },
                {
                    V1: [
                        {
                            id: { Concrete: { parents: 0, interior: 'Here' } },
                            fun: { Fungible: amount },
                        },
                    ],
                },
                0
            )
            .signAndSend(signer, ({ status }) => {
                if (status.isFinalized) {
                    console.log(`✔️  - cross_star_to_bifrost finalized at block hash #${status.asFinalized.toString()}`)
                    resolve(status.asFinalized.toString())
                }
            })
    })
}

const main = async () => {
    const parachain_api = await getWsProviderInstance("ws://127.0.0.1:9910")
    const bifrost_api = await getWsProviderInstance("ws://127.0.0.1:9920")
    const keyring = new Keyring({ type: 'sr25519', ss58Format: 5 })
    const alice = keyring.addFromUri('//Alice')

    await registerTokenMetadata(bifrost_api, alice, ASTR_METADATA)
    await registerMultilocation(bifrost_api, alice, ASTR, ASSET_STAR_LOCATION)

    const set_up_calls = parachain_api.tx.utility.batchAll([
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
            { V1: { parents: 1, interior: { X2: [{ Parachain: 2030 }, { GeneralKey: '0x0001' }] } } },
            18446744073709551623n
        ),
        // set asset to fee
        parachain_api.tx.xcAssetConfig.setAssetUnitsPerSecond(
            { V1: { parents: 1, interior: { X2: [{ Parachain: 2030 }, { GeneralKey: '0x0001' }] } } },
            1000000000n
        )
    ]);

    await sudo(parachain_api, alice, set_up_calls)

    // await sudo(
    // 	parachain_api,
    // 	alice,
    // 	parachain_api.tx.assets.forceCreate(
    // 		18446744073709551624n,
    // 		'ajYMsCKsEAhEvHpeA4XqsfiA9v1CdzZPrCfS6pEfeGHW9j8',
    // 		false,
    // 		1000n
    // 	)
    // )
    // await setMetadata(parachain_api, alice, 18446744073709551624n, 'Voucher DOT', 'vDOT', 10)
    // await sudo(
    // 	parachain_api,
    // 	alice,
    // 	parachain_api.tx.xcAssetConfig.registerAssetLocation(
    // 		{ V1: { parents: 1, interior: { X2: [{ Parachain: 2030 }, { GeneralKey: '0x0900' }] } } },
    // 		18446744073709551624n
    // 	)
    // )
    // await sudo(
    // 	parachain_api,
    // 	alice,
    // 	parachain_api.tx.xcAssetConfig.setAssetUnitsPerSecond(
    // 		{ V1: { parents: 1, interior: { X2: [{ Parachain: 2030 }, { GeneralKey: '0x0900' }] } } },
    // 		1000000000n
    // 	)
    // )
    //
    // await sudo(
    // 	parachain_api,
    // 	alice,
    // 	parachain_api.tx.assets.forceCreate(
    // 		340282366920938463463374607431768211455n,
    // 		'ajYMsCKsEAhEvHpeA4XqsfiA9v1CdzZPrCfS6pEfeGHW9j8',
    // 		false,
    // 		1000n
    // 	)
    // )
    // await setMetadata(parachain_api, alice, 340282366920938463463374607431768211455n, 'Polkadot', 'DOT', 10)
    // await sudo(
    // 	parachain_api,
    // 	alice,
    // 	parachain_api.tx.xcAssetConfig.registerAssetLocation(
    // 		{ V1: { parents: 1, interior: 'Here' } },
    // 		340282366920938463463374607431768211455n
    // 	)
    // )
    // await sudo(
    // 	parachain_api,
    // 	alice,
    // 	parachain_api.tx.xcAssetConfig.setAssetUnitsPerSecond({ V1: { parents: 1, interior: 'Here' } }, 1_000_000_000n)
    // )

    await cross_asset_to_astar(bifrost_api, alice, BNC, 1000n * BNC_DECIMALS)
    await cross_bnc_to_bifrost(parachain_api, alice, 100n * BNC_DECIMALS)
    // await cross_star_to_bifrost(parachain_api, alice, 1000n * STAR_DECIMALS)

    // await cross_bnc_to_bifrost(parachain_api,alice,10_000_000_000_000n)
}
main()
    .then()
    .catch((err) => console.log(err))
    .finally(() => process.exit())
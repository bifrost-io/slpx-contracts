import {ApiPromise, Keyring, WsProvider} from '@polkadot/api'
import { SubmittableExtrinsic } from '@polkadot/api/types';
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

async function mintVtoken(api:ApiPromise, signer:KeyringPair, token: any, amount: bigint) {
    return new Promise((resolve) => {
        api.tx.vtokenMinting.mint(token, amount).signAndSend(signer, ({ status }) => {
            if (status.isFinalized) {
                console.log(`✔️  - mint vtoken finalized at block hash #${status.asFinalized.toString()}`)
                resolve(status.asFinalized.toString())
            }
        })
    })
}

async function assetTransfer(api:ApiPromise, signer:KeyringPair, token_id: bigint, address:string, amount: bigint) {
    return new Promise((resolve) => {
        api.tx.assets.transfer(token_id,address, amount).signAndSend(signer, ({ status }) => {
            if (status.isFinalized) {
                console.log(`✔️  - assetTransfer finalized at block hash #${status.asFinalized.toString()}`)
                resolve(status.asFinalized.toString())
            }
        })
    })
}

async function councilPropose(api:ApiPromise, signer:KeyringPair, threshold: any, call: any, encodedLength: any) {
    return new Promise((resolve) => {
        api.tx.council.propose(threshold, call, encodedLength).signAndSend(signer, ({ status }) => {
            if (status.isFinalized) {
                console.log(`✔️  - councilPropose finalized at block hash #${status.asFinalized.toString()}`)
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

    const bifrost_set_up_calls = bifrost_api.tx.utility.batchAll([
        bifrost_api.tx.assetRegistry.registerTokenMetadata(ASTR_METADATA),
        bifrost_api.tx.assetRegistry.registerMultilocation(ASTR,ASSET_ASTR_LOCATION,0),
        bifrost_api.tx.assetRegistry.registerVtokenMetadata(1),
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
            { V1: { parents: 1, interior: { X2: [{ Parachain: 2030 }, { GeneralKey: '0x0001' }] } } },
            18446744073709551623n
        ),
        // set asset to fee
        parachain_api.tx.xcAssetConfig.setAssetUnitsPerSecond(
            { V1: { parents: 1, interior: { X2: [{ Parachain: 2030 }, { GeneralKey: '0x0001' }] } } },
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
            { V1: { parents: 1, interior: { X2: [{ Parachain: 2030 }, { GeneralKey: '0x0901' }] } } },
            18446744073709551624n
        ),
        // set asset to fee
        parachain_api.tx.xcAssetConfig.setAssetUnitsPerSecond(
            { V1: { parents: 1, interior: { X2: [{ Parachain: 2030 }, { GeneralKey: '0x0901' }] } } },
            1000000000n
        )
    ]);

    await sudo(parachain_api, alice, set_up_calls)

    await cross_asset_to_astar(bifrost_api, alice, BNC, 1000n * BNC_DECIMALS)
    await cross_bnc_to_bifrost(parachain_api, alice, 100n * BNC_DECIMALS)
    await cross_star_to_bifrost(parachain_api, alice, 1000n * ASTR_DECIMALS)
    await mintVtoken(bifrost_api,alice,ASTR,100n * ASTR_DECIMALS)
    await cross_asset_to_astar(bifrost_api, alice, VASTR, 50n * ASTR_DECIMALS)
    await assetTransfer(parachain_api,alice,18446744073709551623n,TEST_ACCOUNT,100n * BNC_DECIMALS)

    // await cross_bnc_to_bifrost(parachain_api,alice,10_000_000_000_000n)
}
main()
    .then()
    .catch((err) => console.log(err))
    .finally(() => process.exit())
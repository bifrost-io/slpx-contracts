import {ApiPromise, Keyring} from '@polkadot/api'
import {
	ASSET_VMOVR_LOCATION,
	MOVR,
	vMOVR,
	ASSET_MOVR_LOCATION,
	vKSM,
	ASSET_VKSM_LOCATION,
	KSM,
	ASSET_KSM_LOCATION,
	ALICE,
	ASTR,
	ASTR_DECIMALS,
	KSM_METADATA,
	KSM_DECIMALS, ALITH, MOVR_DECIMALS, BNC_DECIMALS
} from './constants'
import {
	addLiquidity,
	councilPropose,
	democracyForCallNeedRootOrigin,
	getWsProviderInstance, mintVtoken,
	sudo,
	waitFor
} from "./utils";
import {KeyringPair} from "@polkadot/keyring/types";
import { decodeAddress } from '@polkadot/util-crypto'

export async function cross_ksm_to_bifrost(api:ApiPromise, signer:KeyringPair, amount:any, receiver = ALICE) {
	const paras = [
		{ V3: { parents: 0, interior: { X1: { Parachain: 2001 } } } },
		{ V3: { parents: 0, interior: { X1: { AccountId32: { network: null, id: decodeAddress(receiver) } } } } },
		{ V3: [{ id: { Concrete: { parents: 0, interior: 'Here' } }, fun: { Fungible: amount } }] },
		0,
	]
	return new Promise((resolve) => {
		api.tx.xcmPallet.reserveTransferAssets(...paras).signAndSend(signer, ({ status }) => {
			if (status.isFinalized) {
				console.log(`✔️  - cross_ksm_to_bifrost finalized at block hash #${status.asFinalized.toString()}`)
				resolve(status.asFinalized.toString())
			}
		})
	})
}

export async function cross_ksm_to_moonriver(api:ApiPromise, signer:KeyringPair, amount:any, receiver = ALITH) {
	const paras = [
		{ V3: { parents: 0, interior: { X1: { Parachain: 2023 } } } },
		{ V3: { parents: 0, interior: { X1: { AccountKey20: { network: null, key: ALITH } } } } },
		{ V3: [{ id: { Concrete: { parents: 0, interior: 'Here' } }, fun: { Fungible: amount } }] },
		0,
	]
	return new Promise((resolve) => {
		api.tx.xcmPallet.reserveTransferAssets(...paras).signAndSend(signer, ({ status }) => {
			if (status.isFinalized) {
				console.log(`✔️  - cross_ksm_to_bifrost finalized at block hash #${status.asFinalized.toString()}`)
				resolve(status.asFinalized.toString())
			}
		})
	})
}

const main = async () => {
	const relaychain_api = await getWsProviderInstance("ws://127.0.0.1:9900")
	const parachain_api = await getWsProviderInstance("ws://127.0.0.1:9910")
	const bifrost_api = await getWsProviderInstance("ws://127.0.0.1:9920")
	const keyring = new Keyring({ type: 'sr25519', ss58Format: 6 })
	const alice = keyring.addFromUri('//Alice')
	const keyringEth = new Keyring({ type: 'ethereum' })
	const alith = keyringEth.addFromUri("0x5fb92d6e98884f76de468fa3f6278f8807c48bebc13595d45af5bdc4da702133")

	const bifrost_set_up_calls = bifrost_api.tx.utility.batchAll([
		bifrost_api.tx.assetRegistry.registerMultilocation(MOVR, ASSET_MOVR_LOCATION, 0),
		bifrost_api.tx.assetRegistry.registerMultilocation(vMOVR, ASSET_VMOVR_LOCATION, 0),
		bifrost_api.tx.assetRegistry.registerMultilocation(vKSM, ASSET_VKSM_LOCATION, 0),
		bifrost_api.tx.assetRegistry.registerMultilocation(KSM, ASSET_KSM_LOCATION, 0),
	])

	await councilPropose(bifrost_api, alice, 1, bifrost_set_up_calls, bifrost_set_up_calls.encodedLength)

	// 165823357460190568952172802245839421906
	const calls = parachain_api.tx.utility.batchAll([
		parachain_api.tx.assetManager.registerForeignAsset(
			{
				Xcm: {
					parents: 1,
					interior: {
						X2: [
							{ Parachain: 2001n },
							{ GeneralKey: { length: 2, data: '0x0001000000000000000000000000000000000000000000000000000000000000' } },
						],
					},
				},
			},
			{
				name: 'xcBNC',
				symbol: 'xcBNC',
				decimals: 12,
				isFrozen: false,
			},
			1n,
			false
		),
		parachain_api.tx.assetManager.setAssetUnitsPerSecond(
			{
				Xcm: {
					parents: 1,
					interior: {
						X2: [
							{ Parachain: 2001n },
							{ GeneralKey: { length: 2, data: '0x0001000000000000000000000000000000000000000000000000000000000000' } },
						],
					},
				},
			},
			1n,
			1n
		),

		// 92952664215507824241621286735706447981
		parachain_api.tx.assetManager.registerForeignAsset(
			{
				Xcm: {
					parents: 1,
					interior: {
						X2: [
							{ Parachain: 2001n },
							{ GeneralKey: { length: 2, data: '0x010a000000000000000000000000000000000000000000000000000000000000' } },
						],
					},
				},
			},
			{
				name: 'vMOVR',
				symbol: 'vMOVR',
				decimals: 18,
				isFrozen: false,
			},
			1n,
			false
		),
		parachain_api.tx.assetManager.registerForeignAsset(
			{
				Xcm: {
					parents: 1,
					interior: {
						X2: [
							{ Parachain: 2001n },
							{ GeneralKey: { length: 2, data: '0x0104000000000000000000000000000000000000000000000000000000000000' } },
						],
					},
				},
			},
			{
				name: 'vKSM',
				symbol: 'vKSM',
				decimals: 12,
				isFrozen: false,
			},
			1n,
			false
		),
		parachain_api.tx.assetManager.registerForeignAsset(
			{ Xcm: { parents: 1, interior: 'Here' } },
			{
				name: 'xcKSM',
				symbol: 'xcKSM',
				decimals: 12,
				isFrozen: false,
			},
			1n,
			false
		),
		parachain_api.tx.assetManager.setAssetUnitsPerSecond(
			{
				Xcm: {
					parents: 1,
					interior: 'Here',
				},
			},
			1n,
			1n
		),
	])

	await sudo(parachain_api, alith, calls)

	await cross_ksm_to_bifrost(relaychain_api, alice, 1000_000_000_000_000n)
	await cross_ksm_to_moonriver(relaychain_api, alice, 1000_000_000_000_000n)

	// wait for 24 seconds to make sure the xcm message is executed in polkadot
	await waitFor(24 * 1000)

	await mintVtoken(bifrost_api,alice,KSM,500n * KSM_DECIMALS)

	let ksm = {
		chainId: 2001,
		assetType: 2,
		assetIndex:516,
	}

	let vksm = {
		chainId: 2001,
		assetType: 2,
		assetIndex:260,
	}
	let bnc = {
		chainId: 2001,
		assetType: 0,
		assetIndex:0,
	}
let movr = {
		chainId: 2001,
		assetType: 2,
		assetIndex:522,
	}

	// await democracyForCallNeedRootOrigin(bifrost_api, alice, bifrost_api.tx.zenlinkProtocol.createPair(ksm,vksm))
	await democracyForCallNeedRootOrigin(bifrost_api, alice, bifrost_api.tx.zenlinkProtocol.createPair(bnc,ksm))
	await democracyForCallNeedRootOrigin(bifrost_api, alice, bifrost_api.tx.zenlinkProtocol.createPair(bnc,movr))
	// await democracyForCallNeedRootOrigin(bifrost_api, alice, bifrost_api.tx.zenlinkProtocol.createPair(ksm,movr))

	// await addLiquidity(bifrost_api,alice,ksm,vksm,10n * KSM_DECIMALS,10n * KSM_DECIMALS);
	await addLiquidity(bifrost_api,alice,bnc,vksm,1000n * BNC_DECIMALS,10n * KSM_DECIMALS);
	// await addLiquidity(bifrost_api,alice,bnc,movr,1000n * BNC_DECIMALS,10n * MOVR_DECIMALS);
	// await addLiquidity(bifrost_api,alice,ksm,movr,10n * KSM_DECIMALS,10n * MOVR_DECIMALS);

	// await cross_movr_to_bifrost(parachain_api, alith, 1000n * MOVR_DECIMALS)
	// await mint(bifrost_api, alice, MOVR, 100n * MOVR_DECIMALS)
	//
	// await cross_assets_to_moonriver(bifrost_api, alice, BNC, 1000n * BNC_DECIMALS)
	// await cross_bnc_to_bifrost(parachain_api, alith, 10n * BNC_DECIMALS)
	// await cross_assets_to_moonriver(bifrost_api, alice, BNC, 50n * BNC_DECIMALS)
	//
	// await mint(bifrost_api, alice, KSM, 100n * KSM_DECIMALS)
	// await cross_to_moonriver(bifrost_api, alice, vKSM, 2n * KSM_DECIMALS)



}
main()
	.then()
	.catch((err) => console.log(err))
	.finally(() => process.exit())

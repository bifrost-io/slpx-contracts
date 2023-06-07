import { getWsProviderInstance } from '../utils/create_api'
import { Keyring } from '@polkadot/api'
import {registerMultilocation, registerTokenMetadata} from '../utils/asset_registry'
import {
	ALICE,
	ASSET_VMOVR_LOCATION,
	BIFROST_WSS,
	BNC,
	BNC_DECIMALS,
	MOVR,
	KSM_DECIMALS,
	PARACHAIN_WSS,
	vMOVR,
	MOVR_DECIMALS,
	GLMR,
	ASSET_GLMR_LOCATION,
	GLMR_DECIMALS,
	GLMR_METADATA,
	vGLMR,
	ASSET_VGLMR_LOCATION,
	ASSET_MOVR_LOCATION, vKSM, ASSET_VKSM_LOCATION, KSM, ASSET_KSM_LOCATION,
} from '../utils/bifrost_constants'
import { mint } from '../utils/vtoken_minting'
import {councilPropose, sudo} from '../utils/government'
import { ALITH, ALITH_PRIVATE_KEY, FEE_PER_SECOND_LOCATION } from '../utils/moonbeam_constants'
import { decodeAddress } from '@polkadot/util-crypto'
import { cross_glmr_to_bifrost } from '../utils/bifrost_polkadot_cross_asset'

const cross_assets_to_moonriver = async (api, signer, token, amount) => {
	return new Promise((resolve) => {
		api.tx.xTokens
			.transfer(
				token,
				amount,
				{
					V3: { parents: 1, interior: { X2: [{ Parachain: 2023 }, { AccountKey20: { network: null, key: ALITH } }] } },
				},
				4000000000n
			)
			.signAndSend(signer, ({ status }) => {
				if (status.isFinalized) {
					console.log(`✔️  - cross_bnc_to_moonbease finalized at block hash #${status.asFinalized.toString()}`)
					resolve(status.asFinalized.toString())
				}
			})
	})
}

const cross_bnc_to_bifrost = async (api, signer, amount) => {
	return new Promise((resolve) => {
		api.tx.xTokens
			.transfer(
				{ ForeignAsset: 165823357460190568952172802245839421906n },
				amount,
				{
					V3: {
						parents: 1,
						interior: { X2: [{ Parachain: 2001 }, { AccountId32: { network: null, id: decodeAddress(ALICE) } }] },
					},
				},
				4000000000n
			)
			.signAndSend(signer, ({ status }) => {
				if (status.isFinalized) {
					console.log(`✔️  - cross_bnc_to_moonbease finalized at block hash #${status.asFinalized.toString()}`)
					resolve(status.asFinalized.toString())
				}
			})
	})
}

const cross_to_moonriver = async (api, signer, token, amount) => {
	return new Promise((resolve) => {
		api.tx.xTokens
			.transferMulticurrencies(
				[
					[BNC,1n * BNC_DECIMALS],
					[token, amount],
				],
				0,
				{
					V3: { parents: 1, interior: { X2: [{ Parachain: 2023 }, { AccountKey20: { network: null, key: ALITH } }] } },
				},
				4000000000n
			)
			.signAndSend(signer, ({ status }) => {
				if (status.isFinalized) {
					console.log(`✔️  - cross_vksm_to_moonbase finalized at block hash #${status.asFinalized.toString()}`)
					resolve(status.asFinalized.toString())
				}
			})
	})
}

const cross_vglmr_to_bifrost = async (api, signer, amount) => {
	return new Promise((resolve) => {
		api.tx.xTokens
			.transfer(
				{ ForeignAsset: 92952664215507824241621286735706447981n },
				amount,
				{
					V1: {
						parents: 1,
						interior: { X2: [{ Parachain: 2030 }, { AccountId32: { network: 'Any', id: decodeAddress(ALICE) } }] },
					},
				},
				4000000000n
			)
			.signAndSend(signer, ({ status }) => {
				if (status.isFinalized) {
					console.log(`✔️  - cross_vksm_to_bifrost finalized at block hash #${status.asFinalized.toString()}`)
					resolve(status.asFinalized.toString())
				}
			})
	})
}

const cross_ksm_to_bifrost = async (api, signer, amount) => {
	return new Promise((resolve) => {
		api.tx.xTokens
			.transfer(
				{ ForeignAsset: 42259045809535163221576417993425387648n },
				amount,
				{
					V3: {
						parents: 1,
						interior: { X2: [{ Parachain: 2001 }, { AccountId32: { network: null, id: decodeAddress(ALICE) } }] },
					},
				},
				4000000000n
			)
			.signAndSend(signer, ({ status }) => {
				if (status.isFinalized) {
					console.log(`✔️  - cross_vksm_to_bifrost finalized at block hash #${status.asFinalized.toString()}`)
					resolve(status.asFinalized.toString())
				}
			})
	})
}

export async function cross_movr_to_bifrost(api, signer, amount, receiver = ALICE) {
	const paras = [
		'SelfReserve',
		amount,
		{
			V3: {
				parents: 1n,
				interior: { X2: [{ Parachain: 2001n }, { AccountId32: { network: null, id: decodeAddress(receiver) } }] },
			},
		},
		10000000000n,
	]
	return new Promise((resolve) => {
		api.tx.xTokens.transfer(...paras).signAndSend(signer, ({ status }) => {
			if (status.isFinalized) {
				console.log(`✔️  - cross_movr_to_bifrost finalized at block hash #${status.asFinalized.toString()}`)
				resolve(status.asFinalized.toString())
			}
		})
	})
}

const main = async () => {
	const parachain_api = await getWsProviderInstance(PARACHAIN_WSS)
	const bifrost_api = await getWsProviderInstance(BIFROST_WSS)
	const keyring = new Keyring({ type: 'sr25519', ss58Format: 6 })
	const alice = keyring.addFromUri('//Alice')
	const keyringEth = new Keyring({ type: 'ethereum' })
	const alith = keyringEth.addFromUri(ALITH_PRIVATE_KEY)

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

	// await cross_movr_to_bifrost(parachain_api, alith, 1000n * MOVR_DECIMALS)
	// await mint(bifrost_api, alice, MOVR, 100n * MOVR_DECIMALS)

	// await cross_assets_to_moonriver(bifrost_api, alice, BNC, 1000n * BNC_DECIMALS)
	// await cross_bnc_to_bifrost(parachain_api, alith, 10n * BNC_DECIMALS)
	// await cross_assets_to_moonriver(bifrost_api, alice, BNC, 50n * BNC_DECIMALS)
	// await cross_ksm_to_bifrost(parachain_api, alith, 30n * KSM_DECIMALS)

	// await mint(bifrost_api, alice, KSM, 100n * KSM_DECIMALS)
	// await cross_to_moonriver(bifrost_api, alice, vKSM, 2n * KSM_DECIMALS)



}
main()
	.then()
	.catch((err) => console.log(err))
	.finally(() => process.exit())

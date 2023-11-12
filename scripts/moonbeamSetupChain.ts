// import { ApiPromise, Keyring } from "@polkadot/api";
// import {
//   ASSET_VMOVR_LOCATION,
//   MOVR,
//   vMOVR,
//   ASSET_MOVR_LOCATION,
//   vKSM,
//   ASSET_VKSM_LOCATION,
//   KSM,
//   ASSET_KSM_LOCATION,
//   ALICE,
//   ASTR,
//   ASTR_DECIMALS,
//   KSM_METADATA,
//   KSM_DECIMALS,
//   ALITH,
//   MOVR_DECIMALS,
//   BNC_DECIMALS,
//   ASTR_METADATA,
//   GLMR_METADATA,
//   GLMR,
//   ASSET_GLMR_LOCATION,
//   VGLMR,
//   ASSET_VGLMR_LOCATION,
//   VDOT,
//   ASSET_VDOT_LOCATION,
//   DOT,
//   ASSET_DOT_LOCATION,
//   DOT_DECIMALS,
//   GLMR_DECIMALS,
// } from "./constants";
// import {
//   addLiquidity,
//   councilPropose,
//   democracyForCallNeedRootOrigin,
//   getWsProviderInstance,
//   mintVtoken,
//   sudo,
//   waitFor,
// } from "./utils";
// import { KeyringPair } from "@polkadot/keyring/types";
// import { decodeAddress } from "@polkadot/util-crypto";
//
// export async function cross_dot_to_bifrost(
//   api: ApiPromise,
//   signer: KeyringPair,
//   amount: any,
//   receiver = ALICE
// ) {
//   const paras = [
//     { V3: { parents: 0, interior: { X1: { Parachain: 2030 } } } },
//     {
//       V3: {
//         parents: 0,
//         interior: {
//           X1: { AccountId32: { network: null, id: decodeAddress(receiver) } },
//         },
//       },
//     },
//     {
//       V3: [
//         {
//           id: { Concrete: { parents: 0, interior: "Here" } },
//           fun: { Fungible: amount },
//         },
//       ],
//     },
//     0,
//   ];
//   return new Promise((resolve) => {
//     api.tx.xcmPallet
//       .reserveTransferAssets(...paras)
//       .signAndSend(signer, ({ status }) => {
//         if (status.isFinalized) {
//           console.log(
//             `✔️  - cross_dot_to_bifrost finalized at block hash #${status.asFinalized.toString()}`
//           );
//           resolve(status.asFinalized.toString());
//         }
//       });
//   });
// }
//
// export async function cross_dot_to_moonbeam(
//   api: ApiPromise,
//   signer: KeyringPair,
//   amount: any,
//   receiver = ALITH
// ) {
//   const paras = [
//     { V3: { parents: 0, interior: { X1: { Parachain: 2004 } } } },
//     {
//       V3: {
//         parents: 0,
//         interior: { X1: { AccountKey20: { network: null, key: ALITH } } },
//       },
//     },
//     {
//       V3: [
//         {
//           id: { Concrete: { parents: 0, interior: "Here" } },
//           fun: { Fungible: amount },
//         },
//       ],
//     },
//     0,
//   ];
//   return new Promise((resolve) => {
//     api.tx.xcmPallet
//       .reserveTransferAssets(...paras)
//       .signAndSend(signer, ({ status }) => {
//         if (status.isFinalized) {
//           console.log(
//             `✔️  - cross_dot_to_bifrost finalized at block hash #${status.asFinalized.toString()}`
//           );
//           resolve(status.asFinalized.toString());
//         }
//       });
//   });
// }
//
// export async function cross_glmr_to_bifrost(
//   api: ApiPromise,
//   signer: KeyringPair,
//   amount: bigint,
//   receiver = ALICE
// ) {
//   const paras = [
//     "SelfReserve",
//     amount,
//     {
//       V3: {
//         parents: 1n,
//         interior: {
//           X2: [
//             { Parachain: 2030n },
//             { AccountId32: { network: null, id: decodeAddress(receiver) } },
//           ],
//         },
//       },
//     },
//     4000000000n,
//   ];
//   return new Promise((resolve) => {
//     api.tx.xTokens.transfer(...paras).signAndSend(signer, ({ status }) => {
//       if (status.isFinalized) {
//         console.log(
//           `✔️  - cross_glmr_to_bifrost finalized at block hash #${status.asFinalized.toString()}`
//         );
//         resolve(status.asFinalized.toString());
//       }
//     });
//   });
// }
//
// const main = async () => {
//   // const relaychain_api = await getWsProviderInstance("ws://127.0.0.1:9900");
//   // const parachain_api = await getWsProviderInstance("ws://127.0.0.1:9910");
//   // const bifrost_api = await getWsProviderInstance("ws://127.0.0.1:9920");
//   const bifrost_api = await getWsProviderInstance("wss://bifrost-polkadot-rpc.devnet.liebi.com/ws");
//   const keyring = new Keyring({ type: "sr25519", ss58Format: 6 });
//   const alice = keyring.addFromUri("//Alice");
//   const keyringEth = new Keyring({ type: "ethereum" });
//   const alith = keyringEth.addFromUri(
//     "0x5fb92d6e98884f76de468fa3f6278f8807c48bebc13595d45af5bdc4da702133"
//   );
//
//   const bifrost_set_up_calls = bifrost_api.tx.utility.batchAll([
//     bifrost_api.tx.assetRegistry.registerTokenMetadata(GLMR_METADATA),
//     bifrost_api.tx.assetRegistry.registerVtokenMetadata(1),
//     bifrost_api.tx.assetRegistry.registerMultilocation(
//       GLMR,
//       ASSET_GLMR_LOCATION,
//       0
//     ),
//     bifrost_api.tx.assetRegistry.registerMultilocation(
//       VGLMR,
//       ASSET_VGLMR_LOCATION,
//       0
//     ),
//     bifrost_api.tx.assetRegistry.registerMultilocation(
//       VDOT,
//       ASSET_VDOT_LOCATION,
//       0
//     ),
//     bifrost_api.tx.assetRegistry.registerMultilocation(
//       DOT,
//       ASSET_DOT_LOCATION,
//       0
//     ),
//   ]);
//
//   // await councilPropose(
//   //   bifrost_api,
//   //   alice,
//   //   1,
//   //   bifrost_set_up_calls,
//   //   bifrost_set_up_calls.encodedLength
//   // );
//
//   // 165823357460190568952172802245839421906
//   // const calls = parachain_api.tx.utility.batchAll([
//   //   parachain_api.tx.assetManager.registerForeignAsset(
//   //     {
//   //       Xcm: {
//   //         parents: 1,
//   //         interior: {
//   //           X2: [
//   //             { Parachain: 2030n },
//   //             {
//   //               GeneralKey: {
//   //                 length: 2,
//   //                 data: "0x0001000000000000000000000000000000000000000000000000000000000000",
//   //               },
//   //             },
//   //           ],
//   //         },
//   //       },
//   //     },
//   //     {
//   //       name: "xcBNC",
//   //       symbol: "xcBNC",
//   //       decimals: 12,
//   //       isFrozen: false,
//   //     },
//   //     1n,
//   //     false
//   //   ),
//   //   parachain_api.tx.assetManager.setAssetUnitsPerSecond(
//   //     {
//   //       Xcm: {
//   //         parents: 1,
//   //         interior: {
//   //           X2: [
//   //             { Parachain: 2030n },
//   //             {
//   //               GeneralKey: {
//   //                 length: 2,
//   //                 data: "0x0001000000000000000000000000000000000000000000000000000000000000",
//   //               },
//   //             },
//   //           ],
//   //         },
//   //       },
//   //     },
//   //     1n,
//   //     1n
//   //   ),
//   //
//   //   // 92952664215507824241621286735706447981
//   //   parachain_api.tx.assetManager.registerForeignAsset(
//   //     {
//   //       Xcm: {
//   //         parents: 1,
//   //         interior: {
//   //           X2: [
//   //             { Parachain: 2030n },
//   //             {
//   //               GeneralKey: {
//   //                 length: 2,
//   //                 data: "0x0901000000000000000000000000000000000000000000000000000000000000",
//   //               },
//   //             },
//   //           ],
//   //         },
//   //       },
//   //     },
//   //     {
//   //       name: "vGLMR",
//   //       symbol: "vGLMR",
//   //       decimals: 18,
//   //       isFrozen: false,
//   //     },
//   //     1n,
//   //     false
//   //   ),
//   //   parachain_api.tx.assetManager.registerForeignAsset(
//   //     {
//   //       Xcm: {
//   //         parents: 1,
//   //         interior: {
//   //           X2: [
//   //             { Parachain: 2030n },
//   //             {
//   //               GeneralKey: {
//   //                 length: 2,
//   //                 data: "0x0900000000000000000000000000000000000000000000000000000000000000",
//   //               },
//   //             },
//   //           ],
//   //         },
//   //       },
//   //     },
//   //     {
//   //       name: "vDOT",
//   //       symbol: "vDOT",
//   //       decimals: 10,
//   //       isFrozen: false,
//   //     },
//   //     1n,
//   //     false
//   //   ),
//   //   parachain_api.tx.assetManager.registerForeignAsset(
//   //     { Xcm: { parents: 1, interior: "Here" } },
//   //     {
//   //       name: "xcDOT",
//   //       symbol: "xcDOT",
//   //       decimals: 10,
//   //       isFrozen: false,
//   //     },
//   //     1n,
//   //     false
//   //   ),
//   //   parachain_api.tx.assetManager.setAssetUnitsPerSecond(
//   //     {
//   //       Xcm: {
//   //         parents: 1,
//   //         interior: "Here",
//   //       },
//   //     },
//   //     1n,
//   //     1n
//   //   ),
//   // ]);
//
//   // await sudo(parachain_api, alith, calls)
//
//   // await cross_dot_to_bifrost(relaychain_api, alice, 1000n * KSM_DECIMALS);
//   // await cross_dot_to_moonbeam(relaychain_api, alice, 1000n * KSM_DECIMALS);
//   // await cross_glmr_to_bifrost(parachain_api, alith, 1000n * MOVR_DECIMALS);
//   //
//   // // wait for 24 seconds to make sure the xcm message is executed in polkadot
//   // await waitFor(24 * 1000);
//   //
//   // await mintVtoken(bifrost_api, alice, KSM, 500n * KSM_DECIMALS);
//
//   let dot = {
//     chainId: 2030,
//     assetType: 2,
//     assetIndex: 2048,
//   };
//
//   let vdot = {
//     chainId: 2030,
//     assetType: 2,
//     assetIndex: 2304,
//   };
//   let bnc = {
//     chainId: 2030,
//     assetType: 0,
//     assetIndex: 0,
//   };
//   let glmr = {
//     chainId: 2030,
//     assetType: 2,
//     assetIndex: 2049,
//   };
//
//   const s = bifrost_api.tx.utility.batchAll([
//     bifrost_api.tx.zenlinkProtocol.createPair(dot, vdot),
//     // bifrost_api, alice, bifrost_api.tx.zenlinkProtocol.createPair(bnc,ksm),
//     bifrost_api.tx.zenlinkProtocol.createPair(bnc, glmr),
//     bifrost_api.tx.zenlinkProtocol.createPair(dot, glmr),
//   ]);
//   // await democracyForCallNeedRootOrigin(bifrost_api, alice, s);
//
//   await addLiquidity(
//     bifrost_api,
//     alice,
//     dot,
//     vdot,
//     10n * DOT_DECIMALS,
//     10n * DOT_DECIMALS
//   );
//   await addLiquidity(
//     bifrost_api,
//     alice,
//     bnc,
//     glmr,
//     1000n * BNC_DECIMALS,
//     10n * GLMR_DECIMALS
//   );
//   await addLiquidity(
//     bifrost_api,
//     alice,
//     dot,
//     glmr,
//     10n * DOT_DECIMALS,
//     10n * GLMR_DECIMALS
//   );
//   // await addLiquidity(bifrost_api,alice,ksm,movr,10n * KSM_DECIMALS,10n * MOVR_DECIMALS);
//
//   // await mint(bifrost_api, alice, MOVR, 100n * MOVR_DECIMALS)
//   //
//   // await cross_assets_to_moonriver(bifrost_api, alice, BNC, 1000n * BNC_DECIMALS)
//   // await moonbeamTransferBncToBifrost(parachain_api, alith, 10n * BNC_DECIMALS)
//   // await cross_assets_to_moonriver(bifrost_api, alice, BNC, 50n * BNC_DECIMALS)
//   //
//   // await mint(bifrost_api, alice, KSM, 100n * KSM_DECIMALS)
//   // await cross_to_moonriver(bifrost_api, alice, vKSM, 2n * KSM_DECIMALS)
// };
// main()
//   .then()
//   .catch((err) => console.log(err))
//   .finally(() => process.exit());

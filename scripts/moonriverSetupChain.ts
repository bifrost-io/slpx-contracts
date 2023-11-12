import { ApiPromise, Keyring } from "@polkadot/api";
import {
  ASSET_VMOVR_LOCATION,
  MOVR,
  vMOVR,
  ASSET_MOVR_LOCATION,
  vKSM,
  ASSET_VKSM_LOCATION,
  KSM,
  ASSET_KSM_LOCATION,
  ALITH_KEY,
  BALTATHAR_KEY,
  CHARLETH_KEY,
  KSM_DECIMALS,
  XC_BNC,
  BNC_DECIMALS,
  MOVR_DECIMALS,
} from "./constants";
import {
  getWsProviderInstance,
  mintVtoken,
  waitFor,
  calculate_multilocation_derivative_account,
  replaceSlpxAddress,
} from "./utils";
import { KeyringPair } from "@polkadot/keyring/types";
import { decodeAddress } from "@polkadot/util-crypto";
import { councilPropose, MoonbeamCallNeedRootOrigin } from "./gov";
import {
  balanceTransfer,
  kusamaTransferKsmToBifrost,
  kusamaTransferKsmToMoonriver,
  moonriverTransferMovrToBifrost,
} from "./transfer";
import { ethers } from "hardhat";

const main = async () => {
  console.warn = function () {};
  const moonriverApi = await getWsProviderInstance("ws://127.0.0.1:9910");
  const bifrostApi = await getWsProviderInstance("ws://127.0.0.1:9920");
  const keyring = new Keyring({ type: "sr25519", ss58Format: 6 });
  const alice = keyring.addFromUri("//Alice");
  const keyringEth = new Keyring({ type: "ethereum" });
  const alith = keyringEth.addFromUri(ALITH_KEY);
  const baltathar = keyringEth.addFromUri(BALTATHAR_KEY);
  const charleth = keyringEth.addFromUri(CHARLETH_KEY);

  await balanceTransfer(
    moonriverApi,
    baltathar,
    alith.address,
    10000n * MOVR_DECIMALS
  );
  await balanceTransfer(
    moonriverApi,
    baltathar,
    process.env.MY_ADDRESS !== undefined ? process.env.MY_ADDRESS : "",
    10000n * MOVR_DECIMALS
  );

  await bifrostInit(bifrostApi, alice);
  await moonriverInit(moonriverApi, alith, baltathar, charleth);

  const moonriverSlpx = await depolyContract();
  await replaceSlpxAddress("MOONRIVER_SLPX_ADDRESS", moonriverSlpx.address);
  await bifrostInitSlpx(bifrostApi, alice, moonriverSlpx.address);
};
main()
  .then()
  .catch((err) => console.log(err))
  .finally(() => process.exit());

const bifrostInit = async (api: ApiPromise, signer: KeyringPair) => {
  const bifrost_set_up_calls = api.tx.utility.batchAll([
    api.tx.assetRegistry.registerMultilocation(MOVR, ASSET_MOVR_LOCATION, 0),
    api.tx.assetRegistry.registerMultilocation(vMOVR, ASSET_VMOVR_LOCATION, 0),
    api.tx.assetRegistry.registerMultilocation(vKSM, ASSET_VKSM_LOCATION, 0),
    api.tx.assetRegistry.registerMultilocation(KSM, ASSET_KSM_LOCATION, 0),
  ]);

  await councilPropose(
    api,
    signer,
    1,
    bifrost_set_up_calls,
    bifrost_set_up_calls.encodedLength
  );
};

const moonriverInit = async (
  api: ApiPromise,
  alith: KeyringPair,
  baltathar: KeyringPair,
  charleth: KeyringPair
) => {
  const calls = api.tx.utility.batchAll([
    api.tx.assetManager.registerForeignAsset(
      {
        Xcm: {
          parents: 1,
          interior: {
            X2: [
              { Parachain: 2001n },
              {
                GeneralKey: {
                  length: 2,
                  data: "0x0001000000000000000000000000000000000000000000000000000000000000",
                },
              },
            ],
          },
        },
      },
      {
        name: "xcBNC",
        symbol: "xcBNC",
        decimals: 12,
        isFrozen: false,
      },
      1n,
      true
    ),
    api.tx.assetManager.setAssetUnitsPerSecond(
      {
        Xcm: {
          parents: 1,
          interior: {
            X2: [
              { Parachain: 2001n },
              {
                GeneralKey: {
                  length: 2,
                  data: "0x0001000000000000000000000000000000000000000000000000000000000000",
                },
              },
            ],
          },
        },
      },
      131352192005380n,
      1n
    ),

    // 92952664215507824241621286735706447981
    api.tx.assetManager.registerForeignAsset(
      {
        Xcm: {
          parents: 1,
          interior: {
            X2: [
              { Parachain: 2001n },
              {
                GeneralKey: {
                  length: 2,
                  data: "0x010a000000000000000000000000000000000000000000000000000000000000",
                },
              },
            ],
          },
        },
      },
      {
        name: "vMOVR",
        symbol: "vMOVR",
        decimals: 18,
        isFrozen: false,
      },
      1n,
      true
    ),
    api.tx.assetManager.registerForeignAsset(
      {
        Xcm: {
          parents: 1,
          interior: {
            X2: [
              { Parachain: 2001n },
              {
                GeneralKey: {
                  length: 2,
                  data: "0x0104000000000000000000000000000000000000000000000000000000000000",
                },
              },
            ],
          },
        },
      },
      {
        name: "vKSM",
        symbol: "vKSM",
        decimals: 12,
        isFrozen: false,
      },
      1n,
      true
    ),
    api.tx.assetManager.registerForeignAsset(
      {
        Xcm: {
          parents: 1,
          interior: {
            X2: [
              { Parachain: 2001n },
              {
                GeneralKey: {
                  length: 2,
                  data: "0x0101000000000000000000000000000000000000000000000000000000000000",
                },
              },
            ],
          },
        },
      },
      {
        name: "vBNC",
        symbol: "vBNC",
        decimals: 12,
        isFrozen: false,
      },
      1n,
      true
    ),
    api.tx.assetManager.registerForeignAsset(
      { Xcm: { parents: 1, interior: "Here" } },
      {
        name: "xcKSM",
        symbol: "xcKSM",
        decimals: 12,
        isFrozen: false,
      },
      1n,
      true
    ),
    api.tx.assetManager.setAssetUnitsPerSecond(
      {
        Xcm: {
          parents: 1,
          interior: "Here",
        },
      },
      1n,
      1n
    ),
  ]);

  await MoonbeamCallNeedRootOrigin(api, alith, baltathar, charleth, calls);
};

const depolyContract = async () => {
  // Deploy slpx contract
  const AddressToAccount = await ethers.getContractFactory("AddressToAccount");
  const addressToAccount = await AddressToAccount.deploy();
  await addressToAccount.deployed();
  console.log("AddressToAccount deployed to:", addressToAccount.address);

  const BuildCallData = await ethers.getContractFactory("BuildCallData");
  const buildCallData = await BuildCallData.deploy();
  await buildCallData.deployed();
  console.log("BuildCallData deployed to:", buildCallData.address);

  await waitFor(12 * 1000);

  const MoonriverSlpx = await ethers.getContractFactory("MoonbeamSlpx", {
    libraries: {
      AddressToAccount: addressToAccount.address,
      BuildCallData: buildCallData.address,
    },
  });
  const moonriverSlpx = await MoonriverSlpx.deploy();
  await moonriverSlpx.deployed();
  console.log("moonriverSlpx deployed to:", moonriverSlpx.address);
  await moonriverSlpx.initialize(XC_BNC, "2001", "0x020a");
  return moonriverSlpx;
};

const bifrostInitSlpx = async (
  api: ApiPromise,
  alice: KeyringPair,
  address: string
) => {
  // calculate multilocation derivative account (slpx contract)
  const contract_derivative_account =
    await calculate_multilocation_derivative_account(api, 2023, address);
  console.log("contract_derivative_account", contract_derivative_account);

  // Recharge BNC to contract_derivative_account
  await balanceTransfer(
    api,
    alice,
    contract_derivative_account,
    100n * BNC_DECIMALS
  );
  // add whitelist
  const calls = api.tx.utility.batchAll([
    // api.tx.slpx.addWhitelist("Moonbeam", contract_derivative_account),
    api.tx.slpx.setTransferToFee("Moonbeam", 116414032617n),
  ]);
  await councilPropose(api, alice, 1, calls, calls.encodedLength);
};
//
// await mintVtoken(bifrostApi, alice, KSM, 500n * KSM_DECIMALS);
// await mintVtoken(bifrostApi, alice, MOVR, 500n * MOVR_DECIMALS);

// let ksm = {
//   chainId: 2001,
//   assetType: 2,
//   assetIndex: 516,
// };
//
// let vksm = {
//   chainId: 2001,
//   assetType: 2,
//   assetIndex: 260,
// };
// let bnc = {
//   chainId: 2001,
//   assetType: 0,
//   assetIndex: 0,
// };
// let movr = {
//   chainId: 2001,
//   assetType: 2,
//   assetIndex: 522,
// };
//
// const s = bifrostApi.tx.utility.batchAll([
//   bifrostApi.tx.zenlinkProtocol.createPair(ksm, vksm),
//   // bifrostApi, alice, bifrostApi.tx.zenlinkProtocol.createPair(bnc,ksm),
//   bifrostApi.tx.zenlinkProtocol.createPair(bnc, movr),
//   bifrostApi.tx.zenlinkProtocol.createPair(ksm, movr),
// ]);
// await democracyForCallNeedRootOrigin(bifrostApi, alice, s);
// await democracyForCallNeedRootOrigin(bifrostApi, alice, bifrostApi.tx.zenlinkProtocol.createPair(bnc,ksm))
// await democracyForCallNeedRootOrigin(bifrostApi, alice, bifrostApi.tx.zenlinkProtocol.createPair(bnc,movr))
// await democracyForCallNeedRootOrigin(bifrostApi, alice, bifrostApi.tx.zenlinkProtocol.createPair(ksm,movr))

// await addLiquidity(
//   bifrostApi,
//   alice,
//   ksm,
//   vksm,
//   10n * KSM_DECIMALS,
//   10n * KSM_DECIMALS
// );
// await addLiquidity(bifrostApi,alice,bnc,ksm,1000n * BNC_DECIMALS,10n * KSM_DECIMALS);
// await addLiquidity(
//   bifrostApi,
//   alice,
//   bnc,
//   movr,
//   1000n * BNC_DECIMALS,
//   10n * MOVR_DECIMALS
// );
// await addLiquidity(
//   bifrostApi,
//   alice,
//   ksm,
//   movr,
//   10n * KSM_DECIMALS,
//   10n * MOVR_DECIMALS
// );

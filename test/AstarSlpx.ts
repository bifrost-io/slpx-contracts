import { expect } from "chai";
import { ethers } from "hardhat";
import "@nomiclabs/hardhat-ethers";
import { ApiPromise, Keyring, WsProvider } from "@polkadot/api";
import { u8aToHex } from "@polkadot/util";
import * as polkadotCryptoUtils from "@polkadot/util-crypto";
import {
  ALITH,
  ASSET_ASTR_LOCATION,
  ASSET_VASTR_LOCATION,
  ASTR,
  ASTR_DECIMALS,
  ASTR_METADATA,
  BNC_DECIMALS,
  Hardhat0,
  TEST_ACCOUNT,
  VASTR,
} from "../scripts/constants";
import { KeyringPair } from "@polkadot/keyring/types";
import { MultiLocation } from "@polkadot/types/interfaces";
import { balanceTransfer, councilPropose, waitFor } from "../scripts/utils";
import { calculate_multilocation_derivative_account } from "../scripts/calculate_multilocation_derivative_account";

//aNhuaXEfaSiXJcC1YxssiHgNjCvoJbESD68KjycecaZvqpv
//0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266

describe("AstarSlpx", function () {
  let contract_address: string;
  let astarSlpx: any;
  let test_account_public_key: string;
  let bifrost_api: ApiPromise;
  let astar_api: ApiPromise;
  let alice: KeyringPair;

  before("Setup env", async function () {
    this.timeout(1000 * 1000);
    // Deploy xcm-action contract
    const caller = await ethers.getSigner(Hardhat0);
    const AddressToAccount = await ethers.getContractFactory(
      "AddressToAccount"
    );
    const addressToAccount = await AddressToAccount.deploy();
    await addressToAccount.deployed();
    console.log("AddressToAccount deployed to:", addressToAccount.address);

    const BuildCallData = await ethers.getContractFactory("BuildCallData");
    const buildCallData = await BuildCallData.deploy();
    await buildCallData.deployed();
    console.log("BuildCallData deployed to:", buildCallData.address);

    await waitFor(12 * 1000);

    astarSlpx = await ethers.getContractFactory("AstarSlpx", {
      libraries: {
        AddressToAccount: addressToAccount.address,
        BuildCallData: buildCallData.address,
      },
    });
    astarSlpx = await astarSlpx.deploy(100000000000, 10000000000);
    await astarSlpx.deployed();
    console.log("AstarSlpx deployed to:", astarSlpx.address);
    expect(await astarSlpx.owner()).to.equal(Hardhat0);

    // init polkadot api
    const wsProvider = new WsProvider("ws://127.0.0.1:9920");
    bifrost_api = await ApiPromise.create({ provider: wsProvider });
    const wsProvider1 = new WsProvider("ws://127.0.0.1:9910");
    astar_api = await ApiPromise.create({ provider: wsProvider1 });
    const keyring = new Keyring({ type: "sr25519", ss58Format: 6 });
    alice = keyring.addFromUri("//Alice");

    // xcm-action contract address -> xcm-action contract account_id
    const contract_account_id = polkadotCryptoUtils.evmToAddress(
      astarSlpx.address
    );

    // xcm-action contract account_id -> xcm-action contract account_id public_key
    const contract_public_key = u8aToHex(
      keyring.addFromAddress(contract_account_id).publicKey
    );

    // calculate multilocation derivative account (xcm-action contract)
    const contract_derivative_account =
      await calculate_multilocation_derivative_account(
        bifrost_api,
        2006,
        contract_public_key
      );

    // Recharge BNC to contract_derivative_account
    await balanceTransfer(
      bifrost_api,
      alice,
      contract_derivative_account,
      100n * BNC_DECIMALS
    );
    // transfer some astr to contract_account_id to activate the account
    await balanceTransfer(
      astar_api,
      alice,
      contract_account_id,
      1n * ASTR_DECIMALS
    );

    // add whitelist
    await councilPropose(
      bifrost_api,
      alice,
      1,
      bifrost_api.tx.slpx.addWhitelist(
        "Astar",
        contract_derivative_account
      ),
      bifrost_api.tx.slpx.addWhitelist(
        "Astar",
        contract_derivative_account
      ).encodedLength
    );

    // Approve
    const bnc = await ethers.getContractAt(
      "IERC20",
      "0xfFffFffF00000000000000010000000000000007"
    );
    const vastr = await ethers.getContractAt(
      "IERC20",
      "0xFfFfFfff00000000000000010000000000000008"
    );
    await vastr.approve(astarSlpx.address, "1000000000000000000000000");
    await bnc.approve(astarSlpx.address, "1000000000000000000000000");
  });

  it("setBifrostTransactionFee", async function () {
    this.timeout(1000 * 1000);

    await astarSlpx.setBifrostTransactionFee(100000000000, 10000000000);
    await waitFor(12 * 1000);

    expect(await astarSlpx.transactWeight()).to.equal(10000000000);
    expect(await astarSlpx.bifrostTransactionFee()).to.equal(100000000000);
  });

  it("setAssetAddressToCurrencyId", async function () {
    this.timeout(1000 * 1000);

    await astarSlpx.setAssetAddressToMinimumValue(
      "0xfFffFffF00000000000000010000000000000007",
      "1000000000000"
    );
    await astarSlpx.setAssetAddressToMinimumValue(
      "0xFfFfFfff00000000000000010000000000000008",
      "1000000000000000000"
    );
    await astarSlpx.setAssetAddressToMinimumValue(
      "0x0000000000000000000000000000000000000000",
      "1000000000000000000"
    );
    await waitFor(24 * 1000);
    expect(
      await astarSlpx.assetAddressToMinimumValue(
        "0xfFffFffF00000000000000010000000000000007"
      )
    ).to.equal("1000000000000");
    expect(
      await astarSlpx.assetAddressToMinimumValue(
        "0xFfFfFfff00000000000000010000000000000008"
      )
    ).to.equal("1000000000000000000");
    expect(
      await astarSlpx.assetAddressToMinimumValue(
        "0x0000000000000000000000000000000000000000"
      )
    ).to.equal("1000000000000000000");
  });

  it("setAssetAddressToCurrencyId", async function () {
    this.timeout(1000 * 1000);

    await astarSlpx.setAssetAddressToCurrencyId(
      "0xfFffFffF00000000000000010000000000000007",
      "0x0001"
    );
    await astarSlpx.setAssetAddressToCurrencyId(
      "0xFfFfFfff00000000000000010000000000000008",
      "0x0903"
    );
    await astarSlpx.setAssetAddressToCurrencyId(
      "0x0000000000000000000000000000000000000000",
      "0x0803"
    );
    await waitFor(24 * 1000);
    expect(
      await astarSlpx.assetAddressToCurrencyId(
        "0xfFffFffF00000000000000010000000000000007"
      )
    ).to.equal("0x0001");
    expect(
      await astarSlpx.assetAddressToCurrencyId(
        "0xFfFfFfff00000000000000010000000000000008"
      )
    ).to.equal("0x0903");
    expect(
      await astarSlpx.assetAddressToCurrencyId(
        "0x0000000000000000000000000000000000000000"
      )
    ).to.equal("0x0803");
  });

  it("mint vastr", async function () {
    this.timeout(1000 * 1000);

    const before_astr_balance: any = await astar_api.query.system.account(
      TEST_ACCOUNT
    );
    const before_vastr_balance: any = await astar_api.query.assets.account(
      "18446744073709551624",
      TEST_ACCOUNT
    );

    // mint 10 vastr
    await astarSlpx.mintVNativeAsset({
      from: Hardhat0,
      value: "10000000000000000000",
    });
    await waitFor(60 * 1000);

    const after_astr_balance: any = await astar_api.query.system.account(
      TEST_ACCOUNT
    );
    const after_vastr_balance: any = await astar_api.query.assets.account(
      "18446744073709551624",
      TEST_ACCOUNT
    );

    expect(
      BigInt(before_astr_balance["data"]["free"]) -
        BigInt(after_astr_balance["data"]["free"])
    ).to.greaterThan(10n * ASTR_DECIMALS);
    expect(
      BigInt(after_vastr_balance.toJSON().balance) -
        BigInt(before_vastr_balance.toJSON().balance)
    ).to.greaterThan(8n * ASTR_DECIMALS);
  });

  it("Swap ASTR to BNC", async function () {
    this.timeout(1000 * 1000);

    const before_astr_balance: any = await astar_api.query.system.account(
      TEST_ACCOUNT
    );
    const before_bnc_balance: any = await astar_api.query.assets.account(
      "18446744073709551623",
      TEST_ACCOUNT
    );

    // Swap ASTR to BNC
    await astarSlpx.swapNativeAssetsForExactAssets(
      "0xfFffFffF00000000000000010000000000000007",
      0,
      { value: 50n * ASTR_DECIMALS }
    );
    await waitFor(60 * 1000);

    const after_astr_balance: any = await astar_api.query.system.account(
      TEST_ACCOUNT
    );
    const after_bnc_balance: any = await astar_api.query.assets.account(
      "18446744073709551623",
      TEST_ACCOUNT
    );

    expect(
      BigInt(before_astr_balance["data"]["free"]) -
        BigInt(after_astr_balance["data"]["free"])
    ).to.greaterThan(50n * ASTR_DECIMALS);
    expect(
      BigInt(after_bnc_balance.toJSON().balance) -
        BigInt(before_bnc_balance.toJSON().balance)
    ).to.greaterThan(100n * BNC_DECIMALS);
  });

  it("Swap BNC to ASTR", async function () {
    this.timeout(1000 * 1000);

    const before_astr_balance: any = await astar_api.query.system.account(
      TEST_ACCOUNT
    );
    const before_bnc_balance: any = await astar_api.query.assets.account(
      "18446744073709551623",
      TEST_ACCOUNT
    );

    // Swap BNC to ASTR
    await astarSlpx.swapAssetsForExactNativeAssets(
      "0xfFffFffF00000000000000010000000000000007",
      "100000000000000",
      0
    );
    await waitFor(60 * 1000);

    const after_astr_balance: any = await astar_api.query.system.account(
      TEST_ACCOUNT
    );
    const after_bnc_balance: any = await astar_api.query.assets.account(
      "18446744073709551623",
      TEST_ACCOUNT
    );

    expect(
      BigInt(after_astr_balance["data"]["free"]) -
        BigInt(before_astr_balance["data"]["free"])
    ).to.greaterThan(1n * ASTR_DECIMALS);
    expect(
      BigInt(before_bnc_balance.toJSON().balance) -
        BigInt(after_bnc_balance.toJSON().balance)
    ).to.greaterThan(100n * BNC_DECIMALS);
  });

  it("Swap BNC to VASTR", async function () {
    this.timeout(1000 * 1000);

    const before_bnc_balance: any = await astar_api.query.assets.account(
      "18446744073709551623",
      TEST_ACCOUNT
    );
    const before_vastr_balance: any = await astar_api.query.assets.account(
      "184467440737095516234",
      TEST_ACCOUNT
    );

    // Swap BNC to ASTR
    await astarSlpx.swapAssetsForExactAssets(
      "0xfFffFffF00000000000000010000000000000007",
      "0xFfFfFfff00000000000000010000000000000008",
      "100000000000000",
      0
    );
    await waitFor(60 * 1000);

    const after_bnc_balance: any = await astar_api.query.assets.account(
      "18446744073709551623",
      TEST_ACCOUNT
    );
    const after_vastr_balance: any = await astar_api.query.assets.account(
      "18446744073709551624",
      TEST_ACCOUNT
    );

    expect(
      BigInt(after_vastr_balance.toJSON().balance) -
        BigInt(before_vastr_balance.toJSON().balance)
    ).to.greaterThan(1n * ASTR_DECIMALS);
    expect(
      BigInt(before_bnc_balance.toJSON().balance) -
        BigInt(after_bnc_balance.toJSON().balance)
    ).to.greaterThan(30n * BNC_DECIMALS);
  });
});

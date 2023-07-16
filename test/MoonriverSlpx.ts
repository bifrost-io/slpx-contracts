import { expect } from "chai";
import { ethers } from "hardhat";
import "@nomiclabs/hardhat-ethers";
import { ApiPromise, Keyring, WsProvider } from "@polkadot/api";
import {
  BNC_DECIMALS,
  MOVR_DECIMALS,
} from "../scripts/constants";
import { KeyringPair } from "@polkadot/keyring/types";
import { balanceTransfer, councilPropose, waitFor } from "../scripts/utils";
import {calculate_multilocation_derivative_account} from "../scripts/calculate_multilocation_derivative_account";

//aNhuaXEfaSiXJcC1YxssiHgNjCvoJbESD68KjycecaZvqpv
//0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266

describe("BifrostXcmAction", function () {
  let moonriverSlpx: any;
  let bifrost_api: ApiPromise;
  let astar_api: ApiPromise;
  let alice: KeyringPair;

  it("Setup env", async function () {
    this.timeout(1000 * 1000);
    // Deploy xcm-action contract
    const AddressToAccount = await ethers.getContractFactory(
      "AddressToAccount"
    );
    const addressToAccount = await AddressToAccount.deploy();
    await addressToAccount.deployed();
    console.log("AddressToAccount deployed to:", addressToAccount.address);

    const BuildCallData = await ethers.getContractFactory(
      "BuildCallData"
    );
    const buildCallData = await BuildCallData.deploy();
    await buildCallData.deployed();
    console.log("BuildCallData deployed to:", buildCallData.address);

    await waitFor(12 * 1000);

    moonriverSlpx = await ethers.getContractFactory(
      "MoonbeamSlpx",
      {
        libraries: {
          AddressToAccount: addressToAccount.address,
          BuildCallData: buildCallData.address,
        },
      }
    );
    moonriverSlpx = await moonriverSlpx.deploy();
    await moonriverSlpx.deployed();
    console.log("moonriverSlpx deployed to:", moonriverSlpx.address);
    await moonriverSlpx.initialize("0xfFFFfFfF006cD1E2a35Acdb1786cAF7893547b75",'2001','0x020a')
    // expect(await moonriverSlpx.owner()).to.equal(Hardhat0);

    // init polkadot api
    const wsProvider = new WsProvider("ws://127.0.0.1:9920")
    bifrost_api = await ApiPromise.create({provider: wsProvider})
    const wsProvider1 = new WsProvider("ws://127.0.0.1:9910")
    astar_api = await ApiPromise.create({provider: wsProvider1})
    const keyring = new Keyring({ type: 'sr25519', ss58Format: 6 })
    alice = keyring.addFromUri('//Alice')

    // calculate multilocation derivative account (xcm-action contract)
    const contract_derivative_account = await calculate_multilocation_derivative_account(bifrost_api,2023,moonriverSlpx.address)
    console.log("contract_derivative_account",contract_derivative_account)

    // Recharge BNC to contract_derivative_account
    await balanceTransfer(bifrost_api,alice,contract_derivative_account,100n * BNC_DECIMALS)
    // transfer some astr to contract_account_id to activate the account
    // await balanceTransfer(astar_api, alice, contract_account_id, 1n * ASTR_DECIMALS)

    // add whitelist
    const bifrost_set_up_calls = bifrost_api.tx.utility.batchAll([
      bifrost_api.tx.slpx.addWhitelist("Moonbeam",contract_derivative_account)
    ])

    await councilPropose(bifrost_api,alice,1,bifrost_set_up_calls,bifrost_set_up_calls.encodedLength)
    // Set execuation fee
    await waitFor(12 * 1000)
  });

  it("mint vmovr", async function() {
    this.timeout(1000 * 1000)
    await moonriverSlpx.setAssetAddressInfo("0x0000000000000000000000000000000000000802",'100000000000000000','0x020a')
    await waitFor(36 * 1000)

    // mint 10 vmovr
    await moonriverSlpx.mintVNativeAsset({value: 10n * MOVR_DECIMALS })
  });

  it("mint vksm", async function() {
    this.timeout(1000 * 1000)
    await moonriverSlpx.setAssetAddressInfo("0xFfFFfFff1FcaCBd218EDc0EbA20Fc2308C778080",'100000000000','0x0204')

    const vastr = await ethers.getContractAt("IERC20","0xFfFFfFff1FcaCBd218EDc0EbA20Fc2308C778080");
    await vastr.approve(moonriverSlpx.address,"100000000000000000000")
    await waitFor(24 * 1000)

    // mint 10 vmovr
    await moonriverSlpx.mintVAsset('0xFfFFfFff1FcaCBd218EDc0EbA20Fc2308C778080','10000000000000')
  });

  // it("Swap ASTR to vASTR", async function() {
  //   this.timeout(1000 * 1000)
  //
  //   const before_astr_balance:any = await astar_api.query.system.account(TEST_ACCOUNT)
  //   const before_vastr_balance:any = await astar_api.query.assets.account("18446744073709551624",TEST_ACCOUNT)
  //
  //   // Swap ASTR to vASTR
  //   await moonriverSlpx.swap_astr_for_exact_assets("0xFfFfFfff00000000000000010000000000000008",0,{value: 10n * ASTR_DECIMALS })
  //   await waitFor(60 * 1000)
  //
  //   const after_astr_balance:any = await astar_api.query.system.account(TEST_ACCOUNT)
  //   const after_vastr_balance:any = await astar_api.query.assets.account("18446744073709551624",TEST_ACCOUNT)
  //
  //   expect(BigInt(before_astr_balance['data']['free']) - BigInt(after_astr_balance['data']['free'])).to.greaterThan(2n * ASTR_DECIMALS);
  //   expect(BigInt(after_vastr_balance.toJSON().balance) - BigInt(before_vastr_balance.toJSON().balance)).to.greaterThan(2n * ASTR_DECIMALS);
  //
  // });
  //
  // it("Swap vASTR to ASTR", async function() {
  //   this.timeout(1000 * 1000)
  //
  //   // Approve VASTR to contract
  //   const caller = await ethers.getSigner("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266")
  //   const vastr = await ethers.getContractAt("IERC20","0xFfFfFfff00000000000000010000000000000008",caller);
  //   await vastr.approve(moonriverSlpx.address,"100000000000000000000")
  //   await waitFor(24 * 1000)
  //
  //   const before_astr_balance:any = await astar_api.query.system.account(TEST_ACCOUNT)
  //   const before_vastr_balance:any = await astar_api.query.assets.account("18446744073709551624",TEST_ACCOUNT)
  //
  //   // Swap vASTR to ASTR
  //   await moonriverSlpx.swap_assets_for_exact_astr("0xFfFfFfff00000000000000010000000000000008","5000000000000000000",0)
  //   await waitFor(60 * 1000)
  //
  //   const after_astr_balance:any = await astar_api.query.system.account(TEST_ACCOUNT)
  //   const after_vastr_balance:any = await astar_api.query.assets.account("18446744073709551624",TEST_ACCOUNT)
  //
  //   expect(BigInt(after_astr_balance['data']['free']) - BigInt(before_astr_balance['data']['free'])).to.greaterThan(2n * ASTR_DECIMALS);
  //   expect(BigInt(before_vastr_balance.toJSON().balance) - BigInt(after_vastr_balance.toJSON().balance)).to.greaterThan(2n * ASTR_DECIMALS);
  // });
});

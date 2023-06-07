import { expect } from "chai";
import { ethers } from "hardhat";
import "@nomiclabs/hardhat-ethers"
import {ApiPromise, Keyring, WsProvider} from "@polkadot/api";
import {u8aToHex} from "@polkadot/util";
import * as polkadotCryptoUtils from "@polkadot/util-crypto";
import {ASTR_DECIMALS, BNC_DECIMALS, TEST_ACCOUNT} from "../scripts/constants";
import {KeyringPair} from "@polkadot/keyring/types";
import {MultiLocation} from "@polkadot/types/interfaces";

//aNhuaXEfaSiXJcC1YxssiHgNjCvoJbESD68KjycecaZvqpv
//0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266

async function calculate_multilocation_derivative_account(api:ApiPromise,publicKey:string){
  const interior = {
    X2: [{ Parachain: 2006 }, { AccountId32: { network: {polkadot:null}, id: publicKey } }],
  };
  const multilocation: MultiLocation = api.createType(
      'XcmV3MultiLocation',
      JSON.parse(
          JSON.stringify({
            parents: 1,
            interior: interior,
          })
      )
  );
  console.log('Multilocation for calculation', multilocation.toString());

  const toHash = new Uint8Array([
    ...new Uint8Array([32]),
    ...new TextEncoder().encode('multiloc'),
    ...multilocation.toU8a(),
  ]);

  const DescendOriginAddress32 = u8aToHex(api.registry.hash(toHash).slice(0, 32));
  const DescendOriginAddress20 = u8aToHex(api.registry.hash(toHash).slice(0, 20));

  console.log('32 byte address is %s', DescendOriginAddress32);
  console.log('20 byte address is %s', DescendOriginAddress20);
  return DescendOriginAddress32
}

describe("BifrostXcmAction", function () {
  async function waitFor(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  async function deployAstarXcmAction() {
    const caller = await ethers.getSigner("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266")
    const AstarXcmAction = await ethers.getContractFactory("AstarXcmAction",caller);
    const astarXcmAction = await AstarXcmAction.deploy();
    console.log("Contract address:",astarXcmAction.address)
    return astarXcmAction
  }

  async function addWhitelist(api: ApiPromise, signer: KeyringPair, accountId:string) {
    return new Promise((resolve) => {
      api.tx.xcmAction.addWhitelist("Astar",accountId).signAndSend(signer, ({ status }) => {
        if (status.isFinalized) {
          console.log(`✔️  - addWhitelist finalized at block hash #${status.asFinalized.toString()}`)
          resolve(status.asFinalized.toString())
        }
      })
    })
  }

  async function transfer(api:ApiPromise, signer:KeyringPair, to:string, amount: bigint) {
    return new Promise((resolve) => {
      api.tx.balances.transfer(to, amount).signAndSend(signer, ({ status }) => {
        if (status.isFinalized) {
          console.log(`✔️  - transfer finalized at block hash #${status.asFinalized.toString()}`)
          resolve(status.asFinalized.toString())
        }
      })
    })
  }

  let contract_address:string;
  let astarXcmAction:any;
  let test_account_public_key:string;
  let bifrost_api:ApiPromise;
  let astar_api:ApiPromise;
  let alice:KeyringPair;

  before("Setup env",async function() {
    this.timeout(1000 * 1000)
    // Deploy xcm-action contract
    const caller = await ethers.getSigner("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266")
    const AstarXcmAction = await ethers.getContractFactory("AstarXcmAction",caller);
    astarXcmAction = await AstarXcmAction.deploy();
    console.log("Contract address:",astarXcmAction.address)
    await waitFor(24 * 1000)

    // init polkadot api
    const wsProvider = new WsProvider("ws://127.0.0.1:9920")
    bifrost_api = await ApiPromise.create({provider: wsProvider})
    const wsProvider1 = new WsProvider("ws://127.0.0.1:9910")
    astar_api = await ApiPromise.create({provider: wsProvider1})
    const keyring = new Keyring({ type: 'sr25519', ss58Format: 6 })
    alice = keyring.addFromUri('//Alice')

    // test address -> test account_id
    const test_account_id = polkadotCryptoUtils.evmToAddress("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266")
    // test account_id -> test account_id public_key
    test_account_public_key = u8aToHex(keyring.addFromAddress(test_account_id).publicKey);

    // xcm-action contract address -> xcm-action contract account_id
    const contract_account_id = polkadotCryptoUtils.evmToAddress(astarXcmAction.address)

    // xcm-action contract account_id -> xcm-action contract account_id public_key
    const contract_public_key = u8aToHex(keyring.addFromAddress(contract_account_id).publicKey);

    // calculate multilocation derivative account (xcm-action contract)
    const derivative_account_public_key = await calculate_multilocation_derivative_account(bifrost_api, contract_public_key)
    const contract_derivative_account = keyring.addFromAddress(derivative_account_public_key).address
    console.log(contract_derivative_account)

    // Recharge BNC to contract_derivative_account
    await transfer(bifrost_api,alice,contract_derivative_account,10n * BNC_DECIMALS)
    // transfer some astr to contract_account_id to activate the account
    await transfer(astar_api,alice,contract_account_id,1n * ASTR_DECIMALS)

    // add whitelist
    await addWhitelist(bifrost_api,alice, contract_derivative_account)
    await waitFor(24 * 1000)
  })

  it("mint vastr", async function() {
    this.timeout(1000 * 1000)

    // bind caller publick_key
    await astarXcmAction.bind(test_account_public_key)
    await waitFor(36 * 1000)
    expect(await astarXcmAction.addressToSubstratePublickey("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266")).to.equal(test_account_public_key)

    const before_astr_balance:any = await astar_api.query.system.account(TEST_ACCOUNT)
    const before_vastr_balance:any = await astar_api.query.assets.account("18446744073709551624",TEST_ACCOUNT)

    // mint 10 vastr
    await astarXcmAction.mint_vastr({from:"0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266", value: 10n * ASTR_DECIMALS })
    await waitFor(60 * 1000)

    const after_astr_balance:any = await astar_api.query.system.account(TEST_ACCOUNT)
    const after_vastr_balance:any = await astar_api.query.assets.account("18446744073709551624",TEST_ACCOUNT)

    expect(BigInt(before_astr_balance['data']['free']) - BigInt(after_astr_balance['data']['free'])).to.greaterThan(10n * ASTR_DECIMALS);
    expect(BigInt(after_vastr_balance.toJSON().balance) - BigInt(before_vastr_balance.toJSON().balance)).to.greaterThan(9n * ASTR_DECIMALS);

  });

  it("Swap ASTR to vASTR", async function() {
    this.timeout(1000 * 1000)

    const before_astr_balance:any = await astar_api.query.system.account(TEST_ACCOUNT)
    const before_vastr_balance:any = await astar_api.query.assets.account("18446744073709551624",TEST_ACCOUNT)

    // Swap ASTR to vASTR
    await astarXcmAction.swap_astr_for_exact_assets("0xFfFfFfff00000000000000010000000000000008",0,{value: 10n * ASTR_DECIMALS })
    await waitFor(60 * 1000)

    const after_astr_balance:any = await astar_api.query.system.account(TEST_ACCOUNT)
    const after_vastr_balance:any = await astar_api.query.assets.account("18446744073709551624",TEST_ACCOUNT)

    expect(BigInt(before_astr_balance['data']['free']) - BigInt(after_astr_balance['data']['free'])).to.greaterThan(2n * ASTR_DECIMALS);
    expect(BigInt(after_vastr_balance.toJSON().balance) - BigInt(before_vastr_balance.toJSON().balance)).to.greaterThan(2n * ASTR_DECIMALS);

  });

  it("Swap vASTR to ASTR", async function() {
    this.timeout(1000 * 1000)

    // Approve VASTR to contract
    const caller = await ethers.getSigner("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266")
    const vastr = await ethers.getContractAt("IERC20","0xFfFfFfff00000000000000010000000000000008",caller);
    await vastr.approve(astarXcmAction.address,"100000000000000000000")
    await waitFor(24 * 1000)

    const before_astr_balance:any = await astar_api.query.system.account(TEST_ACCOUNT)
    const before_vastr_balance:any = await astar_api.query.assets.account("18446744073709551624",TEST_ACCOUNT)

    // Swap vASTR to ASTR
    await astarXcmAction.swap_assets_for_exact_astr("0xFfFfFfff00000000000000010000000000000008","5000000000000000000",0)
    await waitFor(60 * 1000)

    const after_astr_balance:any = await astar_api.query.system.account(TEST_ACCOUNT)
    const after_vastr_balance:any = await astar_api.query.assets.account("18446744073709551624",TEST_ACCOUNT)

    expect(BigInt(after_astr_balance['data']['free']) - BigInt(before_astr_balance['data']['free'])).to.greaterThan(2n * ASTR_DECIMALS);
    expect(BigInt(before_vastr_balance.toJSON().balance) - BigInt(after_vastr_balance.toJSON().balance)).to.greaterThan(2n * ASTR_DECIMALS);
  });
});

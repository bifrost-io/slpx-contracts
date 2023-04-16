import { expect } from "chai";
import { ethers } from "hardhat";
import "@nomiclabs/hardhat-ethers"
import {ApiPromise, Keyring, WsProvider} from "@polkadot/api";
import {u8aToHex} from "@polkadot/util";
import * as polkadotCryptoUtils from "@polkadot/util-crypto";
import {ASTR_DECIMALS, BNC_DECIMALS, TEST_ACCOUNT} from "../scripts/constants";
import {KeyringPair} from "@polkadot/keyring/types";
import {SubmittableExtrinsic} from "@polkadot/api/types";
import {ISubmittableResult} from "@polkadot/types/types";
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

  it("mint vastr", async function() {
    this.timeout(1000 * 1000)
    const astarXcmAction =  await deployAstarXcmAction()
    await waitFor(24 * 1000)
    const contract_account_id = polkadotCryptoUtils.evmToAddress(astarXcmAction.address)
    const keyring = new Keyring({ type: 'sr25519', ss58Format: 6 })
    const contract_public_key = keyring.addFromAddress(contract_account_id).publicKey;
    const alice = keyring.addFromUri('//Alice')

    const test_account_id = polkadotCryptoUtils.evmToAddress("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266")
    const test_account_public_key = keyring.addFromAddress(test_account_id).publicKey;

    const wsProvider = new WsProvider("ws://127.0.0.1:9920")
    const bifrost_api = await ApiPromise.create({provider: wsProvider})

    const derivative_account_public_key = await calculate_multilocation_derivative_account(bifrost_api, u8aToHex(contract_public_key))


    // bind
    await astarXcmAction.bind(test_account_public_key)
    await waitFor(24 * 1000)
    expect(await astarXcmAction.addressToSubstratePublickey("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266")).to.equal(u8aToHex(test_account_public_key))

    const contract_derivative_account = keyring.addFromAddress(derivative_account_public_key).address
    console.log(contract_derivative_account)

    await transfer(bifrost_api,alice,contract_derivative_account,10n * BNC_DECIMALS)
    // await transfer(bifrost_api,alice,TEST_ACCOUNT,1n * BNC_DECIMALS)

    // await addWhitelist(bifrost_api,alice, contract_derivative_account)
    // await waitFor(24 * 1000)

    // const bnc = await ethers.getContractAt("IERC20","0xfFffFffF00000000000000010000000000000007");
    // await bnc.approve(astarXcmAction.address,"1000000000000000000")
    // await waitFor(23 * 1000)

    console.log(await astarXcmAction.buildMintCallBytes("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266","0x0801"))

    await astarXcmAction.mint_vastr({from:"0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266", value: 10n * ASTR_DECIMALS })
    // await waitFor(24 * 1000)

    // console.log(await astarXcmAction.buildMintCallBytes("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266", "0x0801"));


    // console.log(astarXcmAction.address)
    //
    // const token_bytes = await astarXcmAction.tokenNameToBytes("bnc")
    // expect(token_bytes).to.equal("0x0809")
    //

    // const balance:any = await astar_api.query.system.account("aNhuaXEfaSiXJcC1YxssiHgNjCvoJbESD68KjycecaZvqpv")
    // console.log(balance)
    // expect(balance['data']['free']).to.equal("99991663480000000000");

  });

  it("swap vastr to astr", async function() {
    this.timeout(1000 * 1000)
    const astarXcmAction =  await deployAstarXcmAction()
    await waitFor(24 * 1000)
    const contract_account_id = polkadotCryptoUtils.evmToAddress(astarXcmAction.address)
    const keyring = new Keyring({ type: 'sr25519', ss58Format: 6 })
    const contract_public_key = keyring.addFromAddress(contract_account_id).publicKey;
    const alice = keyring.addFromUri('//Alice')

    const test_account_id = polkadotCryptoUtils.evmToAddress("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266")
    const test_account_public_key = keyring.addFromAddress(test_account_id).publicKey;

    const wsProvider = new WsProvider("ws://127.0.0.1:9920")
    const bifrost_api = await ApiPromise.create({provider: wsProvider})

    const wsProvider1 = new WsProvider("ws://127.0.0.1:9910")
    const astar_api = await ApiPromise.create({provider: wsProvider1})

    const derivative_account_public_key = await calculate_multilocation_derivative_account(bifrost_api, u8aToHex(contract_public_key))

    // bind
    await astarXcmAction.bind(test_account_public_key)
    await waitFor(24 * 1000)
    expect(await astarXcmAction.addressToSubstratePublickey("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266")).to.equal(u8aToHex(test_account_public_key))

    const contract_derivative_account = keyring.addFromAddress(derivative_account_public_key).address
    console.log(contract_derivative_account)

    await transfer(bifrost_api,alice,contract_derivative_account,10n * BNC_DECIMALS)
    await transfer(astar_api,alice,contract_account_id,1n * ASTR_DECIMALS)

    await addWhitelist(bifrost_api,alice, contract_derivative_account)
    await waitFor(24 * 1000)

    const vastr = await ethers.getContractAt("IERC20","0xFfFfFfff00000000000000010000000000000008");
    await vastr.approve(astarXcmAction.address,"1000000000000000000000000")
    await waitFor(23 * 1000)

    await astarXcmAction.swap_assets_for_exact_astr("0xFfFfFfff00000000000000010000000000000008","10000000000000000000",0)
  });

  it("swap astr to vastr", async function() {
    this.timeout(1000 * 1000)
    const astarXcmAction =  await deployAstarXcmAction()
    await waitFor(24 * 1000)
    const contract_account_id = polkadotCryptoUtils.evmToAddress(astarXcmAction.address)
    const keyring = new Keyring({ type: 'sr25519', ss58Format: 6 })
    const contract_public_key = keyring.addFromAddress(contract_account_id).publicKey;
    const alice = keyring.addFromUri('//Alice')

    const test_account_id = polkadotCryptoUtils.evmToAddress("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266")
    const test_account_public_key = keyring.addFromAddress(test_account_id).publicKey;

    const wsProvider = new WsProvider("ws://127.0.0.1:9920")
    const bifrost_api = await ApiPromise.create({provider: wsProvider})

    const derivative_account_public_key = await calculate_multilocation_derivative_account(bifrost_api, u8aToHex(contract_public_key))


    // bind
    await astarXcmAction.bind(test_account_public_key)
    await waitFor(24 * 1000)
    expect(await astarXcmAction.addressToSubstratePublickey("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266")).to.equal(u8aToHex(test_account_public_key))

    const contract_derivative_account = keyring.addFromAddress(derivative_account_public_key).address
    console.log(contract_derivative_account)

    await transfer(bifrost_api,alice,contract_derivative_account,10n * BNC_DECIMALS)

    await addWhitelist(bifrost_api,alice, contract_derivative_account)
    await waitFor(24 * 1000)

    await astarXcmAction.swap_astr_for_exact_assets("0xFfFfFfff00000000000000010000000000000008",0,{from:"0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266", value: 10n * ASTR_DECIMALS })
  });
});

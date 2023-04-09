import { expect } from "chai";
import { ethers } from "hardhat";
import "@nomiclabs/hardhat-ethers"
import {ApiPromise, Keyring, WsProvider} from "@polkadot/api";
import {u8aToHex} from "@polkadot/util";
import * as polkadotCryptoUtils from "@polkadot/util-crypto";
import {ASTR_DECIMALS} from "../scripts/constants";
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
          console.log(`✔️  - sudoCall finalized at block hash #${status.asFinalized.toString()}`)
          resolve(status.asFinalized.toString())
        }
      })
    })
  }

  it("Deployment", async function() {
    this.timeout(1000 * 1000)
    const astarXcmAction =  await deployAstarXcmAction()
    await waitFor(24 * 1000)
    const contract_account_id = polkadotCryptoUtils.evmToAddress(astarXcmAction.address)
    const keyring = new Keyring({ type: 'sr25519', ss58Format: 6 })
    const { publicKey } = keyring.addFromAddress(contract_account_id);
    const alice = keyring.addFromUri('//Alice')

    const wsProvider = new WsProvider("ws://127.0.0.1:9920")
    const bifrost_api = await ApiPromise.create({provider: wsProvider})

    const derivative_account_public_key = await calculate_multilocation_derivative_account(bifrost_api, u8aToHex(publicKey))


    await astarXcmAction.set_xcm_action_account_id(derivative_account_public_key)
    await waitFor(36 * 1000)
    expect(await astarXcmAction.xcm_action_account_id()).to.equal(derivative_account_public_key)

    const {address} = keyring.addFromAddress(derivative_account_public_key)
    console.log(address)


    await addWhitelist(bifrost_api,alice, address)
    await waitFor(36 * 1000)

    const bnc = await ethers.getContractAt("IERC20","0xfFffFffF00000000000000010000000000000007");
    await bnc.approve(astarXcmAction.address,"1000000000000000000")
    await waitFor(36 * 1000)

    await astarXcmAction.mint_vastr({ value: 10n * ASTR_DECIMALS })
    // await waitFor(24 * 1000)


    // console.log(astarXcmAction.address)
    //
    // const token_bytes = await astarXcmAction.tokenNameToBytes("bnc")
    // expect(token_bytes).to.equal("0x0809")
    //

    // const balance:any = await astar_api.query.system.account("aNhuaXEfaSiXJcC1YxssiHgNjCvoJbESD68KjycecaZvqpv")
    // console.log(balance)
    // expect(balance['data']['free']).to.equal("99991663480000000000");

  });

  it("Getbalance", async function() {
    // const astarXcmAction =  await deployAstarXcmAction()
    //
    // const owner = await astarXcmAction.owner();
    // expect(owner).to.equal("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266");
    // // BNC address
    // const astar = await ethers.getContractAt("IERC20","0xfFffFffF00000000000000010000000000000007");
    //
    // const balance = await astar.totalSupply();
    // expect(balance).to.equal("1000000000000000");
  });
});

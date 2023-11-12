import { expect } from "chai";
import { ethers } from "hardhat";
import "@nomiclabs/hardhat-ethers";
import { MOVR_DECIMALS, XC_KSM } from "../scripts/constants";
import { waitFor } from "../scripts/utils";

describe("Bifrost Slpx", function () {
  let moonriverSlpx: any;

  it("init", async function () {
    const [deployer] = await ethers.getSigners();
    console.log("Test account address:", deployer.address);
    moonriverSlpx = await ethers.getContractAt(
      "MoonbeamSlpx",
      process.env.MOONRIVER_SLPX_ADDRESS
    );
  });

  // it("setOperationToFeeInfo", async function () {
  //   await moonriverSlpx.setOperationToFeeInfo(0, "10000000000", "10000000000", "80000000000");
  //   await waitFor(24000);
  //
  //   const feeInfo = await moonriverSlpx.operationToFeeInfo("0")
  //   expect(feeInfo["transactRequiredWeightAtMost"]).to.equal("10000000000")
  //   expect(feeInfo["feeAmount"]).to.equal("100000000000")
  //   expect(feeInfo["overallWeight"]).to.equal("10000000000")
  // });
  //

  it("setAssetAddressInfo", async function () {
    await moonriverSlpx.setAssetAddressInfo(
      "0x0000000000000000000000000000000000000802",
      "0x020a",
      "100000000000000000"
    );
    await moonriverSlpx.setAssetAddressInfo(XC_KSM, "0x0204", "1000000000000");
    await waitFor(24000);

    // mint 10 vmovr
    const assetInfo = await moonriverSlpx.addressToAssetInfo(
      "0x0000000000000000000000000000000000000802"
    );
    expect(assetInfo["currencyId"]).to.equal("0x020a");
    expect(assetInfo["operationalMin"]).to.equal("100000000000000000");
  });

  it("mint vmovr", async function () {
    // mint 10 vmovr
    await moonriverSlpx.mintVNativeAsset(
      "0x4597C97a43dFBb4a398E2b16AA9cE61f90d801DD",
      "Hello",
      { value: 10n * MOVR_DECIMALS }
    );
  });

  // it("mint vksm", async function () {
  //   this.timeout(1000 * 1000);
  //   await moonriverSlpx.setAssetAddressInfo(
  //     "0xFfFFfFff1FcaCBd218EDc0EbA20Fc2308C778080",
  //     "100000000000",
  //     "0x0204"
  //   );
  //
  //   const vastr = await ethers.getContractAt(
  //     "IERC20",
  //     "0xFfFFfFff1FcaCBd218EDc0EbA20Fc2308C778080"
  //   );
  //   await vastr.approve(moonriverSlpx.address, "100000000000000000000");
  //   await waitFor(24 * 1000);
  //
  //   // mint 10 vmovr
  //   await moonriverSlpx.mintVAsset(
  //     "0xFfFFfFff1FcaCBd218EDc0EbA20Fc2308C778080",
  //     "10000000000000"
  //   );
  // });

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

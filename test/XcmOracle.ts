import { ethers } from "hardhat";
import "@nomiclabs/hardhat-ethers";

// 0x7369626cd1070000000000000000000000000000

describe("Bifrost Slpx", function () {
  let moonriverSlpx: any;

  it("init", async function () {
    const [deployer] = await ethers.getSigners();
    console.log("Test account address:", deployer.address);
    moonriverSlpx = await ethers.getContractAt(
      "XcmOracle",
      "0xB80CF8889Aa09681741C3e69cA90909443524505"
    );
    // const feeInfo = await moonriverSlpx.getTokenByVToken("0xFFfFFfFFF075423be54811EcB478e911F22dDe7D",0)
    // console.log(feeInfo.toString())
    //
    await moonriverSlpx.getCurrencyIdByAssetAddress("0xFFfFFfFFF075423be54811EcB478e911F22dDe7D")

    await moonriverSlpx.tokenPool("0x0204");

    await moonriverSlpx.getTokenByVToken("0xFFfFFfFFF075423be54811EcB478e911F22dDe7D",0);
  });
});

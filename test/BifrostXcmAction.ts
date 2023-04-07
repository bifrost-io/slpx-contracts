import { expect } from "chai";
import { ethers } from "hardhat";

describe("BifrostXcmAction", function () {
  it("Deployment", async function*() {
    const BifrostXcmAction = await ethers.getContractFactory("BifrostXcmAction");
    const bifrostXcmAction = await BifrostXcmAction.deploy();
    await bifrostXcmAction.deployed();

    console.log(`BifrostXcmAction contract deployed to ${bifrostXcmAction.address}, owner: ${bifrostXcmAction.owner}`);
    expect(true);
  });
});

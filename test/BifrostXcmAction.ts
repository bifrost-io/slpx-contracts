import { expect } from "chai";
import { ethers } from "hardhat";
import "@nomiclabs/hardhat-ethers"

describe("BifrostXcmAction", function () {
  it("Deployment", async function() {
    // const caller = await ethers.getSigner()
    const AstarXcmAction = await ethers.getContractFactory("AstarXcmAction");
    const astarXcmAction = await AstarXcmAction.deploy();

    const owner = await astarXcmAction.owner();
    expect(owner).to.equal("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266");
  });

  it("Getbalance", async function() {
    // BNC address
    const astar = await ethers.getContractAt("IERC20","0xfFffFffF00000000000000010000000000000007");

    const balance = await astar.totalSupply();
    expect(balance).to.equal("1000000000000000");
  });
});

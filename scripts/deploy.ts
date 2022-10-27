import { ethers } from "hardhat";

async function main() {
  const BifrostXcmAction = await ethers.getContractFactory("BifrostXcmAction");
  const bifrostXcmAction = await BifrostXcmAction.deploy();

  await bifrostXcmAction.deployed();

  console.log(`BifrostXcmAction contract deployed to ${bifrostXcmAction.address}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

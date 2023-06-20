import { ethers } from "hardhat";

async function main() {
  const [caller] = await ethers.getSigners();
  console.log(caller);
  const AddressToAccount = await ethers.getContractFactory(
    "AddressToAccount",
    caller
  );
  const addressToAccount = await AddressToAccount.deploy();
  await addressToAccount.deployed();
  console.log("AddressToAccount deployed to:", addressToAccount.address);
  //
  // const BuildCallData = await ethers.getContractFactory("BuildCallData",caller);
  // const buildCallData = await BuildCallData.deploy();
  // await buildCallData.deployed();
  // console.log("BuildCallData deployed to:", buildCallData.address);
  //
  // const AstarXcmAction = await ethers.getContractFactory("AstarXcmAction", {
  //   libraries: {
  //     AddressToAccount: addressToAccount.address,
  //     BuildCallData: buildCallData.address,
  //   }
  // });
  // const astarXcmAction = await AstarXcmAction.deploy();
  // await astarXcmAction.deployed();
  // console.log("AstarXcmAction deployed to:", astarXcmAction.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

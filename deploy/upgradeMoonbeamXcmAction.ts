import { ethers, upgrades } from "hardhat";

async function main() {
  const [caller] = await ethers.getSigners();

  const deployedProxyAddress = "0x7A9Ec1d04904907De0ED7b6839CcdD59c3716AC9";

  const AddressToAccount = await ethers.getContractFactory("AddressToAccount");
  const addressToAccount = await AddressToAccount.deploy();
  await addressToAccount.deployed();
  console.log("AddressToAccount deployed to:", addressToAccount.address);

  const BuildCallData = await ethers.getContractFactory("BuildCallData");
  const buildCallData = await BuildCallData.deploy();
  await buildCallData.deployed();
  console.log("BuildCallData deployed to:", buildCallData.address);

  const MoonbeamXcmAction = await ethers.getContractFactory(
    "MoonbeamXcmAction",
    {
      libraries: {
        AddressToAccount: addressToAccount.address,
        BuildCallData: buildCallData.address,
      },
    }
  );

  await upgrades.upgradeProxy(deployedProxyAddress, MoonbeamXcmAction, {
    unsafeAllow: ["external-library-linking"],
  });
}

main()
  .then()
  .catch((err) => console.log(err))
  .finally(() => process.exit());

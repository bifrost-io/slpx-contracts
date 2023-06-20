import { ethers, upgrades } from "hardhat";
import { waitFor } from "../scripts/utils";

async function main() {
  const AddressToAccount = await ethers.getContractFactory("AddressToAccount");
  const addressToAccount = await AddressToAccount.deploy();
  await addressToAccount.deployed();
  console.log("AddressToAccount deployed to:", addressToAccount.address);

  const BuildCallData = await ethers.getContractFactory("BuildCallData");
  const buildCallData = await BuildCallData.deploy();
  await buildCallData.deployed();
  console.log("BuildCallData deployed to:", buildCallData.address);

  const AstarXcmAction = await ethers.getContractFactory("AstarXcmAction", {
    libraries: {
      AddressToAccount: addressToAccount.address,
      BuildCallData: buildCallData.address,
    },
  });

  const proxyAstarXcmAction = await upgrades.deployProxy(
    AstarXcmAction,
    [100000000000, 10000000000],
    { initializer: "initialize", unsafeAllow: ["external-library-linking"] }
  );
  await proxyAstarXcmAction.deployed();

  console.log(proxyAstarXcmAction.address, " astarXcmAction(proxy) address");
  console.log(
    await upgrades.erc1967.getImplementationAddress(
      proxyAstarXcmAction.address
    ),
    " getImplementationAddress"
  );
  console.log(
    await upgrades.erc1967.getAdminAddress(proxyAstarXcmAction.address),
    " getAdminAddress"
  );

  const astarXcmActionImplementationAddress = await ethers.getContractAt(
    "AstarXcmAction",
    await upgrades.erc1967.getImplementationAddress(proxyAstarXcmAction.address)
  );
  await astarXcmActionImplementationAddress.initialize(
    100000000000,
    10000000000
  );
  await waitFor(24 * 1000);
  console.log("Owner:", await astarXcmActionImplementationAddress.owner());
}

main()
  .then()
  .catch((err) => console.log(err))
  .finally(() => process.exit());

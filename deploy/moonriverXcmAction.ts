import { ethers, upgrades } from "hardhat";
import { waitFor } from "../scripts/utils";

async function main() {
  const [caller] = await ethers.getSigners();

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

  const proxyMoonbeamXcmAction = await upgrades.deployProxy(
    MoonbeamXcmAction,
    ["0xfFFFfFfF006cD1E2a35Acdb1786cAF7893547b75", 2001, "0x020a"],
    { initializer: "initialize", unsafeAllow: ["external-library-linking"] }
  );
  await proxyMoonbeamXcmAction.deployed();

  console.log(
    proxyMoonbeamXcmAction.address,
    " MoonbeamXcmAction(proxy) address"
  );
  console.log(
    await upgrades.erc1967.getImplementationAddress(
      proxyMoonbeamXcmAction.address
    ),
    " getImplementationAddress"
  );
  console.log(
    await upgrades.erc1967.getAdminAddress(proxyMoonbeamXcmAction.address),
    " getAdminAddress"
  );

  const moonbeamXcmActionImplementationAddress = await ethers.getContractAt(
    "MoonbeamXcmAction",
    await upgrades.erc1967.getImplementationAddress(
      proxyMoonbeamXcmAction.address
    )
  );
  await moonbeamXcmActionImplementationAddress.initialize(
    "0xfFFFfFfF006cD1E2a35Acdb1786cAF7893547b75",
    2001,
    "0x020a"
  );
  await waitFor(24 * 1000);
  console.log("Owner:", await moonbeamXcmActionImplementationAddress.owner());
}

main()
  .then()
  .catch((err) => console.log(err))
  .finally(() => process.exit());

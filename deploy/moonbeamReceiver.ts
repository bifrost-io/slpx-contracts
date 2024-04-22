import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const deployFunction: DeployFunction = async function ({
  deployments,
  getNamedAccounts,
  network,
}: HardhatRuntimeEnvironment) {
  console.log("Running MoonbeamReceiver deploy script");

  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  console.log("Deployer is :", deployer);

  await deploy("MoonbeamReceiver", {
    from: deployer,
    log: true,
    deterministicDeployment: false,
    libraries: {
      AddressToAccount: "0x2fD8bbF5dc8b342C09ABF34f211b3488e2d9d691",
      BuildCallData: "0xB80CF8889Aa09681741C3e69cA90909443524505",
    }
  });
};

export default deployFunction;

deployFunction.dependencies = [""];

deployFunction.tags = ["MoonbeamReceiver"];

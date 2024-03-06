import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const deployFunction: DeployFunction = async function ({
  deployments,
  getNamedAccounts,
  network,
}: HardhatRuntimeEnvironment) {
  console.log("Running AstarReceiver deploy script");

  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  console.log("Deployer is :", deployer);

  await deploy("AstarReceiver", {
    from: deployer,
    log: true,
    deterministicDeployment: false,
    libraries: {
      AddressToAccount: "0x8F8F6B104190a4A24CcFf7B4006Ea7A59baeAf81",
      BuildCallData: "0x3311A4609cdD0C7Ce8D2Dfa592BA4aDD23FeC578",
    },
    args: [
        "0x2fD8bbF5dc8b342C09ABF34f211b3488e2d9d691",
        "0xfffFffff00000000000000010000000000000010",
        "257"
    ],
  });
};

export default deployFunction;

deployFunction.dependencies = [""];

deployFunction.tags = ["AstarReceiver"];

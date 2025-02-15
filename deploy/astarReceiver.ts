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
      BuildCallData: "0xC94B9fEEAc60c3dE5CCf4039B0C45AD676110423",
    },
    args: [
        "0x9D40Ca58eF5392a8fB161AB27c7f61de5dfBF0E2",
        "0x8D5c5CB8ec58285B424C93436189fB865e437feF",
    ],
  });
};

export default deployFunction;

deployFunction.dependencies = [""];

deployFunction.tags = ["AstarReceiver"];

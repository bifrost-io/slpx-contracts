import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const deployFunction: DeployFunction = async function ({
  deployments,
  getNamedAccounts,
  network,
}: HardhatRuntimeEnvironment) {
  console.log("Running MantaPacificSlpx deploy script");

  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  console.log("Deployer is :", deployer);

  await deploy("MantaPacificSlpx", {
    from: deployer,
    log: true,
    deterministicDeployment: false
  });
};

export default deployFunction;

deployFunction.dependencies = [""];

deployFunction.tags = ["MantaPacificSlpx"];

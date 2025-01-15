import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const deployFunction: DeployFunction = async function ({
  deployments,
  getNamedAccounts,
  network,
}: HardhatRuntimeEnvironment) {
  console.log("Running vAstrOFT deploy script");

  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  console.log("Deployer is :", deployer);

  await deploy("VoucherAstrOFT", {
    from: deployer,
    log: true,
    deterministicDeployment: false,
    args: ["0xa34F3b68c503e04b1554Bf1C98616De99F1e459D"],
  });
};

export default deployFunction;

deployFunction.dependencies = [""];

deployFunction.tags = ["VoucherAstrOFT"];

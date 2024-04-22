import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const deployFunction: DeployFunction = async function ({
  deployments,
  getNamedAccounts,
  network,
}: HardhatRuntimeEnvironment) {
  console.log("Running VoucherDotOFT deploy script");

  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  console.log("Deployer is :", deployer);

  await deploy("VoucherMantaOFT", {
    from: deployer,
    log: true,
    deterministicDeployment: false,
    args: ["0xb6319cC6c8c27A8F5dAF0dD3DF91EA35C4720dd7"],
  });
};

export default deployFunction;

deployFunction.dependencies = [""];

deployFunction.tags = ["VoucherMantaOFT"];

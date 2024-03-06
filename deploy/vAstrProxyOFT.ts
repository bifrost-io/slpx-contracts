import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const deployFunction: DeployFunction = async function ({
  deployments,
  getNamedAccounts,
  network,
}: HardhatRuntimeEnvironment) {
  console.log("Running VoucherAstrProxyOFT deploy script");

  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  console.log("Deployer is :", deployer);

  await deploy("VoucherAstrProxyOFT", {
    from: deployer,
    log: true,
    deterministicDeployment: false,
    args: [
      "0xfffFffff00000000000000010000000000000010",
      "0xb6319cC6c8c27A8F5dAF0dD3DF91EA35C4720dd7",
    ],
  });
};

export default deployFunction;

deployFunction.dependencies = [""];

deployFunction.tags = ["VoucherAstrProxyOFT"];

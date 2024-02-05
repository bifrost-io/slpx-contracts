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
    args: ["0xfffFffff00000000000000010000000000000010", "0x83c73Da98cf733B03315aFa8758834b36a195b87"]
  });
};

export default deployFunction;

deployFunction.dependencies = [""];

deployFunction.tags = ["VoucherAstrProxyOFT"];

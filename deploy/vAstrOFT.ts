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
      args: ["0x6098e96a28E02f27B1e6BD381f870F1C8Bd169d3"]
    });
};

export default deployFunction;

deployFunction.dependencies = [""];

deployFunction.tags = ["VoucherAstrOFT"];

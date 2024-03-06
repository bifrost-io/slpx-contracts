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

  await deploy("AstarZkSlpx", {
    from: deployer,
    log: true,
    deterministicDeployment: false,
    args: [
      "0xdf41220C7e322bFEF933D85D01821ad277f90172",
      "0x7746ef546d562b443AE4B4145541a3b1a3D75717",
      "210"
    ],
  });
};

export default deployFunction;

deployFunction.dependencies = [""];

deployFunction.tags = ["AstarZkSlpx"];

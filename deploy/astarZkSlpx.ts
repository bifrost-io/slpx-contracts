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
      "0xEaFAF3EDA029A62bCbE8a0C9a4549ef0fEd5a400",
      "0x051713fD66845a13BF23BACa008C5C22C27Ccb58",
      "10210"
    ],
  });
};

export default deployFunction;

deployFunction.dependencies = [""];

deployFunction.tags = ["AstarZkSlpx"];

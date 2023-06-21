import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const deployFunction: DeployFunction = async function ({
  deployments,
  getNamedAccounts,
  network,
}: HardhatRuntimeEnvironment) {
  if (network.name == "astar" || network.name == "astar_local") {
    console.log("Running AstarXcmAction deploy script");

    const { deploy } = deployments;
    const { deployer } = await getNamedAccounts();

    console.log("Deployer is :", deployer);
    const addressToAccount = await deploy("AddressToAccount", {
      from: deployer,
      log: true,
      deterministicDeployment: false,
    });

    const buildCallData = await deploy("BuildCallData", {
      from: deployer,
      log: true,
      deterministicDeployment: false,
    });

    await deploy("AstarXcmAction", {
      from: deployer,
      log: true,
      deterministicDeployment: false,
      libraries: {
        AddressToAccount: addressToAccount.address,
        BuildCallData: buildCallData.address,
      },
      proxy: {
        proxyContract: "OpenZeppelinTransparentProxy",
        execute: {
          init: {
            methodName: "initialize",
            args: [100000000000, 10000000000],
          },
        },
      },
    });
  }
};

export default deployFunction;

deployFunction.dependencies = [""];

deployFunction.tags = ["AstarXcmAction"];

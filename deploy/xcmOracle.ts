import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const deployFunction: DeployFunction = async function ({
  deployments,
  getNamedAccounts,
  network,
}: HardhatRuntimeEnvironment) {
  console.log("Running XcmOracle deploy script");

  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  console.log("Deployer is :", deployer);
  await deploy("XcmOracle", {
    from: deployer,
    log: true,
    deterministicDeployment: false,
    proxy: {
      proxyContract: "OpenZeppelinTransparentProxy",
      execute: {
        init: {
          methodName: "initialize",
          args: [
            // "0x6b0A44c64190279f7034b77c13a566E914FE5Ec4",
            // "0x7369626cd1070000000000000000000000000000",
              "0xF1d4797E51a4640a76769A50b57abE7479ADd3d8",
              "0x7369626CeE070000000000000000000000000000"
          ],
        },
      },
    },
  });
};


// 0x7369626cd1070000000000000000000000000000
// 0x7369626CeE070000000000000000000000000000

export default deployFunction;

deployFunction.dependencies = [""];

deployFunction.tags = ["XcmOracle"];

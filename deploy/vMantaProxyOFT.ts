import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const deployFunction: DeployFunction = async function ({
  deployments,
  getNamedAccounts,
  network,
}: HardhatRuntimeEnvironment) {
  console.log("Running VoucherDotProxyOFT deploy script");

  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  console.log("Deployer is :", deployer);

  await deploy("VoucherMantaProxyOFT", {
    from: deployer,
    log: true,
    deterministicDeployment: false,
    args: [
      "0xFFfFFfFfdA2a05FB50e7ae99275F4341AEd43379",
      "0x9740FF91F1985D8d2B71494aE1A2f723bb3Ed9E4",
    ],
  });
};

export default deployFunction;

deployFunction.dependencies = [""];

deployFunction.tags = ["VoucherMantaProxyOFT"];

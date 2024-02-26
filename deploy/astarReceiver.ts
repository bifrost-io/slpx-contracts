import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const deployFunction: DeployFunction = async function ({
  deployments,
  getNamedAccounts,
  network,
}: HardhatRuntimeEnvironment) {
  console.log("Running AstarReceiver deploy script");

  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  console.log("Deployer is :", deployer);

  await deploy("AstarReceiver", {
    from: deployer,
    log: true,
    deterministicDeployment: false,
    libraries: {
      AddressToAccount: "0x4238Ea4AdFa2bD6a5fC9B5E245dc1900cF0258aa",
      BuildCallData: "0x051713fD66845a13BF23BACa008C5C22C27Ccb58",
    },
    args: [
        "0x4e1A1FdE10494d714D2620aAF7B27B878458459c",
        "0xfffFffff00000000000000010000000000000010",
        "10220"
    ],
  });
};

export default deployFunction;

deployFunction.dependencies = [""];

deployFunction.tags = ["AstarReceiver"];

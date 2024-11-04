import { task } from 'hardhat/config'
import {ethers} from "hardhat";

// yarn hardhat approve --erc20 0x051713fD66845a13BF23BACa008C5C22C27Ccb58 --to 0x4e1A1FdE10494d714D2620aAF7B27B878458459c --network zkatana
// yarn hardhat approve --erc20 0xEaFAF3EDA029A62bCbE8a0C9a4549ef0fEd5a400 --to 0x4e1A1FdE10494d714D2620aAF7B27B878458459c --network zkatana
// manta:
// yarn hardhat approve --erc20 0x95CeF13441Be50d20cA4558CC0a27B601aC544E5 --to 0x95A4D4b345c551A9182289F9dD7A018b7Fd0f940 --network manta

// vmanta:
// yarn hardhat approve --erc20 0x7746ef546d562b443AE4B4145541a3b1a3D75717 --to 0x95A4D4b345c551A9182289F9dD7A018b7Fd0f940 --network manta


task("approve")
    .addParam('erc20', ``)
    .addParam('to', ``)
    .setAction(async (taskArgs, hre) => {
        let signers = await hre.ethers.getSigners()
        let owner = signers[0]

        const IERC20Instance = await hre.ethers.getContractAt("IERC20", taskArgs.erc20, owner)

        const tx = await IERC20Instance.approve(taskArgs.to, hre.ethers.utils.parseEther("10000"));
        console.log(`✅ Message Sent [${hre.network.name}] approve() to : ${tx.hash}`)
    });
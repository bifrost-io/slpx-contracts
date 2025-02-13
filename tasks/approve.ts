import { task } from 'hardhat/config'
import {ethers} from "hardhat";

// yarn hardhat approve --erc20 0x051713fD66845a13BF23BACa008C5C22C27Ccb58 --to 0x4e1A1FdE10494d714D2620aAF7B27B878458459c --network zkatana
// yarn hardhat approve --erc20 0xEaFAF3EDA029A62bCbE8a0C9a4549ef0fEd5a400 --to 0x4e1A1FdE10494d714D2620aAF7B27B878458459c --network zkatana
// manta:
// yarn hardhat approve --erc20 0x95CeF13441Be50d20cA4558CC0a27B601aC544E5 --to 0x95A4D4b345c551A9182289F9dD7A018b7Fd0f940 --network manta

// vmanta:
// yarn hardhat approve --erc20 0x7746ef546d562b443AE4B4145541a3b1a3D75717 --to 0x95A4D4b345c551A9182289F9dD7A018b7Fd0f940 --network manta

// astr
// yarn hardhat approve --erc20 0xfffFffff00000000000000010000000000000010 --to 0x4D43d8268365616aA4573362A7a470de23f9598B --network astar

// soneium vastr
// yarn hardhat approve --erc20 0x60336f9296C79dA4294A19153eC87F8E52158e5F --to 0x9D40Ca58eF5392a8fB161AB27c7f61de5dfBF0E2 --network soneium
// soneium astr
// yarn hardhat approve --erc20 0x2CAE934a1e84F693fbb78CA5ED3B0A6893259441 --to 0x9D40Ca58eF5392a8fB161AB27c7f61de5dfBF0E2 --network soneium


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
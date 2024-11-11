import { task } from 'hardhat/config'
import {ethers} from "hardhat";

// yarn hardhat MoonbeamReceiverSetRemoteContract --contract 0x95A4D4b345c551A9182289F9dD7A018b7Fd0f940 --network moonbeam
// yarn hardhat MoonbeamReceiverSetLayerZeroFee --lzfee 10000000000000000 --network moonbeam
// yarn hardhat MoonbeamReceiverSetScriptTrigger --address 0xcdD077770ceb5271e42289Ee1A9b3a19442F445d --network moonbeam
// yarn hardhat MoonbeamReceiverClaimVManta --address 0xcdD077770ceb5271e42289Ee1A9b3a19442F445d --network moonbeam
// yarn hardhat MoonbeamReceiverClaimManta --address 0xcdD077770ceb5271e42289Ee1A9b3a19442F445d --network moonbeam

const contractName = "MoonbeamReceiver";
const contractAddress = "0x5e2DBf9659b64C135912DB1cb2f5397c611e8002";

task("MoonbeamReceiverSetRemoteContract")
    .addParam('contract', ``)
    .setAction(async (taskArgs, hre) => {
            let signers = await hre.ethers.getSigners()
            let owner = signers[0]

            console.log(taskArgs.contract)

            // get local contract
            const localContractInstance = await hre.ethers.getContractAt(contractName, contractAddress, owner)
            const remoteContract = await localContractInstance.mantaPacificSlpx()
            console.log("remoteContract: ",remoteContract)
            // const tx = await localContractInstance.setRemoteContract(taskArgs.contract)
            // console.log(`✅[${owner.address}]: ${tx.hash}`)
    });

task("MoonbeamReceiverSetLayerZeroFee")
    .addParam('lzfee', ``)
    .setAction(async (taskArgs, hre) => {
        let signers = await hre.ethers.getSigners()
        let owner = signers[0]

        console.log(taskArgs.lzfee)

        // get local contract
        const localContractInstance = await hre.ethers.getContractAt(contractName, contractAddress, owner)
        const layerZeroFee = await localContractInstance.layerZeroFee()
        console.log("layerZeroFee: ", layerZeroFee)
        // const tx = await localContractInstance.setLayerZeroFee(taskArgs.lzfee)
        // console.log(`✅[${owner.address}]: ${tx.hash}`)
    });

task("MoonbeamReceiverSetScriptTrigger")
    .addParam('address', ``)
    .setAction(async (taskArgs, hre) => {
        let signers = await hre.ethers.getSigners()
        let owner = signers[0]

        console.log(taskArgs.address)

        // get local contract
        const localContractInstance = await hre.ethers.getContractAt(contractName, contractAddress, owner)
        const scriptTrigger = await localContractInstance.scriptTrigger()
        console.log("scriptTrigger: ", scriptTrigger)
        // const tx = await localContractInstance.setScriptTrigger(taskArgs.address)
        // console.log(`✅[${owner.address}]: ${tx.hash}`)
    });

task("MoonbeamReceiverClaimVManta")
    .addParam('address', ``)
    .setAction(async (taskArgs, hre) => {
        let signers = await hre.ethers.getSigners()
        let owner = signers[0]

        // get local contract
        const adapterParams = hre.ethers.utils.solidityPack(["uint16", "uint256"], [1, 250000])
        const localContractInstance = await hre.ethers.getContractAt(contractName, contractAddress, owner)

        const derivativeAddress = await localContractInstance.callerToDerivativeAddress(owner.address)
        console.log("adapterParams: ",adapterParams);
        console.log("owner.address: ",owner.address);
        console.log("derivativeAddress: ",derivativeAddress);

        const tx = await localContractInstance.claimVManta(taskArgs.address, adapterParams, { value: "1000000000000000000" })
        console.log(`✅${tx.hash}`)
    });


task("MoonbeamReceiverClaimManta")
    .addParam('address', ``)
    .setAction(async (taskArgs, hre) => {
        let signers = await hre.ethers.getSigners()
        let owner = signers[0]

        // get local contract
        const adapterParams = hre.ethers.utils.solidityPack(["uint16", "uint256"], [1, 250000])
        const localContractInstance = await hre.ethers.getContractAt(contractName, contractAddress, owner)

        const derivativeAddress = await localContractInstance.callerToDerivativeAddress(owner.address)
        console.log("adapterParams: ",adapterParams);
        console.log("owner.address: ",owner.address);
        console.log("derivativeAddress: ",derivativeAddress);

        const tx = await localContractInstance.claimManta(taskArgs.address, adapterParams, { value: "1000000000000000000" })
        console.log(`✅${tx.hash}`)
    });

import { task } from 'hardhat/config'

// yarn hardhat AstarReceiverSetRemoteContract --contract 0x95A4D4b345c551A9182289F9dD7A018b7Fd0f940 --network astar
// yarn hardhat AstarReceiverSetLayerZeroFee --lzfee 20000000000000000 --network astar
// yarn hardhat AstarReceiverSetScriptTrigger --address 0xcdD077770ceb5271e42289Ee1A9b3a19442F445d --network astar
// yarn hardhat AstarReceiverClaimVASTR --address 0xcdD077770ceb5271e42289Ee1A9b3a19442F445d --network astar
// yarn hardhat AstarReceiverClaimASTR --address 0xcdD077770ceb5271e42289Ee1A9b3a19442F445d --network astar
// yarn hardhat estimateFee --network astar

const contractName = "AstarReceiver";
const contractAddress = "0x872bB9Ae4491A8f0DB7a9811B562686f2a4416ac";

task("AstarReceiverSetRemoteContract")
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

task("AstarReceiverSetLayerZeroFee")
    .addParam('lzfee', ``)
    .setAction(async (taskArgs, hre) => {
        let signers = await hre.ethers.getSigners()
        let owner = signers[0]

        console.log(taskArgs.lzfee)

        // get local contract
        const localContractInstance = await hre.ethers.getContractAt(contractName, contractAddress, owner)
        const layerZeroFee = await localContractInstance.vastrLayerZeroFee()
        console.log("layerZeroFee: ", layerZeroFee)
        const tx = await localContractInstance.setLayerZeroFee(taskArgs.lzfee)
        console.log(`✅[${owner.address}]: ${tx.hash}`)
    });

task("AstarReceiverSetScriptTrigger")
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

task("AstarReceiverClaimVASTR")
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

        const tx = await localContractInstance.claimVASTR(taskArgs.address, adapterParams, { value: "1000000000000000000" })
        console.log(`✅${tx.hash}`)
    });


task("AstarReceiverClaimASTR")
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

        const tx = await localContractInstance.claimAstr(taskArgs.address, adapterParams, { value: "1000000000000000000" })
        console.log(`✅${tx.hash}`)
    });

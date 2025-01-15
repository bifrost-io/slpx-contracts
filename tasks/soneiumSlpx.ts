import { task } from 'hardhat/config'
import {ethers} from "hardhat";

// yarn hardhat soneiumSlpxMint --amount 5000000000000000000 --network soneium
// yarn hardhat soneiumSlpxRedeem --amount 5000000000000000000 --network soneium
// yarn hardhat soneiumSetRemoteContract --contract 0x825cddFb8F28f1C09577A20f649E2736886380C4 --network soneium
// yarn hardhat soneiumSetMinAmount --amount 2000000000000000000 --network soneium
// yarn hardhat estimateSendAndCallFee --network soneium

const remoteChainId = 126
const contractName = "SoneiumSlpx";
const contractAddress = "0x9D40Ca58eF5392a8fB161AB27c7f61de5dfBF0E2";
const vAstr = "0x60336f9296C79dA4294A19153eC87F8E52158e5F";
const astr = "0x2CAE934a1e84F693fbb78CA5ED3B0A6893259441";

task("soneiumSetRemoteContract")
    .addParam('contract', ``)
    .setAction(async (taskArgs, hre) => {
            let signers = await hre.ethers.getSigners()
            let owner = signers[0]

            console.log(taskArgs.contract)

            // get local contract
            const localContractInstance = await hre.ethers.getContractAt(contractName, contractAddress, owner)
            const remoteContract = await localContractInstance.remoteContract()
            console.log("remoteContract: ",remoteContract)
            const tx = await localContractInstance.setRemoteContract(taskArgs.contract)
            console.log(`✅[${owner.address}]: ${tx.hash}`)
    });

task("soneiumSetMinAmount")
    .addParam('amount', ``)
    .setAction(async (taskArgs, hre) => {
        let signers = await hre.ethers.getSigners()
        let owner = signers[0]

        console.log(taskArgs.amount)

        // get local contract
        const localContractInstance = await hre.ethers.getContractAt(contractName, contractAddress, owner)
        const minAmount = await localContractInstance.minAmount()
        console.log("minAmount: ",minAmount)
        const tx = await localContractInstance.setMinAmount(BigInt(taskArgs.amount))
        console.log(`✅[${owner.address}]: ${tx.hash}`)
    });

task("soneiumSlpxMint")
    .addParam('amount', ``)
    .setAction(async (taskArgs, hre) => {
        let signers = await hre.ethers.getSigners()
        let owner = signers[0]
        let amount = BigInt(taskArgs.amount)

        // get local contract
        const localContractInstance = await hre.ethers.getContractAt(contractName, contractAddress, owner)
        const dstGasForCall = 4000000
        const adapterParams = hre.ethers.utils.solidityPack(["uint16", "uint256"], [1, 4200000])
        console.log("adapterParams", adapterParams)
        console.log("amount", amount)

        // const toAddressBytes32 = hre.ethers.utils.defaultAbiCoder.encode(['address'], [owner.address])
        // const payload = hre.ethers.utils.defaultAbiCoder.encode(['address', 'uint8'], [owner.address, 0])
        // console.log("toAddressBytes32", toAddressBytes32)
        // console.log("payload", payload)

        const channel_id = 0
        const fee = await localContractInstance.estimateSendAndCallFee(
            owner.address,
            0,
            amount,
            "3000000",
            dstGasForCall,
            adapterParams
        )
        console.log("fee:", hre.ethers.utils.formatUnits(fee[0]))

        // Requires approve of soneium to the contract
        const tx = await localContractInstance.mint(
            amount,
            owner.address,
            channel_id,
            3000000,
            { value: fee[0] }
        )
        console.log(`✅${owner.address}]: ${tx.hash}`)
    });

task("soneiumSlpxRedeem")
    .addParam('amount', ``)
    .setAction(async (taskArgs, hre) => {
        let signers = await hre.ethers.getSigners()
        let owner = signers[0]
        let amount = BigInt(taskArgs.amount)

        // get local contract
        const localContractInstance = await hre.ethers.getContractAt(contractName, contractAddress, owner)
        const dstGasForCall = 4000000
        const adapterParams = hre.ethers.utils.solidityPack(["uint16", "uint256"], [1, 4200000])
        console.log("adapterParams", adapterParams)

        // const toAddressBytes32 = hre.ethers.utils.defaultAbiCoder.encode(['address'], [owner.address])
        // const payload = hre.ethers.utils.defaultAbiCoder.encode(['address', 'uint8'], [owner.address, 0])
        // console.log("toAddressBytes32", toAddressBytes32)
        // console.log("payload", payload)

        const channel_id = 0
        const fee = await localContractInstance.estimateSendAndCallFee(owner.address, 1, amount,"3000000", dstGasForCall, adapterParams)
        console.log("fee:", hre.ethers.utils.formatUnits(fee[0]))
        // Requires approve of vsoneium to the contract
        const tx = await localContractInstance.redeem(
            BigInt(taskArgs.amount),
            dstGasForCall,
            adapterParams,
            {value: fee[0]}
        );
        console.log(`✅${owner.address}]: ${tx.hash}`);
    });

task("estimateSendAndCallFee")
    .setAction(async (taskArgs, hre) => {
        let signers = await hre.ethers.getSigners()
        let owner = signers[0]

        // get local contract
        const localContractInstance = await hre.ethers.getContractAt(contractName, contractAddress, owner)
        const dstGasForCall = 4000000
        const adapterParams = hre.ethers.utils.solidityPack(["uint16", "uint256"], [1, 4200000])
        console.log("adapterParams", adapterParams)

        // const toAddressBytes32 = hre.ethers.utils.defaultAbiCoder.encode(['address'], [owner.address])
        // const payload = hre.ethers.utils.defaultAbiCoder.encode(['address', 'uint8'], [owner.address, 0])
        // console.log("toAddressBytes32", toAddressBytes32)
        // console.log("payload", payload)

        // Requires approve of vsoneium to the contract
        const res = await localContractInstance.estimateSendAndCallFee(
            owner.address,
            0,
            "1000000000000000000",
            "3000000",
            dstGasForCall,
            adapterParams
        );
        console.log(`✅${res.toString()}`);
    });

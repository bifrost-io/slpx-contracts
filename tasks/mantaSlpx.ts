import { task } from 'hardhat/config'
import {ethers} from "hardhat";

// yarn hardhat mantaSlpxMint --amount 1000000000000000000 --network manta
// yarn hardhat mantaSlpxRedeem --amount 2000000000000000000 --network manta
// yarn hardhat mantaSetRemoteContract --contract 0x6a3dd86669e24723Ac0Ef0e30c2dd9AD1a8c2A45 --network manta

const remoteChainId = 126
const contractName = "MantaPacificSlpx";
const contractAddress = "0x174aEfe55aaC3894696984A2d6a029e668219593";

task("mantaSetRemoteContract", "redeem vASTR")
    .addParam('contract', ``)
    .setAction(async (taskArgs, hre) => {
            let signers = await hre.ethers.getSigners()
            let owner = signers[0]

            console.log(taskArgs.contract)

            // get local contract
            const localContractInstance = await hre.ethers.getContractAt(contractName, contractAddress, owner)
            const remoteContract = await localContractInstance.remoteContract()
            console.log("remoteContract: ",remoteContract)
            // const tx = await localContractInstance.setRemoteContract(taskArgs.contract)
            // console.log(`✅ setRemoteContract() to vASTR token:[${owner.address}]: ${tx.hash}`)
    });

task("mantaSlpxMint", "mint vASTR")
    .addParam('amount', ``)
    .setAction(async (taskArgs, hre) => {
        let signers = await hre.ethers.getSigners()
        let owner = signers[0]
        let nonce = await hre.ethers.provider.getTransactionCount(owner.address)
        let qty = BigInt(taskArgs.amount)

        // get local contract
        const OFTWithFee = await hre.ethers.getContractAt("contracts/interfaces/ICommonOFT.sol:ICommonOFT", "0x17313cE6e47D796E61fDeAc34Ab1F58e3e089082", owner)
        const localContractInstance = await hre.ethers.getContractAt(contractName, contractAddress, owner)
        const _dstGasForCall = 3000000
        const adapterParams = hre.ethers.utils.solidityPack(["uint16", "uint256"], [1, 3200000])
        const toAddressBytes32 = hre.ethers.utils.defaultAbiCoder.encode(['address'], [owner.address])
        const payload = hre.ethers.utils.defaultAbiCoder.encode(['address', 'uint8'], [owner.address, 0])

        console.log("adapterParams", adapterParams)
        console.log("toAddressBytes32", toAddressBytes32)
        console.log("payload", payload)

        const fees = await OFTWithFee.estimateSendAndCallFee(remoteChainId, toAddressBytes32, qty, payload, _dstGasForCall, false, adapterParams)
        console.log("fee:", hre.ethers.utils.formatUnits(fees[0]))
        const tx = await localContractInstance.mint(BigInt(taskArgs.amount), _dstGasForCall, adapterParams, { value: fees[0] })
        console.log(`✅ mint() to vASTR token:[${owner.address}]: ${tx.hash}`)
    });

task("mantaSlpxRedeem", "redeem vASTR")
    .addParam('amount', ``)
    .setAction(async (taskArgs, hre) => {
        let signers = await hre.ethers.getSigners()
        let owner = signers[0]
        let nonce = await hre.ethers.provider.getTransactionCount(owner.address)
        let qty = BigInt(taskArgs.amount)

        // get local contract
        const OFTWithFee = await hre.ethers.getContractAt("contracts/interfaces/ICommonOFT.sol:ICommonOFT", "0x7746ef546d562b443AE4B4145541a3b1a3D75717", owner)
        const localContractInstance = await hre.ethers.getContractAt(contractName, contractAddress, owner)
        const _dstGasForCall = 3000000
        const adapterParams = hre.ethers.utils.solidityPack(["uint16", "uint256"], [1, 3200000])

        const toAddressBytes32 = hre.ethers.utils.defaultAbiCoder.encode(['address'], [owner.address])
        const payload = hre.ethers.utils.defaultAbiCoder.encode(['address', 'uint8'], [owner.address, 1])

        console.log("adapterParams", adapterParams)
        console.log("toAddressBytes32", toAddressBytes32)
        console.log("payload", payload)

        const fees = await OFTWithFee.estimateSendAndCallFee(remoteChainId, toAddressBytes32, qty, payload, _dstGasForCall, false, adapterParams)
        console.log("fee:", hre.ethers.utils.formatUnits(fees[0]))
        const tx = await localContractInstance.redeem(BigInt(taskArgs.amount), _dstGasForCall, adapterParams, { value: fees[0] })
        console.log(`✅ redeem() to vASTR token:[${owner.address}]: ${tx.hash}`)
    });

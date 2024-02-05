import { task } from 'hardhat/config'
import {ethers} from "hardhat";

// yarn hardhat zkSlpxMint --amount 100000000000000000 --network zkatana
// yarn hardhat zkSlpxRedeem --amount 100000000000000000 --network zkatana
// yarn hardhat setRemoteContract --contract 0x6F8895a9270f81D0a0838644A57F639eB49f02Ca --network zkatana

const remoteChainId = 10210
const contractName = "AstarZkSlpx";
const contractAddress = "0x4e1A1FdE10494d714D2620aAF7B27B878458459c";

task("setRemoteContract", "redeem vASTR")
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
            console.log(`✅ setRemoteContract() to vASTR token:[${owner.address}]: ${tx.hash}`)
    });

task("zkSlpxMint", "mint vASTR")
    .addParam('amount', ``)
    .setAction(async (taskArgs, hre) => {
        let signers = await hre.ethers.getSigners()
        let owner = signers[0]
        let nonce = await hre.ethers.provider.getTransactionCount(owner.address)
        let qty = BigInt(taskArgs.amount)

        // get local contract
        const OFTWithFee = await hre.ethers.getContractAt("contracts/interfaces/ICommonOFT.sol:ICommonOFT", "0xEaFAF3EDA029A62bCbE8a0C9a4549ef0fEd5a400", owner)
        const localContractInstance = await hre.ethers.getContractAt(contractName, contractAddress, owner)
        const _dstGasForCall = 3000000
        const adapterParams = hre.ethers.utils.solidityPack(["uint16", "uint256"], [1, 3200000])
        console.log("adapterParams", adapterParams)
        const toAddressBytes32 = hre.ethers.utils.defaultAbiCoder.encode(['address'], [owner.address])
        const payload = hre.ethers.utils.defaultAbiCoder.encode(['address', 'uint8'], [owner.address, 0])

        const fees = await OFTWithFee.estimateSendAndCallFee(remoteChainId, toAddressBytes32, qty, payload, _dstGasForCall, false, adapterParams)
        console.log("fee:", hre.ethers.utils.formatUnits(fees[0]))
        const tx = await localContractInstance.mint(BigInt(taskArgs.amount), _dstGasForCall, adapterParams, { value: fees[0] })
        console.log(`✅ mint() to vASTR token:[${owner.address}]: ${tx.hash}`)
    });

task("zkSlpxRedeem", "redeem vASTR")
    .addParam('amount', ``)
    .setAction(async (taskArgs, hre) => {
        let signers = await hre.ethers.getSigners()
        let owner = signers[0]
        let nonce = await hre.ethers.provider.getTransactionCount(owner.address)
        let qty = BigInt(taskArgs.amount)

        // get local contract
        const OFTWithFee = await hre.ethers.getContractAt("contracts/interfaces/ICommonOFT.sol:ICommonOFT", "0xEaFAF3EDA029A62bCbE8a0C9a4549ef0fEd5a400", owner)
        const localContractInstance = await hre.ethers.getContractAt(contractName, contractAddress, owner)
        const _dstGasForCall = 3000000
        const adapterParams = hre.ethers.utils.solidityPack(["uint16", "uint256"], [1, 3200000])
        console.log("adapterParams", adapterParams)
        const toAddressBytes32 = hre.ethers.utils.defaultAbiCoder.encode(['address'], [owner.address])
        const payload = hre.ethers.utils.defaultAbiCoder.encode(['address', 'uint8'], [owner.address, 1])

        const fees = await OFTWithFee.estimateSendAndCallFee(remoteChainId, toAddressBytes32, qty, payload, _dstGasForCall, false, adapterParams)
        console.log("fee:", hre.ethers.utils.formatUnits(fees[0]))
        const tx = await localContractInstance.redeem(BigInt(taskArgs.amount), _dstGasForCall, adapterParams, { value: fees[0] })
        console.log(`✅ redeem() to vASTR token:[${owner.address}]: ${tx.hash}`)
    });

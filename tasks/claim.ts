import { task } from 'hardhat/config'
import {ethers} from "hardhat";

// yarn hardhat balanceVAstr --network shibuya
// yarn hardhat claimVAstr --network shibuya
// yarn hardhat claimAstr --network shibuya

const remoteChainId = 10220
const contractName = "AstarReceiver";
const contractAddress = "0x09B8D18d97B5CDF222136E7D72A5A03c8B23889A";

task("balanceVAstr", "Bridge vASTR")
    .setAction(async (taskArgs, hre) => {
            let signers = await hre.ethers.getSigners()
            let owner = signers[0]

            let contractName = "DerivativeContract";
            let contractAddress = "0xf695b88c536bf029b362e6e73d4dd211003c57a5";

            // get local contract
            const localContractInstance = await hre.ethers.getContractAt(contractName, contractAddress, owner)
            const balance = await localContractInstance.balance();
            console.log("derivativeAddress balance: ",balance.toString());
    });

task("claimVAstr", "Bridge vASTR")
    .setAction(async (taskArgs, hre) => {
        let signers = await hre.ethers.getSigners()
        let owner = signers[0]

        // get local contract
        const adapterParams = hre.ethers.utils.solidityPack(["uint16", "uint256"], [1, 250000])
        const localContractInstance = await hre.ethers.getContractAt(contractName, contractAddress, owner)
        const vAstrContractInstance = await hre.ethers.getContractAt("VoucherAstrProxyOFT", "0xF1d4797E51a4640a76769A50b57abE7479ADd3d8", owner)
        const IERC20Instance = await hre.ethers.getContractAt("IERC20", "0xfffFffff00000000000000010000000000000010", owner)

        // convert to address to bytes32
        const toAddressBytes32 = hre.ethers.utils.defaultAbiCoder.encode(['address'], [owner.address])
        console.log("toAddressBytes32",toAddressBytes32)
        console.log("adapterParams",adapterParams)

        const derivativeAddress = await localContractInstance.callerToDerivativeAddress(owner.address)
        console.log("derivativeAddress: ",derivativeAddress);

        const balance = await IERC20Instance.balanceOf(derivativeAddress);
        console.log("balance: ",hre.ethers.utils.formatUnits(balance))
        console.log("balance: ",balance.toString())
        // quote send function
        const fees = await vAstrContractInstance.estimateSendFee(remoteChainId, toAddressBytes32, balance, false, adapterParams)
        console.log("fee: ",hre.ethers.utils.formatUnits(fees[0]))

        // const tx = await localContractInstance.claimVAstr(owner.address, adapterParams, { value: fees[0] })
        // console.log(`✅ Message Sent [${hre.network.name}] claimVAstr() to : ${tx.hash}`)
    });

task("claimAstr", "Bridge vASTR")
    .setAction(async (taskArgs, hre) => {
        let signers = await hre.ethers.getSigners()
        let owner = signers[0]

        // get local contract
        const adapterParams = hre.ethers.utils.solidityPack(["uint16", "uint256"], [1, 250000])
        const localContractInstance = await hre.ethers.getContractAt(contractName, contractAddress, owner)
        const nativeOFTWithFee = await hre.ethers.getContractAt("contracts/interfaces/ICommonOFT.sol:ICommonOFT", "0xEaFAF3EDA029A62bCbE8a0C9a4549ef0fEd5a400", owner)

        // convert to address to bytes32
        const toAddressBytes32 = hre.ethers.utils.defaultAbiCoder.encode(['address'], [owner.address])

        const derivativeAddress = await localContractInstance.callerToDerivativeAddress(owner.address)
        console.log("owner.address: ",owner.address);
        console.log("derivativeAddress: ",derivativeAddress);

        const balance = await hre.ethers.provider.getBalance(derivativeAddress);
        console.log("balance: ",hre.ethers.utils.formatUnits(balance))
        console.log("balance: ",balance.toString())
        // quote send function
        const fees = await nativeOFTWithFee.estimateSendFee(remoteChainId, toAddressBytes32, balance, false, adapterParams)
        console.log("fee: ",hre.ethers.utils.formatUnits(fees[0]))

        // const minAmount = balance / BigInt(2);

        // const tx = await localContractInstance.claimAstr(owner.address, balance, 1000, adapterParams, { value: fees[0] })
        // console.log(`✅ Message Sent [${hre.network.name}] claimVAstr() to : ${tx.hash}`)
    });

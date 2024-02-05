import { task } from 'hardhat/config'

// yarn hardhat depositAstr --amount 10000000000000000000 --network shibuya
// yarn hardhat withdrawAstr --amount 1000000000000000000 --network shibuya

task("depositAstr", "Bridge vASTR")
    .addParam('amount', ``)
    .setAction(async (taskArgs, hre) => {
        let signers = await hre.ethers.getSigners()
        let owner = signers[0]
        let nonce = await hre.ethers.provider.getTransactionCount(owner.address)
        let toAddress = owner.address;
        let qty = BigInt(taskArgs.amount)

        let contractName = "NativeOFTWithFee";
        let contractAddress = "0xEaFAF3EDA029A62bCbE8a0C9a4549ef0fEd5a400";

        // get local contract
        const localContractInstance = await hre.ethers.getContractAt(contractName, contractAddress, owner)

        const tx = await localContractInstance.deposit({ value: qty, gasLimit: 10000000, nonce: nonce++ })

        console.log(`✅ Message Sent [${hre.network.name}] deposit() to OFT token:[${toAddress}]`)
    });

task("withdrawAstr", "Bridge vASTR")
    .addParam('amount', ``)
    .setAction(async (taskArgs, hre) => {
            let signers = await hre.ethers.getSigners()
            let owner = signers[0]
            let nonce = await hre.ethers.provider.getTransactionCount(owner.address)
            let toAddress = owner.address;
            let qty = BigInt(taskArgs.amount)

            let contractName = "NativeOFTWithFee";
            let contractAddress = "0xEaFAF3EDA029A62bCbE8a0C9a4549ef0fEd5a400";

            // get local contract
            const localContractInstance = await hre.ethers.getContractAt(contractName, contractAddress, owner)

            const tx = await localContractInstance.withdraw(qty, { gasLimit: 10000000, nonce: nonce++ })

            console.log(`✅ Message Sent [${hre.network.name}] deposit() to OFT token:[${toAddress}]`)
    });

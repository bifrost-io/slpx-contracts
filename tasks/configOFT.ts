import { task } from 'hardhat/config'

// bnc yarn hardhat setTrustedRemoteAddress --oft 0xDf2217C883C01b027D71b801Bb484D851BbE92bd --id 257 --address 0xBa6F3053D3E1eaB84a8237A46409DF6C2D569ab9 --network astar
// bnc yarn hardhat setMinDstGas --oft 0xDf2217C883C01b027D71b801Bb484D851BbE92bd --id 257 --type 0  --gas 100000 --network astar
// bnc yarn hardhat setMinDstGas --oft 0xDf2217C883C01b027D71b801Bb484D851BbE92bd --id 257 --type 1  --gas 100000 --network astar

// bnc yarn hardhat setTrustedRemoteAddress --oft 0xBa6F3053D3E1eaB84a8237A46409DF6C2D569ab9 --id 210 --address 0xDf2217C883C01b027D71b801Bb484D851BbE92bd --network astar-zk
// bnc yarn hardhat setMinDstGas --oft 0xBa6F3053D3E1eaB84a8237A46409DF6C2D569ab9 --id 210 --type 0  --gas 100000 --network astar-zk
// bnc yarn hardhat setMinDstGas --oft 0xBa6F3053D3E1eaB84a8237A46409DF6C2D569ab9 --id 210 --type 1  --gas 100000 --network astar-zk


// dot yarn hardhat setTrustedRemoteAddress --oft 0x523c134B054d3cd8fd075bf3672A127E38C0a344 --id 257 --address 0x3239C38d7eD39EA24Bcf30A6CFAF2E38c87a79EB --network astar
// dot yarn hardhat setMinDstGas --oft 0x523c134B054d3cd8fd075bf3672A127E38C0a344 --id 257 --type 0  --gas 100000 --network astar
// dot yarn hardhat setMinDstGas --oft 0x523c134B054d3cd8fd075bf3672A127E38C0a344 --id 257 --type 1  --gas 100000 --network astar

// dot yarn hardhat setTrustedRemoteAddress --oft 0x3239C38d7eD39EA24Bcf30A6CFAF2E38c87a79EB --id 210 --address 0x523c134B054d3cd8fd075bf3672A127E38C0a344 --network astar-zk
// dot yarn hardhat setMinDstGas --oft 0x3239C38d7eD39EA24Bcf30A6CFAF2E38c87a79EB --id 210 --type 0  --gas 100000 --network astar-zk
// dot yarn hardhat setMinDstGas --oft 0x3239C38d7eD39EA24Bcf30A6CFAF2E38c87a79EB --id 210 --type 1  --gas 100000 --network astar-zk

// vmanta yarn hardhat setTrustedRemoteAddress --oft 0xDeBBb9309d95DaBbFb82411a9C6Daa3909B164A4 --id 217 --address 0x7746ef546d562b443AE4B4145541a3b1a3D75717 --network moonbeam
// vmanta yarn hardhat setMinDstGas --oft 0xDeBBb9309d95DaBbFb82411a9C6Daa3909B164A4 --id 217 --type 0  --gas 100000 --network moonbeam
// vmanta yarn hardhat setMinDstGas --oft 0xDeBBb9309d95DaBbFb82411a9C6Daa3909B164A4 --id 217 --type 1  --gas 100000 --network moonbeam

// vmanta yarn hardhat setTrustedRemoteAddress --oft 0x7746ef546d562b443AE4B4145541a3b1a3D75717 --id 126 --address 0xDeBBb9309d95DaBbFb82411a9C6Daa3909B164A4 --network manta
// vmanta yarn hardhat setMinDstGas --oft 0x7746ef546d562b443AE4B4145541a3b1a3D75717 --id 126 --type 0  --gas 100000 --network manta
// vmanta yarn hardhat setMinDstGas --oft 0x7746ef546d562b443AE4B4145541a3b1a3D75717 --id 126 --type 1  --gas 100000 --network manta

// manta yarn hardhat setTrustedRemoteAddress --oft 0x785bFEDb090fd06b916F3E00bAefd58F36C8aB5A --id 217 --address 0x2fD8bbF5dc8b342C09ABF34f211b3488e2d9d691 --network moonbeam
// manta yarn hardhat setMinDstGas --oft 0x785bFEDb090fd06b916F3E00bAefd58F36C8aB5A --id 217 --type 0  --gas 100000 --network moonbeam
// manta yarn hardhat setMinDstGas --oft 0x785bFEDb090fd06b916F3E00bAefd58F36C8aB5A --id 217 --type 1  --gas 100000 --network moonbeam

// manta yarn hardhat setTrustedRemoteAddress --oft 0x2fD8bbF5dc8b342C09ABF34f211b3488e2d9d691 --id 126 --address 0x785bFEDb090fd06b916F3E00bAefd58F36C8aB5A --network manta
// manta yarn hardhat setMinDstGas --oft 0x2fD8bbF5dc8b342C09ABF34f211b3488e2d9d691 --id 126 --type 0  --gas 100000 --network manta
// manta yarn hardhat setMinDstGas --oft 0x2fD8bbF5dc8b342C09ABF34f211b3488e2d9d691 --id 126 --type 1  --gas 100000 --network manta




// yarn hardhat sendxx --amount 1000000000000000000 --target-network shibuya --network zkatana

task("setTrustedRemoteAddress", "Bridge vASTR")
    .addParam('oft', ``)
    .addParam('id', ``)
    .addParam('address', ``)
    .setAction(async (taskArgs, hre) => {
        let signers = await hre.ethers.getSigners()
        let owner = signers[0]
        let nonce = await hre.ethers.provider.getTransactionCount(owner.address)

        const remoteChainId = taskArgs.id
        const remoteAddress = taskArgs.address

        // get local contract
        const localContractInstance = await hre.ethers.getContractAt("OFTV2", taskArgs.oft, owner)

        const tx = await localContractInstance.setTrustedRemoteAddress(
            remoteChainId,
            remoteAddress,
            { gasLimit: 10000000, nonce: nonce++ }
        )

        console.log(`* check your address [${owner.address}] on the destination chain, in the ERC20 transaction tab !"`)
    });

task("setMinDstGas", "Bridge vASTR")
    .addParam('oft', ``)
    .addParam('id', ``)
    .addParam('type', ``)
    .addParam('gas', ``)
    .setAction(async (taskArgs, hre) => {
        let signers = await hre.ethers.getSigners()
        let owner = signers[0]
        let nonce = await hre.ethers.provider.getTransactionCount(owner.address)

        const dstChainId = taskArgs.id
        const packetType = taskArgs.type
        const minGas = taskArgs.gas

        // get local contract
        const localContractInstance = await hre.ethers.getContractAt("OFTV2", taskArgs.oft, owner)

        const tx = await localContractInstance.setMinDstGas(
            dstChainId,
            packetType,
            minGas
        )

        console.log(`* check your address [${tx}] on the destination chain, in the ERC20 transaction tab !"`)
    });


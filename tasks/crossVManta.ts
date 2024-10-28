import { task } from 'hardhat/config'

// yarn hardhat send_vmanta --amount 10000000000000000 --target-network manta --network moonbeam
// yarn hardhat send_vmanta --amount 1000000000000000000 --target-network moonbeam --network manta

const ENDPOINT_ID: { [key: string]: number } = {
    "manta": 217,
    "moonbeam": 126
}

task("send_vmanta", "Bridge vASTR")
    .addParam('amount', ``)
    .addParam('targetNetwork', ``)
    .setAction(async (taskArgs, hre) => {
        let signers = await hre.ethers.getSigners()
        let owner = signers[0]
        let nonce = await hre.ethers.provider.getTransactionCount(owner.address)
        let toAddress = owner.address;
        let qty = BigInt(taskArgs.amount)

        let contractName;
        let contractAddress;

        switch (taskArgs.targetNetwork) {
            case "moonbeam":
                contractName = "VoucherMantaOFT"
                contractAddress = "0x7746ef546d562b443AE4B4145541a3b1a3D75717"
                break;
            case "manta":
                contractName = "VoucherMantaProxyOFT"
                contractAddress = "0xDeBBb9309d95DaBbFb82411a9C6Daa3909B164A4"
                break;
            default:
                contractName = "VoucherMantaProxyOFT"
                contractAddress = "0xDeBBb9309d95DaBbFb82411a9C6Daa3909B164A4"
                break;
        }

        // get remote chain id
        const remoteChainId = ENDPOINT_ID[taskArgs.targetNetwork]

        // get local contract
        const localContractInstance = await hre.ethers.getContractAt(contractName, contractAddress, owner)

        // quote fee with default adapterParams
        let adapterParams = hre.ethers.utils.solidityPack(["uint16", "uint256"], [1, 100000])
        console.log("adapterParams", adapterParams)

        // convert to address to bytes32
        let toAddressBytes32 = hre.ethers.utils.defaultAbiCoder.encode(['address'], [toAddress])

        // quote send function
        let fees = await localContractInstance.estimateSendFee(remoteChainId, toAddressBytes32, qty, false, adapterParams)
        // console.log(`OFT fees[0] (wei): ${fees[0]} / (eth): ${ethers.utils.formatEther(fees[0])}`)

        // const balance = await hre.ethers.provider.getBalance(owner.address)
        // console.log("Balance: " + balance.toString())

        // console.log(owner.address, remoteChainId, toAddressBytes32, qty )
        // console.log(hre.ethers.utils.formatUnits(fees[0].toString()))
        // const tx = await localContractInstance.sendFrom(
        //     owner.address,                                       // 'from' address to send tokens
        //     remoteChainId,                                       // remote LayerZero chainId
        //     toAddressBytes32,                                    // 'to' address to send tokens
        //     qty,                                                 // amount of tokens to send (in wei)
        //     {
        //       refundAddress: owner.address,                    // refund address (if too much message fee is sent, it gets refunded)
        //       zroPaymentAddress: hre.ethers.constants.AddressZero, // address(0x0) if not paying in ZRO (LayerZero Token)
        //       adapterParams: adapterParams                     // flexible bytes array to indicate messaging adapter services
        //     },
        //     { value: fees[0], gasLimit: 10000000, nonce: nonce++ }
        //     )
        //
        // console.log(`✅ Message Sent [${hre.network.name}] sendTokens() to OFT @ LZ chainId[${remoteChainId}] token:[${toAddress}]`)
        // console.log(`* check your address [${owner.address}] on the destination chain, in the ERC20 transaction tab !"`)
    });

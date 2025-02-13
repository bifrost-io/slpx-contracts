import { task } from 'hardhat/config'

// yarn hardhat send-vastr --amount 20000000000000000000 --target-network soneium --network astar
// yarn hardhat send-vastr --amount 1000000000000000000 --target-network astar --network soneium

const ENDPOINT_ID: { [key: string]: number } = {
    "astar": 210,
    "soneium": 340
}

task("send-vastr", "Bridge vASTR")
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
            case "astar":
                contractName = "VoucherAstrOFT"
                contractAddress = "0x60336f9296C79dA4294A19153eC87F8E52158e5F"
                break;
            case "soneium":
                contractName = "VoucherAstrProxyOFT"
                contractAddress = "0xba273b7Fa296614019c71Dcc54DCa6C922A93BcF"
                break;
            default:
                contractName = "VoucherAstrProxyOFT"
                contractAddress = "0xba273b7Fa296614019c71Dcc54DCa6C922A93BcF"
                break;
        }

        // get local contract
        const localContractInstance = await hre.ethers.getContractAt(contractName, contractAddress, owner)

        // get remote chain id
        const remoteChainId = ENDPOINT_ID[taskArgs.targetNetwork]

        // quote fee with default adapterParams
        let adapterParams = hre.ethers.utils.solidityPack(["uint16", "uint256"], [1, 2000000])

        // convert to address to bytes32
        let toAddressBytes32 = hre.ethers.utils.defaultAbiCoder.encode(['address'], [toAddress])

        // quote send function
        let fees = await localContractInstance.estimateSendFee(remoteChainId, toAddressBytes32, qty, false, adapterParams)
        // console.log(`OFT fees[0] (wei): ${fees[0]} / (eth): ${ethers.utils.formatEther(fees[0])}`)

        // await localContractInstance.setPeer(remoteChainId, hre.ethers.utils.zeroPad("0x4D43d8268365616aA4573362A7a470de23f9598B", 32))

        console.log(owner.address, remoteChainId, toAddressBytes32, qty )
        console.log(fees[0].toString())
        const tx = await localContractInstance.sendFrom(
            owner.address,                                       // 'from' address to send tokens
            remoteChainId,                                       // remote LayerZero chainId
            toAddressBytes32,                                    // 'to' address to send tokens
            qty,                                                 // amount of tokens to send (in wei)
            {
              refundAddress: owner.address,                    // refund address (if too much message fee is sent, it gets refunded)
              zroPaymentAddress: hre.ethers.constants.AddressZero, // address(0x0) if not paying in ZRO (LayerZero Token)
              adapterParams: adapterParams                     // flexible bytes array to indicate messaging adapter services
            },
            { value: fees[0], gasLimit: 10000000, nonce: nonce++ }
            )

        console.log(`✅ Message Sent [${hre.network.name}] sendTokens() to OFT @ LZ chainId[${remoteChainId}] token:[${toAddress}]`)
        console.log(`* check your address [${owner.address}] on the destination chain, in the ERC20 transaction tab !"`)
    });

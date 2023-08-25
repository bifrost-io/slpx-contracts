import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@nomiclabs/hardhat-ethers";
import "@openzeppelin/hardhat-upgrades";
import "hardhat-deploy";
import * as dotenv from "dotenv";

dotenv.config();

const config: HardhatUserConfig = {
  solidity: {
    compilers: [
      {
        version: "0.8.10",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
    ],
  },
  namedAccounts: {
    deployer: 0,
  },
  networks: {
    astar: {
      url: "https://evm.astar.network",
      chainId: 592,
      accounts:
        process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
    },
    moonbeam: {
      url: "https://moonbeam.api.onfinality.io/public",
      chainId: 1284,
      accounts:
        process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
    },
    moonriver: {
      url: "https://moonriver.api.onfinality.io/public",
      chainId: 1285,
      accounts:
        process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
    },
    moonbeam_local: {
      url: "https://moonbeam-rpc.devnet.liebi.com",
      chainId: 1280,
      accounts:
        process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
    },
    moonriver_local: {
      url: "https://moonriver-rpc.devnet.liebi.com",
      chainId: 1280,
      accounts:
        process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
    },
    astar_local: {
      url: "http://127.0.0.1:8910",
      chainId: 692,
      accounts:
        process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
    },
    astar_rococo: {
      url: "https://evm.rocstar.astar.network",
      chainId: 692,
      accounts:
        process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
    },
    moonbase_alpha: {
      url: "https://rpc.testnet.moonbeam.network",
      chainId: 1287,
      accounts:
        process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
    },
    hardhat: {
      chainId: 1000,
      forking: {
        enabled: process.env.FORKING === "true",
        url: `http://127.0.0.1:8545`,
      },
    },
  },
};

export default config;

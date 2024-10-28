import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@nomiclabs/hardhat-ethers";
import "@openzeppelin/hardhat-upgrades";
import "hardhat-deploy";
import "hardhat-deploy-ethers";
import * as dotenv from "dotenv";
import "./tasks";

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
    manta: {
      url: "https://pacific-rpc.manta.network/http",
      chainId: 169,
      accounts:
          process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
    },
    astar: {
      url: "https://evm.astar.network",
      chainId: 592,
      accounts:
        process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
    },
    "astar-zk": {
      url: `https://rpc.startale.com/astar-zkevm`,
      chainId: 3776,
      accounts: process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
    },
    shibuya: {
      url: "https://evm.shibuya.astar.network",
      chainId: 81,
      accounts:
        process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
    },
    zkatana: {
      url: "https://rpc.zkatana.gelato.digital",
      chainId: 1261120,
      accounts:
        process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
    },
    moonbeam: {
      url: "https://rpc.api.moonbeam.network",
      chainId: 1284,
      accounts:
        process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
    },
    moonriver: {
      url: "https://moonriver.unitedbloc.com:2000",
      chainId: 1285,
      accounts:
        process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
    },
    moonriver_local: {
      url: "https://moonriver-rpc.devnet.liebi.com/ws",
      chainId: 1280,
      accounts:
        process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
    },
    astar_rococo: {
      url: "https://rocstar.astar.network",
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
  etherscan: {
    apiKey: {
      moonbeam:
        process.env.MOONBEAM_API_KEY !== undefined
          ? process.env.MOONBEAM_API_KEY
          : "",
      moonriver:
        process.env.MOONRIVER_API_KEY !== undefined
          ? process.env.MOONRIVER_API_KEY
          : "",
      astar:
          process.env.ASTAR_API_KEY !== undefined
              ? process.env.ASTAR_API_KEY
              : "",
      moonbaseAlpha: "INSERT_MOONSCAN_API_KEY", // Moonbeam Moonscan API Key
    },
    customChains: [
      {
        network: "astar",
        chainId: 592,
        urls: {
          apiURL: "https://astar.blockscout.com/api",
          browserURL: "https://astar.blockscout.com"
        }
      }
    ]
  },
};

export default config;

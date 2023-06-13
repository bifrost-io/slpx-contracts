import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@nomiclabs/hardhat-ethers";
import * as dotenv from "dotenv"

dotenv.config();

const config: HardhatUserConfig = {
  solidity: {
    compilers: [{
      version: "0.8.16",
      settings: {
        optimizer: {
          enabled: true,
          runs: 200,
        }
      }
    }]
  },
  networks: {
    moonbaseAlpha: {
      url: "https://rpc.api.moonbase.moonbeam.network",
      chainId: 1287,
      accounts: process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
    },
    astar: {
      url: "http://127.0.0.1:8910",
      chainId: 592,
      accounts: process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
    },
    moonbeam: {
      url: "http://127.0.0.1:8910",
      chainId: 1280,
      accounts: process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
    }
  }
};

export default config;

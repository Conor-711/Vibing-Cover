import "@nomicfoundation/hardhat-toolbox";

/** @type import('hardhat/config').HardhatUserConfig */
export default {
  solidity: "0.8.24",
  networks: {
    hardhat: {
      chainId: 1337
    },
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 1337
    },
    baseSepolia: {
      url: "https://sepolia.base.org",
      accounts: [], // 稍后添加private key
      chainId: 84532
    },
    base: {
      url: "https://mainnet.base.org",
      accounts: [], // 稍后添加private key
      chainId: 8453
    }
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  }
};

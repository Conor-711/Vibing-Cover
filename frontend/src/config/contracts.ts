// 合约配置文件
// 部署完成后需要更新这些地址

export const CONTRACT_ADDRESSES = {
  // 本地开发网络 (Hardhat)
  localhost: {
    predictionMarket: '0x5FbDB2315678afecb367f032d93F642f64180aa3' // Hardhat默认地址
  },
  // Base Sepolia 测试网
  baseSepolia: {
    predictionMarket: '0xD875233ca5c9f9B641D8609fb0d7b86714fbD24F' // Remix部署的真实合约
  },
  // Base 主网
  base: {
    predictionMarket: '' // 待部署
  }
};

// 根据链ID获取合约地址
export const getContractAddresses = (chainId: number) => {
  switch (chainId) {
    case 1337: // Hardhat本地网络
      return CONTRACT_ADDRESSES.localhost;
    case 84532: // Base Sepolia
      return CONTRACT_ADDRESSES.baseSepolia;
    case 8453: // Base 主网
      return CONTRACT_ADDRESSES.base;
    default:
      return CONTRACT_ADDRESSES.localhost;
  }
};

// 支持的网络
export const SUPPORTED_NETWORKS = {
  1337: {
    name: 'Hardhat Local',
    rpcUrl: 'http://127.0.0.1:8545',
    blockExplorer: ''
  },
  84532: {
    name: 'Base Sepolia',
    rpcUrl: 'https://sepolia.base.org',
    blockExplorer: 'https://sepolia.basescan.org'
  },
  8453: {
    name: 'Base',
    rpcUrl: 'https://mainnet.base.org',
    blockExplorer: 'https://basescan.org'
  }
};

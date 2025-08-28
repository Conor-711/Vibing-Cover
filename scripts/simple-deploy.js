// 简化的部署脚本，避免Node.js版本兼容问题
const fs = require('fs');

async function main() {
    // 使用require代替动态import来避免ES模块问题
    const { ethers } = await import("hardhat");
    
    console.log("开始部署智能合约...");

    // 获取部署者账户
    const [deployer] = await ethers.getSigners();
    console.log("部署者地址:", deployer.address);

    // 获取部署者余额
    const balance = await ethers.provider.getBalance(deployer.address);
    console.log("部署者余额:", ethers.formatEther(balance), "ETH");

    // 部署 MockUSDC
    console.log("部署 MockUSDC...");
    const MockUSDC = await ethers.getContractFactory("MockUSDC");
    const mockUSDC = await MockUSDC.deploy();
    await mockUSDC.waitForDeployment();
    const mockUSDCAddress = await mockUSDC.getAddress();
    console.log("MockUSDC 部署地址:", mockUSDCAddress);

    // 部署 PredictionMarket
    console.log("部署 PredictionMarket...");
    const PredictionMarket = await ethers.getContractFactory("PredictionMarket");
    const predictionMarket = await PredictionMarket.deploy(mockUSDCAddress);
    await predictionMarket.waitForDeployment();
    const predictionMarketAddress = await predictionMarket.getAddress();
    console.log("PredictionMarket 部署地址:", predictionMarketAddress);

    console.log("\n=== 部署完成 ===");
    console.log("MockUSDC:", mockUSDCAddress);
    console.log("PredictionMarket:", predictionMarketAddress);

    // 保存部署地址到文件
    const deploymentInfo = {
        network: 'localhost',
        chainId: 1337,
        mockUSDC: mockUSDCAddress,
        predictionMarket: predictionMarketAddress,
        timestamp: new Date().toISOString()
    };
    
    fs.writeFileSync('./deployment.json', JSON.stringify(deploymentInfo, null, 2));
    console.log("部署信息已保存到 deployment.json");

    // 更新前端配置文件
    const configPath = './frontend/src/config/contracts.ts';
    const configContent = `// 合约配置文件
// 部署完成后需要更新这些地址

export const CONTRACT_ADDRESSES = {
  // 本地开发网络 (Hardhat)
  localhost: {
    predictionMarket: '${predictionMarketAddress}',
    mockUSDC: '${mockUSDCAddress}'
  },
  // Base Sepolia 测试网
  baseSepolia: {
    predictionMarket: '', // 待部署
    mockUSDC: ''         // 待部署
  },
  // Base 主网
  base: {
    predictionMarket: '', // 待部署
    mockUSDC: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' // Base上的真实USDC地址
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
};`;

    fs.writeFileSync(configPath, configContent);
    console.log("前端配置文件已更新");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("部署失败:", error);
        process.exit(1);
    });

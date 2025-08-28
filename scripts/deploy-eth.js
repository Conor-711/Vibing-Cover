import hre from "hardhat";
import fs from 'fs';

async function main() {
    console.log("开始部署ETH版本的预测市场合约...");

    // 获取部署者账户
    const [deployer] = await hre.ethers.getSigners();
    console.log("部署者地址:", deployer.address);

    // 获取部署者余额
    const balance = await hre.ethers.provider.getBalance(deployer.address);
    console.log("部署者余额:", hre.ethers.formatEther(balance), "ETH");

    // 部署 PredictionMarketETH
    console.log("部署 PredictionMarketETH...");
    const PredictionMarketETH = await hre.ethers.getContractFactory("PredictionMarketETH");
    const predictionMarket = await PredictionMarketETH.deploy();
    await predictionMarket.waitForDeployment();
    const predictionMarketAddress = await predictionMarket.getAddress();
    console.log("PredictionMarketETH 部署地址:", predictionMarketAddress);

    console.log("\n=== 部署完成 ===");
    console.log("网络:", hre.network.name);
    console.log("PredictionMarketETH:", predictionMarketAddress);

    // 保存部署地址到文件
    const deploymentInfo = {
        network: hre.network.name,
        chainId: hre.network.config.chainId || 1337,
        predictionMarket: predictionMarketAddress,
        deployer: deployer.address,
        timestamp: new Date().toISOString(),
        contractType: "ETH"
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
    predictionMarket: '${predictionMarketAddress}'
  },
  // Base Sepolia 测试网
  baseSepolia: {
    predictionMarket: '${predictionMarketAddress}'
  },
  // Base 主网
  base: {
    predictionMarket: ''
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

    // 复制合约ABI到前端
    try {
        const artifactPath = `./artifacts/contracts/PredictionMarketETH.sol/PredictionMarketETH.json`;
        const frontendAbiPath = `./frontend/src/contracts/PredictionMarket.json`;
        
        if (fs.existsSync(artifactPath)) {
            fs.copyFileSync(artifactPath, frontendAbiPath);
            console.log("合约ABI已复制到前端");
        } else {
            console.log("警告：找不到合约ABI文件，请手动复制");
        }
    } catch (error) {
        console.log("复制ABI失败，请手动复制:", error.message);
    }
    
    console.log("\n🎉 ETH版本合约部署完成！");
    console.log("💰 现在使用ETH进行投注，无需USDC！");
    console.log("📝 请确保在MetaMask中连接到正确的网络");
    console.log("🔄 刷新DApp页面查看合约状态");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("部署失败:", error);
        process.exit(1);
    });

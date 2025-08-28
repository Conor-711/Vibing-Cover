import hre from "hardhat";
import fs from 'fs';

async function main() {
    console.log("开始部署智能合约...");

    // 获取合约工厂
    const MockUSDC = await hre.ethers.getContractFactory("MockUSDC");
    const PredictionMarket = await hre.ethers.getContractFactory("PredictionMarket");

    // 部署 MockUSDC
    console.log("部署 MockUSDC...");
    const mockUSDC = await MockUSDC.deploy();
    await mockUSDC.waitForDeployment();
    const mockUSDCAddress = await mockUSDC.getAddress();
    console.log("MockUSDC 部署地址:", mockUSDCAddress);

    // 部署 PredictionMarket
    console.log("部署 PredictionMarket...");
    const predictionMarket = await PredictionMarket.deploy(mockUSDCAddress);
    await predictionMarket.waitForDeployment();
    const predictionMarketAddress = await predictionMarket.getAddress();
    console.log("PredictionMarket 部署地址:", predictionMarketAddress);

    console.log("\n=== 部署完成 ===");
    console.log("MockUSDC:", mockUSDCAddress);
    console.log("PredictionMarket:", predictionMarketAddress);

    // 保存部署地址到文件
    const deploymentInfo = {
        network: hre.network.name,
        chainId: hre.network.config.chainId,
        mockUSDC: mockUSDCAddress,
        predictionMarket: predictionMarketAddress,
        timestamp: new Date().toISOString()
    };
    
    fs.writeFileSync('./deployment.json', JSON.stringify(deploymentInfo, null, 2));
    console.log("部署信息已保存到 deployment.json");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("部署失败:", error);
        process.exit(1);
    });
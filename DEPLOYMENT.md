# 🚀 部署指南

## ETH版本合约部署

由于Node.js版本兼容性问题，提供以下几种部署方案：

### 方案1：使用Base Sepolia测试网（推荐）

1. **配置MetaMask**
   ```
   网络名称: Base Sepolia
   RPC URL: https://sepolia.base.org
   Chain ID: 84532
   货币符号: ETH
   区块浏览器: https://sepolia.basescan.org
   ```

2. **获取测试ETH**
   - 访问 [Base Sepolia水龙头](https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet)
   - 输入你的钱包地址
   - 等待测试ETH到账

3. **使用预配置合约**
   - 合约已预配置在前端代码中
   - 无需手动部署，直接使用

### 方案2：部署到Base Sepolia（高级用户）

如果你有Node.js 22.x或想要部署自己的合约：

1. **准备环境**
   ```bash
   # 安装Node.js 22.x
   nvm install 22.10.0
   nvm use 22.10.0
   
   # 重新安装依赖
   npm install --legacy-peer-deps
   ```

2. **配置私钥**
   ```bash
   # 在项目根目录创建 .env 文件
   echo "PRIVATE_KEY=your_private_key_here" > .env
   ```

3. **更新hardhat.config.js**
   ```javascript
   require('dotenv').config();
   
   // 在networks配置中添加：
   baseSepolia: {
     url: "https://sepolia.base.org",
     accounts: [process.env.PRIVATE_KEY],
     chainId: 84532
   }
   ```

4. **部署合约**
   ```bash
   npx hardhat run scripts/deploy-eth.js --network baseSepolia
   ```

5. **更新前端配置**
   - 复制输出的合约地址
   - 更新 `frontend/src/config/contracts.ts` 中的地址

### 方案3：使用Remix IDE

1. **准备合约代码**
   - 复制 `contracts/PredictionMarketETH.sol` 内容
   - 打开 [Remix IDE](https://remix.ethereum.org/)

2. **编译和部署**
   - 粘贴合约代码
   - 选择编译器版本 0.8.24
   - 连接MetaMask到Base Sepolia
   - 部署合约

3. **更新配置**
   - 复制部署后的合约地址
   - 更新前端配置文件

## 🎯 验证部署

部署成功后：

1. **检查合约状态**
   - 打开DApp
   - 查看合约状态显示为"已部署"

2. **测试基本功能**
   - 连接钱包
   - 创建测试议题
   - 验证ETH余额显示正确

## 📋 预配置的测试合约

为了快速体验，我们已经预配置了测试合约地址：

```
Base Sepolia: 0x5FbDB2315678afecb367f032d93F642f64180aa3
```

**注意**: 这是测试地址，仅用于演示。生产环境请部署自己的合约。

## 🔧 故障排除

### 合约调用失败
- 确保连接到正确的网络
- 检查ETH余额是否足够支付gas费
- 验证合约地址是否正确

### 交易失败
- 检查投注金额是否正确
- 确保有足够的ETH余额
- 尝试增加gas limit

### 网络问题
- 切换MetaMask网络后刷新页面
- 检查RPC连接是否稳定
- 尝试使用不同的RPC端点

# 🎯 预测市场 DApp

一个基于Base链的去中心化预测市场应用，支持用户创建议题、参与对赌、裁定结果和领取奖金。使用ETH作为投注货币，无需额外代币。

## 🚀 快速开始

### 环境要求
- Node.js 22+ (推荐 22.10.0 LTS)
- MetaMask 钱包
- Git

### 📦 安装依赖

```bash
# 克隆项目
git clone <your-repo-url>
cd prediction-market-dapp

# 安装后端依赖
npm install --legacy-peer-deps

# 安装前端依赖
cd frontend
npm install
```

### 🔧 配置网络

#### 本地开发网络 (推荐用于测试)

1. **启动本地网络**
```bash
# 在项目根目录
npx hardhat node --port 8545
```

2. **在MetaMask中添加本地网络**
```
网络名称: Hardhat Local
RPC URL: http://127.0.0.1:8545
Chain ID: 1337
货币符号: ETH
```

3. **导入测试账户**
使用Hardhat提供的测试账户私钥导入到MetaMask

#### Base网络配置

**Base Sepolia 测试网:**
```
网络名称: Base Sepolia
RPC URL: https://sepolia.base.org
Chain ID: 84532
货币符号: ETH
区块浏览器: https://sepolia.basescan.org
```

**Base 主网:**
```
网络名称: Base
RPC URL: https://mainnet.base.org
Chain ID: 8453
货币符号: ETH
区块浏览器: https://basescan.org
```

### 📋 部署合约

**注意: 由于Node.js 23.x版本兼容性问题，建议使用Node.js 22.x**

```bash
# 如果使用Node.js 22.x
npx hardhat run scripts/deploy-local.js --network localhost

# 如果使用Node.js 23.x，可以尝试
npm install --save-dev @types/node
npx hardhat run scripts/deploy-local.js --network localhost
```

### 🖥️ 启动应用

```bash
# 启动前端 (在frontend目录下)
cd frontend
npm start
```

应用将在 http://localhost:3000 启动

## 🎮 使用说明

### 基本流程

1. **连接钱包** - 点击"连接MetaMask"
2. **检查网络** - 确保连接到支持的网络
3. **获取测试ETH** - 从Base Sepolia水龙头获取测试ETH
4. **创建议题** - 输入标题、选项、投注金额(ETH)
5. **参与对赌** - 其他用户可以加入议题
6. **裁定结果** - 创建者裁定获胜选项
7. **领取奖金** - 获胜者领取奖池资金

### 功能特性

- ✅ 多选项预测支持
- ✅ 固定金额投注(ETH)
- ✅ 创建者裁定机制
- ✅ 自动资金分配
- ✅ 实时状态更新
- ✅ 多网络支持

## 🛠️ 开发

### 目录结构

```
prediction-market-dapp/
├── contracts/              # 智能合约
├── scripts/                # 部署脚本
├── test/                   # 合约测试
├── frontend/               # React前端
│   ├── src/
│   │   ├── components/     # UI组件
│   │   ├── contexts/       # React Context
│   │   ├── utils/          # 工具函数
│   │   └── types/          # TypeScript类型
└── README.md
```

### 合约测试

```bash
# 运行合约测试
npx hardhat test
```

### 前端开发

```bash
# 启动开发服务器
cd frontend
npm start

# 构建生产版本
npm run build
```

## 🔧 故障排除

### Node.js版本问题

如果遇到Hardhat兼容性问题：

1. **推荐方案**: 安装Node.js 22.x LTS
```bash
# 使用nvm管理Node版本
nvm install 22.10.0
nvm use 22.10.0
```

2. **临时方案**: 使用配置好的合约地址（已在代码中配置）

### 获取测试ETH

1. 访问 [Base Sepolia Faucet](https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet)
2. 输入你的钱包地址
3. 等待测试ETH到账（通常几分钟内）

### 钱包连接问题

1. 确保MetaMask已安装
2. 检查网络配置
3. 确认合约已部署到当前网络

## 📝 许可证

MIT License

## 🤝 贡献

欢迎提交Issue和Pull Request！

## ⚠️ 免责声明

这是一个演示项目，仅用于学习和测试目的。在生产环境使用前请进行充分的安全审计。

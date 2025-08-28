# Prediction Market DApp 🎯

A decentralized prediction market application built on the Base blockchain, featuring a Polymarket-inspired UI design.

![Prediction Market](https://img.shields.io/badge/Blockchain-Base-blue)
![Smart Contracts](https://img.shields.io/badge/Smart%20Contracts-Solidity-green)
![Frontend](https://img.shields.io/badge/Frontend-React%20TypeScript-blue)
![UI Style](https://img.shields.io/badge/UI%20Style-Polymarket-purple)

## 🌟 Features

### Core Functionality
- **Two-Player Prediction Markets**: Players bet against each other on custom topics
- **ETH-Based Betting**: Direct ETH staking without intermediary tokens
- **Creator Arbitration**: Market creators have sole authority to resolve outcomes
- **Automatic Payouts**: Winners claim rewards through smart contract interactions
- **Real-time Updates**: Live blockchain state synchronization

### Technical Features
- **Base Chain Integration**: Deployed on Base Sepolia testnet and mainnet-ready
- **MetaMask Wallet Support**: Seamless wallet connection and transaction management
- **Responsive Design**: Mobile-first approach with desktop optimization
- **Smart Contract Security**: ReentrancyGuard protection and validated state transitions
- **TypeScript Safety**: Full type coverage for reliable development

### UI/UX Highlights
- **Polymarket-Style Cards**: Authentic market card design with percentage bars
- **Progressive Enhancement**: Graceful fallbacks for network issues
- **State Management**: Intelligent loading states and error handling
- **English Interface**: Fully internationalized for global users

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- MetaMask browser extension
- Base testnet ETH for testing

### Installation
```bash
# Clone the repository
git clone https://github.com/Conor-711/Vibing-Cover.git
cd Vibing-Cover

# Install dependencies
npm install
cd frontend && npm install && cd ..

# Start the frontend
cd frontend && npm start
```

### Deployment
```bash
# Compile contracts
npx hardhat compile

# Deploy to Base Sepolia
npx hardhat run scripts/deploy-eth.js --network base-sepolia

# Update contract address in frontend/src/config/contracts.ts
```

## 📁 Project Structure

```
prediction-market-dapp/
├── contracts/                 # Smart contracts
│   ├── PredictionMarketETH.sol   # Main ETH betting contract
│   ├── PredictionMarket.sol      # USDC version (legacy)
│   └── MockUSDC.sol             # Testing token
├── frontend/                  # React application
│   ├── src/
│   │   ├── components/          # UI components
│   │   ├── contexts/           # React contexts
│   │   ├── types/              # TypeScript definitions
│   │   ├── utils/              # Web3 utilities
│   │   └── config/             # Contract configurations
│   └── public/                 # Static assets
├── scripts/                   # Deployment scripts
└── test/                     # Contract tests
```

## 🎮 How to Use

1. **Connect Wallet**: Click "Connect MetaMask" to link your wallet
2. **Create Market**: Navigate to "Create Market" and set up your prediction
3. **Join Markets**: Browse available markets and place your bets
4. **Resolve Outcomes**: Creators resolve markets when events conclude
5. **Claim Rewards**: Winners manually claim their ETH rewards

## 🛠 Smart Contract Details

### PredictionMarketETH.sol
- **Two-player limit**: Each market supports exactly 2 participants
- **Fixed bet amounts**: Standardized staking for fair competition
- **Creator arbitration**: Built-in governance for outcome decisions
- **ETH native**: No token dependencies, direct ETH transactions
- **Event emission**: Comprehensive logging for frontend synchronization

### Key Functions
- `createTopic()`: Initialize new prediction markets
- `joinTopic()`: Participate in existing markets
- `resolveTopic()`: Declare winning outcomes (creator only)
- `claimReward()`: Withdraw winnings (winner only)

## 🌐 Network Configuration

### Base Sepolia Testnet
- **Chain ID**: 84532
- **RPC URL**: https://sepolia.base.org
- **Faucet**: https://sepolia.base.org (for test ETH)
- **Contract Address**: `0xD875233ca5c9f9B641D8609fb0d7b86714fbD24F`

### Base Mainnet
- **Chain ID**: 8453
- **RPC URL**: https://mainnet.base.org
- **Contract**: Ready for mainnet deployment

## 🎨 UI Design Philosophy

The interface closely mimics [Polymarket](https://polymarket.com)'s design system:
- **Card-based layout**: Clean market cards with essential information
- **Percentage visualization**: Dynamic progress bars and statistics
- **Yes/No buttons**: Intuitive green/red betting interface
- **Professional typography**: Modern font stack and spacing
- **Responsive grid**: Adaptive layouts for all screen sizes

## 🔧 Development

### Local Development
```bash
# Start Hardhat node
npx hardhat node

# Deploy contracts locally
npx hardhat run scripts/deploy-eth.js --network localhost

# Run tests
npx hardhat test
```

### Environment Setup
Create `.env` files with:
```
PRIVATE_KEY=your_private_key_here
BASE_SEPOLIA_RPC=https://sepolia.base.org
```

## 📋 Features Roadmap

- [x] ETH-based betting markets
- [x] Polymarket-style UI design
- [x] Two-player market mechanics
- [x] Creator arbitration system
- [x] Real-time state synchronization
- [ ] Multi-player markets
- [ ] Automated resolution (Chainlink oracles)
- [ ] Market discovery and search
- [ ] Advanced analytics dashboard
- [ ] Mobile app development

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## ⚠️ Disclaimer

This is a demonstration project for educational purposes. Please exercise caution when using real funds on blockchain networks. Always verify smart contract addresses and test thoroughly before mainnet deployment.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Links

- **GitHub Repository**: [https://github.com/Conor-711/Vibing-Cover](https://github.com/Conor-711/Vibing-Cover)
- **Base Network**: [https://base.org](https://base.org)
- **Design Inspiration**: [https://polymarket.com](https://polymarket.com)

---

**Built with ❤️ for the decentralized prediction market ecosystem**
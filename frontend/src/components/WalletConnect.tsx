import React from 'react';
import { useWallet } from '../contexts/WalletContext';

const WalletConnect: React.FC = () => {
  const { walletInfo, isConnecting, connect, disconnect, refreshBalance } = useWallet();

  if (walletInfo) {
    return (
      <div className="wallet-info">
        <div className="wallet-address">
          <strong>钱包地址:</strong> {`${walletInfo.address.slice(0, 6)}...${walletInfo.address.slice(-4)}`}
        </div>
        <div className="wallet-balances">
          <div>ETH余额: {parseFloat(walletInfo.balance).toFixed(4)} ETH</div>
        </div>
        <div className="wallet-actions">
          <button onClick={refreshBalance} className="btn-secondary">刷新余额</button>
          <button onClick={disconnect} className="btn-danger">断开连接</button>
        </div>
      </div>
    );
  }

  return (
    <div className="wallet-connect">
      <button 
        onClick={connect} 
        disabled={isConnecting}
        className="btn-primary"
      >
        {isConnecting ? '连接中...' : '连接MetaMask'}
      </button>
    </div>
  );
};

export default WalletConnect;

import React, { createContext, useContext, useState, useEffect } from 'react';
import { WalletInfo } from '../types/contracts';
import { connectWallet } from '../utils/web3';

interface WalletContextType {
  walletInfo: WalletInfo | null;
  isConnecting: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  refreshBalance: () => Promise<void>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};

interface WalletProviderProps {
  children: React.ReactNode;
}

export const WalletProvider: React.FC<WalletProviderProps> = ({ children }) => {
  const [walletInfo, setWalletInfo] = useState<WalletInfo | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  // 检查是否已连接钱包
  useEffect(() => {
    const checkConnection = async () => {
      if (typeof window !== 'undefined' && window.ethereum) {
        try {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          if (accounts.length > 0) {
            await connect();
          }
        } catch (error) {
          console.error('Failed to check wallet connection:', error);
        }
      }
    };

    checkConnection();
  }, []);

  const connect = async () => {
    setIsConnecting(true);
    try {
      const info = await connectWallet();
      setWalletInfo(info);
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      throw error;
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnect = () => {
    setWalletInfo(null);
  };

  const refreshBalance = async () => {
    if (walletInfo) {
      try {
        const info = await connectWallet();
        setWalletInfo(info);
      } catch (error) {
        console.error('Failed to refresh balance:', error);
      }
    }
  };

  return (
    <WalletContext.Provider
      value={{
        walletInfo,
        isConnecting,
        connect,
        disconnect,
        refreshBalance
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

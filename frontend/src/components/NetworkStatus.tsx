import React, { useState, useEffect } from 'react';
import { getProvider } from '../utils/web3';
import { SUPPORTED_NETWORKS } from '../config/contracts';

const NetworkStatus: React.FC = () => {
  const [networkInfo, setNetworkInfo] = useState<{
    chainId: number;
    name: string;
    supported: boolean;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  const checkNetwork = async () => {
    try {
      setLoading(true);
      const provider = getProvider();
      const network = await provider.getNetwork();
      const chainId = Number(network.chainId);
      
      const supportedNetwork = SUPPORTED_NETWORKS[chainId as keyof typeof SUPPORTED_NETWORKS];
      
      setNetworkInfo({
        chainId,
        name: supportedNetwork?.name || `Unknown Network (${chainId})`,
        supported: !!supportedNetwork
      });
    } catch (error) {
      console.error('Failed to get network info:', error);
      setNetworkInfo(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkNetwork();
    
    // Listen for network switches
    if (window.ethereum) {
      const handleChainChanged = () => {
        checkNetwork();
      };
      
      window.ethereum.on('chainChanged', handleChainChanged);
      
      return () => {
        if (window.ethereum) {
          window.ethereum.removeListener('chainChanged', handleChainChanged);
        }
      };
    }
  }, []);

  if (loading) {
    return (
      <div className="network-status loading">
        <p>Checking network...</p>
      </div>
    );
  }

  if (!networkInfo) {
    return (
      <div className="network-status error">
        <p>⚠️ Unable to get network information</p>
      </div>
    );
  }

  return (
    <div className={`network-status ${networkInfo.supported ? 'supported' : 'unsupported'}`}>
      <div className="network-info">
        <span className="network-indicator">
          {networkInfo.supported ? '🟢' : '🔴'}
        </span>
        <div className="network-details">
          <span className="network-name">{networkInfo.name}</span>
          <span className="chain-id">Chain ID: {networkInfo.chainId}</span>
        </div>
        <button onClick={checkNetwork} className="btn-refresh">🔄</button>
      </div>
      
      {!networkInfo.supported && (
        <div className="network-warning">
          <p>⚠️ Current network is not supported</p>
          <div className="supported-networks">
            <p>Supported networks:</p>
            <ul>
              <li>Hardhat Local (1337)</li>
              <li>Base Sepolia (84532)</li>  
              <li>Base Mainnet (8453)</li>
            </ul>
          </div>
        </div>
      )}

      {networkInfo.chainId === 1337 && (
        <div className="development-notice">
          <p>🏠 Using local development network</p>
          <small>For development and testing purposes. Switch to Base network for production.</small>
        </div>
      )}

      {(networkInfo.chainId === 84532 || networkInfo.chainId === 8453) && (
        <div className="base-network-notice">
          <p>🚀 Connected to Base network</p>
          <small>
            {networkInfo.chainId === 84532 ? 
              'This is Base testnet, suitable for testing features.' : 
              'This is Base mainnet, please be careful with real funds.'
            }
          </small>
        </div>
      )}
    </div>
  );
};

export default NetworkStatus;

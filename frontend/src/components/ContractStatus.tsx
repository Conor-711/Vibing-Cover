import React, { useState, useEffect } from 'react';
import { checkContractsDeployed } from '../utils/web3';

const ContractStatus: React.FC = () => {
  const [contractStatus, setContractStatus] = useState<{
    predictionMarket: boolean;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  const checkStatus = async () => {
    try {
      setLoading(true);
      const status = await checkContractsDeployed();
      setContractStatus(status);
    } catch (error) {
      console.error('Failed to check contract status:', error);
      setContractStatus({ predictionMarket: false });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkStatus();
  }, []);

  if (loading) {
    return (
      <div className="contract-status loading">
        <p>Checking contract status...</p>
      </div>
    );
  }

  const allDeployed = contractStatus?.predictionMarket;

  return (
    <div className={`contract-status ${allDeployed ? 'deployed' : 'not-deployed'}`}>
      <div className="status-header">
        <h3>📋 Contract Status</h3>
        <button onClick={checkStatus} className="btn-secondary">Refresh</button>
      </div>
      
      <div className="status-items">
        <div className="status-item">
          <span className="contract-name">PredictionMarket (ETH):</span>
          <span className={`status-indicator ${contractStatus?.predictionMarket ? 'deployed' : 'not-deployed'}`}>
            {contractStatus?.predictionMarket ? '✅ Deployed' : '❌ Not Deployed'}
          </span>
        </div>
      </div>

      {!allDeployed && (
        <div className="deployment-instructions">
          <h4>🚀 Deployment Instructions</h4>
          <p>Please follow these steps to deploy the contract:</p>
          <ol>
            <li>Make sure MetaMask is connected to Base Sepolia network</li>
            <li>Use Remix IDE to deploy the contract</li>
            <li>Copy the deployed contract address</li>
            <li>Update the contract address in the configuration file</li>
          </ol>
        </div>
      )}

      {allDeployed && (
        <div className="ready-message">
          <p>🎉 All contracts deployed successfully. DApp is ready to use!</p>
        </div>
      )}
    </div>
  );
};

export default ContractStatus;

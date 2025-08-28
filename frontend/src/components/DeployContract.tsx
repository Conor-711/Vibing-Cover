import React, { useState } from 'react';

const DeployContract: React.FC = () => {
  const [showInstructions, setShowInstructions] = useState(false);

  return (
    <div className="deploy-contract">
      <div className="deploy-header">
        <h3>🚨 Contract Deployment Issue</h3>
      </div>
      
      <div className="deploy-content">
        <p>The currently configured contract address <code>0x5FbDB2315678afecb367f032d93F642f64180aa3</code> does not have an ETH version contract deployed on Base Sepolia.</p>
        
        <div className="problem-explanation">
          <h4>❌ Problem Causes:</h4>
          <ul>
            <li>Market creation appears successful because the transaction was sent, but no actual execution occurred due to non-existent contract</li>
            <li>Market query fails because there's no code at the contract address</li>
            <li>The configured address is a Hardhat default address that doesn't exist on Base Sepolia</li>
          </ul>
        </div>

        <div className="solutions">
          <h4>✅ Solutions:</h4>
          
          <div className="solution-option">
            <h5>Option 1: Deploy using Remix IDE (Recommended)</h5>
            <ol>
              <li>Open <a href="https://remix.ethereum.org/" target="_blank" rel="noopener noreferrer">Remix IDE</a></li>
              <li>Create new file <code>PredictionMarketETH.sol</code></li>
              <li>Copy contract code (from project's <code>contracts/PredictionMarketETH.sol</code>)</li>
              <li>Select compiler version 0.8.24</li>
              <li>Compile contract</li>
              <li>Connect MetaMask to Base Sepolia</li>
              <li>Deploy contract</li>
              <li>Copy deployed contract address</li>
              <li>Update address in configuration file</li>
            </ol>
          </div>

          <div className="solution-option">
            <h5>Option 2: Use test contract address</h5>
            <p>A test contract has been deployed on Base Sepolia:</p>
            <code className="test-address">0xYourTestContractAddress</code>
            <p><small>(Note: This is just an example, actual deployment needed)</small></p>
          </div>

          <div className="solution-option">
            <h5>Option 3: Switch to local development network</h5>
            <ol>
              <li>Start local Hardhat network</li>
              <li>Deploy contract to local network</li>
              <li>Add local network in MetaMask</li>
              <li>Use local network for testing</li>
            </ol>
          </div>
        </div>

        <button 
          onClick={() => setShowInstructions(!showInstructions)}
          className="btn-secondary"
        >
          {showInstructions ? 'Hide' : 'Show'} detailed steps
        </button>

        {showInstructions && (
          <div className="detailed-instructions">
            <h4>📋 Detailed deployment steps (Remix method):</h4>
            <div className="step">
              <strong>Step 1: Prepare contract code</strong>
              <p>Copy the following code to a new file in Remix:</p>
              <pre><code>{`// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract PredictionMarketETH is ReentrancyGuard {
    // ... 完整的合约代码在 contracts/PredictionMarketETH.sol 中
}`}</code></pre>
            </div>
            
            <div className="step">
              <strong>Step 2: Compile and deploy</strong>
              <ul>
                <li>Select Solidity compiler in Remix</li>
                <li>Choose version 0.8.24</li>
                <li>Compile contract</li>
                <li>Switch to Deploy & Run panel</li>
                <li>Select Environment as "Injected Provider"</li>
                <li>Make sure MetaMask is connected to Base Sepolia</li>
                <li>Deploy contract</li>
              </ul>
            </div>

            <div className="step">
              <strong>Step 3: Update configuration</strong>
              <ul>
                <li>Copy the deployed contract address</li>
                <li>Open <code>frontend/src/config/contracts.ts</code></li>
                <li>Replace Base Sepolia address with the new address</li>
                <li>Save file and refresh page</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DeployContract;

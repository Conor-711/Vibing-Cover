import React, { useState } from 'react';
import { WalletProvider } from './contexts/WalletContext';
import WalletConnect from './components/WalletConnect';
import NetworkStatus from './components/NetworkStatus';
import ContractStatus from './components/ContractStatus';
import DeployContract from './components/DeployContract';
import TopicList from './components/TopicList';
import CreateTopic from './components/CreateTopic';
import TopicDetail from './components/TopicDetail';
import { Topic } from './types/contracts';
import './App.css';

function App() {
  const [currentView, setCurrentView] = useState<'list' | 'create' | 'deploy'>('list');
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);

  const handleTopicSelect = (topic: Topic) => {
    setSelectedTopic(topic);
  };

  const handleCloseDetail = () => {
    setSelectedTopic(null);
  };

  const handleCreateSuccess = () => {
    setCurrentView('list');
  };

  const handleDetailSuccess = () => {
    setSelectedTopic(null);
    // List refresh will be handled in TopicList component
  };

  return (
    <WalletProvider>
      <div className="App">
        <header className="app-header">
          <div className="header-content">
            <div className="header-left">
              <div className="logo">
                <span className="logo-icon">📊</span>
                <span className="logo-text">PredictMarket</span>
              </div>
            </div>
            <div className="header-right">
              <NetworkStatus />
              <WalletConnect />
            </div>
          </div>
        </header>

        <main className="app-main">
          <nav className="app-nav">
            <button
              onClick={() => setCurrentView('list')}
              className={`nav-btn ${currentView === 'list' ? 'active' : ''}`}
            >
              All Markets
            </button>
            <button
              onClick={() => setCurrentView('create')}
              className={`nav-btn ${currentView === 'create' ? 'active' : ''}`}
            >
              Create Market
            </button>
            <button
              onClick={() => setCurrentView('deploy')}
              className={`nav-btn ${currentView === 'deploy' ? 'active' : ''}`}
            >
              Deploy Contract
            </button>
          </nav>

          <div className="app-content">
            <ContractStatus />
            {currentView === 'deploy' && <DeployContract />}
            {currentView === 'list' && (
              <TopicList onTopicSelect={handleTopicSelect} />
            )}
            {currentView === 'create' && (
              <CreateTopic 
                onSuccess={handleCreateSuccess}
                onCancel={() => setCurrentView('list')}
              />
            )}
          </div>
        </main>

        {selectedTopic && (
          <TopicDetail 
            topic={selectedTopic}
            onClose={handleCloseDetail}
            onSuccess={handleDetailSuccess}
          />
        )}

        <footer className="app-footer">
          <p>⚠️ This is a test version for demonstration purposes only</p>
        </footer>
      </div>
    </WalletProvider>
  );
}

export default App;
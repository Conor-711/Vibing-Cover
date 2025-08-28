import React, { useEffect, useState } from 'react';
import { Topic, TopicStatus } from '../types/contracts';
import { getAllTopics } from '../utils/web3';
import { useWallet } from '../contexts/WalletContext';

interface TopicListProps {
  onTopicSelect: (topic: Topic) => void;
}

const TopicList: React.FC<TopicListProps> = ({ onTopicSelect }) => {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const { walletInfo } = useWallet();

  const loadTopics = async (forceRefresh = false) => {
    try {
      setLoading(true);
      setError('');
      console.log(`TopicList: Loading topics${forceRefresh ? ' [force refresh]' : ''}...`);
      
      const allTopics = await getAllTopics(2, forceRefresh);
      setTopics(allTopics);
      console.log('TopicList: Topics loaded, count:', allTopics.length);
      
      // Print key topic info for debugging
      allTopics.forEach(topic => {
        console.log(`Topic "${topic.title}": status=${topic.status}, players=${topic.players.length}, pool=${topic.totalPool}`);
      });
    } catch (error) {
      console.error('TopicList: Failed to load topics:', error);
      setError('Failed to load markets. Please check network connection and contract deployment status.');
    } finally {
      setLoading(false);
    }
  };

  // Delayed loading on page load
  useEffect(() => {
    const timer = setTimeout(() => {
      loadTopics();
    }, 1000); // Delay 1 second to wait for network state to stabilize
    
    return () => clearTimeout(timer);
  }, []);

  // Reload when wallet connection state changes
  useEffect(() => {
    if (walletInfo) {
      console.log('TopicList: Wallet state changed, reloading topics');
      loadTopics(true); // Force refresh when wallet changes
    }
  }, [walletInfo]);

  // Listen for blockchain state change events
  useEffect(() => {
    const handleTopicStateChanged = (event: any) => {
      const { action, topicId, blockNumber } = event.detail;
      console.log(`TopicList: Received state change event - ${action}, topicID: ${topicId}, block: ${blockNumber}`);
      
      // Delayed force refresh to ensure blockchain state is fully synchronized
      setTimeout(() => {
        console.log('TopicList: Executing state sync refresh');
        loadTopics(true);
      }, 2000);
    };

    window.addEventListener('topicStateChanged', handleTopicStateChanged);
    return () => window.removeEventListener('topicStateChanged', handleTopicStateChanged);
  }, []);

  const getStatusText = (status: TopicStatus) => {
    switch (status) {
      case TopicStatus.WAITING_FOR_SECOND_PLAYER:
        return 'Open';
      case TopicStatus.ACTIVE:
        return 'Active';
      case TopicStatus.RESOLVED:
        return 'Resolved';
      case TopicStatus.CLAIMED:
        return 'Claimed';
      default:
        return 'Unknown';
    }
  };

  const getStatusClass = (status: TopicStatus) => {
    switch (status) {
      case TopicStatus.WAITING_FOR_SECOND_PLAYER:
        return 'status-waiting';
      case TopicStatus.ACTIVE:
        return 'status-active';
      case TopicStatus.RESOLVED:
        return 'status-resolved';
      case TopicStatus.CLAIMED:
        return 'status-claimed';
      default:
        return '';
    }
  };

  const canJoin = (topic: Topic) => {
    return walletInfo && 
           topic.status === TopicStatus.WAITING_FOR_SECOND_PLAYER && 
           topic.creator.toLowerCase() !== walletInfo.address.toLowerCase();
  };

  const canResolve = (topic: Topic) => {
    return walletInfo && 
           topic.status === TopicStatus.ACTIVE && 
           topic.creator.toLowerCase() === walletInfo.address.toLowerCase();
  };

  const canClaim = (topic: Topic) => {
    return walletInfo && 
           topic.status === TopicStatus.RESOLVED && 
           topic.winner.toLowerCase() === walletInfo.address.toLowerCase();
  };

  if (loading) {
    return (
      <div className="topic-list">
        <div className="topic-list-header">
          <h2>All Markets</h2>
        </div>
        <div className="loading">Loading markets...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="topic-list">
        <div className="topic-list-header">
          <h2>All Markets</h2>
        </div>
        <div className="error-message">
          <p>❌ {error}</p>
          <button onClick={() => loadTopics()} className="btn-secondary">
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (topics.length === 0) {
    return <div className="no-topics">No markets yet. Create your first one!</div>;
  }

  return (
    <div className="topic-list">
      <div className="topic-list-header">
        <h2>All Markets</h2>
        <div className="header-actions">
          <button onClick={() => loadTopics(false)} className="btn-secondary">Refresh</button>
          <button onClick={() => loadTopics(true)} className="btn-primary" title="Force refresh from blockchain">
            Force Sync
          </button>
        </div>
      </div>
      
      <div className="markets-grid">
        {topics.map((topic) => {
          // Calculate percentages for each option
          const option1Players = topic.players.filter((_, playerIndex) => 
            topic.playerChoices[playerIndex] === 0
          ).length;
          const option2Players = topic.players.filter((_, playerIndex) => 
            topic.playerChoices[playerIndex] === 1
          ).length;
          
          const totalPlayers = topic.players.filter(p => p !== "").length;
          const option1Percentage = totalPlayers > 0 ? Math.round((option1Players / totalPlayers) * 100) : 50;
          const option2Percentage = totalPlayers > 0 ? (100 - option1Percentage) : 50;
          
          return (
            <div key={topic.id} className="polymarket-card" onClick={() => onTopicSelect(topic)}>
              <div className="card-header">
                <div className="market-icon">
                  <div className="icon-placeholder">
                    {topic.title.charAt(0).toUpperCase()}
                  </div>
                </div>
                <div className="market-info">
                  <h3 className="market-title">{topic.title}</h3>
                  <div className="market-volume">${Math.round(parseFloat(topic.totalPool) * 2500)} Vol.</div>
                </div>
                <div className="market-chance">
                  <div className="chance-number">{option1Percentage}%</div>
                  <div className="chance-label">chance</div>
                </div>
              </div>

              <div className="outcomes-section">
                {/* Main outcome row */}
                <div className="outcome-row">
                  <div className="outcome-info">
                    <span className="outcome-label">{topic.options[0] || 'Yes'}</span>
                    <span className="outcome-percentage">{option1Percentage}%</span>
                  </div>
                  <div className="outcome-buttons">
                    <button 
                      className="outcome-btn yes-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        onTopicSelect(topic);
                      }}
                    >
                      <span className="btn-label">Yes</span>
                      <span className="btn-price">{Math.round(parseFloat(topic.betAmount) * 100)}¢</span>
                    </button>
                    <button 
                      className="outcome-btn no-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        onTopicSelect(topic);
                      }}
                    >
                      <span className="btn-label">No</span>
                      <span className="btn-price">{Math.round((1 - parseFloat(topic.betAmount)) * 100)}¢</span>
                    </button>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="progress-container">
                  <div 
                    className="progress-bar"
                    style={{ width: `${option1Percentage}%` }}
                  ></div>
                </div>

                {/* Second option if different from Yes/No */}
                {topic.options[1] && topic.options[1].toLowerCase() !== 'no' && (
                  <div className="outcome-row secondary">
                    <div className="outcome-info">
                      <span className="outcome-label">{topic.options[1]}</span>
                      <span className="outcome-percentage">{option2Percentage}%</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="card-footer">
                <div className="participants">
                  {topic.players.filter(p => p !== "").map((player, index) => (
                    <div key={index} className="participant-indicator">
                      {player.slice(0, 6)}...
                    </div>
                  ))}
                  {topic.players.filter(p => p !== "").length === 0 && (
                    <div className="no-participants">Waiting for participants</div>
                  )}
                </div>
                <div className="market-status">
                  <span className={`status-badge ${getStatusClass(topic.status)}`}>
                    {getStatusText(topic.status)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TopicList;
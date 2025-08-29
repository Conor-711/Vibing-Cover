import React, { useState, useEffect } from 'react';
import { CompositeTopic, OptionBetInfo, Topic, TopicStatus } from '../types/contracts';
import { 
  getCompositeTopic, 
  getCompositeOptionBetInfo, 
  betOnCompositeOption, 
  resolveCompositeTopic, 
  claimCompositeReward,
  getAllTopics
} from '../utils/web3';
import '../styles/CompositeTopicDetail.css';

interface CompositeTopicDetailProps {
  topicId: number;
  walletInfo: any;
  onClose: () => void;
}

const CompositeTopicDetail: React.FC<CompositeTopicDetailProps> = ({ 
  topicId, 
  walletInfo, 
  onClose 
}) => {
  const [compositeTopic, setCompositeTopic] = useState<CompositeTopic | null>(null);
  const [optionBetInfos, setOptionBetInfos] = useState<OptionBetInfo[]>([]);
  const [referencedTopics, setReferencedTopics] = useState<Topic[]>([]);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [betAmount, setBetAmount] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadCompositeTopicDetails();
  }, [topicId]);

  const loadCompositeTopicDetails = async () => {
    try {
      setLoading(true);
      setError('');

      // 获取组合议题详情
      const topic = await getCompositeTopic(topicId);
      if (!topic) {
        setError('Composite topic not found');
        return;
      }
      setCompositeTopic(topic);

      // 获取选项投注信息
      const betInfos = await getCompositeOptionBetInfo(topicId);
      setOptionBetInfos(betInfos);

      // 获取引用的议题详情
      const allTopics = await getAllTopics();
      const referenced = topic.referencedTopicIds.map(id => 
        allTopics.find(t => t.id === id)
      ).filter(Boolean) as Topic[];
      setReferencedTopics(referenced);

    } catch (error: any) {
      console.error('Failed to load composite topic details:', error);
      setError(error.message || 'Failed to load topic details');
    } finally {
      setLoading(false);
    }
  };

  const handleBet = async () => {
    if (!walletInfo) {
      setError('Please connect your wallet first');
      return;
    }

    if (selectedOption === null) {
      setError('Please select an option to bet on');
      return;
    }

    if (!betAmount || parseFloat(betAmount) <= 0) {
      setError('Please enter a valid bet amount');
      return;
    }

    if (parseFloat(betAmount) < parseFloat(compositeTopic?.minBetAmount || '0')) {
      setError(`Minimum bet amount is ${compositeTopic?.minBetAmount} ETH`);
      return;
    }

    try {
      setActionLoading(true);
      setError('');

      await betOnCompositeOption(topicId, selectedOption, betAmount);
      
      alert('Bet placed successfully!');
      
      // 重新加载数据
      await loadCompositeTopicDetails();
      setSelectedOption(null);
      setBetAmount('');
    } catch (error: any) {
      console.error('Failed to place bet:', error);
      setError(error.message || 'Failed to place bet');
    } finally {
      setActionLoading(false);
    }
  };

  const handleResolve = async () => {
    if (!walletInfo) {
      setError('Please connect your wallet first');
      return;
    }

    // 检查所有引用的议题是否都已解决
    const unresolvedTopics = referencedTopics.filter(topic => topic.status !== TopicStatus.RESOLVED);
    if (unresolvedTopics.length > 0) {
      setError(`Please resolve all referenced topics first: ${unresolvedTopics.map(t => t.title).join(', ')}`);
      return;
    }

    try {
      setActionLoading(true);
      setError('');

      await resolveCompositeTopic(topicId);
      
      alert('Composite topic resolved successfully!');
      
      // 重新加载数据
      await loadCompositeTopicDetails();
    } catch (error: any) {
      console.error('Failed to resolve composite topic:', error);
      setError(error.message || 'Failed to resolve topic');
    } finally {
      setActionLoading(false);
    }
  };

  const handleClaim = async () => {
    if (!walletInfo) {
      setError('Please connect your wallet first');
      return;
    }

    try {
      setActionLoading(true);
      setError('');

      await claimCompositeReward(topicId);
      
      alert('Reward claimed successfully!');
      
      // 重新加载数据
      await loadCompositeTopicDetails();
    } catch (error: any) {
      console.error('Failed to claim reward:', error);
      setError(error.message || 'Failed to claim reward');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusText = (status: number) => {
    switch (status) {
      case TopicStatus.WAITING_FOR_SECOND_PLAYER: return 'Waiting for Players';
      case TopicStatus.ACTIVE: return 'Active';
      case TopicStatus.RESOLVED: return 'Resolved';
      case TopicStatus.CLAIMED: return 'Completed';
      default: return 'Unknown';
    }
  };

  const isCreator = walletInfo && compositeTopic && 
    walletInfo.address.toLowerCase() === compositeTopic.creator.toLowerCase();

  const canResolve = isCreator && compositeTopic?.status === TopicStatus.ACTIVE;

  const hasWinningBet = compositeTopic?.status === TopicStatus.RESOLVED && 
    optionBetInfos.length > 0 && 
    optionBetInfos[compositeTopic.winningOption]?.userBets && 
    parseFloat(optionBetInfos[compositeTopic.winningOption].userBets) > 0;

  if (loading) {
    return (
      <div className="composite-detail-modal">
        <div className="composite-detail-overlay" onClick={onClose}></div>
        <div className="composite-detail-container">
          <div className="loading-spinner">Loading composite topic details...</div>
        </div>
      </div>
    );
  }

  if (!compositeTopic) {
    return (
      <div className="composite-detail-modal">
        <div className="composite-detail-overlay" onClick={onClose}></div>
        <div className="composite-detail-container">
          <div className="error-message">Composite topic not found</div>
          <button onClick={onClose} className="close-btn">Close</button>
        </div>
      </div>
    );
  }

  return (
    <div className="composite-detail-modal">
      <div className="composite-detail-overlay" onClick={onClose}></div>
      <div className="composite-detail-container">
        <div className="composite-detail-header">
          <div className="header-content">
            <h2>{compositeTopic.title}</h2>
            <span className={`status-badge status-${compositeTopic.status}`}>
              {getStatusText(compositeTopic.status)}
            </span>
          </div>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="composite-detail-content">
          {/* Topic Information */}
          <div className="info-section">
            <h3>Topic Information</h3>
            <div className="info-grid">
              <div className="info-item">
                <label>Creator:</label>
                <span>{compositeTopic.creator}</span>
              </div>
              <div className="info-item">
                <label>Total Pool:</label>
                <span>{compositeTopic.totalPool} ETH</span>
              </div>
              <div className="info-item">
                <label>Min Bet Amount:</label>
                <span>{compositeTopic.minBetAmount} ETH</span>
              </div>
              <div className="info-item">
                <label>Total Options:</label>
                <span>{compositeTopic.combinedOptions.length}</span>
              </div>
            </div>
          </div>

          {/* Referenced Topics */}
          <div className="referenced-section">
            <h3>Referenced Topics</h3>
            <div className="referenced-topics">
              {referencedTopics.map((topic, index) => (
                <div key={topic.id} className="referenced-topic">
                  <div className="topic-header">
                    <h4>{topic.title}</h4>
                    <span className={`status-badge status-${topic.status}`}>
                      {getStatusText(topic.status)}
                    </span>
                  </div>
                  <div className="topic-options">
                    Options: {topic.options.join(', ')}
                  </div>
                  {topic.status === TopicStatus.RESOLVED && (
                    <div className="winning-option">
                      Winning Option: {topic.options[topic.winningOption]}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Betting Options */}
          <div className="options-section">
            <h3>Betting Options</h3>
            <div className="options-grid">
              {optionBetInfos.map((optionInfo, index) => (
                <div 
                  key={index} 
                  className={`option-card ${selectedOption === index ? 'selected' : ''} ${
                    compositeTopic.status === TopicStatus.RESOLVED && 
                    compositeTopic.winningOption === index ? 'winning' : ''
                  }`}
                  onClick={() => compositeTopic.status === TopicStatus.ACTIVE && setSelectedOption(index)}
                >
                  <div className="option-header">
                    <span className="option-number">#{index + 1}</span>
                    {compositeTopic.status === TopicStatus.RESOLVED && 
                     compositeTopic.winningOption === index && (
                      <span className="winner-badge">🏆 Winner</span>
                    )}
                  </div>
                  <div className="option-text">{optionInfo.optionText}</div>
                  <div className="option-stats">
                    <div className="stat-item">
                      <label>Total Bets:</label>
                      <span>{optionInfo.totalBets} ETH</span>
                    </div>
                    <div className="stat-item">
                      <label>Your Bets:</label>
                      <span>{optionInfo.userBets} ETH</span>
                    </div>
                    <div className="stat-item">
                      <label>Percentage:</label>
                      <span>{optionInfo.percentage}%</span>
                    </div>
                  </div>
                  {compositeTopic.status === TopicStatus.ACTIVE && (
                    <div className="option-action">
                      {selectedOption === index ? 'Selected for betting' : 'Click to select'}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          {compositeTopic.status === TopicStatus.ACTIVE && (
            <div className="actions-section">
              <h3>Place Your Bet</h3>
              <div className="bet-form">
                <div className="bet-input-group">
                  <label>Bet Amount (ETH):</label>
                  <input
                    type="number"
                    value={betAmount}
                    onChange={(e) => setBetAmount(e.target.value)}
                    min={compositeTopic.minBetAmount}
                    step="0.001"
                    placeholder={`Min: ${compositeTopic.minBetAmount} ETH`}
                  />
                </div>
                <button 
                  onClick={handleBet}
                  disabled={actionLoading || selectedOption === null || !betAmount}
                  className="bet-btn"
                >
                  {actionLoading ? 'Placing Bet...' : 'Place Bet'}
                </button>
              </div>
            </div>
          )}

          {/* Creator Actions */}
          {canResolve && (
            <div className="actions-section">
              <h3>Creator Actions</h3>
              <button 
                onClick={handleResolve}
                disabled={actionLoading}
                className="resolve-btn"
              >
                {actionLoading ? 'Resolving...' : 'Resolve Topic'}
              </button>
            </div>
          )}

          {/* Claim Reward */}
          {hasWinningBet && (
            <div className="actions-section">
              <h3>Claim Your Reward</h3>
              <button 
                onClick={handleClaim}
                disabled={actionLoading}
                className="claim-btn"
              >
                {actionLoading ? 'Claiming...' : 'Claim Reward'}
              </button>
            </div>
          )}

          {error && <div className="error-message">{error}</div>}
        </div>
      </div>
    </div>
  );
};

export default CompositeTopicDetail;

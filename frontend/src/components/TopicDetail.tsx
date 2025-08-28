import React, { useState } from 'react';
import { Topic, TopicStatus } from '../types/contracts';
import { joinTopic, resolveTopic, claimReward } from '../utils/web3';
import { useWallet } from '../contexts/WalletContext';

interface TopicDetailProps {
  topic: Topic;
  onClose: () => void;
  onSuccess: () => void;
}

const TopicDetail: React.FC<TopicDetailProps> = ({ topic, onClose, onSuccess }) => {
  const [selectedChoice, setSelectedChoice] = useState(0);
  const [selectedWinningOption, setSelectedWinningOption] = useState(0);
  const [loading, setLoading] = useState(false);
  const { walletInfo, refreshBalance } = useWallet();

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

  const canJoin = () => {
    return walletInfo && 
           topic.status === TopicStatus.WAITING_FOR_SECOND_PLAYER && 
           topic.creator.toLowerCase() !== walletInfo.address.toLowerCase();
  };

  const canResolve = () => {
    return walletInfo && 
           topic.status === TopicStatus.ACTIVE && 
           topic.creator.toLowerCase() === walletInfo.address.toLowerCase();
  };

  const canClaim = () => {
    return walletInfo && 
           topic.status === TopicStatus.RESOLVED && 
           topic.winner.toLowerCase() === walletInfo.address.toLowerCase();
  };

  const handleJoin = async () => {
    if (!walletInfo) {
      alert('Please connect your wallet first');
      return;
    }

    if (parseFloat(topic.betAmount) > parseFloat(walletInfo.balance)) {
      alert('Insufficient ETH balance');
      return;
    }

    setLoading(true);
    try {
      await joinTopic(topic.id, selectedChoice, topic.betAmount);
      await refreshBalance();
      alert('Successfully joined the market!');
      onSuccess();
    } catch (error) {
      console.error('Failed to join topic:', error);
      alert('Failed to join market, please try again');
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async () => {
    setLoading(true);
    try {
      await resolveTopic(topic.id, selectedWinningOption);
      alert('Market resolved successfully!');
      onSuccess();
    } catch (error) {
      console.error('Failed to resolve topic:', error);
      alert('Failed to resolve market, please try again');
    } finally {
      setLoading(false);
    }
  };

  const handleClaim = async () => {
    setLoading(true);
    try {
      await claimReward(topic.id);
      await refreshBalance();
      alert('Reward claimed successfully!');
      onSuccess();
    } catch (error) {
      console.error('Failed to claim reward:', error);
      alert('Failed to claim reward, please try again');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="topic-detail-overlay">
      <div className="topic-detail">
        <div className="topic-detail-header">
          <h2>{topic.title}</h2>
          <button onClick={onClose} className="btn-close">×</button>
        </div>

        <div className="topic-detail-content">
          <div className="topic-info">
            <div className="info-item">
              <span className="label">Status:</span>
              <span className={`status status-${topic.status}`}>
                {getStatusText(topic.status)}
              </span>
            </div>
            <div className="info-item">
              <span className="label">Creator:</span>
              <span>{`${topic.creator.slice(0, 6)}...${topic.creator.slice(-4)}`}</span>
            </div>
            <div className="info-item">
              <span className="label">Bet Amount:</span>
              <span>{topic.betAmount} ETH</span>
            </div>
            <div className="info-item">
              <span className="label">Total Pool:</span>
              <span>{topic.totalPool} ETH</span>
            </div>
          </div>

          <div className="topic-options-detail">
            <h3>Prediction Options</h3>
            <div className="options-detail">
              {topic.options.map((option, index) => (
                <div key={index} className="option-detail">
                  <span className="option-text">{option}</span>
                  <div className="option-info">
                    {topic.status !== TopicStatus.WAITING_FOR_SECOND_PLAYER && (
                      <div className="players">
                        {topic.playerChoices[0] === index && (
                          <span className="player p1">Player 1</span>
                        )}
                        {topic.playerChoices[1] === index && (
                          <span className="player p2">Player 2</span>
                        )}
                      </div>
                    )}
                    {topic.status >= TopicStatus.RESOLVED && topic.winningOption === index && (
                      <span className="winner-badge">Winning Option</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Join Market */}
          {canJoin() && (
            <div className="action-section">
              <h3>Join Market</h3>
              <div className="join-form">
                <div className="form-group">
                  <label>Choose your prediction:</label>
                  <select
                    value={selectedChoice}
                    onChange={(e) => setSelectedChoice(parseInt(e.target.value))}
                    className="form-select"
                  >
                    {topic.options.map((option, index) => (
                      <option key={index} value={index}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={handleJoin}
                  disabled={loading}
                  className="btn-primary"
                >
                  {loading ? 'Joining...' : `Bet ${topic.betAmount} ETH`}
                </button>
              </div>
            </div>
          )}

          {/* Resolve Market */}
          {canResolve() && (
            <div className="action-section">
              <h3>Resolve Market</h3>
              <div className="resolve-form">
                <div className="form-group">
                  <label>Winning option:</label>
                  <select
                    value={selectedWinningOption}
                    onChange={(e) => setSelectedWinningOption(parseInt(e.target.value))}
                    className="form-select"
                  >
                    {topic.options.map((option, index) => (
                      <option key={index} value={index}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="warning-text">
                  ⚠️ Warning: Once confirmed, the resolution cannot be changed. Please choose carefully!
                </div>
                <button
                  onClick={handleResolve}
                  disabled={loading}
                  className="btn-warning"
                >
                  {loading ? 'Resolving...' : 'Confirm Resolution'}
                </button>
              </div>
            </div>
          )}

          {/* Claim Reward */}
          {canClaim() && (
            <div className="action-section">
              <h3>Claim Reward</h3>
              <div className="claim-info">
                <div className="winner-message">
                  🎉 Congratulations! Your prediction was correct. You can claim your reward!
                </div>
                <div className="claim-amount">
                  Claimable amount: {topic.totalPool} ETH
                </div>
                <button
                  onClick={handleClaim}
                  disabled={loading}
                  className="btn-success"
                >
                  {loading ? 'Claiming...' : 'Claim Reward'}
                </button>
              </div>
            </div>
          )}

          {/* Finished Market Info */}
          {topic.status === TopicStatus.CLAIMED && (
            <div className="action-section">
              <h3>Market Finished</h3>
              <div className="completed-info">
                <div>Winning option: {topic.options[topic.winningOption]}</div>
                <div>Winner: {`${topic.winner.slice(0, 6)}...${topic.winner.slice(-4)}`}</div>
                <div>Reward amount: {topic.totalPool} ETH</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TopicDetail;

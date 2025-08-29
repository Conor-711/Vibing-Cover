import React, { useState, useEffect } from 'react';
import { Topic } from '../types/contracts';
import { createCompositeTopic, getAvailableTopicsForComposite } from '../utils/web3';
import '../styles/CreateCompositeTopic.css';

interface CreateCompositeTopicProps {
  walletInfo: any;
  onClose: () => void;
  onSuccess: () => void;
}

const CreateCompositeTopic: React.FC<CreateCompositeTopicProps> = ({ 
  walletInfo, 
  onClose, 
  onSuccess 
}) => {
  const [title, setTitle] = useState('');
  const [selectedTopics, setSelectedTopics] = useState<number[]>([]);
  const [minBetAmount, setMinBetAmount] = useState('0.01');
  const [availableTopics, setAvailableTopics] = useState<Topic[]>([]);
  const [combinedOptions, setCombinedOptions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingTopics, setLoadingTopics] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadAvailableTopics();
  }, []);

  useEffect(() => {
    if (selectedTopics.length >= 2) {
      generateCombinedOptions();
    } else {
      setCombinedOptions([]);
    }
  }, [selectedTopics, availableTopics]);

  const loadAvailableTopics = async () => {
    try {
      setLoadingTopics(true);
      const topics = await getAvailableTopicsForComposite();
      setAvailableTopics(topics);
    } catch (error) {
      console.error('Failed to load available topics:', error);
      setError('Failed to load available topics for combination');
    } finally {
      setLoadingTopics(false);
    }
  };

  const generateCombinedOptions = () => {
    const selectedTopicDetails = selectedTopics.map(id => 
      availableTopics.find(topic => topic.id === id)
    ).filter(Boolean) as Topic[];

    if (selectedTopicDetails.length < 2) {
      setCombinedOptions([]);
      return;
    }

    // 计算所有可能的组合
    let combinations: string[][] = [[]];
    
    for (const topic of selectedTopicDetails) {
      const newCombinations: string[][] = [];
      for (const combo of combinations) {
        for (const option of topic.options) {
          newCombinations.push([...combo, `${topic.title}: ${option}`]);
        }
      }
      combinations = newCombinations;
    }

    // 限制最大组合数以避免UI过载
    const maxCombinations = 16;
    if (combinations.length > maxCombinations) {
      setError(`Too many combinations (${combinations.length}). Maximum allowed: ${maxCombinations}. Please select fewer topics or topics with fewer options.`);
      setCombinedOptions([]);
      return;
    }

    setError('');
    setCombinedOptions(combinations.map(combo => combo.join(' & ')));
  };

  const handleTopicToggle = (topicId: number) => {
    setSelectedTopics(prev => {
      if (prev.includes(topicId)) {
        return prev.filter(id => id !== topicId);
      } else {
        if (prev.length >= 5) {
          setError('Maximum 5 topics can be combined');
          return prev;
        }
        setError('');
        return [...prev, topicId];
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!walletInfo) {
      setError('Please connect your wallet first');
      return;
    }

    if (!title.trim()) {
      setError('Please enter a topic title');
      return;
    }

    if (selectedTopics.length < 2) {
      setError('Please select at least 2 topics to combine');
      return;
    }

    if (selectedTopics.length > 5) {
      setError('Maximum 5 topics can be combined');
      return;
    }

    if (parseFloat(minBetAmount) <= 0) {
      setError('Minimum bet amount must be greater than 0');
      return;
    }

    if (combinedOptions.length === 0) {
      setError('No valid combinations generated');
      return;
    }

    try {
      setLoading(true);
      setError('');

      await createCompositeTopic(title.trim(), selectedTopics, minBetAmount);
      
      alert('Composite topic created successfully!');
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Failed to create composite topic:', error);
      setError(error.message || 'Failed to create composite topic');
    } finally {
      setLoading(false);
    }
  };

  const getTopicStatusText = (status: number) => {
    switch (status) {
      case 0: return 'Waiting for Player';
      case 1: return 'Active';
      case 2: return 'Resolved';
      case 3: return 'Claimed';
      default: return 'Unknown';
    }
  };

  return (
    <div className="composite-topic-modal">
      <div className="composite-topic-overlay" onClick={onClose}></div>
      <div className="composite-topic-container">
        <div className="composite-topic-header">
          <h2>Create Composite Topic</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="composite-topic-form">
          {/* Title Input */}
          <div className="form-group">
            <label htmlFor="title">Composite Topic Title:</label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter a descriptive title for your composite topic..."
              required
              maxLength={200}
            />
          </div>

          {/* Min Bet Amount */}
          <div className="form-group">
            <label htmlFor="minBetAmount">Minimum Bet Amount (ETH):</label>
            <input
              type="number"
              id="minBetAmount"
              value={minBetAmount}
              onChange={(e) => setMinBetAmount(e.target.value)}
              min="0.001"
              step="0.001"
              required
            />
          </div>

          {/* Available Topics Selection */}
          <div className="form-group">
            <label>Select Topics to Combine ({selectedTopics.length}/5):</label>
            
            {loadingTopics ? (
              <div className="loading-topics">Loading available topics...</div>
            ) : availableTopics.length === 0 ? (
              <div className="no-topics">
                No topics available for combination. Create some basic topics first.
              </div>
            ) : (
              <div className="topics-selection">
                {availableTopics.map(topic => (
                  <div 
                    key={topic.id} 
                    className={`topic-card ${selectedTopics.includes(topic.id) ? 'selected' : ''}`}
                    onClick={() => handleTopicToggle(topic.id)}
                  >
                    <div className="topic-header">
                      <h4>{topic.title}</h4>
                      <span className={`status-badge status-${topic.status}`}>
                        {getTopicStatusText(topic.status)}
                      </span>
                    </div>
                    <div className="topic-options">
                      <strong>Options:</strong> {topic.options.join(', ')}
                    </div>
                    <div className="topic-details">
                      <span>Bet Amount: {topic.betAmount} ETH</span>
                      <span>Pool: {topic.totalPool} ETH</span>
                    </div>
                    <div className="selection-indicator">
                      {selectedTopics.includes(topic.id) ? '✓ Selected' : 'Click to select'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Preview of Combined Options */}
          {combinedOptions.length > 0 && (
            <div className="form-group">
              <label>Generated Combination Options ({combinedOptions.length}):</label>
              <div className="combined-options-preview">
                {combinedOptions.map((option, index) => (
                  <div key={index} className="option-preview">
                    <span className="option-index">{index + 1}.</span>
                    <span className="option-text">{option}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {error && <div className="error-message">{error}</div>}

          <div className="form-actions">
            <button type="button" onClick={onClose} className="cancel-btn">
              Cancel
            </button>
            <button 
              type="submit" 
              className="submit-btn"
              disabled={loading || selectedTopics.length < 2 || combinedOptions.length === 0}
            >
              {loading ? 'Creating...' : 'Create Composite Topic'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateCompositeTopic;

import React, { useState } from 'react';
import { createTopic } from '../utils/web3';
import { useWallet } from '../contexts/WalletContext';

interface CreateTopicProps {
  onSuccess: () => void;
  onCancel: () => void;
}

const CreateTopic: React.FC<CreateTopicProps> = ({ onSuccess, onCancel }) => {
  const [title, setTitle] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [betAmount, setBetAmount] = useState('');
  const [choice, setChoice] = useState(0);
  const [loading, setLoading] = useState(false);
  const { walletInfo, refreshBalance } = useWallet();

  const addOption = () => {
    setOptions([...options, '']);
  };

  const removeOption = (index: number) => {
    if (options.length > 2) {
      const newOptions = options.filter((_, i) => i !== index);
      setOptions(newOptions);
      // If the deleted option is currently selected, reset selection
      if (choice >= newOptions.length) {
        setChoice(0);
      }
    }
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!walletInfo) {
      alert('Please connect your wallet first');
      return;
    }

    if (!title.trim()) {
      alert('Please enter a market question');
      return;
    }

    const filledOptions = options.filter(opt => opt.trim() !== '');
    if (filledOptions.length < 2) {
      alert('Please set at least 2 options');
      return;
    }

    if (!betAmount || parseFloat(betAmount) <= 0) {
      alert('Please enter a valid bet amount');
      return;
    }

    if (choice === undefined || choice < 0 || choice >= filledOptions.length) {
      alert('Please select your position');
      return;
    }

    if (parseFloat(walletInfo.balance) < parseFloat(betAmount)) {
      alert('Insufficient balance');
      return;
    }

    setLoading(true);
    try {
      await createTopic(title.trim(), options.map(opt => opt.trim()), betAmount, choice);
      await refreshBalance();
      alert('Market created successfully!');
      onSuccess();
    } catch (error) {
      console.error('Failed to create topic:', error);
      alert('Failed to create market, please try again');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-topic">
      <div className="create-topic-header">
        <h2>Create New Market</h2>
        <button onClick={onCancel} className="btn-secondary">Cancel</button>
      </div>

      <form onSubmit={handleSubmit} className="create-topic-form">
        <div className="form-group">
          <label htmlFor="title">Market Question</label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Will it rain tomorrow?"
            className="form-input"
            maxLength={200}
          />
        </div>

        <div className="form-group">
          <label>Prediction Options</label>
          <div className="options-input">
            {options.map((option, index) => (
              <div key={index} className="option-input">
                <input
                  type="text"
                  value={option}
                  onChange={(e) => updateOption(index, e.target.value)}
                  placeholder={`Option ${index + 1}`}
                  className="form-input"
                  maxLength={100}
                />
                {options.length > 2 && (
                  <button
                    type="button"
                    onClick={() => removeOption(index)}
                    className="btn-remove"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
            {options.length < 10 && (
              <button
                type="button"
                onClick={addOption}
                className="btn-secondary add-option-btn"
              >
                Add Option
              </button>
            )}
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="betAmount">Bet Amount (ETH)</label>
          <input
            id="betAmount"
            type="number"
            step="0.001"
            min="0.001"
            value={betAmount}
            onChange={(e) => setBetAmount(e.target.value)}
            placeholder="0.001"
            className="form-input"
          />
          <small>Amount of ETH each player needs to stake</small>
        </div>

        <div className="form-group">
          <label htmlFor="choice">Your Position</label>
          <select
            id="choice"
            value={choice}
            onChange={(e) => setChoice(parseInt(e.target.value))}
            className="form-select"
          >
            {options.map((option, index) => (
              <option key={index} value={index}>
                {option || `Option ${index + 1}`}
              </option>
            ))}
          </select>
          <small>Choose the option you think will win</small>
        </div>

        {walletInfo && (
          <div className="balance-info">
            <p>Current Balance: {walletInfo.balance} ETH</p>
            {parseFloat(betAmount) > 0 && parseFloat(walletInfo.balance) < parseFloat(betAmount) && (
              <p className="insufficient-balance">Insufficient balance, need {betAmount} ETH</p>
            )}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !title.trim() || options.filter(opt => opt.trim()).length < 2 || !betAmount || parseFloat(betAmount) <= 0}
          className="btn-primary create-btn"
        >
          {loading ? 'Creating...' : 'Create Market'}
        </button>
      </form>
    </div>
  );
};

export default CreateTopic;
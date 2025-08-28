import { ethers } from 'ethers';
import { Topic, WalletInfo } from '../types/contracts';
import { getContractAddresses } from '../config/contracts';
import PredictionMarketABI from '../contracts/PredictionMarketETH.json';

// 获取Web3 Provider
export const getProvider = () => {
  if (typeof window !== 'undefined' && window.ethereum) {
    return new ethers.BrowserProvider(window.ethereum);
  }
  throw new Error('MetaMask not found');
};

// 获取当前网络的合约地址
const getContractAddressesForCurrentNetwork = async (retryCount = 3) => {
  for (let i = 0; i < retryCount; i++) {
    try {
      const provider = getProvider();
      const network = await provider.getNetwork();
      const chainId = Number(network.chainId);
      
      console.log(`网络检测 (尝试 ${i + 1}/${retryCount}):`, {
        chainId,
        networkName: network.name
      });
      
      // 检查是否是支持的网络
      const addresses = getContractAddresses(chainId);
      
      // 如果是默认网络但实际连接的不是localhost，可能是网络未切换完成
      if (chainId === 1337 && window.ethereum) {
        try {
          // 尝试获取当前MetaMask的chainId
          const currentChainId = await window.ethereum.request({ method: 'eth_chainId' });
          const currentChainIdNum = parseInt(currentChainId, 16);
          console.log('MetaMask实际chainId:', currentChainIdNum);
          
          if (currentChainIdNum !== chainId) {
            console.log('Provider和MetaMask chainId不匹配，使用MetaMask的chainId');
            return getContractAddresses(currentChainIdNum);
          }
        } catch (metamaskError) {
          console.warn('无法获取MetaMask chainId:', metamaskError);
        }
      }
      
      return addresses;
    } catch (error) {
      console.error(`网络检测失败 (尝试 ${i + 1}/${retryCount}):`, error);
      
      if (i === retryCount - 1) {
        console.log('所有重试失败，返回Base Sepolia配置');
        // 最后一次失败，返回Base Sepolia配置（最常用的）
        return getContractAddresses(84532);
      }
      
      // 等待一段时间后重试
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  // 这里应该不会到达，但为了类型安全
  return getContractAddresses(84532);
};

// 连接钱包
export const connectWallet = async (): Promise<WalletInfo> => {
  try {
    const provider = getProvider();
    await provider.send("eth_requestAccounts", []);
    const signer = await provider.getSigner();
    const address = await signer.getAddress();
    const balance = await provider.getBalance(address);
    
    return {
      address,
      balance: ethers.formatEther(balance)
    };
  } catch (error) {
    console.error('Failed to connect wallet:', error);
    throw new Error(`钱包连接失败: ${error instanceof Error ? error.message : '未知错误'}`);
  }
};

// 获取合约实例
export const getPredictionMarketContract = async (signer?: ethers.Signer) => {
  const addresses = await getContractAddressesForCurrentNetwork();
  
  console.log('Current network addresses:', addresses);
  
  if (!addresses.predictionMarket || addresses.predictionMarket === '') {
    throw new Error('PredictionMarket contract not deployed');
  }
  
  // 获取provider用于检查合约代码
  const provider = getProvider();
  
  // 检查合约是否真的存在
  const code = await provider.getCode(addresses.predictionMarket);
  console.log('Contract code length:', code.length);
  
  if (code === '0x') {
    throw new Error(`No contract found at address ${addresses.predictionMarket}`);
  }
  
  // 如果有signer就使用signer，否则使用provider
  const contractProvider = signer || provider;
  
  return new ethers.Contract(
    addresses.predictionMarket,
    PredictionMarketABI.abi,
    contractProvider
  );
};

// 智能合约交互函数

// 创建议题
export const createTopic = async (
  title: string,
  options: string[],
  betAmount: string,
  choice: number
) => {
  try {
    const provider = getProvider();
    const signer = await provider.getSigner();
    
    const predictionContract = await getPredictionMarketContract(signer);
    const amount = ethers.parseEther(betAmount);
    
    // 创建议题，直接发送ETH
    const createTx = await predictionContract.createTopic(title, options, choice, {
      value: amount
    });
    const receipt = await createTx.wait();
    
    console.log('创建议题交易确认，区块号:', receipt.blockNumber);
    
    // 触发状态同步事件
    window.dispatchEvent(new CustomEvent('topicStateChanged', { 
      detail: { action: 'create', txHash: receipt.hash, blockNumber: receipt.blockNumber } 
    }));
    
    return receipt;
  } catch (error) {
    console.error('Failed to create topic:', error);
    throw error;
  }
};

// 加入议题
export const joinTopic = async (topicId: number, choice: number, betAmount: string) => {
  try {
    const provider = getProvider();
    const signer = await provider.getSigner();
    
    const predictionContract = await getPredictionMarketContract(signer);
    const amount = ethers.parseEther(betAmount);
    
    // 加入议题，直接发送ETH
    const joinTx = await predictionContract.joinTopic(topicId, choice, {
      value: amount
    });
    const receipt = await joinTx.wait();
    
    console.log('加入议题交易确认，区块号:', receipt.blockNumber);
    
    // 触发状态同步事件
    window.dispatchEvent(new CustomEvent('topicStateChanged', { 
      detail: { action: 'join', topicId, txHash: receipt.hash, blockNumber: receipt.blockNumber } 
    }));
    
    return receipt;
  } catch (error) {
    console.error('Failed to join topic:', error);
    throw error;
  }
};

// 裁定议题
export const resolveTopic = async (topicId: number, winningOption: number) => {
  try {
    const provider = getProvider();
    const signer = await provider.getSigner();
    const predictionContract = await getPredictionMarketContract(signer);
    
          const resolveTx = await predictionContract.resolveTopic(topicId, winningOption);
      const receipt = await resolveTx.wait();
      
      console.log('裁定议题交易确认，区块号:', receipt.blockNumber);
      
      // 触发状态同步事件
      window.dispatchEvent(new CustomEvent('topicStateChanged', { 
        detail: { action: 'resolve', topicId, txHash: receipt.hash, blockNumber: receipt.blockNumber } 
      }));
      
      return receipt;
  } catch (error) {
    console.error('Failed to resolve topic:', error);
    throw error;
  }
};

// 领取奖金
export const claimReward = async (topicId: number) => {
  try {
    const provider = getProvider();
    const signer = await provider.getSigner();
    const predictionContract = await getPredictionMarketContract(signer);
    
          const claimTx = await predictionContract.claimReward(topicId);
      const receipt = await claimTx.wait();
      
      console.log('领取奖励交易确认，区块号:', receipt.blockNumber);
      
      // 触发状态同步事件
      window.dispatchEvent(new CustomEvent('topicStateChanged', { 
        detail: { action: 'claim', topicId, txHash: receipt.hash, blockNumber: receipt.blockNumber } 
      }));
      
      return receipt;
  } catch (error) {
    console.error('Failed to claim reward:', error);
    throw error;
  }
};

// 获取所有议题（带重试机制和强制刷新）
export const getAllTopics = async (retryCount = 2, forceRefresh = false): Promise<Topic[]> => {
  for (let i = 0; i < retryCount; i++) {
    try {
      console.log(`获取议题尝试 ${i + 1}/${retryCount}${forceRefresh ? ' [强制刷新]' : ''}`);
      
      const predictionContract = await getPredictionMarketContract();
      
      // 如果强制刷新，先获取最新的区块号确保读取最新状态
      if (forceRefresh) {
        const provider = getProvider();
        const latestBlock = await provider.getBlockNumber();
        console.log('强制刷新模式，当前最新区块:', latestBlock);
        
        // 等待一小段时间确保所有节点同步
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      console.log('Contract instance created, calling getAllTopicIds...');
      
      const topicIds = await predictionContract.getAllTopicIds();
      console.log('Topic IDs received:', topicIds);
      
      const topics: Topic[] = [];
      for (const id of topicIds) {
        console.log('Getting topic details for ID:', id);
        
        // 对于每个议题，也确保获取最新状态
        const topic = await predictionContract.getTopic(id);
        
        const processedTopic: Topic = {
          id: Number(topic.id),
          creator: topic.creator,
          title: topic.title,
          options: topic.options,
          betAmount: ethers.formatEther(topic.betAmount),
          players: [topic.players[0] || '', topic.players[1] || ''] as [string, string],
          playerChoices: [Number(topic.playerChoices[0] || 0), Number(topic.playerChoices[1] || 0)] as [number, number],
          totalPool: ethers.formatEther(topic.totalPool),
          status: Number(topic.status),
          winningOption: Number(topic.winningOption),
          winner: topic.winner
        };
        
        console.log(`议题 ${id} 状态:`, {
          title: processedTopic.title,
          status: processedTopic.status,
          players: processedTopic.players.length,
          totalPool: processedTopic.totalPool
        });
        
        topics.push(processedTopic);
      }
      
      console.log('All topics processed:', topics.map(t => ({ 
        id: t.id, 
        title: t.title, 
        status: t.status,
        players: t.players.length
      })));
      
      return topics;
    } catch (error) {
      console.error(`获取议题失败 (尝试 ${i + 1}/${retryCount}):`, error);
      
      if (i === retryCount - 1) {
        console.log('所有获取议题尝试都失败了');
        // 如果合约未部署，返回空数组
        return [];
      }
      
      // 等待一段时间后重试
      await new Promise(resolve => setTimeout(resolve, 1500));
    }
  }
  
  return [];
};

// 获取单个议题
export const getTopic = async (topicId: number): Promise<Topic> => {
  try {
    const predictionContract = await getPredictionMarketContract();
    const topic = await predictionContract.getTopic(topicId);
    
    return {
      id: Number(topic.id),
      creator: topic.creator,
      title: topic.title,
      options: topic.options,
      betAmount: ethers.formatEther(topic.betAmount),
      players: [topic.players[0] || '', topic.players[1] || ''] as [string, string],
      playerChoices: [Number(topic.playerChoices[0] || 0), Number(topic.playerChoices[1] || 0)] as [number, number],
      totalPool: ethers.formatEther(topic.totalPool),
      status: Number(topic.status),
      winningOption: Number(topic.winningOption),
      winner: topic.winner
    };
  } catch (error) {
    console.error('Failed to get topic:', error);
    throw error;
  }
};

// 检查合约是否已部署
export const checkContractsDeployed = async (): Promise<{
  predictionMarket: boolean;
}> => {
  try {
    const addresses = await getContractAddressesForCurrentNetwork();
    return {
      predictionMarket: addresses.predictionMarket !== ''
    };
  } catch (error) {
    return {
      predictionMarket: false
    };
  }
};
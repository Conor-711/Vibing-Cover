export interface Topic {
  id: number;
  creator: string;
  title: string;
  options: string[];
  betAmount: string;
  players: [string, string];
  playerChoices: [number, number];
  totalPool: string;
  status: TopicStatus;
  winningOption: number;
  winner: string;
  isComposite?: boolean;
}

export interface CompositeTopic {
  id: number;
  creator: string;
  title: string;
  referencedTopicIds: number[];
  combinedOptions: string[];
  minBetAmount: string;
  totalPool: string;
  status: TopicStatus;
  winningOption: number;
  createdAt: number;
}

export interface CompositeBet {
  bettor: string;
  amount: string;
  optionIndex: number;
  timestamp: number;
}

export interface OptionBetInfo {
  optionIndex: number;
  optionText: string;
  totalBets: string;
  userBets: string;
  percentage: number;
}

export enum TopicStatus {
  WAITING_FOR_SECOND_PLAYER = 0,
  ACTIVE = 1,
  RESOLVED = 2,
  CLAIMED = 3
}

export interface ContractAddresses {
  predictionMarket: string;
}

export interface WalletInfo {
  address: string;
  balance: string;
}

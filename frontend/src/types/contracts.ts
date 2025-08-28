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

export interface Web3Account {
    address: string;
    chain: 'EVM' | 'SOLANA';
    isVerified: boolean;
  }
  
  export interface SocialAccount {
    platform: 'TWITTER' | 'GITHUB' | 'DISCORD';
    username: string;
    isVerified: boolean;
  }
  
  export interface UserProfile {
    id: string;
    username: string;
    bio?: string;
    avatar?: string;
    email?: string;
    web3Accounts: Web3Account[];
    socialAccounts: SocialAccount[];
    createdAt: Date;
    updatedAt: Date;
  }

  export enum Chain {
    EVM = "ethereum",
    SOLANA = "SOLANA",
  }
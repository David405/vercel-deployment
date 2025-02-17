export interface Web3Account {
    address: string;
    chain: 'ethereum' | 'solana';
    isVerified: boolean;
  }
  
  export interface SocialAccount {
    platform: 'twitter' | 'github' | 'discord';
    username: string;
    
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

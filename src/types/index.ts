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

export enum ActivityType {
    Mint = 'mint',
    Swap = 'swap',
    Deposit = 'deposit',
}

export interface OnChainActivity {
    id: string;
    type: ActivityType;
    amount: number;
    timestamp: Date;
    txHash: string;
    chain: 'ethereum' | 'solana';
    metadata: Record<string, any>;
    createdAt: Date;
    web3AccountId: string;
}

export interface Post {
    id: string;
    content: string;
    createdAt: Date;
    updatedAt: Date;
    userId: string;
    onChainActivity: OnChainActivity[];
    comments: Comment[];
    likes: Like[];
    dislikes: Dislike[];
    replies: Reply[];
    mediaUrl?: string;
}

interface Comment {
    id: string;
    content: string;
    createdAt: Date;
    updatedAt: Date;
    userId: string;
    postId: string;
}

interface Like {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    userId: string;
    postId: string;
}

interface Dislike {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    userId: string;
    postId: string;
}

interface Reply {
    id: string;
    content: string;
    createdAt: Date;  
    updatedAt: Date;
    userId: string;
    commentId: string;  
    likes: Like[];
    dislikes: Dislike[];
    postId: string;
}
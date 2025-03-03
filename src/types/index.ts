import { OnchainActivity } from "@prisma/client";

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

// Metadata for a Mint activity
export interface MintMetadata {
    contractAddress: string;
    tokenId: string;
    collection: string;
    fiatValue?: string;
    mediaUrl?:string 
}

// Metadata for a Swap activity
export interface SwapMetadata {
    fromToken: string;
    toToken: string;
    amountIn: string;
    amountOut: string;
    exchange: string;
    marketCap?: string;
    fiatValue?: string; 
    pnl?: string; 
}

// Metadata for a Deposit activity
export interface DepositMetadata {
    amount: string;
    walletAddress: string;
    tokenAddress : string;
    source: string;
    fiatValue?: string; 
    marketCap?: string;// Optional fiat value of the deposit
}

export type ActivityMetadata <T extends ActivityType> = 
    T extends ActivityType.Mint ? MintMetadata :
    T extends ActivityType.Swap ? SwapMetadata :
    T extends ActivityType.Deposit ? DepositMetadata :
    never;

export interface OnChainActivity<T extends ActivityType> {
    id: string;
    type: T;
    amount: number;
    timestamp: Date;
    txHash: string;
    chain: 'ethereum' | 'solana';
    metadata: ActivityMetadata<T>;
    createdAt: Date;
    web3AccountId: string;
}

export interface Post {
    id: string;
    content: string;
    createdAt: Date;
    userId: string;
    onChainActivity: OnchainActivity;
    commentsCount:number;
    comments: Comment[];
    likeCount:number;
    likes: Like[];
    dislikeCount: number;
    dislikes: Dislike[];
    replies: Reply[];
    mediaUrl?: string;
    avatar?:string;
    username?:string;
    enagagement: number;

}

interface Comment {
    id: string;
    content: string;
    createdAt: Date;
   
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
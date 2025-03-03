import { Chain, PrismaClient, User } from "@prisma/client"
import axios from "axios";
import { account } from "../services/users";
import { ActivityMetadata, ActivityType, DepositMetadata, MintMetadata, SwapMetadata, UserProfile } from "../types";


const prisma = new PrismaClient();


//?  List of Banned words to be provided
const bannedWords:string[] = []; 


// Validate Username
      // - Checks uniqueness
      // - Checks characters
      // - Checks banned word list

export const validateUsername = async (username :string):Promise<{ valid: boolean; message: string; }>=> {

    // Check characters
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
        return { valid: false, message: "Invalid characters in username" };
    }

    //TODO: Check if username contains banned words
    if (bannedWords.some(word => username.toLowerCase().includes(word))) {
        return { valid: false, message: "Username contains banned words" };
    }

    //Check if username already exists
    const existingUser = await prisma.user.findUnique({ where: { username } });
    if (existingUser) {
        return { valid: false, message: "Username already taken" };
    }

    return { valid: true, message: "Username is available" };
    
}

// Validate Email
        // - Check unique
        // - Check format
        // - Check domain

export const validateEmail = async(email:string):Promise<{valid:boolean , message:string}> => {
    const existingEmail = await prisma.user.findUnique({ where: { email } });
    if (existingEmail) {
        return { valid: false, message: "Email already registered" };
    }
    
    return { valid: true, message: "Email is valid" };
}

// Validates Account Address with Adamik API

export const validateAddressWithAdamik= async({address , nonce ,chainId}:account):Promise<{valid:boolean , message:string}> => {
    console.log({
        address : address ,
        chainId : chainId ,
    })
    const apiKey = process.env.ADAMIK_API_KEY;
    

    try{
        const response = await axios.post(`https://api.adamik.io/api/${chainId}/address/validate`,
            {address},
            {headers:{
                Authorization : apiKey,
                "Content-Type":'application/json'
            }}
        );
        if(response.data.valid){
            return {
                valid:true,
                message:"Address is valid"
            }
        }

        else {
            return { valid: false, message: 'Address is invalid' };
        }
    } catch(err){
        console.error("Error Validating Address: " , err);
        return {
            valid : false ,
            message : "Error Validating Address!"
        }
    }
}

export async function getUserAndCheckFollowingStatus(currentUserId: string, usernameToCheck: string)
: Promise<{isFollowing:boolean , userToCheck:User}> {
    const userToCheck = await prisma.user.findUnique({
      where: { username: usernameToCheck },
    });
  
    if (!userToCheck) {
      throw new Error("User not found");
    }
  
    const existingFollow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: currentUserId,
          followingId: userToCheck.id,
        },
      },
    });
  
    return { isFollowing: !!existingFollow, userToCheck };
  }



  // Type guard functions to validate metadata
export function isMintMetadata(metadata: any): metadata is MintMetadata {
    return (
        typeof metadata === 'object' &&
        metadata !== null &&
        typeof metadata.contractAddress === 'string' &&
        typeof metadata.tokenId === 'string' &&
        typeof metadata.collection === 'string' &&
        (metadata.fiatValue === undefined || typeof metadata.fiatValue === 'string') &&
        (metadata.mediaUrl === undefined || typeof metadata.mediaUrl === 'string')
    );
}

export function isSwapMetadata(metadata: any): metadata is SwapMetadata {
    return (
        typeof metadata === 'object' &&
        metadata !== null &&
        typeof metadata.fromToken === 'string' &&
        typeof metadata.toToken === 'string' &&
        typeof metadata.amountIn === 'string' &&
        typeof metadata.amountOut === 'string' &&
        typeof metadata.exchange === 'string' &&
        (metadata.marketCap === undefined || typeof metadata.marketCap === 'string') &&
        (metadata.fiatValue === undefined || typeof metadata.fiatValue === 'string') &&
        (metadata.pnl === undefined || typeof metadata.pnl === 'string')
    );
}

export function isDepositMetadata(metadata: any): metadata is DepositMetadata {
    return (
        typeof metadata === 'object' &&
        metadata !== null &&
        typeof metadata.amount === 'string' &&
        typeof metadata.walletAddress === 'string' &&
        typeof metadata.source === 'string' &&
        (metadata.fiatValue === undefined || typeof metadata.fiatValue === 'string') &&
        (metadata.marketCap === undefined || typeof metadata.marketCap === 'string')
    );
}

  export function validateOnChainActivity<T extends ActivityType>(
    activity: any
): activity is { activityType: T; txHash: string; chain: Chain; metadata: ActivityMetadata<T> } {
    if (!activity || typeof activity !== 'object') return false;
    if (!activity.activityType || !activity.txHash || !activity.chain) return false;
    
    // Validate chain
    if (activity.chain !== 'ethereum' && activity.chain !== 'solana') return false;
    
    // Validate metadata based on activity type
    if (activity.activityType === ActivityType.Mint) {
        return isMintMetadata(activity.metadata);
    } else if (activity.activityType === ActivityType.Swap) {
        return isSwapMetadata(activity.metadata);
    } else if (activity.activityType === ActivityType.Deposit) {
        return isDepositMetadata(activity.metadata);
    }
    
    return false;
}
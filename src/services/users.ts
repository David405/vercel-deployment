import { NextFunction, Request, Response } from "express";
import { UserProfile, Web3Account, SocialAccount } from "../types";
import { PrismaClient, Chain } from "@prisma/client";
import { validateAddressWithAdamik, validateEmail, validateUsername } from "../utils/validators";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();

export type account  = {
  address : string;
  nonce : string;
  chainId : string;
}

const asyncHandler =
  (fn: any) => (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

interface TurnkeyCreateUserBody {
  type: "turnkey";
  username: string;
  email: string;
  bio?: string;
  avatar?: string;
  account: account;
}

interface ThirdPartyCreateUserBody {
  type: "third-party";
  username: string;
  bio?: string;
  avatar?: string;
  account: account;
}

type CreateUserBody = TurnkeyCreateUserBody | ThirdPartyCreateUserBody;

// * Create User Profile


export const checkUsername = asyncHandler(
  async (req:Request , res:Response) => {
    try{
      console.log(
      "Calling Function"
      )
      const {username} = req.params;
      const response = await validateUsername(username);
      if( response.valid){
        res.status(200).json(response);
      }
      else{
        console.log("invalid res :",response)
        res.status(400).json(response);
      }
      
    } catch(err){
      console.log(err);
      res.status(500).json({
        message:"Error validating username",
        error : err,
      })
    }
  }
);
 

export const createUserProfile = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const body = req.body as CreateUserBody;
      const validUser = await validateUsername(body.username);
      
      if(!validUser.valid){
        res.status(400).json({
          message : validUser.message
        });
      } else {
        console.log(validUser.message);
      }

      if (body.type === "turnkey") {
        
        const validEmail = await validateEmail(body.email);
        if(!validEmail.valid){
          res.send(400).json({
            message : validEmail.message
          });
        } else {
          console.log(validEmail.message)
        }
      }

      const validAddress = await validateAddressWithAdamik(body.account);
      if(!validAddress.valid){
        res.send(400).json({
          message : validAddress.message
        });
      } else {
        console.log(validAddress.message);
      }

      

      const userData = {
        username: body.username,
        bio: body.bio || null,
        avatar: body.avatar || null,
        email: body.type === "turnkey" ? body.email : null,
        turnkeyWallet : body.type === "turnkey" ? body.account.address : null,
        nonce : body.account.nonce,


      };

      const newUser  = await prisma.user.create({data:userData});

      if (body.account.chainId !== 'ethereum' && body.account.chainId !== 'solana') {
        return res.status(400).json({ error: "Invalid chain parameter" });
      }

      const chain: Chain = body.account.chainId as unknown as Chain; 
      
      const web3Wallet = {
        userId : newUser.id,
        address : body.account.address,
        chain : chain,
        isVerified : false
      }

    const newWeb3Wallet = await prisma.web3Account.create({data:web3Wallet});

    res.status(201).json({
      message:"User profile added successfully",
      data : {profile : newUser,
        wallet : newWeb3Wallet
      }
    })
     
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

// * Fetch User Profile
export const getUserProfile = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const { username } = req.params;
      const user = await prisma.user.findUnique({
        where: { username },
        include: {
          web3Accounts: true,
          socialAccounts: true,
          followers: true,
          following: true,
        },
      });

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const userProfile: UserProfile = {
        id: user.id,
        username: user.username,
        bio: user.bio || undefined,
        avatar: user.avatar || undefined,
        email: user.email || undefined,
        web3Accounts: user.web3Accounts.map((acc: Web3Account) => ({
          address: acc.address,
          chain: acc.chain, // Ensuring TypeScript compatibility
          isVerified: acc.isVerified,
        })) as Web3Account[], // Explicitly casting to Web3Account[]
        socialAccounts: user.socialAccounts.map((acc: SocialAccount) => ({
          platform: acc.platform,
          username: acc.username,
        })), // Removed `isVerified`
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      };

      res.status(200).json({
        message: "User profile retrieved",
        data: userProfile,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

export const loginWithAddress = asyncHandler(
  async (req: Request, res: Response) => {
    const { address, chain } = req.body;

    if (!address || typeof address !== "string") {
      return res.status(400).json({ error: "Invalid account address" });
    }

    const account = await prisma.web3Account.findUnique({
      where: { address_chain: { address, chain } },
      include: { user: true }, 
    });

    if (!account) {
      return res.status(401).json({ error: "Account not found" });
    }

    const token = jwt.sign({ userId: account.userId }, process.env.JWT_SECRET!, {
      expiresIn: "1h",
    });

    res.cookie("token", token, {
      httpOnly: true, 
      secure: process.env.NODE_ENV === "production", 
      maxAge: 3600000,
      sameSite: "strict",
    });

    const userDetails = account.user;

    res.status(200).json({
      message: "Login successful",
      user: {
        id: userDetails.id,
        username: userDetails.username,
        email: userDetails.email,
        bio: userDetails.bio,
        avatar: userDetails.avatar,
        address: account.address,
        isVerified: account.isVerified,
      },
    });
  }
);

import {  Request, Response } from "express";
import { createPublicClient, http, type Hex } from 'viem';
import { UserProfile, Web3Account, SocialAccount } from "../types";
import {  Chain } from "@prisma/client";
import { validateAddressWithAdamik, validateEmail, validateUsername } from "../utils/validators";
import { asyncHandler } from "../utils/asyncHandler";
import { prisma } from "../utils/prismaUtils";
import { getAddressFromMessage, getChainIdFromMessage, formatSignature } from "../utils/helpers";
import jwt from "jsonwebtoken";


export type account  = {
  address : string;
  nonce : string;
  chainId : string;
}

interface TurnkeyCreateUserBody {
  type: "turnkey";
  username: string;
  email: string;
  bio?: string;
  avatar?: string;
  account: account;
  message: string;
  signature: string;
}

interface ThirdPartyCreateUserBody {
  type: "third-party";
  username: string;
  bio?: string;
  avatar?: string;
  account: account;
  message: string;
  signature: string;
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

      // Validate username
      const validUser = await validateUsername(body.username);
      if (!validUser.valid) {
        return res.status(400).json({
          message: validUser.message
        });
      } else {
        console.log(validUser.message);
      }

      // Validate email for turnkey users
      if (body.type === "turnkey") {
        const validEmail = await validateEmail(body.email);
        if (!validEmail.valid) {
          return res.status(400).json({
            message: validEmail.message
          });
        } else {
          console.log(validEmail.message);
        }
      }

      // Validate wallet address
      const validAddress = await validateAddressWithAdamik(body.account);
      if (!validAddress.valid) {
        return res.status(400).json({
          message: validAddress.message
        });
      } else {
        console.log(validAddress.message);
      }

      // Validate chain ID before creating any database entries
      if (body.account.chainId !== 'ethereum' && body.account.chainId !== 'solana') {
        return res.status(400).json({ error: "Invalid chain parameter" });
      }

      // Verify the signature
      const { message, signature } = body; 

      if (!message || typeof message !== "string") {
        return res.status(400).json({ error: "Invalid message" });
      }
      if (!signature || typeof signature !== "string") {
        return res.status(400).json({ error: "Missing or invalid signature" });
      }

      // Extract address and chainId from the SIWE message
      const extractedAddress = getAddressFromMessage(message);

      const publicClient = createPublicClient({
        transport: http(
          `https://rpc.walletconnect.org/v1/?chainId=${body.account.chainId}&projectId=${process.env.PROJECT_ID}`
        ),
      });

      const formattedAddress = `0x${extractedAddress}` as Hex;
      const formattedSignature = formatSignature(signature);

      const isValid = await publicClient.verifyMessage({
        message,
        address: formattedAddress,
        signature: formattedSignature,
      });

      if (!isValid) {
        return res.status(400).json({ error: "Invalid signature" });
      }

      const result = await prisma.$transaction(async (prismaClient) => {

        // Create user data object
        const userData = {
          username: body.username,
          bio: body.bio || null,
          avatar: body.avatar || null,
          email: body.type === "turnkey" ? body.email : null,
          turnkeyWallet: body.type === "turnkey" ? body.account.address : null,
          nonce: body.account.nonce,
        };

        // Create the user
        const newUser = await prismaClient.user.create({ data: userData });

        const chain: Chain = body.account.chainId as unknown as Chain;

        // Create wallet data object
        const web3Wallet = {
          userId: newUser.id,
          address: body.account.address,
          chain: chain,
          isVerified: true
        };

        // Create the wallet
        const newWeb3Wallet = await prismaClient.web3Account.create({ data: web3Wallet });

        return {
          profile: newUser,
          wallet: newWeb3Wallet
        };
      });

      // If we get here, both operations succeeded

      // Create a SIWE session
      const siwe = JSON.stringify({ address: extractedAddress, chainId: body.account.chainId, isValid });

      res.cookie("siwe", siwe, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 3600000,
        sameSite: "strict",
      });

      const token = jwt.sign({ userId: result.profile.id }, process.env.SECRET!, {
        expiresIn: "1h",
      });

      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 3600000,
        sameSite: "strict",
      });

      res.status(201).json({
        message: "User profile added successfully",
        data: result
      });

    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Internal Server Error", err });
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
        web3Accounts: user.web3Accounts.map((acc) => ({
          address: acc.address,
          chain: acc.chain as "ethereum" | "solana" , // Ensuring TypeScript compatibility
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

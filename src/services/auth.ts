import { PrismaClient } from "@prisma/client";
import { Request, Response, NextFunction } from "express";

import { createPublicClient, http, type Hex } from 'viem';
import jwt from "jsonwebtoken";

import { getAddressFromMessage, getChainIdFromMessage, formatSignature } from "../utils/helpers";

const prisma = new PrismaClient();


// Utility function to wrap async functions
const asyncHandler =
  (fn: any) => (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

  export const checkAccountAddress = asyncHandler(
    async (req: Request, res: Response) => {
      const { address, chainId } = req.query;
  
      if (!address || typeof address !== "string") {
        return res.status(400).json({ error: "Invalid account address" });
      }
  
      if (!chainId || typeof chainId !== "string") {
        return res.status(400).json({ error: "Missing or invalid chain parameter" });
      }

      const chain: 'ethereum' | 'solana' = chainId as 'ethereum' | 'solana';

      const account = await prisma.web3Account.findUnique({
        where: { address_chain: { address, chain } }, 
        include: { user: true },
      });
  
      if (!account) {
        return res.status(404).json({ exists: false, ownedByUser: false });
      }
  
      res.status(200).json({ exists: true, ownedByUser: !!account.userId });
    }
  );

  export const verifyAccountAddress = asyncHandler(
    async (req: Request, res: Response) => {
      try {
        const { message, signature } = req.body;
        
        
        if (!message || typeof message !== "string") {
          return res.status(400).json({ error: "Invalid message" });
        }
        if (!signature || typeof signature !== "string") {
          return res.status(400).json({ error: "Missing or invalid signature" });
        }
        
        // Extract address and chainId from the SIWE message
        const address = getAddressFromMessage(message);
        const chainId = getChainIdFromMessage(message);
        
        const publicClient = createPublicClient({
          transport: http(
            `https://rpc.walletconnect.org/v1/?chainId=${chainId}&projectId=${process.env.PROJECT_ID}`
          ),
        });
        
        const formattedAddress = `0x${address}` as Hex;
        const formattedSignature = formatSignature(signature);
      
        const isValid = await publicClient.verifyMessage({
        message,
        address: formattedAddress,
        signature: formattedSignature,
        });

      console.log(isValid);
      
      if (!isValid) {
        throw new Error("Invalid signature");
      }
      
        // Create a SIWE session
        const siwe = JSON.stringify({ address, chainId, isValid });
        
        res.cookie("siwe", siwe, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          maxAge: 3600000,
          sameSite: "strict",
        });
        
        res.status(200).json({ address, chainId, isValid });

      } catch (e) {
        console.error("SIWE Verification Error:", e);
        res.status(500).json({ message: (e as Error).message });
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
  
      const token = jwt.sign({ userId: account.userId }, process.env.SECRET!, {
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
  

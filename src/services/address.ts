import { PrismaClient } from "@prisma/client";
import { Request, Response, NextFunction } from "express";
import {
  getAddressFromMessage,
  getChainIdFromMessage,
} from "@reown/appkit-siwe";
import { createPublicClient, http } from "viem";

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
        return res.status(400).json({ error: "Missing or invalid chain parameter" });
      }

      const address = getAddressFromMessage(message);
      let chainId = getChainIdFromMessage(message);
  
      const publicClient = createPublicClient({
        transport: http(
          `https://rpc.walletconnect.org/v1/?chainId=${chainId}&projectId=${process.env.PROJECT_ID}`
        ),
      });

      const isValid = await publicClient.verifyMessage({
        message,
        address: `0x${address}`,
        signature: `0x${signature}`,
      });

      if (!isValid) {
        throw new Error("Invalid signature");
      }

      const siwe = JSON.stringify({ address, chainId});

      res.cookie("siwe", siwe, {
        httpOnly: true, 
        secure: process.env.NODE_ENV === "production", 
        maxAge: 3600000,
        sameSite: "strict",
      })

      req.session.siwe = { address, chainId };
      req.session.save(() => res.status(200).json({ address, chainId}));
    } catch (e) {
      // Clean the session
      req.session.siwe = undefined;
      req.session.save(() => res.status(500).json({ message: (e as Error).message }));
    }
    }
  )
  
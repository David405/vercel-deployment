import { Chain, PrismaClient } from "@prisma/client";
import { Request, Response, NextFunction } from "express";

import { createPublicClient, http, type Hex } from "viem";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import { createHmac } from "crypto";

import {
  getAddressFromMessage,
  getChainIdFromMessage,
  formatSignature,
} from "../utils/helpers";
import { CustomError } from "../utils/errors";

import { AuthRepository } from "../repositories";

const prisma = new PrismaClient();

export type Web3AccountData = {
  address: string;
  chainId: string;
};

export enum ChainAllowed {
  ETHEREUM = "ethereum",
  SOLANA = "solana",
}

export class AuthService {
  private authRepository: AuthRepository;
  private secret: string | undefined;

  constructor() {
    this.authRepository = new AuthRepository();
    this.secret = process.env.SECRET;
  }
  /**
   * Checks if a web3 account exists and if it is linked to a user
   * @param accountData - Object containing address and chainId
   * @returns Object containing account existence and ownership status
   */
  async checkAccountAddress(
    accountData: Web3AccountData
  ): Promise<{ exists: boolean; ownedByUser: boolean }> {
    const { address, chainId } = accountData;

    if (!address) {
      throw CustomError.BadRequest(
        "Invalid Account Address",
        "Address is required"
      );
    }

    if (
      !chainId ||
      !Object.values(ChainAllowed).includes(chainId as ChainAllowed)
    ) {
      throw CustomError.BadRequest(
        "Invalid Chain ID",
        "Supported chains: ethereum, solana"
      );
    }

    const chain = chainId as ChainAllowed;

    const account = await this.authRepository.findWeb3Account({
      address,
      chain,
    });

    return {
      exists: !!account,
      ownedByUser: !!account?.userId,
    };
  }

  async generateNonce(): Promise<{ nonce: string }> {
    if (!this.secret) {
      throw new Error("Secret not set");
    }

    const uuid = uuidv4();
    const nonce = createHmac("sha256", this.secret).update(uuid).digest("hex");

    return { nonce };
  }

  async verifyAndLogin({
    message,
    signature,
    address,
    chain,
  }: {
    message: string;
    signature: string;
    address: string;
    chain: ChainAllowed;
  }): Promise<any> {
    if (!address) {
      throw CustomError.BadRequest(
        "Invalid Account Address",
        "Address is required"
      );
    }

    if (!message ||  typeof message !== "string") {
      throw CustomError.BadRequest(
        "Invalid Data",
        "Missing or invalid message"
      );
    }

    if (!signature || typeof signature !== "string") {
      throw CustomError.BadRequest(
        "Invalid Data",
        "Missing or invalid signature"
      );
    }

    const account = await this.authRepository.findWeb3Account({
      address,
      chain,
    });

    if (!account) {
      throw CustomError.NotFound(
        "Account Not Found",
        "No account associated with this address"
      );
    }

    const extractedAddress = getAddressFromMessage(message);
    const chainId = getChainIdFromMessage(message);

    const siweSession = JSON.stringify({
      address: extractedAddress,
      chainId,
      isValid: true,
    });

    const token = jwt.sign({ userId: account.userId }, this.secret!, {
      expiresIn: "1h",
    });

    return {
      siweSession,
      token,
      user: {
        id: account.user?.id,
        username: account.user?.username,
        email: account.user?.email,
        bio: account.user?.bio,
        avatar: account.user?.avatar,
        address: account.address,
        isVerified: account.isVerified,
      },
    };
  }
}

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
      return res
        .status(400)
        .json({ error: "Missing or invalid chain parameter" });
    }

    const chain: "ethereum" | "solana" = chainId as "ethereum" | "solana";

    const account = await prisma.web3Account.findUnique({
      where: { address_chain: { address, chain } },
      include: { user: true },
    });

    if (!account) {
      return res.status(200).json({ exists: false, ownedByUser: false });
    }

    res.status(200).json({ exists: true, ownedByUser: !!account.userId });
  }
);

export const generateNonce = asyncHandler(
  async (req: Request, res: Response) => {
    // Get the secret from environment variable
    const secret = process.env.SECRET;

    if (!secret) {
      throw new Error("NONCE_SECRET environment variable is required");
    }

    // Generate a UUID
    const uuid = uuidv4();

    // Create an HMAC using the secret and UUID
    const hmac = createHmac("sha256", secret);
    hmac.update(uuid);
    const nonce = hmac.digest("hex");

    res.status(200).json({
      message: "Nonce generated successfully",
      nonce: nonce,
    });
  }
);

export const verifyAndLogin = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const { message, signature, address, chain } = req.body;

      // Validate address for login
      if (!address || typeof address !== "string") {
        return res.status(400).json({ error: "Invalid account address" });
      }

      const account = await prisma.web3Account.findUnique({
        where: { address_chain: { address, chain } },
        include: { user: true },
      });

      if (!account) {
        return res.status(404).json({ error: "Account not found" });
      }

      // Validate message and signature
      if (!message || typeof message !== "string") {
        return res.status(400).json({ error: "Invalid message" });
      }
      if (!signature || typeof signature !== "string") {
        return res.status(400).json({ error: "Missing or invalid signature" });
      }

      // Extract address and chainId from the SIWE message
      const extractedAddress = getAddressFromMessage(message);
      const chainId = getChainIdFromMessage(message);

      const publicClient = createPublicClient({
        transport: http(
          `https://rpc.walletconnect.org/v1/?chainId=${chainId}&projectId=${process.env.PROJECT_ID}`
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
        return res.status(200).json({ error: "Invalid signature" });
      }

      // Create a SIWE session
      const siwe = JSON.stringify({
        address: extractedAddress,
        chainId,
        isValid,
      });

      res.cookie("siwe", siwe, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 3600000,
        sameSite: "strict",
      });

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
    } catch (e) {
      console.error("Verification and Login Error:", e);
      res.status(500).json({ message: (e as Error).message });
    }
  }
);

import { NextFunction, Request, Response } from "express";
import { UserProfile, Web3Account } from "../types";
import { PrismaClient, Chain } from "@prisma/client";

const prisma = new PrismaClient();

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
  account: { address: string; nonce: string };
}

interface ThirdPartyCreateUserBody {
  type: "third-party";
  username: string;
  bio?: string;
  avatar?: string;
  account: { address: string; nonce: string };
}

type CreateUserBody = TurnkeyCreateUserBody | ThirdPartyCreateUserBody;

// * Create User Profile
export const createUserProfile = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const body = req.body as CreateUserBody;

      const existingUser = await prisma.user.findFirst({
        where: { OR: [{ email }, { username }] },
      });

      if (existingUser) {
        return res.status(400).json({ message: "User Already Exists" });
      }

      // Validate Username
      // - Check unique
      // - Check characters
      // - Check banned word list

      if (body.type === "turnkey") {
        // Validate Email
        // - Check unique
        // - Check format
        // - Check domain
      }

      // Validate Address
      // - Check format
      // - Check uniqueness
      // - Verify Nonce Signature

      const data = {
        username: body.username,
        bio: body.bio,
        avatar: body.avatar,
        ...(body.type === "turnkey" && { email: body.email }),
      };

      const newUser = await prisma.user.create({
        data: { username, email, bio, avatar, nonce, turnkeyWallet },
      });

      res.status(201).json({
        message: "User added Successfully",
        data: newUser,
      });
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
      const { id } = req.params;
      const user = await prisma.user.findUnique({
        where: { id },
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
          chain: acc.chain as Chain | null, // Ensuring TypeScript compatibility
          isVerified: acc.isVerified,
        })) as Web3Account[], // Explicitly casting to Web3Account[]
        socialAccounts: user.socialAccounts.map((acc) => ({
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

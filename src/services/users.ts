import { NextFunction, Request, Response } from "express";
import { UserProfile, Web3Account } from "../types";
import { PrismaClient, Chain } from "@prisma/client";
import { validateAddressWithAdamik, validateEmail, validateUsername } from "../utils/validators";
import { userInfo } from "os";

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
        bio: body.bio,
        avatar: body.avatar,
        ...(body.type === "turnkey" && { email: body.email }),
      };

      // TODO : UPON VALIDATION ADD USER PROFILE TO THE DATABASE ( Waiting for Finalized Schema );
     
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

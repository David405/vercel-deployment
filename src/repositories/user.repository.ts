import {
  Chain,
  PrismaClient,
  SocialAccount,
  User,
  Web3Account,
} from "@prisma/client";
import prisma from "../config/database";
import { z } from "zod";

export class UserRepository {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = prisma;
  }

  /**
   * Validates if a username is available and valid
   * @param username The username to validate
   * @returns Object indicating validity and a message
   */
  async findUserByUsername(username: string): Promise<unknown> {
    // Check if username already exists
    return await this.prisma.user.findUnique({
      where: { username },
    });
  }

  /**
   * Validates if an email is available and valid
   * @param email The email to validate
   * @returns Object indicating validity and a message
   */
  async findUserByEmail(email: string): Promise<unknown> {
    return await this.prisma.user.findUnique({
      where: { email },
    });
  }

  async findUserByAddress(address: string): Promise<unknown> {
    return await this.prisma.user.findFirst({
      where: {
        web3Accounts: {
          some: {
            address: address,
          },
        },
      },
      include: {
        web3Accounts: true, // Include Web3 accounts if needed
      },
    });
  }

  /**
   * Creates a user and their associated web3 account
   * @param userData User data object
   * @param web3AccountData Web3 account data
   * @returns Created user and web3 account
   */
  async createUser(
    userData: {
      username: string;
      bio?: string | null;
      avatar?: string | null;
      email?: string | null;
      turnkeyWallet?: string | null;
      nonce: string;
    },
    web3AccountData: {
      address: string;
      chain: Chain;
      isVerified: boolean;
    }
  ): Promise<{ profile: User; wallet: Web3Account }> {
    return await this.prisma.$transaction(async (prismaClient) => {
      // Create the user
      const newUser = await prismaClient.user.create({
        data: userData,
      });

      // Create the wallet
      const newWeb3Wallet = await prismaClient.web3Account.create({
        data: {
          userId: newUser.id,
          address: web3AccountData.address,
          chain: web3AccountData.chain,
          isVerified: web3AccountData.isVerified,
        },
      });

      return {
        profile: newUser,
        wallet: newWeb3Wallet,
      };
    });
  }

  /**
   * Gets a user profile by username
   * @param username The username to search for
   * @returns User profile or null if not found
   */
  async getUserByUsername(
    username: string
  ): Promise<
    | (User & { web3Accounts: Web3Account[]; socialAccounts: SocialAccount[] })
    | null
  > {
    return await this.prisma.user.findUnique({
      where: { username },
      include: {
        web3Accounts: true,
        socialAccounts: true,
        followers: true,
        following: true,
      },
    });
  }

  /**
   * Gets a user profile by ID
   * @param id The user ID to search for
   * @returns User profile or null if not found
   */
  async getUserById(id: string): Promise<User | null> {
    return await this.prisma.user.findUnique({
      where: { id },
      include: {
        web3Accounts: true,
        socialAccounts: true,
        followers: true,
        following: true,
      },
    });
  }

  /**
   * Checks if a user follows another user
   * @param followerId The ID of the follower user
   * @param followingId The ID of the user being followed
   * @returns Boolean indicating if the follow relationship exists
   */
  async checkFollowStatus(
    followerId: string,
    followingId: string
  ): Promise<boolean> {
    const existingFollow = await this.prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId,
        },
      },
    });

    return !!existingFollow;
  }

  /**
   * Finds suggested users for a given user, excluding already followed users.
   * @param userId The ID of the current user for whom suggestions are being generated.
   * @param count The number of suggested users to return.
   * @returns A list of suggested users who are not yet followed by the given user.
   */

  async findSuggestedUsers(userId: string, count: number) {
    // Validate inputs to prevent sql injection
    const validatedInput = this.suggestedUsersSchema.parse({ userId, count });

    return await this.prisma.$queryRaw<
      {
        id: string;
        username: string;
        avatar: string | null;
      }[]
    >`
      SELECT u.id, u.username, u.avatar
      FROM "User" u
      WHERE u.id != ${validatedInput.userId}
      AND NOT EXISTS (
        SELECT 1 FROM "Follow" f
        WHERE f."followerId" = ${validatedInput.userId} AND f."followingId" = u.id
      )
      ORDER BY RANDOM()
      LIMIT ${validatedInput.count};
    `;
  }

  private suggestedUsersSchema = z.object({
    userId: z.string().uuid(),
    count: z.number().int().positive().max(50),
  });
}

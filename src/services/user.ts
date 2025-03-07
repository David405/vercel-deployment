import { Chain, Web3Account as PrismaWeb3Account, User } from "@prisma/client";
import { UserRepository } from "../repositories/userRepository";
import { UserProfile } from "../types";
import { validateAddressWithAdamik } from "../utils/validators";

export type account = {
  address: string;
  nonce: string;
  chainId: string;
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

export interface ThirdPartyCreateUserBody {
  type: "third-party";
  username: string;
  bio?: string;
  avatar?: string;
  account: account;
  message: string;
  signature: string;
}

export type CreateUserBody = TurnkeyCreateUserBody | ThirdPartyCreateUserBody;

export class UserService {
  private userRepository: UserRepository;

  constructor() {
    this.userRepository = new UserRepository();
  }

  /**
   * Validates if a username is available
   * @param username The username to validate
   * @returns Object indicating validity and a message
   */
  async validateUsername(username: string): Promise<{ valid: boolean; message: string }> {
    try {
      return await this.userRepository.validateUsername(username);
    } catch (error) {
      console.error("Error validating username:", error);
      throw error;
    }
  }

  /**
   * Validates an email address
   * @param email The email to validate
   * @returns Object indicating validity and a message
   */
  async validateEmail(email: string): Promise<{ valid: boolean; message: string }> {
    try {
      return await this.userRepository.validateEmail(email);
    } catch (error) {
      console.error("Error validating email:", error);
      throw error;
    }
  }

  /**
   * Creates a new user profile with associated web3 account
   * @param userData The user data to create
   * @returns The created user and web3 account
   */
  async createUser(userData: CreateUserBody): Promise<{ profile: User; wallet: PrismaWeb3Account }> {
    try {
      // Validate username
      const validUser = await this.userRepository.validateUsername(userData.username);
      if (!validUser.valid) {
        throw new Error(validUser.message);
      }

      // Validate email for turnkey users
      if (userData.type === "turnkey") {
        const validEmail = await this.userRepository.validateEmail(userData.email);
        if (!validEmail.valid) {
          throw new Error(validEmail.message);
        }
      }

      // Validate wallet address
      const validAddress = await validateAddressWithAdamik(userData.account);
      if (!validAddress.valid) {
        throw new Error(validAddress.message);
      }
      
      // Validate chain ID
      if (userData.account.chainId !== 'ethereum' && userData.account.chainId !== 'solana') {
        throw new Error("Invalid chain parameter");
      }
      
      // Prepare user data
      const userDataForRepo = {
        username: userData.username,
        bio: userData.bio || null,
        avatar: userData.avatar || null,
        email: userData.type === "turnkey" ? userData.email : null,
        turnkeyWallet: userData.type === "turnkey" ? userData.account.address : null,
        nonce: userData.account.nonce,
      };
      
      // Prepare web3 account data
      const web3AccountData = {
        address: userData.account.address,
        chain: userData.account.chainId as Chain,
        isVerified: false
      };
      
      // Create the user and web3 account
      return await this.userRepository.createUser(userDataForRepo, web3AccountData);
    } catch (error) {
      console.error("Error creating user:", error);
      throw error;
    }
  }

  /**
   * Gets a user profile by username
   * @param username The username to lookup
   * @returns The formatted user profile or null if not found
   */
  async getUserProfile(username: string): Promise<UserProfile | null> {
    try {
      const user = await this.userRepository.getUserByUsername(username);
      
      if (!user) {
        return null;
      }
      
      // Format the user data for the response
      return {
        id: user.id,
        username: user.username,
        bio: user.bio || undefined,
        avatar: user.avatar || undefined,
        email: user.email || undefined,
        web3Accounts: user.web3Accounts.map((acc) => ({
          address: acc.address,
          chain: acc.chain as "ethereum" | "solana",
          isVerified: acc.isVerified,
        })),
        socialAccounts: user.socialAccounts.map((acc) => ({
          platform: acc.platform,
          username: acc.username,
        })),
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      };
    } catch (error) {
      console.error("Error getting user profile:", error);
      throw error;
    }
  }
}

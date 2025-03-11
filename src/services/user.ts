import { Chain, Web3Account as PrismaWeb3Account, User } from "@prisma/client";
import axios from "axios";
import { UserRepository } from "../repositories/user-repository";
import { UserProfile } from "../types";
import { CustomError } from "../utils/errors";

export type account = {
  address: string;
  nonce: string;
  chainId: string;
};

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
  async validateUsername(
    username: string
  ): Promise<{ valid: boolean; message: string }> {
    // Check if username is empty
    if (username.length <= 0) {
      throw CustomError.BadRequest("Invalid Username", "Username is required");
    }

    // Check if username is too long
    if (username.length > 20) {
      throw CustomError.BadRequest("Invalid Username", "Username is too long");
    }

    // Check if username is too short or too long
    const CHECK_USERNAME_LENGTH_AND_CHARACTERS = /^[a-zA-Z0-9_]{3,20}$/;
    if (!CHECK_USERNAME_LENGTH_AND_CHARACTERS.test(username)) {
      throw CustomError.BadRequest(
        "Invalid Username",
        "Invalid characters in username"
      );
    }

    // Check if username contains banned words
    // TODO: Check if username contains banned words
    const bannedWords: string[] = []; // This should be populated from a configuration or database
    if (bannedWords.some((word) => username.toLowerCase().includes(word))) {
      throw CustomError.BadRequest(
        "Invalid Username",
        "Username contains banned words"
      );
    }

    // Check if username already exists
    const existingUser = await this.userRepository.findUserByUsername(username);
    if (!existingUser) {
      return { valid: true, message: "Username is available" };
    } else {
      throw CustomError.BadRequest(
        "Invalid Username",
        "Username is already taken"
      );
    }
  }

  /**
   * Validates an email address
   * @param email The email to validate
   * @returns Object indicating validity and a message
   */
  async validateEmail(
    email: string
  ): Promise<{ valid: boolean; message: string }> {
    // Check if email is empty
    if (!email || email.trim().length === 0) {
      throw CustomError.BadRequest("Email is required");
    }

    // Validate email format
    const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!EMAIL_REGEX.test(email)) {
      throw CustomError.BadRequest("Invalid email format");
    }

    // Check if email is already registered
    const existingUser = await this.userRepository.findUserByEmail(email);
    if (existingUser) {
      throw CustomError.BadRequest("Email is already taken");
    }

    return { valid: true, message: "Email is available" };
  }

  async validateAddress({
    address,
    chainId,
  }: {
    address: string;
    chainId: string;
  }): Promise<{ valid: boolean; message: string }> {
    if (!address || !chainId) {
      throw CustomError.BadRequest("Address and Chain ID are required");
    }

    const existingUser = await this.userRepository.findUserByAddress(address);
    if (existingUser) {
      throw CustomError.BadRequest("Address already exists");
    }

    const apiKey = process.env.ADAMIK_API_KEY;
    if (!apiKey) {
      throw CustomError.InternalServerError("Adamik API key is missing");
    }

    const response = await axios.post(
      `https://api.adamik.io/api/${chainId}/address/validate`,
      { address },
      {
        headers: {
          Authorization: apiKey,
          "Content-Type": "application/json",
        },
      }
    );

    if (response.data?.valid) {
      return { valid: true, message: "Address is valid" };
    }
    return { valid: false, message: "Address is invalid" };
  }

  /**
   * Creates a new user profile with associated web3 account
   * @param userData The user data to create
   * @returns The created user and web3 account
   */
  async createUser(
    userData: CreateUserBody
  ): Promise<{ profile: User; wallet: PrismaWeb3Account }> {
    // Validate username
    const validUser = await this.validateUsername(userData.username);
    if (!validUser.valid) {
      throw new Error(validUser.message);
    }

    // Validate email for turnkey users
    if (userData.type === "turnkey") {
      const validEmail = await this.validateEmail(userData.email);
      if (!validEmail.valid) {
        throw new Error(validUser.message);
      }
    }

    // Validate wallet address
    const validAddress = await this.validateAddress(userData.account);
    if (!validAddress.valid) {
      throw new Error(validAddress.message);
    }

    // Validate chain ID
    if (
      userData.account.chainId !== "ethereum" &&
      userData.account.chainId !== "solana"
    ) {
      throw new Error("Invalid chain parameter");
    }

    // Prepare user data
    const userDataForRepo = {
      username: userData.username,
      bio: userData.bio || null,
      avatar: userData.avatar || null,
      email: userData.type === "turnkey" ? userData.email : null,
      turnkeyWallet:
        userData.type === "turnkey" ? userData.account.address : null,
      nonce: userData.account.nonce,
    };

    // Prepare web3 account data
    const web3AccountData = {
      address: userData.account.address,
      chain: userData.account.chainId as Chain,
      isVerified: false,
    };

    // Create the user and web3 account
    return await this.userRepository.createUser(
      userDataForRepo,
      web3AccountData
    );
  }

  /**
   * Gets a user profile by username
   * @param username The username to lookup
   * @returns The formatted user profile or null if not found
   */
  async getUserProfile(username: string): Promise<UserProfile> {
    const user = await this.userRepository.getUserByUsername(username);
    if (!user) {
      throw CustomError.NotFound("User not found");
    }

    return {
      id: user.id,
      username: user.username,
      bio: user.bio ?? undefined,
      avatar: user.avatar ?? undefined,
      email: user.email ?? undefined,
      web3Accounts:
        user.web3Accounts?.map(({ address, chain, isVerified }) => ({
          address,
          chain: chain as "ethereum" | "solana",
          isVerified,
        })) ?? [],
      socialAccounts:
        user.socialAccounts?.map(({ platform, username }) => ({
          platform,
          username,
        })) ?? [],
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}

import { Chain, Web3Account as PrismaWeb3Account, User } from "@prisma/client";
import axios from "axios";
import { UserRepository } from "../repositories";
import { UserProfile } from "../types";
import { CustomError } from "../utils/errors";
import { verifySignature } from "../utils/verifySignature";
import { REGEX } from "../utils/constant";
import { UserValidation } from "../validations";
import { validateObjectOrThrowError } from "../utils/validateObject";

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

export interface IValidationResponse {
  valid: boolean;
  message: string;
}

export type CreateUserBody = TurnkeyCreateUserBody | ThirdPartyCreateUserBody;

export class UserService {
  private userRepository: UserRepository;

  constructor() {
    this.userRepository = new UserRepository();
  }

  /**
   * Creates a new user profile with associated web3 account
   * @param userData The user data to create
   * @returns The created user and web3 account
   */
  async createUser(
    userData: CreateUserBody
  ): Promise<{ profile: User; wallet: PrismaWeb3Account }> {
    //Validate username
    const validatedUserData = validateObjectOrThrowError(
      userData as unknown as Record<string, unknown>,
      UserValidation.createUserSchema,
      "Validation Error in createUser function"
    );
    userData = validatedUserData;

    // Validate username
    const isValidUsername = await this.validateUsername(userData.username);
    if (!isValidUsername.valid) {
      throw new Error(isValidUsername.message);
    }

    // Validate wallet address
    const validAddress = await this.validateAddress(userData.account);
    if (!validAddress.valid) {
      throw new Error(validAddress.message);
    }

    // Verfiy signature
    const isValidSignature = await verifySignature(
      userData.message,
      userData.signature
    );
    if (!isValidSignature) {
      throw CustomError.BadRequest("Invalid signature");
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
      isVerified: true,
    };

    const newUser = await this.userRepository.createUser(
      userDataForRepo,
      web3AccountData
    );

    return newUser;
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

  /**
   * Validates if a username is available
   * @param username The username to validate
   * @returns Object indicating validity and a message
   */
  async validateUsername(username: string): Promise<IValidationResponse> {
    try {
      const validatedData = validateObjectOrThrowError(
        { username },
        UserValidation.usernameSchema,
        "Validation Error in validateUsername function"
      );
      username = validatedData.username;
    } catch (error) {
      const validationError = error as { cause: string };
      return { valid: false, message: validationError.cause };
    }

    // Check if username contains banned words
    // TODO: Check if username contains banned words
    const bannedWords: string[] = []; // This should be populated from a configuration or database
    if (bannedWords.some((word) => username.includes(word))) {
      return { valid: false, message: "Username contains banned words" };
    }
    // Check if username already exists
    const existingUser = await this.userRepository.findUserByUsername(username);
    return existingUser
      ? { valid: false, message: "Username is already taken" }
      : { valid: true, message: "Username is available" };
  }

  /**
   * Validates an email address
   * @param email The email to validate
   * @returns Object indicating validity and a message
   */
  async validateEmail(email: string): Promise<IValidationResponse> {
    // Additional safeguard: re-check length in case of non-controller invocations.
    if (!email || email.trim().length === 0) {
      throw CustomError.BadRequest("Invalid Email", "Email is required");
    }

    // Validate email format
    if (!REGEX.EMAIL.test(email)) {
      throw CustomError.BadRequest("Invalid Email", "Invalid email format");
    }
    // Check if email is already registered
    const existingUser = await this.userRepository.findUserByEmail(email);
    if (existingUser) {
      throw CustomError.BadRequest("Invalid Email", "Email is already taken");
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
    const existingUser = await this.userRepository.findUserByAddress(address);
    if (existingUser) {
      throw CustomError.BadRequest("Invalid Address", "Address already exists");
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
    } else {
      throw CustomError.BadRequest(
        "Invalid Address",
        "Address not valid according to Adamik"
      );
    }
  }

  async getUsersMetadata(username: string): Promise<Partial<UserProfile>> {
    const validatedData = validateObjectOrThrowError(
      { username },
      UserValidation.usernameSchema,
      "Validation Error in validateUsername function"
    );
    username = validatedData.username;

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
      socialAccounts:
        user.socialAccounts?.map(({ platform, username }) => ({
          platform,
          username,
        })) ?? [],
    };
  }
}

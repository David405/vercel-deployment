import { createHmac } from "crypto";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";

import { CustomError } from "../utils/errors";
import {
  getAddressFromMessage,
  getChainIdFromMessage
} from "../utils/helpers";

import { AuthRepository } from "../repositories";


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

    if (!message || typeof message !== "string") {
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

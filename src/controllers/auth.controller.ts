import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { z } from "zod";
import { AuthService } from "../services";
import { asyncHandler, customRequestHandler } from "../utils/requests.utils";

const accountAddressRequestSchema = z.object({
  address: z
    .string({
      required_error: "Address is required in request",
    })
    .min(1, "Address is required in request"),
  chainId: z.string(),
});

const verifyAndLoginSchema = z.object({
  message: z.string().min(1, "Message is required"),
  signature: z.string().min(1, "Signature is required"),
  address: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid Ethereum address"),
  chain: z.string().min(1, "Chain is required"),
});

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  /**
   * Checks if a web3 account address exists
   * @param req Express request object
   * @param res Express response object
   */
  checkAccountAddress = asyncHandler(async (req: Request, res: Response) =>
    customRequestHandler(
      req,
      res,
      StatusCodes.OK,
      { source: "query", schema: accountAddressRequestSchema },
      async (req) => {
        const { address, chainId } = req.query as {
          address: string;
          chainId: string;
        };
        return await this.authService.checkAccountAddress({
          address,
          chainId,
        });
      }
    )
  );

  /**
   * Generates a nonce for authentication
   * @param req Express request object
   * @param res Express response object
   */
  generateNonce = asyncHandler(async (req: Request, res: Response) =>
    customRequestHandler(req, res, StatusCodes.OK, undefined, async () => {
      return await this.authService.generateNonce();
    })
  );

  /**
   * Verifies a signature and logs in the user
   * @param req Express request object containing message, signature, address, and chain in the body
   * @param res Express response object
   */
  verifyAndLogin = (req: Request, res: Response) =>
    customRequestHandler(
      req,
      res,
      StatusCodes.OK,
      {
        source: "body",
        schema: verifyAndLoginSchema, // Ensure you have a Zod schema for validation
      },
      async (req) => {
        const { message, signature, address, chain } = req.body;
        return await this.authService.verifyAndLogin({
          message,
          signature,
          address,
          chain,
        });
      }
    );
}

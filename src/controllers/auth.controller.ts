import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { AuthService } from "../services";
import { CustomError } from "../utils/errors";
import { asyncHandler, customRequestHandler } from "../utils/requests.utils";
import { verifySignature } from "../utils/verifySignature";
import { AuthValidation } from "../validations";

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
      { querySchema: AuthValidation.accountAddressRequestSchema },
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
        bodySchema: AuthValidation.verifyAndLoginSchema, // Ensure you have a Zod schema for validation
      },
      async (req) => {
        const { message, signature, address, chain } = req.body;
        const isValidSignature = await verifySignature(message, signature);
        if (!isValidSignature) {
          throw CustomError.BadRequest("Invalid signature");
        }

        const result = await this.authService.verifyAndLogin({
          message,
          signature,
          address,
          chain,
        });
        // Set cookies for SIWE session and token
        res.cookie("siweSession", result.siweSession, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          maxAge: 3600000,
          sameSite: "strict",
        });

        res.cookie("token", result.token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          maxAge: 3600000,
          sameSite: "strict",
        });

        return result.user;
      }
    );
}

import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { asyncHandler } from "../utils/asyncHandler";
import { handleError, CustomError } from "../utils/errors";
import { AuthService, CreateUserBody } from "../services";
import { sendJsonResponse } from "../utils/sendJsonResponse";

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
  checkAccountAddress = asyncHandler(async (req: Request, res: Response) => {
    try {
      const { address, chainId } = req.query as {
        address?: string;
        chainId?: string;
      };

      if (!address || !chainId) {
        throw CustomError.BadRequest("Address and Chain ID are required");
      }

      const result = await this.authService.checkAccountAddress({
        address,
        chainId,
      });
      return sendJsonResponse(res, StatusCodes.OK, result);
    } catch (error) {
      return handleError(res, error as Error | CustomError);
    }
  });

  generateNonce = asyncHandler(async (req: Request, res: Response) => {
    try {
      const nonce = await this.authService.generateNonce();
      return sendJsonResponse(res, StatusCodes.OK, nonce);
    } catch (error) {
      return handleError(res, error as Error | CustomError);
    }
  });

  verifyAndLogin = asyncHandler(async (req: Request, res: Response) => {
    try {
      const { message, signature, address, chain } = req.body;
      const user = await this.authService.verifyAndLogin({
        message,
        signature,
        address,
        chain,
      });
      return sendJsonResponse(res, StatusCodes.OK, user);
    } catch (error) {
      return handleError(res, error as Error | CustomError);
    }
  });
}

import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { CreateUserBody, UserService } from "../services/user";
import { asyncHandler } from "../utils/asyncHandler";
import { getErrorDetails, sendErrorResponse } from "../utils/sendErrorResponse";

export class UserController {
  private userService: UserService;

  constructor() {
    this.userService = new UserService();
  }

  /**
   * Validates if a username is available
   * @param req Express request object
   * @param res Express response object
   */
  validateUsername = asyncHandler(async (req: Request, res: Response) => {
    try {
      const { username } = req.params;

      if (!username) {
        return sendErrorResponse(
          res,
          StatusCodes.BAD_REQUEST,
          "Username is required"
        );
      }

      const result = await this.userService.validateUsername(username);

      return res.status(StatusCodes.OK).json({
        success: result.valid,
        message: result.message,
      });
    } catch (error: unknown) {
      const { statusCode, message, stack } = getErrorDetails(error);
      return sendErrorResponse(res, statusCode, message, stack);
    }
  });

  /**
   * Creates a new user
   * @param req Express request object
   * @param res Express response object
   */
  create = asyncHandler(async (req: Request, res: Response) => {
    try {
      const userData: CreateUserBody = req.body;

      if (!userData || Object.keys(userData).length === 0) {
        return sendErrorResponse(
          res,
          StatusCodes.BAD_REQUEST,
          "User data is required"
        );
      }
      const { profile, wallet } = await this.userService.createUser(userData);

      return res.status(201).json({
        success: true,
        data: {
          profile: {
            id: profile.id,
            username: profile.username,
            bio: profile.bio,
            avatar: profile.avatar,
            email: profile.email,
            createdAt: profile.createdAt,
            updatedAt: profile.updatedAt,
          },
          wallet: {
            address: wallet.address,
            chain: wallet.chain,
            isVerified: wallet.isVerified,
          },
        },
      });
    } catch (error: unknown) {
      const { statusCode, message, stack } = getErrorDetails(error);
      return sendErrorResponse(res, statusCode, message, stack);
    }
  });

  /**
   * Gets a user profile by username
   * @param req Express request object
   * @param res Express response object
   */
  getProfile = asyncHandler(async (req: Request, res: Response) => {
    try {
      const { username } = req.params;

      if (!username) {
        return sendErrorResponse(
          res,
          StatusCodes.BAD_REQUEST,
          "Username is required"
        );
      }

      const userProfile = await this.userService.getUserProfile(username);

      if (!userProfile) {
        return sendErrorResponse(res, StatusCodes.NOT_FOUND, "User not found");
      }

      return res.status(200).json({
        success: true,
        data: userProfile,
      });
    } catch (error: unknown) {
      const { statusCode, message, stack } = getErrorDetails(error);
      return sendErrorResponse(res, statusCode, message, stack);
    }
  });
}

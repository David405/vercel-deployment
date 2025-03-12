import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { asyncHandler } from "../utils/asyncHandler";
import { handleError, CustomError } from "../utils/errors";
import { CreateUserBody, UserService } from "../services";
import { sendJsonResponse } from "../utils/sendJsonResponse";

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
        throw CustomError.BadRequest("Username is required in request params");
      }

      const result = await this.userService.validateUsername(username);

      return sendJsonResponse(res, StatusCodes.OK, result);
    } catch (error) {
      return handleError(res, error as Error | CustomError);
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
        throw CustomError.BadRequest("User data is required in request body");
      }
      const { profile, wallet } = await this.userService.createUser(userData);

      return sendJsonResponse(res, StatusCodes.CREATED, {
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
      });
    } catch (error: unknown) {
      return handleError(res, error as Error | CustomError);
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
        throw CustomError.BadRequest("Username is required in request params");
      }

      const userProfile = await this.userService.getUserProfile(username);

      if (!userProfile) {
        throw CustomError.NotFound("User not found");
      }

      return sendJsonResponse(res, StatusCodes.OK, { userProfile });
    } catch (error: unknown) {
      return handleError(res, error as Error | CustomError);
    }
  });
}

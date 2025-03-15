import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { z } from "zod";
import {
  CreateUserBody,
  IValidationResponse,
  UserService,
} from "../services/user.services";
import { asyncHandler, customRequestHandler } from "../utils/requests.utils";
import { handleError, CustomError } from "../utils/errors";
import { sendJsonResponse } from "../utils/sendJsonResponse";
import { verifySignature } from "../utils/verifySignature";

const usernameRequestSchema = z.object({
  username: z
    .string({
      required_error: "Username is required in request",
    })
    .min(1, "Username is required in request"),
});

const createUserRequestSchema = z.object({
  type: z.enum(["turnkey", "third-party"]),
  username: z.string().min(1, "Username is required in request"),
  email: z.string(),
  bio: z.string().optional(),
  avatar: z.string().optional(),
  account: z.object({
    address: z.string(),
    nonce: z.string(),
    chainId: z.string(),
  }),
  message: z.string(),
  signature: z.string(),
});

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
  validateUsername = asyncHandler(async (req: Request, res: Response) =>
    customRequestHandler(
      req,
      res,
      StatusCodes.OK,
      { source: "params", schema: usernameRequestSchema },
      async (req) => {
        return await this.userService.validateUsername(req.params.username);
      }
    )
  );

  /**
   * Creates a new user
   * @param req Express request object
   * @param res Express response object
   */
  create = asyncHandler(async (req: Request, res: Response) =>
    customRequestHandler(
      req,
      res,
      StatusCodes.CREATED,
      { source: "body", schema: createUserRequestSchema },
      async (req: Request) => {
        return await this.userService.createUser(req.body as CreateUserBody);
      }
    )
  );

      const isValidSignature = await verifySignature(userData.message, userData.signature);

      if (!isValidSignature) {
        throw CustomError.BadRequest("Invalid signature");
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
    customRequestHandler(
      req,
      res,
      StatusCodes.OK,
      { source: "params", schema: usernameRequestSchema },
      async (req: Request) => {
        return await this.userService.getUserProfile(req.params.username);
      }
    );
  });
}

import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { CreateUserBody, UserService } from "../services/user.services";
import { asyncHandler, customRequestHandler } from "../utils/requests.utils";
import { UserValidation } from "../validations";
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
      { paramSchema: UserValidation.usernameSchema },
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
      { bodySchema: UserValidation.createUserSchema},
      async (req: Request) => {
        return await this.userService.createUser(req.body as CreateUserBody);
      }
    )
  );

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
      { paramSchema: UserValidation.usernameSchema },
      async (req: Request) => {
        return await this.userService.getUserProfile(req.params.username);
      }
    );
  });
}

import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { UserService, CreateUserBody } from "../services/user";

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
    const { username } = req.params;

    if (!username) {
      return res.status(400).json({
        success: false,
        message: "Username is required",
      });
    }

    const result = await this.userService.validateUsername(username);
    
    return res.status(200).json({
      success: result.valid,
      message: result.message,
    });
  });

  /**
   * Creates a new user
   * @param req Express request object
   * @param res Express response object
   */
  create = asyncHandler(async (req: Request, res: Response) => {
    const userData: CreateUserBody = req.body;

    if (!userData) {
      return res.status(400).json({
        success: false,
        message: "User data is required",
      });
    }

    try {
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
          }
        },
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: error.message || "Failed to create user",
      });
    }
  });

  /**
   * Gets a user profile by username
   * @param req Express request object
   * @param res Express response object
   */
  getProfile = asyncHandler(async (req: Request, res: Response) => {
    const { username } = req.params;

    if (!username) {
      return res.status(400).json({
        success: false,
        message: "Username is required",
      });
    }

    const userProfile = await this.userService.getUserProfile(username);

    if (!userProfile) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: userProfile,
    });
  });
}


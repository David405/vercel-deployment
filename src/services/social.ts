import { NextFunction, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const asyncHandler =
  (fn: any) => (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

export const followUser = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const { username } = req.params;
      const currentUserId = req.user?.userId;

      if (!currentUserId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const userToFollow = await prisma.user.findUnique({
        where: { username },
      });

      if (!userToFollow) {
        return res.status(404).json({ message: "User not found" });
      }

      // Check if the current user is already following the user
      const existingFollow = await prisma.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId: currentUserId,
            followingId: userToFollow.id,
          },
        },
      });

      if (existingFollow) {
        return res.status(400).json({ message: "Already following this user" });
      }

      // Create a new follow relationship
      await prisma.follow.create({
        data: {
          followerId: currentUserId,
          followingId: userToFollow.id,
        },
      });

      res.status(200).json({ message: `You are now following ${username}` });
    } catch (error) {
      console.log(error);
      res.status(500).json({
        message: "Error following the user",
        error: error,
      });
    }
  }
);

export const isFollowingUser = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const { username } = req.params;
      const currentUserId = req.user?.userId;

      if (!currentUserId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const userToCheck = await prisma.user.findUnique({
        where: { username },
      });

      if (!userToCheck) {
        return res.status(404).json({ message: "User not found" });
      }

      // Check if there is an existing follow relationship between the current user and the user to check
      const existingFollow = await prisma.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId: currentUserId,
            followingId: userToCheck.id,
          },
        },
      });

      // Determine if the current user is following the user to check
      const isFollowing = !!existingFollow;
      res.status(200).json({ isFollowing });
    } catch (error) {
      console.log(error);
      res.status(500).json({
        message: "Error checking following status",
        error: error,
      });
    }
  }
);


import { NextFunction, Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import prisma from '../config/database';
import { getUserAndCheckFollowingStatus } from "../utils/validators";

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

export const unfollowUser = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const { username } = req.params;
      const currentUserId = req.user?.userId;

      if (!currentUserId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      // Use the helper function to check if the user is following and get user info
      const { isFollowing, userToCheck } = await getUserAndCheckFollowingStatus(currentUserId, username);

      if (!isFollowing) {
        return res.status(400).json({ message: "You do not follow this user" });
      }

      // Delete the follow relationship using the retrieved user info
      await prisma.follow.delete({
        where: {
          followerId_followingId: {
            followerId: currentUserId,
            followingId: userToCheck.id,
          },
        },
      });

      res.status(200).json({ message: "Successfully unfollowed the user" });
    } catch (error) {
      const err = error as Error; // Type assertion to Error
      if (err.message === "User not found") {
        return res.status(404).json({ message: "User not found" });
      }
      console.log(err);
      res.status(500).json({
        message: "Error unfollowing user",
        error: err,
      });
    }
  }
);

export const getFollowers = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const { username } = req.params;

      const user = await prisma.user.findUnique({
        where: { username },
      });

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const followers = await prisma.follow.findMany({
        where: { followingId: user.id },
        select: {
          follower: {
            select : {username : true, id : true , avatar:true ,email:true,bio:true,

             }
          },
        },
      });

      const followerUsers = followers.map(follow => follow.follower);
      res.status(200).json({ followers: followerUsers });
    } catch (error) {
      console.log(error);
      res.status(500).json({
        message: "Error retrieving followers",
        error: error,
      });
    }
  }
);

export const getFollowing = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const { username } = req.params;

      const user = await prisma.user.findUnique({
        where: { username },
      });

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const following = await prisma.follow.findMany({
        where: { followerId: user.id },
        select: {
          following: {
            select: { username: true, id: true, avatar: true, email: true , bio:true },
          },
        },
      });

      const followingUsers = following.map(follow => follow.following);
      res.status(200).json({ following: followingUsers });
    } catch (error) {
      console.log(error);
      res.status(500).json({
        message: "Error retrieving following",
        error: error,
      });
    }
  }
);


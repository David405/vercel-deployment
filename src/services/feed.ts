import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { prisma } from "../utils/prismaUtils";
import { OnchainActivity, Prisma, Chain } from "@prisma/client";
import { ActivityType } from "../types";


//* POST CREATION FLOW 
//* 1. Get Post Data and OnChain Activity Data from Frontend
//? 2. Validate the onchain activity
//* 3. Create the onchain activity
//* 4. Create the post
//* 5. Return the post


interface PostCreateBody {
    content: string;
    onChainActivity: OnChainActivityData;
    mediaUrl?: string;
}

interface OnChainActivityData {
    activityType: ActivityType;
    txHash: string;
    chain: "ethereum" | "solana";
    metadata?: Record<string, any>;
}



export const createPost = asyncHandler(async (req: Request, res: Response) => {
    try {
        
        const body = req.body as PostCreateBody;
        
        const currentUser = req.user?.userId;
        
        if (!currentUser) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        // Validate the presence of onChainActivity and its properties
        if (!body.onChainActivity || !body.onChainActivity.activityType || !body.onChainActivity.txHash || !body.onChainActivity.chain) {
            return res.status(400).json({ message: "Invalid onChainActivity data" });
        }

        // First, verify the user has a web3 account
        const web3Account = await prisma.web3Account.findFirst({
            where: {
                userId: currentUser
            }
        });

        if (!web3Account) {
            return res.status(400).json({ 
                message: "User must have a Web3 account to create onchain activity" 
            });
        }

        const activityData = await prisma.onchainActivity.create({
            data: {
                web3AccountId: web3Account.id,
                activityType: body.onChainActivity.activityType,
                txHash: body.onChainActivity.txHash,
                chain: body.onChainActivity.chain as Chain,
                metadata: body.onChainActivity.metadata as Prisma.InputJsonValue,
            }
        });

        const post = await prisma.post.create({
            data: {
                content: body.content,
                userId: currentUser,
                onchainActivityId: activityData.id,
                mediaUrl: body.mediaUrl,
            }
        });

        return res.status(201).json({
            message: "Post created successfully",
            post,
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: "Internal server error",
        });
    }
});

// Function to get all posts by a username
export const getPostsByUsername = asyncHandler(async (req: Request, res: Response) => {
    const { username } = req.params;

    try {
        const user = await prisma.user.findUnique({
            where: { username },
            include: { posts: true },
        });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        return res.status(200).json({ posts: user.posts });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal server error" });
    }
});

// Function to get a single post by postId
export const getPostById = asyncHandler(async (req: Request, res: Response) => {
    const { postId } = req.params;

    try {
        const post = await prisma.post.findUnique({
            where: { id: postId },
            include: { user: true, comments: true, likes: true },
        });

        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }

        return res.status(200).json({ post });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal server error" });
    }
});



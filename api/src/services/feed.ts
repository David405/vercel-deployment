import { Request, Response } from 'express';
import prisma from '../config/database';
import { OnchainActivity, Prisma, Chain } from '@prisma/client';
import { ActivityMetadata, ActivityType, Post } from '../types';
import { asyncHandler } from '../utils/requests.utils';
import { validateOnChainActivity } from '../utils/validators';

//* POST CREATION FLOW
//* 1. Get Post Data and OnChain Activity Data from Frontend
//? 2. Validate the onchain activity (Currently just checking if the onchain activity is in valid format)
//* 3. Create the onchain activity
//* 4. Create the post
//* 5. Return the post

export const createPost = asyncHandler(async (req: Request, res: Response) => {
	try {
		const body = req.body;
		const currentUserId = req.user?.userId;

		if (!currentUserId) {
			return res.status(401).json({ message: 'Unauthorized: User not logged in' });
		}

		// Validate the request body
		if (!body.content || !body.onChainActivity) {
			return res.status(400).json({ message: 'Invalid request: Missing required fields' });
		}

		// Validate onChainActivity
		if (!validateOnChainActivity(body.onChainActivity)) {
			return res.status(400).json({
				message: 'Invalid onChainActivity data: Structure does not match expected format'
			});
		}

		// Find the user's web3 account
		const web3Account = await prisma.web3Account.findFirst({
			where: {
				userId: currentUserId
			}
		});

		if (!web3Account) {
			return res.status(400).json({
				message: 'User must have a Web3 account to create onchain activity'
			});
		}

		// Create on-chain activity record
		const activityData = await prisma.onchainActivity.create({
			data: {
				web3AccountId: web3Account.id,
				activityType: body.onChainActivity.activityType,
				txHash: body.onChainActivity.txHash,
				chain: body.onChainActivity.chain as Chain,
				metadata: body.onChainActivity.metadata
			}
		});

		// Create post record
		const post = await prisma.post.create({
			data: {
				content: body.content,
				userId: currentUserId,
				onchainActivityId: activityData.id,
				mediaUrl: body.mediaUrl
			}
		});

		return res.status(201).json({
			message: 'Post created successfully',
			post
		});
	} catch (error) {
		console.error('Error creating post:', error);
		return res.status(500).json({
			message: 'Internal server error: Unable to create post'
		});
	}
});

// Function to get all posts by a username
export const getPostsByUsername = asyncHandler(async (req: Request, res: Response) => {
	const { username } = req.params;

	try {
		const user = await prisma.user.findUnique({
			where: { username },
			include: {
				posts: {
					include: {
						onchainActivity: true,
						comments: { select: { id: true } },
						likes: { select: { id: true } },
						dislikes: { select: { id: true } }
					}
				}
			}
		});

		if (!user) {
			return res.status(404).json({ message: 'User not found' });
		}

		// Format posts to match Post interface
		const formattedPosts = user.posts.map((post) => ({
			id: post.id,
			avatar: user.avatar || null,
			username: user.username || null,
			content: post.content,
			createdAt: post.createdAt,
			onChainActivity: post.onchainActivity,
			commentsCount: post.comments.length,
			likeCount: post.likes.length,
			dislikeCount: post.dislikes.length,
			mediaUrl: post.mediaUrl || null,
			engagement: post.views // engagement metric
		}));

		return res.status(200).json({
			username: username,
			userId: user.id,
			postCount: formattedPosts.length,
			posts: formattedPosts
		});
	} catch (error) {
		console.error('Error fetching posts by username:', error);
		return res.status(500).json({ message: 'Internal server error' });
	}
});

// Function to get a single post by postId
export const getPostById = asyncHandler(async (req: Request, res: Response) => {
	const { postId } = req.params;

	try {
		// Fetch post details & user info in parallel
		const [post, comments, likes, dislikes] = await Promise.all([
			prisma.post.findUnique({
				where: { id: postId },
				select: {
					id: true,
					userId: true,
					content: true,
					createdAt: true,
					mediaUrl: true,
					views: true,
					onchainActivity: true,
					user: { select: { avatar: true, username: true } }
				}
			}),
			prisma.comment.count({ where: { postId } }),
			prisma.like.count({ where: { postId } }),
			prisma.dislike.count({ where: { postId } })
		]);

		if (!post) {
			return res.status(404).json({ message: 'Post not found' });
		}

		// Format post to match interface
		const formattedPost = {
			id: post.id,
			userId: post.userId,
			avatar: post.user.avatar || undefined,
			username: post.user.username || undefined,
			createdAt: post.createdAt,
			content: post.content,
			onChainActivity: post.onchainActivity,
			commentsCount: comments,
			likeCount: likes,
			dislikeCount: dislikes,
			mediaUrl: post.mediaUrl || undefined,
			engagement: post.views
		};

		return res.status(200).json({ post: formattedPost });
	} catch (error) {
		console.error('Error fetching post by ID:', error);
		return res.status(500).json({ message: 'Internal server error' });
	}
});

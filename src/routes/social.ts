import { Router } from 'express';
import {
	followUser,
	isFollowingUser,
	unfollowUser,
	getFollowers,
	getFollowing
} from '../services/social';
import { authenticateUser } from '../middleware/auth';

const router = Router();

// Route to follow a user
router.post('/users/follow/:username', authenticateUser, followUser);

// Route to check if the current user is following another user
router.get('/users/follow-status/:username', authenticateUser, isFollowingUser);

// Route to unfollow a user
router.post('/users/unfollow/:username', authenticateUser, unfollowUser);

// Route to get the list of followers for a user
router.get('/users/:username/followers', authenticateUser, getFollowers);

// Route to get the list of users a user is following
router.get('/users/:username/following', authenticateUser, getFollowing);

export default router;

import { Router } from "express";
import { followUser, isFollowingUser } from "../services/social";
import { authenticateUser } from "../middleware/auth";

const router = Router();

// Route to follow a user
router.post("/users/follow/:username", authenticateUser, followUser);

// Route to check if the current user is following another user
router.get("/users/follow-status/:username", authenticateUser, isFollowingUser);

export default router;
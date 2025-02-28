import { Router } from "express";
import { createPost, getPostsByUsername, getPostById } from "../services/feed";
import { authenticateUser } from "../middleware/auth";

const router = Router();

router.post("/feed/users/post", authenticateUser, createPost);
router.get("/feed/users/posts/:username", authenticateUser, getPostsByUsername);
router.get("/feed/posts/:postId", authenticateUser, getPostById);

export default router;
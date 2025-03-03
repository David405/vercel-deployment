import { Router } from "express";
import { createPost, getPostsByUsername, getPostById } from "../services/feed";
import { authenticateUser } from "../middleware/auth";

const router = Router();

router.post("/feed/posts/create", authenticateUser, createPost);
router.get("/feed/posts/:username", authenticateUser, getPostsByUsername);
router.get("/feed/post/:postId", authenticateUser, getPostById);

export default router;
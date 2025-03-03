import { Router } from "express";
import { checkUsername, createUserProfile, getUserProfile } from "../services/user";
import { authenticateUser } from "../middleware/auth";

const router = Router();

router.post("/users/create" , createUserProfile);
router.get("/users/:username" , authenticateUser, getUserProfile);
router.get("/users/validate-username/:username",checkUsername);

export default router;

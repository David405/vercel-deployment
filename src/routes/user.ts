import { Router } from "express";
import { checkUsername, createUserProfile, getUserProfile, loginWithAddress } from "../services/users";
import { authenticateUser } from "../middleware/auth";

const router = Router();

router.post("/users/create" , createUserProfile);
router.get("/users/:username" , authenticateUser, getUserProfile);
router.get("/users/validate-username/:username",checkUsername);
router.post("/users/login", loginWithAddress);

export default router;

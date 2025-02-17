import { Router } from "express";
import { checkUsername, createUserProfile, getUserProfile } from "../services/users";

const router = Router();

router.post("/users/create" , createUserProfile);
router.get("/users/:username" , getUserProfile);
router.get("/users/validate-username/:username",checkUsername);

export default router;

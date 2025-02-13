import { Router } from "express";
import { createUserProfile, getUserProfile } from "../services/users";

const router = Router();

router.post("/user/create" , createUserProfile);
router.get("/user/:id" , getUserProfile);

export default router;

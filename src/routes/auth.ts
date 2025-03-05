import express from "express";
import { checkAccountAddress, verifyAccountAddress, loginWithAddress } from "../services/auth";

const router = express.Router();

router.get("/auth/check-address", checkAccountAddress);
router.post("/auth/verify", verifyAccountAddress);
router.post("/auth/login", loginWithAddress);

export default router;

import express from "express";
import { checkAccountAddress, generateNonce, verifyAndLogin } from "../services/auth";

const router = express.Router();

router.get("/auth/check-address", checkAccountAddress);
router.get("/auth/nonce", generateNonce);
router.post("/auth/login", verifyAndLogin);

export default router;

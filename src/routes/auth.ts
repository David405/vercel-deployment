import express from "express";
import { authController } from "../controllers";

const router = express.Router();

router.get("/auth/check-address", authController.checkAccountAddress);
router.get("/auth/nonce", authController.generateNonce);
router.post("/auth/login", authController.verifyAndLogin);

export default router;

import express from "express";
import { checkAccountAddress, verifyAndLogin } from "../services/auth";

const router = express.Router();

router.get("/auth/check-address", checkAccountAddress);
router.post("/auth/login", verifyAndLogin);

export default router;

import express from "express";
import { checkAccountAddress } from "../services/address";

const router = express.Router();

router.get("/users/check-address", checkAccountAddress);

export default router;

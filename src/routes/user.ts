import { Router } from "express";
import { userController } from "../controllers";
import { authenticateUser } from "../middleware/auth";

const router = Router();

router.post("/users/create", userController.create);
router.get("/users/:username", authenticateUser, userController.getProfile);
router.get("/users/validate-username/:username", userController.validateUsername);

export default router;

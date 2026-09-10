import express from "express";
import { changePassword, getUser, updateUser } from "../controllers/userController.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();

router.patch("/change-password", authMiddleware, changePassword);
router.get("/user-profile", authMiddleware, getUser);
router.patch("/update-user", authMiddleware, updateUser);

export default router;

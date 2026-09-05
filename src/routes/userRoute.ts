import express from "express";
import { changePassword } from "../controllers/userController.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();

router.patch("/change_password", authMiddleware, changePassword);

export default router;

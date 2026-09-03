import express from "express";
import {registerController, loginController, refreshController, logoutController} from "../controllers/authController.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/register", registerController);
router.post("/login", loginController);
router.post("/refresh_token", refreshController);
router.post("/logout", logoutController);

export default router;

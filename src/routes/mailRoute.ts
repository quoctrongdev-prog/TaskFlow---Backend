import express from "express";
import { resendVerifyEmail, verifyEmail, forgotPassword } from "../controllers/mailController.js";
// testEmail, 
const router = express.Router();

// router.post('/test-email', testEmail);
router.get("/verify-email", verifyEmail);
router.post("/resend-email", resendVerifyEmail);
router.get("/forgot-password", forgotPassword);

export default router;

import express from "express";
import { resendVerifyEmail, resetPassword, sendResetPassword, verifyEmail } from "../controllers/mailController.js";
// testEmail, 
const router = express.Router();

// router.post('/test-email', testEmail);
router.get("/verify-email", verifyEmail);
router.post("/resend-email", resendVerifyEmail);
router.post("/reset-link", sendResetPassword);
router.post("/reset-password", resetPassword);

export default router;

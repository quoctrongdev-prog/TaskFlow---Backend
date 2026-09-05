import express from "express";
import { testEmail, verifyEmail } from "../controllers/mailController.js";

const router = express.Router();

router.post('/test-email', testEmail);
router.get("/verify-email", verifyEmail);

export default router;

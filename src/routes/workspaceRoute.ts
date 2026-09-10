import express from "express";
import authMiddleware from "../middlewares/authMiddleware.js";
import { createWorkspace } from "../controllers/workspaceController.js";

const router = express.Router();

router.post("/create-workspace", authMiddleware, createWorkspace);

export default router;

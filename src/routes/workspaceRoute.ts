import express from "express";
import authMiddleware from "../middlewares/authMiddleware.js";
import { createWorkspace, getWorkspace, workspaceDetail } from "../controllers/workspaceController.js";

const router = express.Router();

router.post("/create-workspace", authMiddleware, createWorkspace);
router.get("/get-workspaces", authMiddleware, getWorkspace);
router.get("/workspace-detail", authMiddleware, workspaceDetail);

export default router;

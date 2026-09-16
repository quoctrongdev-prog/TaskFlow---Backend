import express from "express";
import authMiddleware from "../middlewares/authMiddleware.js";
import { createWorkspace, deleteWorkspace, getWorkspace, updateRole, updateWorkspace, workspaceDetail } from "../controllers/workspaceController.js";
import { sendInvitation } from "../controllers/invitationsController.js";

const router = express.Router();

router.post("/create-workspace", authMiddleware, createWorkspace);
router.get("/get-workspaces", authMiddleware, getWorkspace);
router.get("/:workspaceId", authMiddleware, workspaceDetail);
router.patch("/update/:workspaceId", authMiddleware, updateWorkspace);
router.patch("/update-role/:workspaceId/:userId", authMiddleware, updateRole);
router.delete("/delete/:workspaceId", authMiddleware, deleteWorkspace);
router.post("/send-invitation/:workspaceId", authMiddleware, sendInvitation)

export default router;

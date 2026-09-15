import sql from "../config/db.js";
import ErrorHandler from "../config/errorHandler.js";
import dotenv from "dotenv";
import { Response } from "express";
import { AuthRequest } from "../middlewares/authMiddleware.js";

export const sendInvitation = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.userId;
    const workspaceId = req.params.workspaceId;
    const email = req.body.email?.toLowerCase().trim();

    if (!user) {
      throw new ErrorHandler(401, "Athentication required");
    }

    if (!email) {
      throw new ErrorHandler(400, "Email is required");
    }

    const [currentMember] = await sql`SELECT user_id, workspace_id from workspace_members
    WHERE workspace_id = ${workspaceId} AND user_id = ${user}`;

    if (currentMember.length > 0) {
      throw new ErrorHandler(
        409,
        "This user is already a member of this workspace",
      );
    }

    if (currentMember.role !== "Admin") {
      throw new ErrorHandler(
        403,
        "You don't have permission to send invitation",
      );
    }




  } catch (error) {
    throw error;
  }
};

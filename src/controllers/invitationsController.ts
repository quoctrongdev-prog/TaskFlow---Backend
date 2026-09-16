import sql from "../config/db.js";
import ErrorHandler from "../config/errorHandler.js";
import { Response } from "express";
import { AuthRequest } from "../middlewares/authMiddleware.js";
import { sendInvitationEmail } from "../utils/sendVerificationEmail.js";
import { generateSecureToken } from "../utils/generateSecureToken.js";
import crypto from "crypto";

export const sendInvitation = async (req: AuthRequest, res: Response) => {
  try {
    const inviterId = req.userId;
    const workspaceId = req.params.workspaceId;
    const email = req.body.email?.toLowerCase().trim();

    if (!inviterId) {
      throw new ErrorHandler(401, "Athentication required");
    }

    if (!email) {
      throw new ErrorHandler(400, "Email is required");
    }

    const currentMember =
      await sql`SELECT user_id, workspace_id, role from workspace_members
    WHERE workspace_id = ${workspaceId} AND user_id = ${inviterId}`;

    if (currentMember.length === 0) {
      throw new ErrorHandler(
        404,
        "Workspace not found or you don't have access",
      );
    }

    if (currentMember[0].role !== "Admin") {
      throw new ErrorHandler(
        403,
        "You don't have permission to send invitation",
      );
    }

    const existInWorkspace =
      await sql`SELECT u.user_id , u.email, m.workspace_id FROM users 
    AS u JOIN workspace_members AS m ON u.user_id = m.user_id
    WHERE u.email = ${email} AND m.workspace_id = ${workspaceId}`;

    const [inviter] =
      await sql`SELECT user_id, name FROM users WHERE user_id = ${inviterId}`;

    const [workspace_name] =
      await sql`SELECT workspace_id, name FROM workspaces WHERE workspace_id = ${workspaceId}`;

    if (existInWorkspace.length > 0) {
      throw new ErrorHandler(
        409,
        "This user already a member of this workspace",
      );
    }

    if (!workspace_name) {
      throw new ErrorHandler(404, "Workspace not found");
    }

    if (!inviter) {
      throw new ErrorHandler(404, "User not found");
    }

    const { token, tokenHash } = generateSecureToken();

    const expiresAt = new Date();
    //đặt phút của expiresAt thành phút thứ 15 sau phút hiện tại của expiresAt
    expiresAt.setMinutes(expiresAt.getMinutes() + 15);

    const [invitation] =
      await sql`INSERT INTO workspace_invitations (workspace_id, email, role, token, status, invited_by, expires_at)
    VALUES (${workspaceId}, ${email}, ${"Member"}, ${tokenHash}, ${"Pending"}, ${inviterId}, ${expiresAt})
    RETURNING  workspace_id, email, role, status, invited_by, expires_at, created_at`;

    await sendInvitationEmail(email, token, inviter.name, workspace_name.name);

    res.status(200).json({
      message: "Send invitation successfully",
      invitation: invitation,
    });
  } catch (error) {
    throw error;
  }
};

export const acceptInvitation = async (req: AuthRequest, res: Response) => {
  try {
    const { token } = req.query;
    const acceptingUserId = req.userId;

    if (!token || typeof token !== "string") {
      throw new ErrorHandler(400, "Verification token is required");
    }

    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    const verificationToken = await sql`
      SELECT email, status, expires_at
      FROM workspace_invitations
      WHERE token = ${tokenHash}
    `;

    if (verificationToken.length === 0) {
      throw new ErrorHandler(400, "Invalid verification token");
    }

    const record = verificationToken[0];

    if (new Date(record.expires_at) < new Date()) {
      throw new ErrorHandler(400, "Verification token has expired");
    }

    const [hasAccount] = await sql`SELECT user_id, email
    FROM users WHERE email = ${record.email}`;

    if(!hasAccount){
      res.json({
        "status": "REGISTER_REQUIRED"
      })
    }

    

  } catch (error) {}
};

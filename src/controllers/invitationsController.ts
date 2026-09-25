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
    console.log(error)
    throw error;
  }
};

export const acceptInvitation = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { token } = req.body;

    if (!userId) {
      throw new ErrorHandler(401, "Authentication required");
    }

    if (!token) {
      throw new ErrorHandler(400, "Invitation token is required");
    }

    // Lấy thông tin user đang đăng nhập
    const [user] = await sql`
      SELECT user_id, email
      FROM users
      WHERE user_id = ${userId}
    `;

    if (!user) {
      throw new ErrorHandler(404, "User not found");
    }

    // Hash token nhận từ client
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    // Tìm invitation
    const [invitation] = await sql`
      SELECT
        invitation_id,
        workspace_id,
        email,
        role,
        status,
        expires_at,
        invited_by
      FROM workspace_invitations
      WHERE token = ${tokenHash}
    `;

    if (!invitation) {
      throw new ErrorHandler(400, "Invalid invitation token");
    }

    // Kiểm tra invitation đã được sử dụng chưa
    if (invitation.status !== "Pending") {
      throw new ErrorHandler(400, "This invitation is no longer available");
    }

    // Kiểm tra hết hạn
    if (new Date(invitation.expires_at) < new Date()) {
      await sql`
        UPDATE workspace_invitations
        SET status = 'Expired'
        WHERE invitation_id = ${invitation.invitation_id}
      `;

      throw new ErrorHandler(400, "This invitation has expired");
    }

    // Kiểm tra invitation có đúng email của user không
    if (user.email !== invitation.email) {
      throw new ErrorHandler(403, "This invitation is not for you");
    }

    // Kiểm tra user đã là member chưa
    const [existingMember] = await sql`
      SELECT workspace_member_id
      FROM workspace_members
      WHERE workspace_id = ${invitation.workspace_id}
        AND user_id = ${userId}
    `;

    if (existingMember) {
      throw new ErrorHandler(409, "You are already a member of this workspace");
    }

    const [member] = await sql`
    INSERT INTO workspace_members (
    workspace_id,
    user_id,
    role,
    invited_by
    )
  VALUES (
    ${invitation.workspace_id},
    ${userId},
    'Member',
    ${invitation.invited_by}
  )
  RETURNING
    workspace_member_id,
    workspace_id,
    user_id,
    role,
    joined_at
`;

    // Đánh dấu invitation đã được accept
    await sql`
      UPDATE workspace_invitations
      SET status = 'Accepted'
      WHERE invitation_id = ${invitation.invitation_id}
    `;

    return res.status(200).json({
      message: "Invitation accepted successfully",
      member,
    });
  } catch (error) {
    throw error;
  }
};

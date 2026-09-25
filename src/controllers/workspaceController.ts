import sql from "../config/db.js";
import ErrorHandler from "../config/errorHandler.js";
import dotenv from "dotenv";
import { Response } from "express";
import { AuthRequest } from "../middlewares/authMiddleware.js";

export const createWorkspace = async (req: AuthRequest, res: Response) => {
  try {
    //Lấy id user xem đã đăng nhập chưa
    const user = req.userId;
    if (!user) {
      throw new ErrorHandler(401, "Athentication required");
    }

    const { name, description } = req.body;
    const createdBy = user;

    if (typeof name !== "string" || name.trim() === "") {
      throw new ErrorHandler(400, "Name is required");
    }

    const existWorkspace =
      await sql`SELECT workspace_id from workspaces WHERE name = ${name}`;

    if (existWorkspace.length > 0) {
      throw new ErrorHandler(409, "Workspace with this name already exists");
    }

    await sql`BEGIN`;

    const workspace =
      await sql`INSERT INTO workspaces (name, description, created_by) VALUES
    (${name}, ${description}, ${createdBy}) RETURNING
    workspace_id, name, description, created_by, created_at`;

    const workspaceId = workspace[0].workspace_id;
    const role = "Admin";

    await sql`INSERT INTO workspace_members (workspace_id, user_id, role) VALUES
    (${workspaceId}, ${createdBy}, ${role})`;

    await sql`COMMIT`;

    res.json({
      message: "Create workspace successfully!",
      workspace: workspace[0],
    });
  } catch (error) {
    console.log(error);
    await sql`ROLLBACK`;
    throw error;
  }
};

export const getWorkspace = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.userId;
    if (!user) {
      throw new ErrorHandler(401, "Athentication required");
    }

    const workspaces = await sql`SELECT
    w.workspace_id,
    w.name
    FROM workspaces AS w
    INNER JOIN workspace_members AS m
    ON w.workspace_id = m.workspace_id
    WHERE m.user_id = ${user};`;

    return res.status(200).json({
      message:
        workspaces.length === 0
          ? "You haven't joined any workspaces yet"
          : "Get workspaces successfully",
      workspace: workspaces,
    });
  } catch (error) {
    console.log(error);
    throw error;
  }
};

export const workspaceDetail = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.userId;
    const workspaceId = req.params.workspaceId;

    if (!user) {
      throw new ErrorHandler(401, "Athentication required");
    }

    const workspaceDetail = await sql`SELECT
    w.workspace_id,
    w.name,
    w.description,
    w.created_by,
    w.created_at,
    w.updated_at,
    m.role
    FROM workspaces AS w
    INNER JOIN workspace_members AS m
    ON w.workspace_id = m.workspace_id
    WHERE m.user_id = ${user} AND w.workspace_id = ${workspaceId}`;

    if (workspaceDetail.length === 0) {
      throw new ErrorHandler(
        404,
        "Workspace not found or you don't have access",
      );
    }

    res.status(200).json({
      message: "Get workspace detail successfully",
      workspaceDetail: workspaceDetail[0],
    });
  } catch (error) {
    throw error;
  }
};

export const updateWorkspace = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.userId;
    const workspaceId = req.params.workspaceId;

    const { name, description } = req.body;

    if (!user) {
      throw new ErrorHandler(401, "Athentication required");
    }

    if (!name || !description) {
      throw new ErrorHandler(400, "Please fill all details");
    }

    const [getWorkspaceId] = await sql`SELECT workspace_id FROM workspaces 
    WHERE workspace_id = ${workspaceId}`;

    if (!getWorkspaceId) {
      throw new ErrorHandler(
        404,
        "Workspace not found or you don't have access",
      );
    }

    const [role] = await sql`SELECT role FROM workspace_members
    WHERE workspace_id = ${getWorkspaceId.workspace_id} AND user_id = ${user}`;

    if (!role) {
      throw new ErrorHandler(
        404,
        "Workspace not found or you don't have access",
      );
    }

    if (role.role !== "Admin") {
      throw new ErrorHandler(
        403,
        "You don't have permission to update workspace",
      );
    }

    const [updatingWorkspace] = await sql`UPDATE workspaces 
    SET name = ${name}, description = ${description}, updated_at = NOW()
    WHERE workspace_id = ${getWorkspaceId.workspace_id}
    RETURNING name, description, updated_at`;

    res.status(200).json({
      message: "Update workspace successfully",
      workspace: updatingWorkspace,
    });
  } catch (error) {
    console.log(error)
    throw error;
  }
};

export const updateRole = async (req: AuthRequest, res: Response) => {
  // user
  // ↓
  // "Người đang làm hành động"
  // → kiểm tra role của người này

  // targetUserId
  // ↓
  // "Người bị tác động"
  // → kiểm tra có tồn tại
  // → update role của người này
  try {
    //Kiem tra da dang nhap chua
    //Người đang thực hiện hành động
    const user = req.userId;
    const workspaceId = req.params.workspaceId;
    //Id nay la cua user (hoac cua nguoi khac) lay tu URL dung de xem user nay co trong workspace nay khong
    //Va cung nhu dung de update role
    //Người bị thay đổi role
    const targetUserId = req.params.userId;
    const { role } = req.body;

    if (!user) {
      throw new ErrorHandler(401, "Authentication required");
    }

    if (!role) {
      throw new ErrorHandler(400, "Please provide a role");
    }

    if (role !== "Admin" && role !== "Member") {
      throw new ErrorHandler(400, "Invalid role");
    }

    const [currentMember] = await sql`SELECT role from workspace_members
    WHERE workspace_id = ${workspaceId} AND user_id = ${user}`;

    if (!currentMember) {
      throw new ErrorHandler(
        404,
        "Workspace not found or you don't have access",
      );
    }

    if (currentMember.role !== "Admin") {
      throw new ErrorHandler(403, "You don't have permission to update role");
    }

    const [targetMember] = await sql`SELECT workspace_id, user_id 
    FROM workspace_members WHERE workspace_id = ${workspaceId} AND user_id = ${targetUserId}`;

    if (!targetMember) {
      throw new ErrorHandler(
        404,
        "Workspace not found or you don't have access",
      );
    }

    if (user === targetUserId) {
      throw new ErrorHandler(403, "You can't change your own role");
    }

    //Admin A có thể đổi role của Member B targetUserId.
    const [updatingRole] = await sql`UPDATE workspace_members
    SET role = ${role}
    WHERE workspace_id = ${workspaceId} AND user_id = ${targetUserId}
    RETURNING user_id, role`;

    res.status(200).json({
      message: "Update role successfully",
      role: updatingRole,
    });
  } catch (error) {
    console.log(error);
    throw error;
  }
};

export const deleteWorkspace = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.userId;
    const workspaceId = req.params.workspaceId;

    if (!user) {
      throw new ErrorHandler(401, "Authentication required");
    }

    if (!workspaceId) {
      throw new ErrorHandler(
        404,
        "Workspace not found or you don't have access",
      );
    }

    const [currentMember] = await sql`SELECT workspace_id, user_id, role
    FROM workspace_members WHERE workspace_id = ${workspaceId} AND user_id = ${user}`;

    if (!currentMember) {
      throw new ErrorHandler(
        404,
        "Workspace not found or you don't have access",
      );
    }

    if (currentMember.role !== "Admin") {
      throw new ErrorHandler(
        403,
        "You don't have permission to delete this workspace",
      );
    }

    await sql`DELETE FROM workspaces WHERE workspace_id = ${workspaceId}`;

    res.status(200).json({
      message: "Delete workspace successfully",
    });
  } catch (error) {
    throw error;
  }
};

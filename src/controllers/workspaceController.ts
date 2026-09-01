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

    if (!name) {
      throw new ErrorHandler(401, "Missing field name!");
    }

    const existWorkspace =
      await sql`SELECT workspace_id from workspaces WHERE name = ${name}`;
    if (existWorkspace.length > 0) {
      throw new ErrorHandler(401, "Workspace with this name already exists");
    }

    const workspace =
      await sql`INSERT INTO workspaces (name, description, created_by) VALUES
    (${name}, ${description}, ${createdBy}) RETURNING
    workspace_id, name, description, created_by, created_at`;

    res.json({
      message: "Create workspace successfully!",
      workspace: workspace,
    });
  } catch (error) {
    console.log(error);
    res.status(401).json({
      error: "Workspace with this name already exists",
    });
  }
};

export const getWorkspace = async (req: AuthRequest, res: Response) => {
  // const workspaces = await sql`SELECT * FROM workspaces`
};

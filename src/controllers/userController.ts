import { Response } from "express";
import { AuthRequest } from "../middlewares/authMiddleware.js";
import ErrorHandler from "../config/errorHandler.js";
import sql from "../config/db.js";
import bcrypt from "bcrypt";

export const changePassword = async (req: AuthRequest, res: Response) => {
  try {
    //Cần mật khẩu hiện tại để tiếp tục đổi mật khẩu: đang thiếu
    const userId = req.userId;
    if (!userId) {
      throw new ErrorHandler(401, "Unauthorized");
    }
    console.log("userId:", userId);
    const { password, newPassword } = req.body;
    if (!password || !newPassword) {
      throw new ErrorHandler(400, "Please give all details");
    }

    const user =
      await sql`SELECT user_id, name, password_hash FROM users WHERE user_id = ${userId}`;
    if (user.length > 0) {
      const isValid = await bcrypt.compare(password, user[0].password_hash);
      if (!isValid) {
        throw new ErrorHandler(401, "Invalid password");
      }
      const changePass = await bcrypt.hash(newPassword, 10);
      await sql`UPDATE users SET password_hash = ${changePass} WHERE user_id = ${userId}`;
      res.status(200).json({
        message: "Change password successfully",
      });
    } else {
      throw new ErrorHandler(404, "User not found");
    }
  } catch (error) {
    console.log(error);
    throw error;
  }
};

export const getUser = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      throw new ErrorHandler(401, "Unauthorized");
    }

    const record =
      await sql`SELECT user_id, name, email, avatar_url, created_at, updated_at 
      FROM users 
      WHERE user_id = ${userId}`;
    if (record.length === 0) {
      throw new ErrorHandler(404, "User not found");
    }
    const user = record[0];

    res.status(200).json({
      message: "Get profile user successfully",
      user: user,
    });
  } catch (error) {
    throw error;
  }
};

export const updateUser = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      throw new ErrorHandler(401, "Unauthorized");
    }

    const { name, email } = req.body;
    if (!name || !email) {
      throw new ErrorHandler(400, "Please fill all details");
    }

    const record =
      await sql`SELECT user_id, name, email FROM users WHERE user_id = ${userId}`;
    if (record.length === 0) {
      throw new ErrorHandler(404, "User not found");
    }
    const user = record[0];

    const newName = name || user.name;
    const newEmail = email || user.email;

    const update =
      await sql`UPDATE users SET name = ${newName}, email = ${newEmail} 
    WHERE user_id = ${userId}
    RETURNING name, email`;

    const updateUser = update[0];

    res.status(200).json({
      message: "Update user info successfully",
      user: updateUser,
    });
  } catch (error) {
    throw error;
  }
};

export const updateAvatar = async (req: AuthRequest, res: Response) => {
  const userId = req.userId;
  if (!userId) {
      throw new ErrorHandler(401, "Unauthorized");
    }
}

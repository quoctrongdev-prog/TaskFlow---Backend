import { Response } from "express";
import { AuthRequest } from "../middlewares/authMiddleware.js";
import ErrorHandler from "../config/errorHandler.js";
import sql from "../config/db.js";
import bcrypt from "bcrypt";

export const changePassword = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      throw new ErrorHandler(401, "Athentication required");
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
    throw new ErrorHandler(500, "Invalid password");
  }
};

import { NextFunction, Request, Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import dotenv from "dotenv";
import { User } from "../config/model.js";

dotenv.config();

// interface User{
//     user_id:string;
//     name: string;
//     email:string;
//     password_hash: string;
//     avatar_url
// }

export interface AuthRequest extends Request {
  userId?: string;
}
//authMiddleware: user đã xác thực chưa trước khi được đi tiếp đến controller
//Vào workspace, project khi đã được ủy quyền(mời) mới được xem, tương tác
const authMiddleware = (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authHeader = req.headers.authorization;
    // console.log("=== AUTH MIDDLEWARE ===");
    // console.log("Authorization:", req.headers.authorization);
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const token = authHeader.split(" ")[1];
    // console.log("Auth Token Split: ", token);

    const decoded = jwt.verify(
      token,
      process.env.JWT_ACCESS_SECRET as string,
    ) as JwtPayload;

    // console.log("decoded jwt as jwtpayload:", decoded);

    if (!decoded || !decoded.id) {
      return res.status(401).json({
        message: "Invalid Token",
      });
    }

    const userId = decoded.id;
    // console.log("Id từ payload jwt đã được decoded:", userId);

    req.userId = userId;
    // console.log("User ID:", userId);
    // console.log("Calling next()");
    next();
  } catch (error) {
    return res.status(401).json({ message: "Error middleware" });
  }
};

export default authMiddleware;

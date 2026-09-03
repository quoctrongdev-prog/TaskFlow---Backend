import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { UserToken } from "../config/model.js";

dotenv.config();

const generateAccessToken = async (userId: string) => {
  const token = jwt.sign(
    { id: userId },
    process.env.JWT_ACCESS_SECRET as string,
    {
      expiresIn: "15min",
    },
  );
  // console.log("token:", token);
  return token;
};

const generateRefreshToken = async (userId: string) => {
  const expiredAt = new Date();
  expiredAt.setDate(expiredAt.getDate() + 7);
  const token = jwt.sign(
    { id: userId },
    process.env.JWT_REFRESH_SECRET as string,
    {
      expiresIn: "7d",
    },
  );
  return { token, expiredAt };
};

export { generateAccessToken, generateRefreshToken };

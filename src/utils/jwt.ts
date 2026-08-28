import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { UserToken } from "../config/model.js";

dotenv.config();

const generateAccessToken = async (userId: string) => {
  const token = jwt.sign(
    { userId },
    process.env.JWT_ACCESS_SECRET as string,
    { expiresIn: "15min" },
  );
  console.log('token:', token)
  return token;
};

const generateRefreshToken = async (userId: string) => {
  const token = jwt.sign(
    { userId },
    process.env.JWT_REFRESH_SECRET as string,
    { expiresIn: "1d" },
  );
  return token;
};

export { generateAccessToken, generateRefreshToken };

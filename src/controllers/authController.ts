import sql from "../config/db.js";
import ErrorHandler from "../config/errorHandler.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { Request, Response } from "express";
import { generateAccessToken, generateRefreshToken } from "../utils/jwt.js";

dotenv.config();

const registerController = async (req: Request, res: Response) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    throw new ErrorHandler(400, "Please give all details");
  }

  const emailLowerCase = req.body.email.toLowerCase().trim();

  const existUser =
    await sql`SELECT email FROM users WHERE email = ${emailLowerCase}`;

  if (existUser.length > 0) {
    throw new ErrorHandler(409, "User with this email already exists");
  }

  const hashPassword = await bcrypt.hash(password, 10);

  const user = await sql`INSERT INTO users (name, email, password_hash) VALUES
  (${name},${emailLowerCase},${hashPassword}) RETURNING 
  user_id, name, email, created_at`;

  const registerdUser = user[0];

  //Trả về một promise thì luôn luôn await để lấy kết quả
  const accessToken = await generateAccessToken(registerdUser.user_id);

  console.log("accessToken", accessToken);

  res.status(201).json({
    message: "Register Successfully!",
    userData: {
      registerdUser: registerdUser,
      // accessToken: accessToken,
    },
  });
};

const loginController = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    throw new ErrorHandler(400, "Please give all details");
  }

  const emailLowerCase = req.body.email.toLowerCase().trim();

  try {
    const existUser =
      await sql`SELECT user_id, email, password_hash FROM users WHERE email = ${emailLowerCase}`;

    if (existUser.length > 0) {
      const isValid = await bcrypt.compare(
        password,
        existUser[0].password_hash,
      );
      if (!isValid) {
        return res.status(401).json("Invalid Password");
      }

      const accessToken = await generateAccessToken(existUser[0].user_id);
      const refreshToken = await generateRefreshToken(existUser[0].user_id);
      const expiredToken = refreshToken.expiredAt

      const updateRefreshToken = await sql`INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES
      (${existUser[0].user_id}, ${refreshToken}, ${expiredToken}) RETURNING
      token_id, user_id, token, expires_at, created_at`;

      return res.status(200).json({
        message: "Login Successfully!",
        // userData: {
        //   accessToken: accessToken,
        //   refreshToken: refreshToken
        // },
      });
    } else {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }
  } catch (error) {
    console.log(error);
    res.status(404).json({
      messsage: "Loi Login"
    })
  }
};

export { registerController, loginController };

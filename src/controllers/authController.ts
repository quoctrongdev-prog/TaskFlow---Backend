import sql from "../config/db.js";
import ErrorHandler from "../config/errorHandler.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { Request, Response } from "express";
import { generateAccessToken } from "../utils/jwt.js";


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
  const accessToken = await generateAccessToken(registerdUser.user_id)

  console.log('accessToken', accessToken)


  res.status(201).json({
    message: "Register Successfully!",
    registerdUser,
    accessToken,
  });
};

const loginController = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    throw new ErrorHandler(400, "Please give all details");
  }

  try {
    const existUser =
      await sql`SELECT email, password_hash FROM users WHERE email = ${email}`;

      if(existUser.length >0){
        const isValid = await bcrypt.compare(password, existUser[0].password_hash)
        if(!isValid){
          return res.status(401).json("Invalid email or password")
        }

        return res.status(200).json({
          message: "Login Successfully!"
        })
      } else {
        return res.status(401).json({
          message: "Invalid email or password"
        })
      }
  } catch (error) {
    console.log(error)
  }
};

export { registerController, loginController };

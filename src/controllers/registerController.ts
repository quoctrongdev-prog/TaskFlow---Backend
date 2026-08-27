import sql from "../config/db.js";
import ErrorHandler from "../config/errorHandler.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const registerController = async (req: any, res: any) => {
  const emailLowerCase = req.body.email.toLowerCase();

  const { name, password_hash, avatar_url } = req.body;

  const existUser =
    await sql`SELECT email FROM users WHERE email = ${emailLowerCase}`;

  if (existUser.length > 0) {
    throw new ErrorHandler(409, "User with this email already exists");
  }

  if (!name || !emailLowerCase || !password_hash) {
    throw new ErrorHandler(400, "Please give all details");
  }

  const hashPassword = await bcrypt.hash(password_hash, 10);

  const user =
    await sql`INSERT INTO users (name, email, password_hash, avatar_url) VALUES
  (${name},${emailLowerCase},${hashPassword},${avatar_url}) RETURNING 
  user_id, name, email, avatar_url, email_verified, created_at`;

  const registerdUser = user[0];

  const token = jwt.sign(
    { id: registerdUser?.user_id },
    process.env.JWT_ACCESS_SECRET as string,
    { expiresIn: "15m" },
  );

  res.json({
    message: "Register Successfully!",
    registerdUser,
    token,
  });
};

export default registerController;

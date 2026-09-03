import sql from "../config/db.js";
import ErrorHandler from "../config/errorHandler.js";
import bcrypt from "bcrypt";
import crypto from "crypto";
import dotenv from "dotenv";
import { Request, Response } from "express";
import { generateAccessToken, generateRefreshToken } from "../utils/jwt.js";
import jwt from "jsonwebtoken";

dotenv.config();

//jwt và cookie thì vẫn lưu và so sánh bằng token chưa băm

const registerController = async (req: Request, res: Response) => {
  try {
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

    // console.log("accessToken", accessToken);

    res.status(201).json({
      message: "Register Successfully!",
      // userData: {
      //   registerdUser: registerdUser,
      accessToken: accessToken,
      // },
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Error register",
    });
  }
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
      const expiredToken = refreshToken.expiredAt;
      const tokenRefresh = refreshToken.token;

      const tokenHash = crypto
        //SHA-256 là thuật toán băm xác định (Deterministic).
        //Nghĩa là một token dù có bị băm ở chỗ khác
        //thì cùng 1 token sau khi băm sẽ luôn luôn ra cùng 1 kết quả
        .createHash("sha256")
        .update(tokenRefresh)
        .digest("hex");

      const updateRefreshToken =
        await sql`INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES
      (${existUser[0].user_id}, ${tokenHash}, ${expiredToken}) RETURNING
      token_id, user_id, token, expires_at, created_at`;

      res.cookie("refreshToken", tokenRefresh, {
        httpOnly: true,
        //secure: true chỉ chạy qua https bên frontend,
        //nếu chạy localhost thì secure: true sẽ không lưu cookie
        //nên để false để test trước đã
        secure: false,
      });

      // console.log("cookie", cookie);
      // console.log("refreshToken", refreshToken.token)

      return res.status(200).json({
        message: "Login Successfully!",
        // userData: {
        // user: existUser[0],
        accessToken: accessToken,
        // refreshToken: refreshToken.token,
        // expiredAt: refreshToken.expiredAt,
        // },
      });
    } else {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({
      messsage: "Error Login",
    });
  }
};

const refreshController = async (req: Request, res: Response) => {
  const refreshToken = req.cookies.refreshToken;
  // console.log(refreshToken)
  try {
    if (!refreshToken) {
      throw new ErrorHandler(403, "Token is empty");
    }
    const tokenHash = crypto
      .createHash("sha256")
      .update(refreshToken)
      .digest("hex");
    const userId =
      await sql`SELECT user_id, is_revoked FROM refresh_tokens WHERE token = ${tokenHash}`;
    if (userId.length === 0 || userId[0].is_revoked) {
      throw new ErrorHandler(403, "Invalid token");
    }
    console.log("UserId từ refreshController: ", userId[0].user_id);

    jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET as string,
      // async (error: any) => {
      //   if (error) {
      //     throw new ErrorHandler(403, "Invalid token");
      //   }
      //}
    );
    const token = await generateAccessToken(userId[0].user_id);
    console.log("Token từ refreshController: ", token);
    res.json({
      message: "Generate access token successfully",
      accessToken: token,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Refresh token error",
    });
  }
};

// const logoutController = async (req: Request, res: Response) => {
//   try {
//     const refreshToken = req.cookies.refreshToken;
//     if (!refreshToken) {
//       throw new ErrorHandler(403, "Token is empty");
//     }
//     const tokenHash = crypto
//       .createHash("sha256")
//       .update(refreshToken)
//       .digest("hex");

//     const user =
//       await sql`SELECT user_id FROM refresh_tokens WHERE token = ${tokenHash}`;
//     console.log("userId: ", user);
//     const userId = user[0].user_id;
//     if (user.length > 0 && userId != null) {
//       const update =
//         await sql`UPDATE refresh_tokens SET is_revoked = true WHERE token = ${tokenHash}`;
//       console.log("update: ", update);
//     }

//     res.clearCookie("refreshToken");
//     return res.status(200).json({ message: "Logout successfully" });
//   } catch (error) {
//     console.log(error);
//     res.status(500).json({
//       message: "Error logout",
//     });
//   }
// };

const logoutController = async (req: Request, res: Response) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      throw new ErrorHandler(403, "Token is empty");
    }

    const tokenHash = hashToken(refreshToken);

    // Thu hồi token trực tiếp bằng UPDATE mà không cần SELECT trước
    await sql`UPDATE refresh_tokens SET is_revoked = true WHERE token = ${tokenHash}`;

    res.clearCookie("refreshToken");
    return res.status(200).json({ message: "Logout successfully" });
  } catch (error: any) {
    console.error(error);
    res.clearCookie("refreshToken"); // Đảm bảo luôn xóa cookie nếu có lỗi xảy ra
    return res.status(error.statusCode || 500).json({
      message: error.message || "Error logout",
    });
  }
};

export {
  registerController,
  loginController,
  refreshController,
  logoutController,
};

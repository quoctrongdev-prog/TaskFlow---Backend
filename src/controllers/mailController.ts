import { Request, Response } from "express";
import resend from "../utils/mail.js";
import dotenv from "dotenv";
import ErrorHandler from "../config/errorHandler.js";
import crypto from "crypto";
import sql from "../config/db.js";

dotenv.config();

export const testEmail = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        message: "Email is required",
      });
    }

    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM as string,
      to: email,
      subject: "TaskFlow Test Email",
      html: `
        <h1>Hello from TaskFlow 👋</h1>
        <p>This is a test email sent using Resend.</p>
      `,
    });

    if (error) {
      console.log(error);

      return res.status(400).json({
        message: "Failed to send email",
        error,
      });
    }

    return res.status(200).json({
      message: "Email sent successfully",
      emailId: data?.id,
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

export const verifyEmail = async (req: Request, res: Response) => {
  try {
    const { token } = req.query;

    if (!token || typeof token !== "string") {
      throw new ErrorHandler(400, "Verification token is required");
    }

    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    const verificationToken = await sql`
      SELECT
        token_id,
        user_id,
        expires_at,
        used_at
      FROM email_verification_tokens
      WHERE token = ${tokenHash}
    `;

    if (verificationToken.length === 0) {
      throw new ErrorHandler(400, "Invalid verification token");
    }

    const record = verificationToken[0];

    //đã được sử dụng chưa
    if (record.used_at) {
      throw new ErrorHandler(400, "Verification token has already been used");
    }

    if (new Date(record.expires_at) < new Date()) {
      throw new ErrorHandler(400, "Verification token has expired");
    }

    await sql`
      UPDATE users
      SET email_verified = true
      WHERE user_id = ${record.user_id}
    `;

    await sql`
      UPDATE email_verification_tokens
      SET used_at = NOW()
      WHERE token_id = ${record.token_id}
    `;

    return res.status(200).json({
      message: "Email verified successfully",
    });
  } catch (error) {
    throw error;
  }
};

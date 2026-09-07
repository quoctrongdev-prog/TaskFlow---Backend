import nodemailer from "nodemailer";
import dotenv from "dotenv";
import transporter from "./mail.js";
dotenv.config();

//Gửi email thôi
export const sendVerificationEmail = async (email: string, token: string) => {
  try {
    const verifyUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM, // sender address
      to: email, // list of recipients
      subject: "Verify Email", // subject line
      text: "Verify your TaskFlow account", // plain text body
      html: `
       <h1>Welcome to TaskFlow!</h1>

     <p>
        Please verify your email address by clicking the link below:
      </p>

      <a href="${verifyUrl}">
        Verify Email
      </a>

      <p>This link will expire in 15 minutes.</p>`, // HTML body

    });
    console.log("Message sent: %s", info.messageId);
    // Preview URL is only available when using an Ethereal test account
    console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
    return info
  } catch (err) {
    console.error("Error while sending mail:", err);
  }
};

export const sendForgotPassword = async (email: string, token: string) => {
  try {
    const verifyUrl = `${process.env.FRONTEND_URL}/forgot-password?token=${token}`;
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM, // sender address
      to: email, // list of recipients
      subject: "Forgot password", // subject line
      text: "Forgot password", // plain text body
      html: `
       <h1>Here is your link to change password!</h1>

      <a href="${verifyUrl}">
        Change password
      </a>

      <p>This link will expire in 15 minutes.</p>`, // HTML body

    });
    console.log("Message sent: %s", info.messageId);
    // Preview URL is only available when using an Ethereal test account
    console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
    return info
  } catch (err) {
    console.error("Error while sending mail:", err);
  }
};

// export const sendVerificationEmail = async (email: string, token: string) => {
//   const verifyUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;

//   const { data, error } = await resend.emails.send({
//     from: process.env.EMAIL_FROM as string,
//     to: email,
//     subject: "Verify your TaskFlow account",
//     html: `
//       <h1>Welcome to TaskFlow!</h1>

//       <p>
//         Please verify your email address by clicking the link below:
//       </p>

//       <a href="${verifyUrl}">
//         Verify Email
//       </a>

//       <p>This link will expire in 15 minutes.</p>
//     `,
//   });

//   if (error) {
//     throw error;
//   }

//   return data;
// };

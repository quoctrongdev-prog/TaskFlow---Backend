import resend from "./mail.js";

export const sendVerificationEmail = async (email: string, token: string) => {
  const verifyUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;

  const { data, error } = await resend.emails.send({
    from: process.env.EMAIL_FROM as string,
    to: email,
    subject: "Verify your TaskFlow account",
    html: `
      <h1>Welcome to TaskFlow!</h1>

      <p>
        Please verify your email address by clicking the link below:
      </p>

      <a href="${verifyUrl}">
        Verify Email
      </a>

      <p>This link will expire in 15 minutes.</p>
    `,
  });

  if (error) {
    throw error;
  }

  return data;
};

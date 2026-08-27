import { Router } from "express";
import sql from "../config/db.js"

const router = Router();

router.get("/", async (_req, res) => {
  try {
    const result = await sql.query(`
      SELECT
        user_id,
        name,
        email,
        avatar_url,
        email_verified,
        created_at,
        updated_at
      FROM users
      ORDER BY created_at DESC
    `);

    res.status(200).json({
      users: result,
    });
  } catch (error) {
    console.error("Failed to fetch users:", error);

    res.status(500).json({
      message: "Failed to fetch users",
    });
  }
});

export default router;
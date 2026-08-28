import express from "express";
import authRoute from "./routes/authRoute.js";
import sql from "./config/db.js";

const app = express();

app.use(express.json());

app.get("/", async (_req, res) => {
  try {
    const result = await sql.query("SELECT NOW()");

    res.json({
      message: "TaskFlow API is running",
      database_time: result,
    });
  } catch (error) {
    console.error("Database connection error:", error);

    res.status(500).json({
      message: "Database connection failed",
    });
  }
});

app.use("/api", authRoute);

export default app;

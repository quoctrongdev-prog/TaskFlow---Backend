import express from "express";
import authRoute from "./routes/authRoute.js";
import workRoute from './routes/workspaceRoute.js'
import userRoute from './routes/userRoute.js'
import mailRoute from './routes/mailRoute.js'
import sql from "./config/db.js";
import cookieParser from "cookie-parser";
// import cors from "cors";

const app = express();

app.use(express.json());
app.use(cookieParser());
// app.use(cors());

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

app.use("/api/auth", authRoute);
app.use("/api/workspace", workRoute);
app.use('/api/users', userRoute);
app.use('/api/mail', mailRoute);


export default app;

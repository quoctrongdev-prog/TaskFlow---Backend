import "dotenv/config";
import { neon } from "@neondatabase/serverless";

// Hàm `neon()` trả về một function để thực hiện truy vấn SQL trực tiếp qua HTTP
const sql = neon(process.env.DATABASE_URL!);

export default sql;
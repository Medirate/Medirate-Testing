import { Pool } from "pg";

// Validate required environment variables
if (!process.env.DB_HOST) {
  throw new Error("DB_HOST environment variable is required");
}
if (!process.env.DB_NAME) {
  throw new Error("DB_NAME environment variable is required");
}
if (!process.env.DB_USER) {
  throw new Error("DB_USER environment variable is required");
}
if (!process.env.DB_PASS) {
  throw new Error("DB_PASS environment variable is required");
}

const pool = new Pool({
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  port: parseInt(process.env.DB_PORT || "5432"),
  ssl: { rejectUnauthorized: false }, // Required for Azure-hosted databases
});

export default pool;

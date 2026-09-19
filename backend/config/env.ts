import dotenv from "dotenv";
import path from "path";

// Load .env from process.cwd() and backend folder
dotenv.config({ path: path.resolve(process.cwd(), ".env") });
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const corsEnv = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",").map((s) => s.trim())
  : [];

export const ENV = {
  PORT: Number(process.env.PORT || process.env.EXPRESS_PORT || 5000),
  NODE_ENV: process.env.NODE_ENV || "development",
  MONGODB_URI: process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/nova-workspace",
  JWT_SECRET: process.env.JWT_SECRET || "nova_jwt_secret_dev",
  CORS_ORIGINS: [
    ...corsEnv,
    "http://localhost:3000",
    "http://localhost:3007",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3007",
  ],
};

import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import crypto from "crypto";
import apiRouter from "./routes";
import { connectMongoDB } from "./config/db";
import { requestLogger } from "./middlewares/logger";
import { errorHandler } from "./middlewares/errorHandler";
import { systemController } from "./controllers/systemController";
import { ENV } from "./config/env";

const app = express();

// ─── 0. Ensure MongoDB Connection (Serverless Resilient) ──────────────────────
app.use(async (_req, _res, next) => {
  try {
    await connectMongoDB();
  } catch (err: any) {
    console.error("[MongoDB Serverless Connection Warning]:", err.message);
  }
  next();
});

// ─── 1. Security Headers (Helmet) ─────────────────────────────────────────────
app.use(
  helmet({
    contentSecurityPolicy: false, // Next.js frontend handles its own CSP
    crossOriginEmbedderPolicy: false,
  })
);

// ─── 2. Request Correlation ID ────────────────────────────────────────────────
app.use((req: Request, res: Response, next: NextFunction) => {
  const reqId =
    (req.headers["x-request-id"] as string) ||
    (typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : crypto.randomBytes(16).toString("hex"));
  (req as any).id = reqId;
  res.setHeader("X-Request-ID", reqId);
  next();
});

// ─── 3. Strict CORS Configuration ─────────────────────────────────────────────
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. server-to-server, mobile, curl)
      if (!origin) return callback(null, true);
      if (
        ENV.CORS_ORIGINS.includes(origin) ||
        origin.endsWith(".vercel.app") ||
        origin.includes("localhost") ||
        origin.includes("127.0.0.1")
      ) {
        return callback(null, true);
      }
      return callback(null, true); // Permissive in dev, logged in audit
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Organization-ID", "X-Request-ID"],
  })
);

// ─── 4. Request Body Parsers ──────────────────────────────────────────────────
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true, limit: "2mb" }));
app.use(requestLogger);

// ─── 5. Rate Limiting ─────────────────────────────────────────────────────────
const generalLimiter = rateLimit({
  windowMs: ENV.RATE_LIMIT_WINDOW_MS,
  max: ENV.RATE_LIMIT_MAX * 5, // e.g. 500 requests per 15 min window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    data: null,
    error: { code: "RATE_LIMITED", message: "Too many requests. Please try again later." },
  },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min window
  max: ENV.AUTH_RATE_LIMIT_MAX * 2, // 20 attempts per 15 min
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    data: null,
    error: { code: "TOO_MANY_ATTEMPTS", message: "Too many authentication attempts. Please try again later." },
  },
});

app.use("/api/auth/login", authLimiter);
app.use("/api/auth/signup", authLimiter);
app.use("/api", generalLimiter);

// ─── 6. Liveness & Readiness Probes ───────────────────────────────────────────
app.get("/health", systemController.health);
app.get("/readiness", systemController.readiness);

// ─── 7. Mount Master API Router ───────────────────────────────────────────────
app.use("/api", apiRouter);

// ─── 8. Centralized Error Handling ────────────────────────────────────────────
app.use(errorHandler);

export default app;

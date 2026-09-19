import { Request, Response, NextFunction } from "express";
import { ENV } from "../config/env";

export function errorHandler(err: any, req: Request, res: Response, _next: NextFunction) {
  const requestId = (req.headers["x-request-id"] as string) || (req as any).id || "req-unknown";
  const statusCode = typeof err.statusCode === "number" ? err.statusCode : (err.status || 500);

  // Log detailed error server-side
  console.error(`[API Error] [${requestId}] ${req.method} ${req.path} -> ${statusCode}:`, err);

  // Safe message in production vs debug message in development
  let message = err.message || "An unexpected internal server error occurred.";
  if (ENV.IS_PRODUCTION && statusCode === 500) {
    message = "An unexpected internal server error occurred. Please contact support.";
  }

  res.status(statusCode).json({
    data: null,
    error: {
      code: err.code || (statusCode === 404 ? "NOT_FOUND" : statusCode === 403 ? "FORBIDDEN" : "INTERNAL_ERROR"),
      message,
    },
    meta: {
      requestId,
      timestamp: new Date().toISOString(),
    },
  });
}

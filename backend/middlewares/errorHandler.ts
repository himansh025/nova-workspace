import { Request, Response, NextFunction } from "express";

export function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction) {
  console.error("[Unhandled API Error]:", err);
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    error: err.message || "Internal Server Error",
  });
}

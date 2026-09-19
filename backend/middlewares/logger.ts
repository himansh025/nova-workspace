import { Request, Response, NextFunction } from "express";

export function requestLogger(req: Request, _res: Response, next: NextFunction) {
  const timestamp = new Date().toISOString().split("T")[1].slice(0, 8);
  console.log(`[Express API] [${timestamp}] ${req.method} ${req.path}`);
  next();
}

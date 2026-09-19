import { Request, Response, NextFunction } from "express";
import { verifySessionToken } from "../services/auth";

export function parseCookies(req: Request): Record<string, string> {
  const list: Record<string, string> = {};
  const rc = req.headers.cookie;
  if (!rc) return list;
  rc.split(";").forEach((cookie) => {
    const parts = cookie.split("=");
    const key = parts.shift()?.trim();
    if (key) {
      list[key] = decodeURIComponent(parts.join("="));
    }
  });
  return list;
}

export function authGuard(req: Request, res: Response, next: NextFunction) {
  const cookies = parseCookies(req);
  const authHeader = req.headers.authorization;
  let token = cookies["nova_session"];

  if (!token && authHeader?.startsWith("Bearer ")) {
    token = authHeader.substring(7);
  }

  if (!token) {
    return res.status(401).json({ error: "Authentication required" });
  }

  const user = verifySessionToken(token);
  if (!user) {
    return res.status(401).json({ error: "Invalid or expired session token" });
  }

  (req as any).user = user;
  next();
}

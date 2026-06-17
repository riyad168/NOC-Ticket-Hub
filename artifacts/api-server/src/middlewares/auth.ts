import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env["JWT_SECRET"] || "noc_secret_key_2025";

export interface JwtPayload {
  id: number;
  name: string;
  email: string;
  role: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const token = req.cookies?.token;
  if (!token) {
    res.redirect("/login");
    return;
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    req.user = decoded;
    next();
  } catch {
    res.clearCookie("token");
    res.redirect("/login");
  }
}

export function requireGuest(req: Request, res: Response, next: NextFunction): void {
  const token = req.cookies?.token;
  if (token) {
    try {
      jwt.verify(token, JWT_SECRET);
      res.redirect("/dashboard");
      return;
    } catch {
      res.clearCookie("token");
    }
  }
  next();
}

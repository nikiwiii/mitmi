import type { Request, Response, NextFunction } from "express";
import { findUserById, User } from "../db.js";
import { readToken } from "../services/auth.service.js";

export interface AuthedRequest extends Request {
  user?: User;
}

export async function requireAuth(
  req: AuthedRequest,
  res: Response,
  next: NextFunction
) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  const userId = token ? readToken(token) : null;
  const user = userId ? await findUserById(userId) : null;

  if (!user) {
    return res.status(401).json({ error: "wymagane logowanie" });
  }

  req.user = user;
  next();
}

import type { Request, Response, NextFunction } from "express";
import { AuthedRequest } from "../middleware/auth.middleware.js";
import {
  registerUser,
  loginUser,
  updateProfileAvatar,
} from "../services/auth.service.js";

export async function register(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const result = await registerUser(
      req.body.username,
      req.body.password,
      req.body.avatar
    );
    if (!result.success) {
      return res.status(result.status).json({ error: result.error });
    }
    return res.status(result.status || 201).json(result.data);
  } catch (err) {
    next(err);
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await loginUser(req.body.username, req.body.password);
    if (!result.success) {
      return res.status(result.status).json({ error: result.error });
    }
    return res.status(result.status || 200).json(result.data);
  } catch (err) {
    next(err);
  }
}

export async function getMe(req: AuthedRequest, res: Response) {
  return res.json({ user: req.user });
}

export async function updateAvatar(
  req: AuthedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const result = await updateProfileAvatar(req.user!.id, req.body.avatar);
    if (!result.success) {
      return res.status(result.status).json({ error: result.error });
    }
    return res.json({ user: result.data });
  } catch (err) {
    next(err);
  }
}

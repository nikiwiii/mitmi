import type { Request, Response, NextFunction } from "express";
import { getHealthStatus } from "../services/health.service.js";

export function getHealth(req: Request, res: Response, next: NextFunction) {
  try {
    return res.json(getHealthStatus());
  } catch (err) {
    next(err);
  }
}

import type { Request, Response } from "express";
import { getHealthStatus } from "../services/health.service.js";

export function getHealth(req: Request, res: Response) {
  return res.json(getHealthStatus());
}

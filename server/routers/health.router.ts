import { Router } from "express";
import { getHealth } from "../handlers/health.handler.js";

const healthRouter = Router();

healthRouter.get("/", getHealth);

export { healthRouter };

import { Router } from "express";
import rateLimit from "express-rate-limit";
import { requireAuth } from "../middleware/auth.middleware.js";
import {
  register,
  login,
  getMe,
  updateAvatar,
} from "../handlers/auth.handler.js";

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Zbyt wiele prób, spróbuj ponownie za 15 minut" },
});

const authRouter = Router();

authRouter.post("/register", authLimiter, register);
authRouter.post("/login", authLimiter, login);
authRouter.get("/me", requireAuth, getMe);
authRouter.patch("/me", requireAuth, updateAvatar);

export { authRouter, authLimiter };

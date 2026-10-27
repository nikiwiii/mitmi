import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware.js";
import {
  register,
  login,
  getMe,
  updateAvatar,
} from "../handlers/auth.handler.js";

const authRouter = Router();

authRouter.post("/register", register);
authRouter.post("/login", login);
authRouter.get("/me", requireAuth, getMe);
authRouter.patch("/me", requireAuth, updateAvatar);

export { authRouter };

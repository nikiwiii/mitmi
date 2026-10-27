import { Router } from "express";
import { healthRouter } from "./health.router.js";
import { authRouter } from "./auth.router.js";
import { meetingRouter } from "./meeting.router.js";

const apiRouter = Router();

apiRouter.use("/health", healthRouter);
apiRouter.use("/auth", authRouter);
apiRouter.use("/meetings", meetingRouter);

export { apiRouter };

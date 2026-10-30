import express from "express";
import cors from "cors";
import helmet from "helmet";
import { apiRouter } from "./routers/index.js";
import { requestLogger } from "./middleware/logger.middleware.js";
import { errorHandler } from "./middleware/error.middleware.js";

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(requestLogger);

app.use("/api", apiRouter);

app.use(errorHandler);

export { app };

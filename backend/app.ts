import express from "express";
import cors from "cors";
import apiRouter from "./routes";
import { requestLogger } from "./middlewares/logger";
import { errorHandler } from "./middlewares/errorHandler";
import { systemController } from "./controllers/systemController";

const app = express();

// Global Middlewares
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

// System Health Check
app.get("/health", systemController.health);

// Mount Master API Router
app.use("/api", apiRouter);

// Centralized Error Handling
app.use(errorHandler);

export default app;

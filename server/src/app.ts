import express from "express";
import type { Express } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { authRouter } from "./app/modules/auth/routes.js";
import { pollRouter } from "./app/modules/polls/routes.js";
import { resultsRouter } from "./app/modules/results/routes.js";
import { publicRouter } from "./app/modules/public/routes.js";

export function createApp(): Express {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: process.env.CORS_ORIGIN || "http://localhost:5173",
      credentials: true,
    }),
  );
  app.use(express.json());
  app.use(morgan("dev"));

  app.get("/api/health", (_req, res) => res.json({ status: "ok" }));

  app.use("/api/auth", authRouter);
  app.use("/api/polls", pollRouter);
  app.use("/api/polls", resultsRouter);
  app.use("/api/public/polls", publicRouter);

  return app;
}

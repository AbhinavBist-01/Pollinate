import express from "express";
import type { Express } from "express";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { authRouter } from "./app/modules/auth/routes.js";
import { pollRouter } from "./app/modules/polls/routes.js";
import { resultsRouter } from "./app/modules/results/routes.js";
import { publicRouter } from "./app/modules/public/routes.js";

const allowedOrigins = (
  process.env.CORS_ORIGIN || "http://localhost:3000,http://localhost:5173"
)
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

const __dirname = dirname(fileURLToPath(import.meta.url));

export function createApp(): Express {
  const app = express();

  app.use(
    cors({
      origin: (origin, cb) => {
        if (!origin || allowedOrigins.includes(origin)) {
          cb(null, true);
          return;
        }
        cb(new Error(`CORS blocked origin: ${origin}`));
      },
      credentials: true,
    }),
  );
  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(express.json());
  app.use(morgan("dev"));

  app.get("/api/health", (_req, res) => res.json({ status: "ok" }));
  app.use("/api/auth", authRouter);
  app.use("/api/polls", pollRouter);
  app.use("/api/polls", resultsRouter);
  app.use("/api/public/polls", publicRouter);

  // Production: serve client SPA build
  const clientDist = resolve(__dirname, "../../client/dist");
  app.use(express.static(clientDist));
  app.get(/.*/, (_req, res) => {
    res.sendFile(resolve(clientDist, "index.html"));
  });

  return app;
}

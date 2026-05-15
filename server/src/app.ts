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
import { isAllowedHttpOrigin } from "./app/lib/origins.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

export function createApp(): Express {
  const app = express();

  app.use(
    cors((req, cb) => {
      cb(null, {
        origin: (origin, originCb) => {
          if (isAllowedHttpOrigin(origin, req)) {
            originCb(null, true);
            return;
          }
          originCb(new Error(`CORS blocked origin: ${origin}`));
        },
        credentials: true,
      });
    }),
  );

  app.use(
    (
      err: Error,
      _req: express.Request,
      res: express.Response,
      next: express.NextFunction,
    ) => {
      if (err.message.startsWith("CORS blocked origin:")) {
        res.status(403).json({ message: err.message });
        return;
      }
      next(err);
    },
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

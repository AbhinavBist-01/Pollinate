import { Router } from "express";
import type { Router as RouterType } from "express";
import rateLimit from "express-rate-limit";
import {
  getPublicLeaderboard,
  getPublicPoll,
  submitResponse,
} from "./controller.js";

export const publicRouter: RouterType = Router();
const submitLimiter = rateLimit({
  windowMs: 60_000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: "Too many vote attempts. Please wait a minute and try again.",
  },
});

publicRouter.get("/:shareId/leaderboard", getPublicLeaderboard);
publicRouter.get("/:shareId", getPublicPoll);
publicRouter.post("/:shareId/respond", submitLimiter, submitResponse);

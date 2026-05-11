import { Router } from "express";
import type { Router as RouterType } from "express";
import { authenticate } from "../../middleware/auth.js";
import { getResults, getAnalytics } from "./controller.js";

export const resultsRouter: RouterType = Router();

resultsRouter.use(authenticate);

resultsRouter.get("/:id/results", getResults);
resultsRouter.get("/:id/analytics", getAnalytics);

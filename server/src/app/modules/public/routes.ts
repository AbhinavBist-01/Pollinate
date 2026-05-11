import { Router } from "express";
import type { Router as RouterType } from "express";
import { getPublicPoll, submitResponse } from "./controller.js";

export const publicRouter: RouterType = Router();

publicRouter.get("/:shareId", getPublicPoll);
publicRouter.post("/:shareId/respond", submitResponse);

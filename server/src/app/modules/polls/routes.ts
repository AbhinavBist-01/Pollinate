import { Router } from "express";
import type { Router as RouterType } from "express";
import { authenticate } from "../../middleware/auth.js";
import { createPoll, listPolls, getPoll, updatePoll, deletePoll } from "./controller.js";

export const pollRouter: RouterType = Router();

pollRouter.use(authenticate);

pollRouter.post("/", createPoll);
pollRouter.get("/", listPolls);
pollRouter.get("/:id", getPoll);
pollRouter.patch("/:id", updatePoll);
pollRouter.delete("/:id", deletePoll);

import { Router } from "express";
import type { Router as RouterType } from "express";
import { register, login, me } from "./controller.js";
import { authenticate } from "../../middleware/auth.js";

export const authRouter: RouterType = Router();

authRouter.post("/register", register);
authRouter.post("/login", login);
authRouter.get("/me", authenticate, me);

import { z } from "zod";

export const RegisterSchema = z.object({
  name: z.string().min(2).max(255),
  email: z.string().email().max(322),
  password: z.string().min(6).max(128),
});

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

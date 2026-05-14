import { z } from "zod";

export const OptionSchema = z.object({
  text: z.string().min(1).max(255),
  order: z.number().int().min(0).optional(),
  isCorrect: z.boolean().default(false),
});

export const QuestionSchema = z
  .object({
    text: z.string().min(1).max(500),
    type: z.enum(["radio", "checkbox", "text"]).default("radio"),
    order: z.number().int().min(0).optional(),
    isRequired: z.boolean().default(true),
    timeLimit: z.number().int().min(1).max(600).optional(),
    options: z.array(OptionSchema).optional(),
  })
  .refine(
    (q) => {
      if (q.type === "text") return true;
      return q.options && q.options.length > 0;
    },
    {
      message: "radio/checkbox questions must have at least one option",
      path: ["options"],
    },
  );

export const CreatePollSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  expiresAt: z.string().datetime().optional(),
  scheduledAt: z.string().datetime().optional(),
  status: z.enum(["draft", "live", "ended", "scheduled"]).optional(),
  voteLimitPerSession: z.number().int().min(1).max(10).default(1),
  isPublished: z.boolean().default(false),
  questions: z.array(QuestionSchema).min(1),
});

export const UpdatePollSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  expiresAt: z.string().datetime().nullable().optional(),
  scheduledAt: z.string().datetime().nullable().optional(),
  status: z.enum(["draft", "live", "ended", "scheduled"]).optional(),
  voteLimitPerSession: z.number().int().min(1).max(10).optional(),
  isPublished: z.boolean().optional(),
  questions: z.array(QuestionSchema).min(1).optional(),
});

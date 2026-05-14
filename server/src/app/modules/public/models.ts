import { z } from "zod";

export const AnswerSchema = z.object({
  questionId: z.string().uuid(),
  optionId: z.string().uuid().optional(),
  value: z.string().optional(),
});

export const SubmitResponseSchema = z.object({
  respondentName: z.string().min(1).max(255).optional(),
  voterSessionId: z.string().min(8).max(120).optional(),
  answers: z.array(AnswerSchema).min(1),
});

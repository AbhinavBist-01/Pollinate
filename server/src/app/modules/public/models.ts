import { z } from "zod";

export const AnswerSchema = z.object({
  questionId: z.string().uuid(),
  optionId: z.string().uuid().optional(),
  value: z.string().optional(),
});

export const SubmitResponseSchema = z.object({
  answers: z.array(AnswerSchema).min(1),
});

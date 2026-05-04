import { z } from "zod";

export const TaskExtractionSchema = z.object({
  language: z.string().default("ar"),
  timezone: z.string().default("Asia/Riyadh"),
  tasks: z
    .array(
      z.object({
        title: z.string(),
        date_expression: z.string().nullable().optional(),
        resolved_date_hint: z.string().nullable().optional(),
        time_expression: z.string().nullable().optional(),
        duration_minutes: z.number().int().positive().default(30),
        priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
        energy: z.enum(["low", "medium", "high"]).default("medium"),
        flexibility: z
          .enum(["fixed", "flexible", "deadline"])
          .default("flexible"),
        type: z.string().optional(),
        confidence: z.number().min(0).max(1).default(0.7),
      })
    )
    .default([]),
  fixed_events_mentioned: z
    .array(
      z.object({
        title: z.string(),
        date_expression: z.string().nullable().optional(),
        time_expression: z.string().nullable().optional(),
        duration_minutes: z.number().int().positive().default(60),
        confidence: z.number().min(0).max(1).default(0.7),
      })
    )
    .default([]),
  ambiguities: z
    .array(
      z.object({
        text: z.string(),
        question: z.string(),
        fallback: z.string().optional(),
      })
    )
    .default([]),
});

export type TaskExtraction = z.infer<typeof TaskExtractionSchema>;

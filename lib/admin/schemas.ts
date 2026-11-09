import { z } from "zod";

export const REVIEW_DECISION_VALUES = ["active", "rejected"] as const;

export const REQUEST_REVIEW_DECISION_VALUES = [
  "approved",
  "rejected",
] as const;

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const reviewResponderSchema = z.object({
  profileId: z
    .string()
    .trim()
    .regex(UUID_PATTERN, "Invalid account reference."),
  decision: z.enum(REVIEW_DECISION_VALUES, {
    message: "Choose approve or reject.",
  }),
});

export const reviewEmergencyRequestSchema = z.object({
  requestId: z
    .string()
    .trim()
    .regex(UUID_PATTERN, "Invalid request reference."),
  decision: z.enum(REQUEST_REVIEW_DECISION_VALUES, {
    message: "Choose approve or reject.",
  }),
});

export const assignResponderSchema = z.object({
  requestId: z
    .string()
    .trim()
    .regex(UUID_PATTERN, "Invalid request reference."),
  responderId: z
    .string()
    .trim()
    .regex(UUID_PATTERN, "Invalid responder reference."),
});

export type ReviewResponderInput = z.infer<typeof reviewResponderSchema>;
export type ReviewEmergencyRequestInput = z.infer<
  typeof reviewEmergencyRequestSchema
>;
export type AssignResponderInput = z.infer<typeof assignResponderSchema>;

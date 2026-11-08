import { z } from "zod";

export const EMERGENCY_SEVERITY_VALUES = [
  "low",
  "medium",
  "high",
  "critical",
] as const;

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const emergencyTypeSchema = z
  .string()
  .trim()
  .min(1, "Emergency type is required.")
  .max(100, "Emergency type must be 100 characters or fewer.");

const locationSchema = z
  .string()
  .trim()
  .min(1, "Location is required.")
  .max(500, "Location must be 500 characters or fewer.");

const descriptionSchema = z
  .string()
  .trim()
  .min(1, "Description is required.")
  .max(5000, "Description must be 5,000 characters or fewer.");

const severitySchema = z.enum(EMERGENCY_SEVERITY_VALUES, {
  message: "Choose a valid severity.",
});

const affectedPeopleSchema = z
  .string()
  .trim()
  .min(1, "Enter the number of affected people.")
  .regex(/^\d+$/, "Use a whole number for affected people.")
  .transform((value) => Number(value))
  .pipe(
    z
      .number()
      .int("Use a whole number for affected people.")
      .min(1, "At least 1 person must be affected.")
      .max(1_000_000, "Affected people must be 1,000,000 or fewer."),
  );

export const createRequestSchema = z.object({
  emergencyType: emergencyTypeSchema,
  location: locationSchema,
  description: descriptionSchema,
  affectedPeople: affectedPeopleSchema,
  severity: severitySchema,
});

export const requestIdSchema = z
  .string()
  .trim()
  .regex(UUID_PATTERN, "Invalid request reference.");

export type CreateRequestInput = z.infer<typeof createRequestSchema>;

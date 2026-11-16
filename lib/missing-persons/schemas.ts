import { z } from "zod";

export const MISSING_PERSON_GENDER_VALUES = [
  "female",
  "male",
  "other",
  "unknown",
] as const;

export const MISSING_PERSON_STATUS_VALUES = ["missing", "found"] as const;

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const fullNameSchema = z
  .string()
  .trim()
  .min(1, "Full name is required.")
  .max(120, "Full name must be 120 characters or fewer.");

const ageSchema = z
  .string()
  .trim()
  .refine(
    (value) => value === "" || /^\d+$/.test(value),
    "Use a whole number for age.",
  )
  .transform((value) => (value === "" ? null : Number(value)))
  .refine(
    (value) =>
      value === null ||
      (Number.isInteger(value) && value >= 0 && value <= 120),
    "Age must be between 0 and 120.",
  );

const genderSchema = z.enum(MISSING_PERSON_GENDER_VALUES, {
  message: "Choose a valid gender option.",
});

const descriptionSchema = z
  .string()
  .trim()
  .min(1, "Description is required.")
  .max(2000, "Description must be 2,000 characters or fewer.");

const lastSeenLocationSchema = z
  .string()
  .trim()
  .min(1, "Last seen location is required.")
  .max(500, "Last seen location must be 500 characters or fewer.");

// Bangladesh has used a fixed UTC+6 offset without daylight saving since 2009,
// so a `datetime-local` value can be converted by attaching that offset.
const BANGLADESH_UTC_OFFSET = "+06:00";

/**
 * Parses a `datetime-local` value as Bangladesh wall-clock time. The UTC
 * round-trip rejects impossible dates such as 30 February, which `Date`
 * would otherwise roll into the next month.
 */
function parseBangladeshDateTime(value: string): Date | null {
  const wallClock = new Date(`${value}:00Z`);

  if (
    Number.isNaN(wallClock.getTime()) ||
    wallClock.toISOString().slice(0, 16) !== value
  ) {
    return null;
  }

  return new Date(`${value}:00${BANGLADESH_UTC_OFFSET}`);
}

const lastSeenAtSchema = z
  .string()
  .trim()
  .min(1, "Enter when the person was last seen.")
  .transform((value) => parseBangladeshDateTime(value))
  .refine(
    (value): value is Date => value !== null,
    "Enter a valid date and time.",
  )
  .refine(
    (value) =>
      value === null || value.getTime() <= Date.now() + 5 * 60 * 1000,
    "Last seen time cannot be in the future.",
  );

export const createMissingPersonSchema = z.object({
  fullName: fullNameSchema,
  age: ageSchema,
  gender: genderSchema,
  description: descriptionSchema,
  lastSeenLocation: lastSeenLocationSchema,
  lastSeenAt: lastSeenAtSchema,
});

export const missingPersonIdSchema = z
  .string()
  .trim()
  .regex(UUID_PATTERN, "Invalid missing person reference.");

export const updateMissingPersonStatusSchema = z.object({
  reportId: missingPersonIdSchema,
  status: z.enum(MISSING_PERSON_STATUS_VALUES, {
    message: "Choose a valid report status.",
  }),
});

export type CreateMissingPersonInput = z.infer<
  typeof createMissingPersonSchema
>;
export type UpdateMissingPersonStatusInput = z.infer<
  typeof updateMissingPersonStatusSchema
>;

import { z } from "zod";
import type { RefinementCtx } from "zod";

export const PUBLIC_ROLE_VALUES = [
  "victim",
  "volunteer",
  "rescue_team_member",
] as const;

export const RESCUE_CATEGORY_VALUES = [
  "government",
  "hospital",
  "defence",
  "ngo",
] as const;

export const DEFENCE_SUBCATEGORY_VALUES = [
  "police",
  "fire_service",
] as const;

const fullNameSchema = z
  .string()
  .trim()
  .min(1, "Full name is required.")
  .max(120, "Full name must be 120 characters or fewer.");

const emailSchema = z
  .string()
  .trim()
  .min(3, "Email is required.")
  .max(320, "Email must be 320 characters or fewer.")
  .email("Enter a valid email address.")
  .transform((value) => value.toLowerCase());

const phoneSchema = z
  .string()
  .trim()
  .min(7, "Phone number must be at least 7 characters.")
  .max(30, "Phone number must be 30 characters or fewer.");

const addressSchema = z
  .string()
  .trim()
  .min(3, "Address is required.")
  .max(500, "Address must be 500 characters or fewer.");

const roleSchema = z.enum(PUBLIC_ROLE_VALUES, {
  message: "Choose a valid registration role.",
});

const rescueTeamCategorySchema = z.enum(RESCUE_CATEGORY_VALUES, {
  message: "Choose a valid rescue team category.",
});

const defenceSubcategorySchema = z.enum(DEFENCE_SUBCATEGORY_VALUES, {
  message: "Choose Police or Fire Service.",
});

function addIssue(
  ctx: RefinementCtx,
  path: string,
  message: string,
): void {
  ctx.addIssue({
    code: "custom",
    path: [path],
    message,
  });
}

function refineRescueFields(
  value: {
    role: (typeof PUBLIC_ROLE_VALUES)[number];
    rescueTeamCategory?: (typeof RESCUE_CATEGORY_VALUES)[number];
    defenceSubcategory?: (typeof DEFENCE_SUBCATEGORY_VALUES)[number];
  },
  ctx: RefinementCtx,
): void {
  if (value.role !== "rescue_team_member") {
    if (value.rescueTeamCategory) {
      addIssue(
        ctx,
        "rescueTeamCategory",
        "Only rescue team members choose a rescue team category.",
      );
    }

    if (value.defenceSubcategory) {
      addIssue(
        ctx,
        "defenceSubcategory",
        "Only Defence rescue teams choose a subcategory.",
      );
    }

    return;
  }

  if (!value.rescueTeamCategory) {
    addIssue(
      ctx,
      "rescueTeamCategory",
      "Choose a rescue team category.",
    );
    return;
  }

  if (value.rescueTeamCategory === "defence") {
    if (!value.defenceSubcategory) {
      addIssue(
        ctx,
        "defenceSubcategory",
        "Defence teams must be Police or Fire Service.",
      );
    }

    return;
  }

  if (value.defenceSubcategory) {
    addIssue(
      ctx,
      "defenceSubcategory",
      "Only Defence rescue teams choose a subcategory.",
    );
  }
}

export const registerSchema = z
  .object({
    fullName: fullNameSchema,
    email: emailSchema,
    password: z
      .string()
      .min(8, "Password must be at least 8 characters.")
      .max(72, "Password must be 72 characters or fewer."),
    confirmPassword: z.string().min(1, "Confirm your password."),
    phone: phoneSchema,
    address: addressSchema,
    role: roleSchema,
    rescueTeamCategory: rescueTeamCategorySchema.optional(),
    defenceSubcategory: defenceSubcategorySchema.optional(),
  })
  .superRefine((value, ctx) => {
    if (value.password !== value.confirmPassword) {
      addIssue(ctx, "confirmPassword", "Passwords do not match.");
    }

    refineRescueFields(value, ctx);
  });

export const loginSchema = z.object({
  email: emailSchema,
  password: z
    .string()
    .min(1, "Password is required.")
    .max(72, "Password must be 72 characters or fewer."),
});

export const profileUpdateSchema = z.object({
  fullName: fullNameSchema,
  phone: phoneSchema,
  address: addressSchema,
});

/**
 * Metadata written during sign-up. It is validated again on login so a
 * partially created account can be repaired without trusting arbitrary user
 * metadata.
 */
export const profileSeedSchema = z
  .object({
    fullName: fullNameSchema,
    phone: phoneSchema,
    address: addressSchema,
    role: roleSchema,
    rescueTeamCategory: rescueTeamCategorySchema.optional().nullable(),
    defenceSubcategory: defenceSubcategorySchema.optional().nullable(),
  })
  .superRefine((value, ctx) => {
    refineRescueFields(
      {
        role: value.role,
        rescueTeamCategory: value.rescueTeamCategory ?? undefined,
        defenceSubcategory: value.defenceSubcategory ?? undefined,
      },
      ctx,
    );
  });

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
export type ProfileSeed = z.infer<typeof profileSeedSchema>;

/**
 * Validates and normalises metadata stored on the Supabase auth user.
 */
export function parseProfileSeed(metadata: unknown): ProfileSeed | null {
  if (!metadata || typeof metadata !== "object") {
    return null;
  }

  const result = profileSeedSchema.safeParse(metadata);

  return result.success ? result.data : null;
}

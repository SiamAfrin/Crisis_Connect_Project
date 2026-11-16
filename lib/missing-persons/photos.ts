import type { SupabaseServerClient } from "@/lib/supabase/server";

/**
 * Private Storage bucket for optional missing-person photographs. Objects are
 * never exposed through public URLs; the data layer creates short-lived signed
 * URLs for active users.
 */
export const MISSING_PERSON_PHOTO_BUCKET = "missing-person-photos";

export const MISSING_PERSON_PHOTO_MAX_BYTES = 5 * 1024 * 1024;

export const MISSING_PERSON_PHOTO_SIGNED_URL_TTL_SECONDS = 10 * 60;

export const MISSING_PERSON_PHOTO_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export type MissingPersonPhotoMimeType =
  (typeof MISSING_PERSON_PHOTO_MIME_TYPES)[number];

export const MISSING_PERSON_PHOTO_ACCEPT =
  MISSING_PERSON_PHOTO_MIME_TYPES.join(",");

const PHOTO_EXTENSIONS: Readonly<Record<MissingPersonPhotoMimeType, string>> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

function isAllowedMimeType(value: string): value is MissingPersonPhotoMimeType {
  return (MISSING_PERSON_PHOTO_MIME_TYPES as readonly string[]).includes(value);
}

function matchesImageSignature(
  bytes: Uint8Array,
  mimeType: MissingPersonPhotoMimeType,
): boolean {
  if (mimeType === "image/jpeg") {
    return (
      bytes.length >= 3 &&
      bytes[0] === 0xff &&
      bytes[1] === 0xd8 &&
      bytes[2] === 0xff
    );
  }

  if (mimeType === "image/png") {
    const pngSignature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

    return (
      bytes.length >= pngSignature.length &&
      pngSignature.every((byte, index) => bytes[index] === byte)
    );
  }

  // WebP is a RIFF container with a WEBP form type at bytes 8-11.
  const riff = [0x52, 0x49, 0x46, 0x46];
  const webp = [0x57, 0x45, 0x42, 0x50];

  return (
    bytes.length >= 12 &&
    riff.every((byte, index) => bytes[index] === byte) &&
    webp.every((byte, index) => bytes[index + 8] === byte)
  );
}

export type MissingPersonPhotoValidation =
  | { ok: true; file: File | null }
  | { ok: false; message: string };

/**
 * Validates an optional photo field on the server.
 *
 * A missing file input is valid and returns `file: null`. A provided file must
 * be a JPG, PNG, or WebP image no larger than 5 MB, and its leading bytes must
 * match the declared image type so a renamed non-image file is rejected.
 */
export async function validateMissingPersonPhoto(
  value: FormDataEntryValue | null,
): Promise<MissingPersonPhotoValidation> {
  if (value === null) {
    return { ok: true, file: null };
  }

  if (typeof value === "string") {
    // An untouched file input can arrive as an empty string instead of a
    // zero-length File, depending on how the multipart body is decoded.
    // Treat that as "no photo" rather than an invalid upload.
    if (value === "") {
      return { ok: true, file: null };
    }

    return { ok: false, message: "Choose a photo file to upload." };
  }

  const file = value;

  // Browsers submit an empty File when the optional input is left untouched.
  // Next's multipart decoder passes busboy's `undefined` filename into
  // `new File(...)`, which stringifies to "undefined".
  if (
    file.size === 0 &&
    (file.name === "" || file.name === "undefined") &&
    !isAllowedMimeType(file.type)
  ) {
    return { ok: true, file: null };
  }

  if (!isAllowedMimeType(file.type)) {
    return {
      ok: false,
      message: "Upload a JPG, PNG, or WebP image.",
    };
  }

  if (file.size === 0) {
    return { ok: false, message: "The selected photo is empty." };
  }

  if (file.size > MISSING_PERSON_PHOTO_MAX_BYTES) {
    return {
      ok: false,
      message: "Photo must be 5 MB or smaller.",
    };
  }

  const header = new Uint8Array(
    await file.slice(0, 12).arrayBuffer(),
  );

  if (!matchesImageSignature(header, file.type)) {
    return {
      ok: false,
      message: "The selected file is not a valid JPG, PNG, or WebP image.",
    };
  }

  return { ok: true, file };
}

export type MissingPersonPhotoPlan =
  | { kind: "none" }
  | { kind: "upload"; file: File; path: string }
  | { kind: "error"; message: string };

export function buildMissingPersonPhotoPath(
  userId: string,
  file: File,
): string {
  const extension = isAllowedMimeType(file.type)
    ? PHOTO_EXTENSIONS[file.type]
    : "bin";

  return `${userId}/${crypto.randomUUID()}.${extension}`;
}

/**
 * Decides what the Server Action should do with the optional photo field. The
 * report insert runs with a NULL photo path for `none`, and only uploads for
 * `upload`. This keeps the with-photo and without-photo paths independent.
 */
export async function planMissingPersonPhoto(
  value: FormDataEntryValue | null,
  userId: string,
): Promise<MissingPersonPhotoPlan> {
  const validation = await validateMissingPersonPhoto(value);

  if (!validation.ok) {
    return { kind: "error", message: validation.message };
  }

  if (!validation.file) {
    return { kind: "none" };
  }

  return {
    kind: "upload",
    file: validation.file,
    path: buildMissingPersonPhotoPath(userId, validation.file),
  };
}

export async function uploadMissingPersonPhoto(
  supabase: SupabaseServerClient,
  path: string,
  file: File,
): Promise<{ path: string | null; error?: string }> {
  const { error } = await supabase.storage
    .from(MISSING_PERSON_PHOTO_BUCKET)
    .upload(path, file, {
      contentType: file.type,
      upsert: false,
    });

  if (error) {
    return { path: null, error: error.message };
  }

  return { path };
}

/**
 * Best-effort cleanup for an uploaded file whose report insert failed. The
 * caller keeps the original insert error even if cleanup also fails.
 */
export async function removeMissingPersonPhoto(
  supabase: SupabaseServerClient,
  path: string,
): Promise<{ error?: string }> {
  const { error } = await supabase.storage
    .from(MISSING_PERSON_PHOTO_BUCKET)
    .remove([path]);

  if (error) {
    return { error: error.message };
  }

  return {};
}

/**
 * Creates signed URLs for the photos in a result set. Missing paths are
 * skipped, and a Storage failure degrades to no photo rather than failing the
 * whole directory.
 */
export async function createMissingPersonPhotoUrls(
  supabase: SupabaseServerClient,
  paths: Array<string | null>,
): Promise<Map<string, string>> {
  const uniquePaths = Array.from(
    new Set(paths.filter((path): path is string => Boolean(path))),
  );

  if (uniquePaths.length === 0) {
    return new Map();
  }

  const { data, error } = await supabase.storage
    .from(MISSING_PERSON_PHOTO_BUCKET)
    .createSignedUrls(uniquePaths, MISSING_PERSON_PHOTO_SIGNED_URL_TTL_SECONDS);

  if (error || !data) {
    return new Map();
  }

  const urlByPath = new Map<string, string>();

  for (const item of data) {
    if (item.path && item.signedUrl) {
      urlByPath.set(item.path, item.signedUrl);
    }
  }

  return urlByPath;
}

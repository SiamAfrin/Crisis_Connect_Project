import assert from "node:assert/strict";
import { test } from "node:test";

import {
  MISSING_PERSON_PHOTO_MAX_BYTES,
  planMissingPersonPhoto,
} from "../lib/missing-persons/photos.ts";
import { createMissingPersonSchema } from "../lib/missing-persons/schemas.ts";

const USER_ID = "11111111-1111-4111-8111-111111111111";

const BASE_REPORT = {
  fullName: "Test Person",
  age: "34",
  gender: "female",
  description: "Wearing a blue jacket and carrying a grey backpack.",
  lastSeenLocation: "Central shelter, Dhaka",
  lastSeenAt: "2020-01-01T10:00",
};

const PNG_HEADER = new Uint8Array([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x00,
]);
const JPEG_HEADER = new Uint8Array([
  0xff, 0xd8, 0xff, 0xe0, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
]);
const WEBP_HEADER = new Uint8Array([
  0x52, 0x49, 0x46, 0x46, 0x04, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50,
]);
const NOT_AN_IMAGE = new Uint8Array([
  0x3c, 0x68, 0x74, 0x6d, 0x6c, 0x3e, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
]);

function imageFile(
  bytes: Uint8Array<ArrayBuffer>,
  name: string,
  type: string,
): File {
  return new File([bytes], name, { type });
}

test("report text fields validate without any photo field", () => {
  const parsed = createMissingPersonSchema.safeParse(BASE_REPORT);

  assert.equal(parsed.success, true);
});

test("no photo selection plans a report with a null photo path", async () => {
  const plan = await planMissingPersonPhoto(null, USER_ID);

  assert.deepEqual(plan, { kind: "none" });
});

test("an untouched browser file input plans a report without an upload", async () => {
  const untouchedInput = new File([], "", {
    type: "application/octet-stream",
  });

  const plan = await planMissingPersonPhoto(untouchedInput, USER_ID);

  assert.deepEqual(plan, { kind: "none" });
});

test("an empty string photo field plans a report without an upload", async () => {
  // A multipart body may decode an untouched file input as "" rather than a
  // zero-length File, which previously blocked submission without a photo.
  const plan = await planMissingPersonPhoto("", USER_ID);

  assert.deepEqual(plan, { kind: "none" });
});

test("the server-decoded untouched input plans a report without an upload", async () => {
  // Next's multipart decoder turns busboy's undefined filename into
  // "undefined", so the untouched input arrives as a zero-byte File with that
  // name and a generic content type.
  const serverShape = new File([], "undefined", {
    type: "application/octet-stream",
  });

  const plan = await planMissingPersonPhoto(serverShape, USER_ID);

  assert.deepEqual(plan, { kind: "none" });
});

test("a valid PNG photo plans an upload under the reporter folder", async () => {
  const plan = await planMissingPersonPhoto(
    imageFile(PNG_HEADER, "photo.png", "image/png"),
    USER_ID,
  );

  assert.equal(plan.kind, "upload");

  if (plan.kind !== "upload") {
    return;
  }

  assert.equal(plan.file.type, "image/png");
  assert.match(
    plan.path,
    new RegExp(`^${USER_ID}/[0-9a-f-]{36}\\.png$`),
  );
});

test("a valid JPEG photo plans an upload with a jpg extension", async () => {
  const plan = await planMissingPersonPhoto(
    imageFile(JPEG_HEADER, "photo.jpeg", "image/jpeg"),
    USER_ID,
  );

  assert.equal(plan.kind, "upload");

  if (plan.kind !== "upload") {
    return;
  }

  assert.match(plan.path, /\.jpg$/);
});

test("a valid WebP photo plans an upload with a webp extension", async () => {
  const plan = await planMissingPersonPhoto(
    imageFile(WEBP_HEADER, "photo.webp", "image/webp"),
    USER_ID,
  );

  assert.equal(plan.kind, "upload");

  if (plan.kind !== "upload") {
    return;
  }

  assert.match(plan.path, /\.webp$/);
});

test("a non-image MIME type is rejected", async () => {
  const plan = await planMissingPersonPhoto(
    imageFile(NOT_AN_IMAGE, "notes.txt", "text/plain"),
    USER_ID,
  );

  assert.deepEqual(plan, {
    kind: "error",
    message: "Upload a JPG, PNG, or WebP image.",
  });
});

test("a renamed non-image file is rejected by its signature", async () => {
  const plan = await planMissingPersonPhoto(
    imageFile(NOT_AN_IMAGE, "photo.png", "image/png"),
    USER_ID,
  );

  assert.deepEqual(plan, {
    kind: "error",
    message: "The selected file is not a valid JPG, PNG, or WebP image.",
  });
});

test("an empty file with an image name is rejected", async () => {
  const plan = await planMissingPersonPhoto(
    imageFile(new Uint8Array(), "photo.png", "image/png"),
    USER_ID,
  );

  assert.deepEqual(plan, {
    kind: "error",
    message: "The selected photo is empty.",
  });
});

test("a photo larger than 5 MB is rejected", async () => {
  const oversized = new Uint8Array(MISSING_PERSON_PHOTO_MAX_BYTES + 1);
  oversized.set(PNG_HEADER);

  const plan = await planMissingPersonPhoto(
    imageFile(oversized, "photo.png", "image/png"),
    USER_ID,
  );

  assert.equal(plan.kind, "error");

  if (plan.kind === "error") {
    assert.match(plan.message, /5 MB or smaller/);
  }
});

test("a non-file form value is rejected", async () => {
  const plan = await planMissingPersonPhoto("not-a-file", USER_ID);

  assert.deepEqual(plan, {
    kind: "error",
    message: "Choose a photo file to upload.",
  });
});

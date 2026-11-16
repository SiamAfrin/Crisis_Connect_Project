import assert from "node:assert/strict";
import { test } from "node:test";

import { formatRegistrationDate } from "../lib/admin/format.ts";
import { createMissingPersonSchema } from "../lib/missing-persons/schemas.ts";
import { formatDateTime } from "../lib/requests/format.ts";

const BASE_REPORT = {
  fullName: "Test Person",
  age: "34",
  gender: "female",
  description: "Wearing a blue jacket and carrying a grey backpack.",
  lastSeenLocation: "Central shelter, Dhaka",
  lastSeenAt: "2026-11-16T22:14",
};

function toDhakaInputValue(date: Date): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Dhaka",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);

  const get = (type: string) =>
    parts.find((part) => part.type === type)?.value ?? "";

  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`;
}

test("a UTC instant is displayed in Bangladesh time with a BST label", () => {
  const formatted = formatDateTime("2026-11-16T16:14:00.000Z");

  assert.match(formatted, /22:14/);
  assert.ok(formatted.endsWith("BST"));
});

test("registration dates use the same Bangladesh timezone", () => {
  const formatted = formatRegistrationDate("2026-11-16T16:14:00.000Z");

  assert.match(formatted, /22:14/);
  assert.ok(formatted.endsWith("BST"));
});

test("a last-seen datetime is parsed as Bangladesh local time", () => {
  const parsed = createMissingPersonSchema.safeParse(BASE_REPORT);

  assert.equal(parsed.success, true);

  if (!parsed.success) {
    return;
  }

  assert.equal(
    parsed.data.lastSeenAt.toISOString(),
    "2026-11-16T16:14:00.000Z",
  );
});

test("a last-seen datetime just after local midnight converts to the prior UTC day", () => {
  const parsed = createMissingPersonSchema.safeParse({
    ...BASE_REPORT,
    lastSeenAt: "2020-01-02T00:30",
  });

  assert.equal(parsed.success, true);

  if (!parsed.success) {
    return;
  }

  assert.equal(
    parsed.data.lastSeenAt.toISOString(),
    "2020-01-01T18:30:00.000Z",
  );
});

test("an impossible last-seen date is rejected", () => {
  const parsed = createMissingPersonSchema.safeParse({
    ...BASE_REPORT,
    lastSeenAt: "2026-02-30T10:00",
  });

  assert.equal(parsed.success, false);
});

test("a last-seen time more than five minutes in the future is rejected", () => {
  const parsed = createMissingPersonSchema.safeParse({
    ...BASE_REPORT,
    lastSeenAt: toDhakaInputValue(new Date(Date.now() + 60 * 60 * 1000)),
  });

  assert.equal(parsed.success, false);

  if (parsed.success) {
    return;
  }

  assert.match(parsed.error.issues[0]?.message ?? "", /cannot be in the future/);
});

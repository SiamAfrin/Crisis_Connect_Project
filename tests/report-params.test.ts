import assert from "node:assert/strict";
import { test } from "node:test";

import {
  getReportFilename,
  normalizeReportType,
  parseReportRange,
} from "../lib/reports/params.ts";

test("empty report dates leave the report unrestricted", () => {
  const { range, error } = parseReportRange({ from: "", to: "" });

  assert.equal(error, undefined);
  assert.deepEqual(range, { fromIso: null, toIso: null });
});

test("a start date begins at Bangladesh midnight", () => {
  const { range, error } = parseReportRange({ from: "2026-11-01" });

  assert.equal(error, undefined);
  assert.equal(range.fromIso, "2026-10-31T18:00:00.000Z");
  assert.equal(range.toIso, null);
});

test("an end date covers the whole Bangladesh day", () => {
  const { range, error } = parseReportRange({ to: "2026-11-17" });

  assert.equal(error, undefined);
  assert.equal(range.fromIso, null);
  assert.equal(range.toIso, "2026-11-17T17:59:59.999Z");
});

test("a single-day report is inclusive on both sides", () => {
  const { range, error } = parseReportRange({
    from: "2026-11-16",
    to: "2026-11-16",
  });

  assert.equal(error, undefined);
  assert.equal(range.fromIso, "2026-11-15T18:00:00.000Z");
  assert.equal(range.toIso, "2026-11-16T17:59:59.999Z");
});

test("impossible and malformed dates are rejected", () => {
  assert.equal(
    parseReportRange({ from: "2026-02-30" }).error,
    "Enter a valid start date in YYYY-MM-DD format.",
  );
  assert.equal(
    parseReportRange({ to: "17-11-2026" }).error,
    "Enter a valid end date in YYYY-MM-DD format.",
  );
  assert.notEqual(parseReportRange({ from: "2026-13-01" }).error, undefined);
});

test("the start date cannot be after the end date", () => {
  const { error } = parseReportRange({
    from: "2026-11-18",
    to: "2026-11-17",
  });

  assert.equal(error, "The start date must be on or before the end date.");
});

test("only the missions value selects the rescue activity report", () => {
  assert.equal(normalizeReportType("missions"), "missions");
  assert.equal(normalizeReportType("requests"), "requests");
  assert.equal(normalizeReportType(""), "requests");
  assert.equal(normalizeReportType("archived"), "requests");
});

test("the report filename reflects the type and validated dates", () => {
  assert.equal(
    getReportFilename("requests", { from: "2026-11-01", to: "2026-11-17" }),
    "crisis-connect-emergency-requests-2026-11-01-to-2026-11-17.csv",
  );
  assert.equal(
    getReportFilename("missions", {}),
    "crisis-connect-rescue-activities-all-time.csv",
  );
  assert.equal(
    getReportFilename("missions", { from: "2026-11-01" }),
    "crisis-connect-rescue-activities-from-2026-11-01.csv",
  );
  assert.equal(
    getReportFilename("requests", { to: "2026-11-17" }),
    "crisis-connect-emergency-requests-to-2026-11-17.csv",
  );
});

test("an unexpected filename value cannot reach the response header", () => {
  const filename = getReportFilename("requests", {
    from: '2026-11-01"\r\nX-Injected: yes',
    to: "not-a-date",
  });

  assert.equal(filename, "crisis-connect-emergency-requests-all-time.csv");
  assert.ok(!filename.includes('"'));
  assert.ok(!filename.includes("\r"));
  assert.ok(!filename.includes("\n"));
});

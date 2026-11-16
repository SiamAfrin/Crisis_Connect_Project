import assert from "node:assert/strict";
import { test } from "node:test";

import { buildCsv, escapeCsvValue } from "../lib/reports/csv.ts";

test("plain values are written without quotes", () => {
  assert.equal(escapeCsvValue("plain"), "plain");
  assert.equal(escapeCsvValue(42), "42");
  assert.equal(escapeCsvValue(null), "");
  assert.equal(escapeCsvValue(undefined), "");
});

test("commas, quotes, and line breaks stay inside one field", () => {
  assert.equal(escapeCsvValue("Dhaka, Sector 4"), '"Dhaka, Sector 4"');
  assert.equal(escapeCsvValue('say "hi"'), '"say ""hi"""');
  assert.equal(escapeCsvValue("line\nbreak"), '"line\nbreak"');
  assert.equal(escapeCsvValue("line\r\nbreak"), '"line\r\nbreak"');
});

test("formula-looking text is neutralized but numbers are not", () => {
  assert.equal(escapeCsvValue("=1+1"), "'=1+1");
  assert.equal(escapeCsvValue("  =SUM(A1)"), "'  =SUM(A1)");
  assert.equal(escapeCsvValue("+SUM(A1)"), "'+SUM(A1)");
  assert.equal(escapeCsvValue("@cmd"), "'@cmd");
  assert.equal(escapeCsvValue("-5"), "'-5");
  assert.equal(escapeCsvValue(-5), "-5");
});

test("CSV uses CRLF line endings and ends with a newline", () => {
  const csv = buildCsv(["A", "B"], [
    ["one", 2],
    ["three", null],
  ]);

  assert.equal(csv, "A,B\r\none,2\r\nthree,\r\n");
});

test("a header-only CSV is still a valid attachment", () => {
  assert.equal(buildCsv(["Reference", "Status"], []), "Reference,Status\r\n");
});

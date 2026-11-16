import assert from "node:assert/strict";
import { test } from "node:test";

import { formatCount } from "../lib/admin/format.ts";
import {
  getMissionStatusesForFilter,
  MISSION_STATUS_FILTERS,
  normalizeMissionStatusFilter,
} from "../lib/admin/mission-filters.ts";

test("the mission monitor accepts each supported status filter", () => {
  for (const filter of MISSION_STATUS_FILTERS) {
    assert.equal(normalizeMissionStatusFilter(filter.value), filter.value);
  }
});

test("an unknown mission filter falls back to all missions", () => {
  assert.equal(normalizeMissionStatusFilter("archived"), "all");
  assert.equal(normalizeMissionStatusFilter(""), "all");
});

test("the all-missions filter does not restrict assignment statuses", () => {
  assert.equal(getMissionStatusesForFilter("all"), undefined);
});

test("the closed filter groups declined and cancelled missions", () => {
  assert.deepEqual(getMissionStatusesForFilter("closed"), [
    "declined",
    "cancelled",
  ]);
});

test("each active mission filter maps to one assignment status", () => {
  assert.deepEqual(getMissionStatusesForFilter("pending"), ["pending"]);
  assert.deepEqual(getMissionStatusesForFilter("accepted"), ["accepted"]);
  assert.deepEqual(getMissionStatusesForFilter("completed"), ["completed"]);
});

test("monitoring counts use grouped number formatting", () => {
  assert.equal(formatCount(0), "0");
  assert.equal(formatCount(1234), "1,234");
});

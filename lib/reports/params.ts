export type ReportType = "requests" | "missions";

export type ReportTypeOption = {
  value: ReportType;
  label: string;
  description: string;
};

export const REPORT_TYPE_OPTIONS: ReadonlyArray<ReportTypeOption> = [
  {
    value: "requests",
    label: "Emergency request report",
    description:
      "Emergency requests submitted in the selected period, with review status, severity, and emergency type summaries.",
  },
  {
    value: "missions",
    label: "Rescue activity report",
    description:
      "Missions assigned in the selected period, with mission status, assigned responders, and rescue activity summaries.",
  },
];

/**
 * Reports read one capped batch of rows. The cap keeps a report request bounded
 * while still covering the current project scale; the page and export disclose
 * when the cap is reached.
 */
export const REPORT_ROW_LIMIT = 1000;

export type ReportRange = {
  fromIso: string | null;
  toIso: string | null;
};

export type ReportRangeResult = {
  range: ReportRange;
  error?: string;
};

const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

// Bangladesh has used a fixed UTC+6 offset without daylight saving since 2009.
// A report date therefore maps to that wall-clock day in Bangladesh time.
const BANGLADESH_UTC_OFFSET_MS = 6 * 60 * 60 * 1000;

type CalendarDate = {
  year: number;
  month: number;
  day: number;
};

/**
 * Accepts only a real calendar date. The UTC round-trip rejects impossible
 * dates such as 30 February, which `Date` would otherwise roll forward.
 */
function parseCalendarDate(value: string): CalendarDate | null {
  const match = DATE_PATTERN.exec(value);

  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const utc = new Date(Date.UTC(year, month - 1, day));

  if (
    utc.getUTCFullYear() !== year ||
    utc.getUTCMonth() !== month - 1 ||
    utc.getUTCDate() !== day
  ) {
    return null;
  }

  return { year, month, day };
}

function startOfBangladeshDay(date: CalendarDate): string {
  const utcMidnight = Date.UTC(date.year, date.month - 1, date.day);

  return new Date(utcMidnight - BANGLADESH_UTC_OFFSET_MS).toISOString();
}

function endOfBangladeshDay(date: CalendarDate): string {
  const utcEnd = Date.UTC(
    date.year,
    date.month - 1,
    date.day,
    23,
    59,
    59,
    999,
  );

  return new Date(utcEnd - BANGLADESH_UTC_OFFSET_MS).toISOString();
}

/**
 * Turns optional `YYYY-MM-DD` report dates into inclusive UTC bounds for the
 * same Bangladesh calendar day. Empty bounds mean the report is not restricted
 * on that side of the period.
 */
export function parseReportRange(input: {
  from?: string;
  to?: string;
}): ReportRangeResult {
  const from = (input.from ?? "").trim();
  const to = (input.to ?? "").trim();

  const fromDate = from === "" ? null : parseCalendarDate(from);
  const toDate = to === "" ? null : parseCalendarDate(to);

  if (from !== "" && fromDate === null) {
    return {
      range: { fromIso: null, toIso: null },
      error: "Enter a valid start date in YYYY-MM-DD format.",
    };
  }

  if (to !== "" && toDate === null) {
    return {
      range: { fromIso: null, toIso: null },
      error: "Enter a valid end date in YYYY-MM-DD format.",
    };
  }

  if (fromDate && toDate && from > to) {
    return {
      range: { fromIso: null, toIso: null },
      error: "The start date must be on or before the end date.",
    };
  }

  return {
    range: {
      fromIso: fromDate ? startOfBangladeshDay(fromDate) : null,
      toIso: toDate ? endOfBangladeshDay(toDate) : null,
    },
  };
}

/**
 * Accepts only the two supported report types. Any other query value falls back
 * to the emergency request report.
 */
export function normalizeReportType(value: string): ReportType {
  return value === "missions" ? "missions" : "requests";
}

/**
 * Builds a plain, predictable attachment name. Only validated date values are
 * included, so a crafted query value cannot reach the response header.
 */
export function getReportFilename(
  type: ReportType,
  range: { from?: string; to?: string },
): string {
  const base =
    type === "missions"
      ? "crisis-connect-rescue-activities"
      : "crisis-connect-emergency-requests";

  const from = (range.from ?? "").trim();
  const to = (range.to ?? "").trim();
  const safeFrom = DATE_PATTERN.test(from) ? from : "";
  const safeTo = DATE_PATTERN.test(to) ? to : "";

  let suffix = "all-time";

  if (safeFrom && safeTo) {
    suffix = `${safeFrom}-to-${safeTo}`;
  } else if (safeFrom) {
    suffix = `from-${safeFrom}`;
  } else if (safeTo) {
    suffix = `to-${safeTo}`;
  }

  return `${base}-${suffix}.csv`;
}

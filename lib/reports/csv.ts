export type CsvValue = string | number | null | undefined;

/**
 * Escapes one CSV field. Text that a spreadsheet could treat as a formula is
 * prefixed with an apostrophe so user-supplied locations and names cannot run
 * as formulas when the report is opened in Excel.
 */
export function escapeCsvValue(value: CsvValue): string {
  if (value === null || value === undefined) {
    return "";
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? String(value) : "";
  }

  const text = String(value);
  const safe =
    /^\s*[=+\-@]/.test(text) || /^[\t\r]/.test(text) ? `'${text}` : text;

  if (/[",\r\n]/.test(safe)) {
    return `"${safe.replace(/"/g, '""')}"`;
  }

  return safe;
}

/**
 * Builds RFC 4180-style CSV with CRLF line endings. The export route adds the
 * UTF-8 BOM so Excel opens the downloaded file with the right encoding.
 */
export function buildCsv(
  headers: ReadonlyArray<string>,
  rows: ReadonlyArray<ReadonlyArray<CsvValue>>,
): string {
  const lines = [
    headers.map(escapeCsvValue).join(","),
    ...rows.map((row) => row.map(escapeCsvValue).join(",")),
  ];

  return `${lines.join("\r\n")}\r\n`;
}

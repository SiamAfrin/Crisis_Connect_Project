// Crisis Connect shows every timestamp in Bangladesh Standard Time (UTC+6).
// The explicit time zone keeps server output deterministic regardless of the
// host's own time zone.
const dateTimeFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Asia/Dhaka",
});

const numberFormatter = new Intl.NumberFormat("en-US");

export function formatDateTime(value: string): string {
  return `${dateTimeFormatter.format(new Date(value))} BST`;
}

export function formatAffectedPeople(value: number): string {
  return numberFormatter.format(value);
}

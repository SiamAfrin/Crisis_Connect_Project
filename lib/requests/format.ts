const dateTimeFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "UTC",
});

const numberFormatter = new Intl.NumberFormat("en-US");

export function formatDateTime(value: string): string {
  return `${dateTimeFormatter.format(new Date(value))} UTC`;
}

export function formatAffectedPeople(value: number): string {
  return numberFormatter.format(value);
}

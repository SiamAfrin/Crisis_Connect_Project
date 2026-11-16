import Link from "next/link";

import { formatCount } from "@/lib/admin/format";

type AdminStatCardProps = {
  label: string;
  value: number;
  hint?: string;
  href?: string;
  tone?: "default" | "warning" | "success" | "info";
};

const TONE_CLASSES: Readonly<
  Record<NonNullable<AdminStatCardProps["tone"]>, string>
> = {
  default: "text-ink-950",
  warning: "text-amber-700",
  success: "text-emerald-700",
  info: "text-sky-700",
};

/**
 * A single real database count for the administrator monitoring dashboard.
 * The value is never computed from sample data; each card receives a count
 * from a request-scoped Supabase query.
 */
export function AdminStatCard({
  label,
  value,
  hint,
  href,
  tone = "default",
}: AdminStatCardProps) {
  const content = (
    <>
      <p className="text-xs font-medium text-ink-500">{label}</p>
      <p
        className={`mt-2 text-2xl font-semibold tracking-tight ${TONE_CLASSES[tone]}`}
      >
        {formatCount(value)}
      </p>
      {hint ? <p className="mt-1 text-xs text-ink-500">{hint}</p> : null}
    </>
  );

  const classes =
    "block rounded-lg border border-line bg-white px-5 py-4 transition";

  if (href) {
    return (
      <Link
        href={href}
        className={`${classes} hover:border-ink-300 hover:bg-ink-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink-950`}
      >
        {content}
      </Link>
    );
  }

  return <div className={classes}>{content}</div>;
}

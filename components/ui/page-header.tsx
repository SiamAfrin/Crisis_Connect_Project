import type { ReactNode } from "react";

type PageHeaderProps = {
  title: string;
  description?: string;
  actions?: ReactNode;
  meta?: ReactNode;
};

export function PageHeader({
  title,
  description,
  actions,
  meta,
}: PageHeaderProps) {
  return (
    <header className="flex flex-col gap-5 border-b border-line pb-6 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0 max-w-3xl">
        <h1 className="text-2xl font-semibold tracking-[-0.025em] text-ink-950 sm:text-3xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-2 text-sm leading-6 text-ink-600">{description}</p>
        ) : null}
        {meta ? <div className="mt-3">{meta}</div> : null}
      </div>

      {actions ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {actions}
        </div>
      ) : null}
    </header>
  );
}

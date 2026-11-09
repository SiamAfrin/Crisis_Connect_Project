import type { ReactNode } from "react";

type EmptyStateProps = {
  title: string;
  description: string;
  action?: ReactNode;
};

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="rounded-lg border border-line bg-white px-6 py-8 text-center">
      <h2 className="text-base font-semibold text-ink-950">{title}</h2>
      <p className="mx-auto mt-1.5 max-w-md text-sm leading-6 text-ink-600">
        {description}
      </p>
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </div>
  );
}

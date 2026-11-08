export function PlaceholderCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <article className="rounded-2xl border border-dashed border-slate-300 bg-white p-5">
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
        <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-slate-500">
          Planned
        </span>
      </div>
      <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
    </article>
  );
}

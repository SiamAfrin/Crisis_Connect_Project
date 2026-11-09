type LogoProps = {
  tone?: "light" | "dark";
  subtitle?: string;
};

export function Logo({
  tone = "dark",
  subtitle = "Emergency response coordination",
}: LogoProps) {
  const isLight = tone === "light";

  return (
    <div className="flex items-center gap-3">
      <div className="relative grid size-10 shrink-0 place-items-center rounded-lg bg-signal-600 text-white shadow-sm">
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          className="size-5"
        >
          <path
            d="M9.25 3h5.5A1.25 1.25 0 0 1 16 4.25V8h3.75A1.25 1.25 0 0 1 21 9.25v5.5A1.25 1.25 0 0 1 19.75 16H16v3.75A1.25 1.25 0 0 1 14.75 21h-5.5A1.25 1.25 0 0 1 8 19.75V16H4.25A1.25 1.25 0 0 1 3 14.75v-5.5A1.25 1.25 0 0 1 4.25 8H8V4.25A1.25 1.25 0 0 1 9.25 3Z"
            fill="currentColor"
          />
        </svg>
      </div>
      <div className="min-w-0">
        <p
          className={
            isLight
              ? "text-[0.95rem] font-semibold leading-5 tracking-tight text-white"
              : "text-[0.95rem] font-semibold leading-5 tracking-tight text-ink-950"
          }
        >
          Crisis Connect
        </p>
        <p
          className={
            isLight
              ? "truncate text-[0.68rem] leading-4 text-ink-300"
              : "truncate text-[0.68rem] leading-4 text-ink-600"
          }
        >
          {subtitle}
        </p>
      </div>
    </div>
  );
}

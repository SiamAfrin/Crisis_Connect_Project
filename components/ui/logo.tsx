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
      <div className="grid size-11 place-items-center rounded-2xl bg-rose-600 text-white shadow-lg shadow-rose-600/25">
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          className="size-6"
        >
          <path
            d="M9 4.75A1.75 1.75 0 0 1 10.75 3h2.5A1.75 1.75 0 0 1 15 4.75V9h4.25A1.75 1.75 0 0 1 21 10.75v2.5A1.75 1.75 0 0 1 19.25 15H15v4.25A1.75 1.75 0 0 1 13.25 21h-2.5A1.75 1.75 0 0 1 9 19.25V15H4.75A1.75 1.75 0 0 1 3 13.25v-2.5A1.75 1.75 0 0 1 4.75 9H9V4.75Z"
            fill="currentColor"
          />
        </svg>
      </div>
      <div>
        <p
          className={
            isLight
              ? "text-base font-semibold tracking-tight text-white"
              : "text-base font-semibold tracking-tight text-slate-950"
          }
        >
          Crisis Connect
        </p>
        <p
          className={
            isLight
              ? "text-sm text-slate-400"
              : "text-sm text-slate-500"
          }
        >
          {subtitle}
        </p>
      </div>
    </div>
  );
}

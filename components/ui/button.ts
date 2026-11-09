const base =
  "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-60";

export const buttonPrimary = `${base} bg-ink-950 text-white shadow-sm hover:bg-ink-800 active:bg-ink-900 focus-visible:outline-ink-950`;

export const buttonSignal = `${base} bg-signal-500 text-white shadow-sm hover:bg-signal-600 active:bg-signal-700 focus-visible:outline-signal-600`;

export const buttonSecondary = `${base} border border-line bg-white text-ink-700 hover:border-ink-300 hover:text-ink-950 active:bg-ink-50 focus-visible:outline-ink-950`;

export const buttonGhost = `${base} text-ink-600 hover:bg-ink-50 hover:text-ink-950 active:bg-ink-100 focus-visible:outline-ink-950`;

export const buttonSuccess = `${base} bg-emerald-700 text-white shadow-sm hover:bg-emerald-800 active:bg-emerald-900 focus-visible:outline-emerald-700`;

export const buttonDanger = `${base} border border-signal-200 bg-signal-50 text-signal-700 hover:bg-signal-100 active:bg-signal-200 focus-visible:outline-signal-600`;

export const buttonSmall = "px-3 py-2 text-xs";

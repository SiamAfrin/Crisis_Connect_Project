import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Crisis Connect",
    template: "%s | Crisis Connect",
  },
  description:
    "A centralized emergency response and coordination system for victims, responders, and administrators.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full bg-slate-50 font-sans">{children}</body>
    </html>
  );
}

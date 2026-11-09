"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export type AppNavItem = {
  href: string;
  label: string;
};

export function AppNav({ items }: { items: AppNavItem[] }) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Application"
      className="scrollbar-thin -mb-px flex items-center gap-1 overflow-x-auto"
    >
      {items.map((item) => {
        const isActive =
          pathname === item.href || pathname.startsWith(`${item.href}/`);

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            className={
              isActive
                ? "inline-flex shrink-0 items-center border-b-2 border-signal-400 px-3 py-3 text-sm font-semibold text-white transition"
                : "inline-flex shrink-0 items-center border-b-2 border-transparent px-3 py-3 text-sm font-medium text-ink-200 transition hover:border-white/40 hover:text-white"
            }
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

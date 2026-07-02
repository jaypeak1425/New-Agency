"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

const NAV_ITEMS = [
  { href: "/app", label: "Dashboard" },
  { href: "/app/scenarios", label: "Scenarios" },
  { href: "/app/pipeline", label: "Pipeline" },
  { href: "/app/prospects", label: "Prospects" },
  { href: "/app/tax-reference", label: "Tax reference" },
  { href: "/app/settings", label: "Settings" },
];

export function AppNav() {
  const pathname = usePathname();

  return (
    <div className="flex flex-col gap-1">
      {NAV_ITEMS.map((item) => {
        const active = item.href === "/app" ? pathname === "/app" : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "rounded-md px-3 py-2 text-sm transition-colors",
              active ? "bg-navy-light text-gold" : "text-cream/80 hover:bg-navy-light hover:text-cream",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}

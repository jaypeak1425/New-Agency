"use client";

import { Button } from "@/components/ui/Button";

export function PrintButton({ children = "Print / save as PDF" }: { children?: React.ReactNode }) {
  return (
    <Button variant="outline" onClick={() => window.print()} className="print:hidden">
      {children}
    </Button>
  );
}

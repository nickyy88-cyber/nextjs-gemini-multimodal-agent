"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface SheetProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

const Sheet = ({ open, onOpenChange, children }: SheetProps) => {
  return (
    <>
      {open && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={() => onOpenChange?.(false)}
          />
          {/* Sheet */}
          <div className="fixed inset-y-0 left-0 z-50 w-64 bg-gray-50 shadow-xl md:hidden transform transition-transform duration-300 ease-in-out">
            {children}
          </div>
        </>
      )}
    </>
  );
};

export { Sheet };

import type { ReactNode } from "react";

interface StatusTextProps {
  children: ReactNode;
}

export function StatusText({ children }: StatusTextProps) {
  return (
    <p className="border-l-4 border-[#e9bc58] bg-[#f7f4ed] px-3 py-2 text-sm leading-6">
      {children}
    </p>
  );
}

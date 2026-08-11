"use client";

import { useScrollAnimation } from "@/hooks/useScrollAnimation";

export function ScrollProvider({ children }: { children: React.ReactNode }) {
  useScrollAnimation();
  return <>{children}</>;
}

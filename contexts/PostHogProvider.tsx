"use client";

// Demo mode: no-op PostHog provider
import { ReactNode } from "react";

export function PostHogProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

export function usePostHog() {
  return null;
}

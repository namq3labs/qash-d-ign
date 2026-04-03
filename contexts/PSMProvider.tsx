"use client";

// Demo mode: re-export mock PSM provider
export { MockPSMProvider as PSMProvider, usePSMProvider } from "./DemoMockProviders";

// Keep type exports for compatibility
export interface EnrichedBalance {
  faucetId: string;
  faucetBech32: string;
  amount: bigint;
  symbol: string;
  decimals: number;
}

export interface AccountCache {
  syncResult: any;
  enrichedBalances: EnrichedBalance[];
}

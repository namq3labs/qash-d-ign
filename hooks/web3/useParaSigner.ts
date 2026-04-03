"use client";

// Demo mode: mock Para signer hook
export function useParaSigner() {
  return {
    commitment: "demo-commitment",
    publicKey: "demo-public-key",
    walletId: "demo-wallet",
    isReady: true,
    createSigner: async () => ({}),
  };
}

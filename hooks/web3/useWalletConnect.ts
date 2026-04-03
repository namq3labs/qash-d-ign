"use client";

// Demo mode: mock wallet connect hook
export const getLastConnectedAddress = (): string | null => "demo-address";
export const getWalletAddresses = (): string[] => ["demo-address"];

export function useWalletConnect() {
  return {
    walletAddress: "demo-address",
    isConnected: true,
    isLoading: false,
    connect: async () => {},
    disconnect: async () => {},
    deployAccount: async () => {},
    importAccount: async () => {},
    replaceWalletAddresses: () => {},
    addWalletAddress: () => {},
  };
}

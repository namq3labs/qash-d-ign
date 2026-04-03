"use client";

/**
 * Mock providers that replace Miden/PSM/Auth/Socket providers in demo mode.
 * Provides the same interface so existing components work without modification.
 */

import React, { createContext, useContext, ReactNode } from "react";
import { useDemo } from "./DemoProvider";

// ─── Mock Auth Context ──────────────────────────────────────────────────────

interface MockAuthContextValue {
  isAuthenticated: boolean;
  user: any;
  isLoading: boolean;
  error: string | null;
  loginWithPara: (token: string, pk?: string, commitment?: string) => Promise<any>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  clearError: () => void;
}

const MockAuthContext = createContext<MockAuthContextValue | undefined>(undefined);

export function MockAuthProvider({ children }: { children: ReactNode }) {
  const { data } = useDemo();

  const { isLoggedIn, isOnboarded } = useDemo();

  const value: MockAuthContextValue = {
    isAuthenticated: isLoggedIn && isOnboarded,
    user: data?.user ?? null,
    isLoading: false,
    error: null,
    loginWithPara: async () => data?.user ?? null,
    logout: async () => {},
    refreshUser: async () => {},
    clearError: () => {},
  };

  return <MockAuthContext.Provider value={value}>{children}</MockAuthContext.Provider>;
}

export function useAuth(): MockAuthContextValue {
  const context = useContext(MockAuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within MockAuthProvider");
  }
  return context;
}

// ─── Mock Miden Context ─────────────────────────────────────────────────────

interface MockMidenContextType {
  isConnected: boolean;
  isLoading: boolean;
  wallet: any;
  openModal: (config?: any) => void;
  logoutAsync: () => Promise<void>;
  client: any;
  address: string | undefined;
  balances: any;
  balancesLoading: boolean;
  fetchBalances: () => Promise<void>;
}

const MockMidenContext = createContext<MockMidenContextType | undefined>(undefined);

export function MockMidenProvider({ children }: { children: ReactNode }) {
  const value: MockMidenContextType = {
    isConnected: true,
    isLoading: false,
    wallet: { id: "demo-wallet" },
    openModal: () => {},
    logoutAsync: async () => {},
    client: null,
    address: "demo-address",
    balances: { balances: [], totalUsd: 0 },
    balancesLoading: false,
    fetchBalances: async () => {},
  };

  return <MockMidenContext.Provider value={value}>{children}</MockMidenContext.Provider>;
}

export function useMidenProvider(): MockMidenContextType {
  const context = useContext(MockMidenContext);
  if (context === undefined) {
    throw new Error("useMidenProvider must be used within MockMidenProvider");
  }
  return context;
}

// ─── Mock PSM Context ───────────────────────────────────────────────────────

interface MockPSMContextType {
  multisigClient: any;
  psmCommitment: string;
  psmPublicKey: string | undefined;
  psmStatus: "connected";
  error: string | null;
  syncWarning: string | null;
  reconnect: () => Promise<void>;
  ensureConnected: () => Promise<any>;
  registerMultisig: (accountId: string, multisig: any, syncResult?: any) => void;
  getMultisig: (accountId: string) => any;
  pauseSync: () => void;
  resumeSync: () => void;
  sync: () => Promise<void>;
  accountCacheMap: Map<string, any>;
}

const MockPSMContext = createContext<MockPSMContextType | undefined>(undefined);

export function MockPSMProvider({ children }: { children: ReactNode }) {
  const value: MockPSMContextType = {
    multisigClient: {},
    psmCommitment: "demo-commitment",
    psmPublicKey: "demo-public-key",
    psmStatus: "connected",
    error: null,
    syncWarning: null,
    reconnect: async () => {},
    ensureConnected: async () => ({}),
    registerMultisig: () => {},
    getMultisig: () => undefined,
    pauseSync: () => {},
    resumeSync: () => {},
    sync: async () => {},
    accountCacheMap: new Map(),
  };

  return <MockPSMContext.Provider value={value}>{children}</MockPSMContext.Provider>;
}

export function usePSMProvider(): MockPSMContextType {
  const context = useContext(MockPSMContext);
  if (context === undefined) {
    throw new Error("usePSMProvider must be used within MockPSMProvider");
  }
  return context;
}

// ─── Mock Socket Context ────────────────────────────────────────────────────

const MockSocketContext = createContext<{ socket: null; changeSocketUrl: (url: string) => void } | null>({
  socket: null,
  changeSocketUrl: () => {},
});

export function MockSocketProvider({ children }: { children: ReactNode }) {
  return (
    <MockSocketContext.Provider value={{ socket: null, changeSocketUrl: () => {} }}>
      {children}
    </MockSocketContext.Provider>
  );
}

export function useSocket() {
  return useContext(MockSocketContext);
}

// ─── Mock Account Context ───────────────────────────────────────────────────

interface MockAccountContextType {
  assets: any[];
  loading: boolean;
  error: unknown;
  isAccountDeployed: boolean;
  accountId: string;
  isError: boolean;
  refreshAccount: () => Promise<void>;
  refetchAssets: () => Promise<void>;
  forceFetch: () => Promise<void>;
}

const MockAccountContext = createContext<MockAccountContextType | undefined>(undefined);

export function MockAccountProvider({ children }: { children: ReactNode }) {
  const value: MockAccountContextType = {
    assets: [],
    loading: false,
    error: null,
    isAccountDeployed: true,
    accountId: "demo-account",
    isError: false,
    refreshAccount: async () => {},
    refetchAssets: async () => {},
    forceFetch: async () => {},
  };

  return <MockAccountContext.Provider value={value}>{children}</MockAccountContext.Provider>;
}

export function useAccountContext(): MockAccountContextType {
  const context = useContext(MockAccountContext);
  if (context === undefined) {
    throw new Error("useAccountContext must be used within MockAccountProvider");
  }
  return context;
}

// ─── Mock Transaction Context ───────────────────────────────────────────────

const MockTransactionContext = createContext<any>(null);

export function MockTransactionProvider({ children }: { children: ReactNode }) {
  return <MockTransactionContext.Provider value={{}}>{children}</MockTransactionContext.Provider>;
}

"use client";

// Demo mode: re-export mock auth provider
export { MockAuthProvider as AuthProvider, useAuth } from "@/contexts/DemoMockProviders";

// Keep the type exports for compatibility
export interface AuthState {
  isAuthenticated: boolean;
  user: any;
  isLoading: boolean;
  error: string | null;
}

export interface AuthContextValue extends AuthState {
  loginWithPara: (paraJwtToken: string, publicKey?: string, commitment?: string) => Promise<any>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  clearError: () => void;
}

export interface AuthProviderProps {
  children: React.ReactNode;
}

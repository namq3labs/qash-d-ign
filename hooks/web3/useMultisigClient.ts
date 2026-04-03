// Stubbed: @openzeppelin/miden-multisig-client and @miden-sdk/miden-sdk removed.
"use client";

import { useState } from "react";

interface MultisigClientState {
  client: any | null;
  psmCommitment: string;
  psmPublicKey: string | undefined;
  isInitializing: boolean;
  error: string | null;
}

/**
 * Hook to initialize the OZ MultisigClient.
 * Stubbed: returns idle state since miden packages are not available.
 */
export function useMultisigClient(_webClient: any | null, _scheme?: any) {
  const [state] = useState<MultisigClientState>({
    client: null,
    psmCommitment: "",
    psmPublicKey: undefined,
    isInitializing: false,
    error: "MultisigClient not available in demo mode",
  });

  return state;
}

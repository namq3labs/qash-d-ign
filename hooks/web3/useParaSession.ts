// Stubbed: @miden-sdk/use-miden-para-react and @openzeppelin/miden-multisig-client removed.
"use client";

import { useState } from "react";

export interface ParaSessionState {
  connected: boolean;
  publicKey: string | null;
  commitment: string | null;
}

export function useParaSession() {
  const [session] = useState<ParaSessionState>({
    connected: false,
    publicKey: null,
    commitment: null,
  });

  return {
    session,
    paraClient: null,
    paraMiden: null,
    getWalletId: () => null,
  };
}

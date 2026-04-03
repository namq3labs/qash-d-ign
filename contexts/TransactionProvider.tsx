"use client";

// Demo mode: mock transaction provider
import { type ReactNode, createContext, useContext } from "react";

export const MidenSdkStoreContext = createContext<any>(undefined);

export interface Props {
  children: ReactNode;
}

export const TransactionProviderC = ({ children }: Props) => {
  return <MidenSdkStoreContext.Provider value={{}}>{children}</MidenSdkStoreContext.Provider>;
};

export const useTransactionStore = <T,>(_selector: (store: any) => T): T => {
  return {} as T;
};

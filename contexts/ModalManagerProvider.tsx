"use client";

// Demo mode: lightweight modal provider that doesn't import heavy modal types

import { createContext, useCallback, useContext, useMemo, useState, ReactNode } from "react";
import { BaseModalProps, ModalProps } from "@/types/modal";

export type ModalProp<T extends ModalProps> = T & {
  isOpen: boolean;
};

interface ModalContextType {
  openModal: (modalId: string, props?: any, closeAll?: boolean) => void;
  closeModal: (modalId: string) => void;
  closeAllModals: () => void;
  isModalOpen: (modalId: string) => boolean;
  getModalProps: (modalId: string) => any;
  getModalZIndex: (modalId: string) => number;
}

const ModalContext = createContext<ModalContextType>({
  openModal: () => {},
  closeModal: () => {},
  closeAllModals: () => {},
  isModalOpen: () => false,
  getModalProps: () => undefined,
  getModalZIndex: () => 50,
});

export const ModalProvider = ({ children }: { children: ReactNode }) => {
  const [openModals, setOpenModals] = useState<Record<string, any>>({});

  const openModal = useCallback((modalId: string, props?: any, _closeAll?: boolean) => {
    setOpenModals(prev => ({ ...prev, [modalId]: { props: props || {}, timestamp: Date.now() } }));
  }, []);

  const closeModal = useCallback((modalId: string) => {
    setOpenModals(prev => {
      const next = { ...prev };
      delete next[modalId];
      return next;
    });
  }, []);

  const closeAllModals = useCallback(() => {
    setOpenModals({});
  }, []);

  const isModalOpen = useCallback((modalId: string) => !!openModals[modalId], [openModals]);

  const getModalProps = useCallback((modalId: string) => openModals[modalId]?.props, [openModals]);

  const getModalZIndex = useCallback((modalId: string) => {
    const modal = openModals[modalId];
    // Base must sit ABOVE the sidebar (z-70) / team sidebar (z-60) so the modal
    // backdrop blur covers the whole viewport, including the sidebar.
    if (!modal?.timestamp) return 100;

    // Sort open modals by timestamp, most recent gets highest z-index
    const sorted = Object.entries(openModals)
      .filter(([, v]) => v?.timestamp)
      .sort(([, a], [, b]) => a.timestamp - b.timestamp);

    const position = sorted.findIndex(([id]) => id === modalId);
    return 100 + position * 10;
  }, [openModals]);

  const value = useMemo(
    () => ({ openModal, closeModal, closeAllModals, isModalOpen, getModalProps, getModalZIndex }),
    [openModal, closeModal, closeAllModals, isModalOpen, getModalProps, getModalZIndex],
  );

  return <ModalContext.Provider value={value}>{children}</ModalContext.Provider>;
};

export const useModal = () => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error("useModal must be used within a ModalProvider");
  }
  return context;
};

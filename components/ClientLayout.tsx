"use client";

import { ReactNode, useMemo } from "react";
import toast, { ToastBar, Toaster } from "react-hot-toast";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Sidebar } from "./Sidebar/Sidebar";
import { Title } from "./Common/Title";
import { ModalProvider } from "@/contexts/ModalManagerProvider";
import { ModalManager } from "./Common/ModalManager";
import { TitleProvider } from "@/contexts/TitleProvider";
import { usePathname } from "next/navigation";
import { DemoProvider } from "@/contexts/DemoProvider";
import { useAuthGuard } from "@/hooks/server/useAuthGuard";
import {
  MockAuthProvider,
  MockMidenProvider,
  MockPSMProvider,
  MockSocketProvider,
  MockTransactionProvider,
} from "@/contexts/DemoMockProviders";
import { AccountProvider } from "@/contexts/AccountProvider";

// Responsive sidebar widths
const SIDEBAR_WIDTH_CLASSES = "w-[200px] lg:w-[240px] xl:w-[280px]";

interface ClientLayoutProps {
  children: ReactNode;
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
    },
  },
});

const fullscreenPages = new Set([
  "/not-found",
  "/404",
  "/mobile",
  "/login",
  "/onboarding",
  "/payment/",
  "/invoice-review",
  "/invoice/create",
  "/team-invite",
]);

function ProtectedContent({ children }: { children: ReactNode }) {
  useAuthGuard();
  return <>{children}</>;
}

export default function ClientLayout({ children }: ClientLayoutProps) {
  const pathname = usePathname();

  const isFullscreen = useMemo(() => {
    if (!pathname) return false;
    return Array.from(fullscreenPages).some(
      p => pathname === p || pathname.startsWith(p.endsWith("/") ? p : `${p}/`),
    );
  }, [pathname]);

  return (
    <QueryClientProvider client={queryClient}>
      <DemoProvider>
        <MockMidenProvider>
          <MockPSMProvider>
            <Toaster
              position="top-right"
              toastOptions={{
                style: {
                  padding: "6px",
                  background: "var(--toast-background) !important",
                  border: "4px solid var(--toast-border) !important",
                  width: "full",
                  maxWidth: "900px",
                  borderRadius: "9999px",
                },
                success: {
                  icon: <img src="/toast/success.svg" alt="success" />,
                },
                error: {
                  icon: <img src="/toast/error.svg" alt="error" />,
                },
                loading: {
                  icon: <img src="/toast/loading.gif" alt="loading" className="w-10.5" />,
                },
              }}
              children={t => (
                <ToastBar
                  toast={t}
                  style={{
                    ...t.style,
                  }}
                >
                  {({ icon, message }) => (
                    <div className="flex items-center justify-between gap-8 pr-3">
                      <div className="flex items-center">
                        {icon}
                        <span className="text-toast-text leading-none">{message}</span>
                      </div>
                      <img
                        src="/toast/close-icon.svg"
                        alt="close"
                        className="w-5 cursor-pointer"
                        onClick={() => toast.dismiss(t.id)}
                      />
                    </div>
                  )}
                </ToastBar>
              )}
            />
            <MockAuthProvider>
              <ProtectedContent>
              <MockSocketProvider>
                <ModalProvider>
                  <AccountProvider>
                    <MockTransactionProvider>
                      <ModalManager />
                      <TitleProvider>
                        {isFullscreen ? (
                          <div className="h-screen w-screen">{children}</div>
                        ) : (
                          <div className="flex flex-col h-screen overflow-hidden">
                            <div className="flex flex-row gap-2">
                              <div className={`top-0 ${SIDEBAR_WIDTH_CLASSES}`}>
                                <Sidebar />
                              </div>
                              <div className="flex-1 h-screen flex flex-col overflow-hidden gap-2">
                                <Title />
                                <div className="mx-[8px] mb-[24px] rounded-[12px] flex justify-center items-center flex-1 overflow-auto relative bg-background">
                                  {children}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                        {/* FloatingActionButton removed in demo mode */}
                      </TitleProvider>
                    </MockTransactionProvider>
                  </AccountProvider>
                </ModalProvider>
              </MockSocketProvider>
              </ProtectedContent>
            </MockAuthProvider>
          </MockPSMProvider>
        </MockMidenProvider>
      </DemoProvider>
    </QueryClientProvider>
  );
}

"use client";
import React, { useEffect, useState } from "react";
import { CardContainer } from "./CardContainer";
import { Overview } from "./Overview";
import { ReportsSection } from "./ReportsSection";
import { useTitle } from "@/contexts/TitleProvider";
import { CaretRight } from "@phosphor-icons/react";
import { TabContainer } from "../Common/TabContainer";
import { useModal } from "@/contexts/ModalManagerProvider";
import TransactionHistory from "../Dashboard/WalletAnalytics/TransactionHistory";
import TransactionDetail from "../Dashboard/WalletAnalytics/TransactionDetail";
import { DemoTransaction } from "@/contexts/DemoProvider";
import { useEscapeKey } from "@/hooks/web3/useEscapeKey";

const ANIMATION_DURATION = 300;

const tabs = [
  { id: "overview", label: "Overview" },
  { id: "accounting", label: "Accounting & Reports" },
  { id: "transactions", label: "Transaction History" },
];

type TabId = "overview" | "accounting" | "transactions";

export const HomeContainer = () => {
  const { openModal } = useModal();
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [selectedTransaction, setSelectedTransaction] = useState<DemoTransaction | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const { setTitle } = useTitle();

  // Breadcrumb in the top title bar: Dashboard › <active tab>
  const activeLabel = tabs.find(t => t.id === activeTab)?.label ?? "Overview";
  useEffect(() => {
    const id = window.setTimeout(() => {
      setTitle(
        <div className="flex items-center gap-1.5 text-[14px]">
          <span className="text-text-secondary">Dashboard</span>
          <CaretRight size={12} weight="bold" className="text-text-secondary/50" />
          <span className="font-medium text-text-primary">{activeLabel}</span>
        </div>,
      );
    }, 0);
    return () => window.clearTimeout(id);
  }, [activeLabel, setTitle]);

  const handleTransactionClick = (transaction: DemoTransaction) => {
    setSelectedTransaction(transaction);
    setShowDetail(true);
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), ANIMATION_DURATION);
  };

  const handleBackToHistory = () => {
    setIsAnimating(true);
    setShowDetail(false);
    setTimeout(() => setIsAnimating(false), ANIMATION_DURATION);
  };

  useEscapeKey(handleBackToHistory, showDetail && activeTab === "transactions");

  return (
    <div className="w-full h-full flex flex-col">
      {/* Header + Tabs */}
      <div className="w-full flex flex-col gap-4 border-b border-primary-divider px-6 pt-6 pb-4">
        <div className="flex flex-col gap-0.5">
          <h1 className="text-[26px] font-bold leading-tight tracking-tight text-text-primary">Dashboard</h1>
          <p className="text-[14px] text-text-secondary">
            A quick overview of your treasury, payroll, and recent activity.
          </p>
        </div>

        {/* Tab Navigation */}
        <TabContainer
          tabs={tabs}
          activeTab={activeTab}
          setActiveTab={tab => {
            setActiveTab(tab as TabId);
            if (tab !== "transactions") {
              setShowDetail(false);
              setSelectedTransaction(null);
            }
          }}
          textSize="sm"
        />
      </div>

      {/* Tab Content */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {activeTab === "overview" && (
          <div className="w-full flex flex-col items-start gap-4 p-5">
            <CardContainer />
            <Overview onCreateAccount={() => openModal("CREATE_ACCOUNT")} />
          </div>
        )}

        {activeTab === "accounting" && (
          <div className="w-full p-5">
            <ReportsSection />
          </div>
        )}

        {activeTab === "transactions" && (
          <div className="relative w-full h-full overflow-hidden p-5">
            {/* Transaction List */}
            <div
              className={`transition-transform duration-[${ANIMATION_DURATION}ms] ease-in-out h-full ${
                showDetail ? "-translate-x-full" : "translate-x-0"
              }`}
            >
              <div className="h-full overflow-y-auto">
                <TransactionHistory onTransactionClick={handleTransactionClick} />
              </div>
            </div>

            {/* Transaction Detail */}
            <div
              className={`absolute inset-0 transition-transform duration-[${ANIMATION_DURATION}ms] ease-in-out h-full p-5 ${
                showDetail ? "translate-x-0" : "translate-x-full"
              }`}
            >
              {(showDetail || isAnimating) && selectedTransaction && (
                <div className="h-full overflow-y-auto">
                  <TransactionDetail transaction={selectedTransaction} onBack={handleBackToHistory} />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

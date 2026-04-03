"use client";
import React, { useState } from "react";
import { CardContainer } from "./CardContainer";
import { Overview } from "./Overview";
import { ReportsSection } from "./ReportsSection";
import { PageHeader } from "../Common/PageHeader";
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
      <div className="w-full flex flex-col gap-3 px-5 pt-5 pb-2">
        <PageHeader icon="/sidebar/home.svg" label="Dashboard" button={null} />

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
          <div className="relative w-full h-full overflow-hidden px-5 pb-5">
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
              className={`absolute inset-0 transition-transform duration-[${ANIMATION_DURATION}ms] ease-in-out h-full px-5 pb-5 ${
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

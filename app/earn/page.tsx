"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useDemo } from "@/contexts/DemoProvider";
import { PageHeader } from "@/components/Common/PageHeader";
import { PrimaryButton } from "@/components/Common/PrimaryButton";
import { SecondaryButton } from "@/components/Common/SecondaryButton";
import { Badge, BadgeStatus } from "@/components/Common/Badge";
import { BaseContainer } from "@/components/Common/BaseContainer";
import { TabContainer } from "@/components/Common/TabContainer";
import { Table } from "@/components/Common/Table";
import { ModalHeader } from "@/components/Common/ModalHeader";
import BaseModal from "@/components/Modal/BaseModal";
import InputFilled from "@/components/Common/Input/InputFilled";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from "recharts";
import toast from "react-hot-toast";

// ---- Helpers ---------------------------------------------------------------

function fmtUsd(n: number): string {
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

// ---- Mock Earn Data --------------------------------------------------------

const EARN_APY = 4.85;
const TOTAL_DEPOSITED = 150000;
const AVAILABLE_TO_WITHDRAW = 150000;
const TOTAL_EARNED = 3812.5;
const MONTHLY_YIELD = 606.25;
const TVL = 28_400_000;

// Daily yield data (last 30 days)
const DAILY_YIELD_DATA = Array.from({ length: 30 }, (_, i) => {
  const date = new Date(2026, 2, 4 + i); // Mar 4 - Apr 2 2026
  const base = 19.86; // ~$150k * 4.85% / 365
  const variance = (Math.sin(i * 0.7) * 0.4 + Math.random() * 0.3) * base;
  return {
    date: `${date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`,
    earned: Math.round((base + variance) * 100) / 100,
  };
});

// Monthly yield data (last 6 months)
const MONTHLY_YIELD_DATA = [
  { date: "Oct 25", earned: 0 },
  { date: "Nov 25", earned: 0 },
  { date: "Dec 25", earned: 0 },
  { date: "Jan 26", earned: 101.04 },
  { date: "Feb 26", earned: 606.25 },
  { date: "Mar 26", earned: 606.25 },
];

interface EarnActivity {
  id: string;
  type: "deposit" | "withdraw" | "yield";
  amount: number;
  date: string;
  wallet: string;
  status: string;
}

const MOCK_ACTIVITY: EarnActivity[] = [
  { id: "e1", type: "deposit", amount: 50000, date: "2026-03-15T10:30:00Z", wallet: "Treasury", status: "completed" },
  { id: "e2", type: "yield", amount: 202.08, date: "2026-03-31T00:00:00Z", wallet: "Treasury", status: "completed" },
  { id: "e3", type: "deposit", amount: 100000, date: "2026-02-10T14:20:00Z", wallet: "Operations", status: "completed" },
  { id: "e4", type: "yield", amount: 202.08, date: "2026-02-28T00:00:00Z", wallet: "Treasury", status: "completed" },
  { id: "e5", type: "yield", amount: 404.17, date: "2026-02-28T00:00:00Z", wallet: "Operations", status: "completed" },
  { id: "e6", type: "withdraw", amount: 25000, date: "2026-01-20T09:00:00Z", wallet: "Treasury", status: "completed" },
  { id: "e7", type: "deposit", amount: 25000, date: "2026-01-05T16:45:00Z", wallet: "Treasury", status: "completed" },
  { id: "e8", type: "yield", amount: 101.04, date: "2026-01-31T00:00:00Z", wallet: "Treasury", status: "completed" },
];

// ---- Stat Card (matches Bill/Card page pattern) ----------------------------

function StatCard({ title, text }: { title: string; text: React.ReactNode }) {
  return (
    <div
      className="relative w-full h-full rounded-xl border border-primary-divider p-4 flex flex-col overflow-hidden gap-3"
      style={{
        backgroundImage: "url(/card/background.svg)",
        backgroundSize: "30%",
        backgroundPosition: "right",
        backgroundRepeat: "no-repeat",
      }}
    >
      <span className="text-text-secondary text-sm leading-none">{title}</span>
      {text}
    </div>
  );
}

// ---- Chart Tooltip ---------------------------------------------------------

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-background border border-primary-divider rounded-[8px] px-3 py-2 shadow-lg text-xs">
      <p className="font-semibold text-text-primary mb-1">{label}</p>
      <p style={{ color: "var(--badge-success-text)" }}>Earned: {fmtUsd(payload[0].value)}</p>
    </div>
  );
}

// ---- How It Works Modal ----------------------------------------------------

function HowItWorksModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  return (
    <BaseModal isOpen={isOpen} onClose={onClose}>
      <ModalHeader title="How Qash Earn Works" onClose={onClose} icon="/sidebar/earn.svg" />
      <div className="flex flex-col w-[520px] p-5 rounded-b-2xl border-2 border-t-0 border-primary-divider bg-background gap-5">
        <div className="grid grid-cols-1 gap-4">
          {[
            {
              step: "1",
              title: "Deposit idle funds",
              desc: "Move USDT from any of your multisig wallets into the yield vault.",
            },
            {
              step: "2",
              title: "Earn T-Bill backed yield",
              desc: `Your funds are invested in short-duration US Treasury Bills, earning ${EARN_APY}% APY. Yield accrues daily and is distributed monthly.`,
            },
            {
              step: "3",
              title: "Withdraw anytime",
              desc: "Withdraw to any wallet within 24 hours (T+1 settlement). No lock-up period, no fees.",
            },
          ].map(({ step, title, desc }) => (
            <div
              key={step}
              className="flex items-start gap-3 bg-app-background rounded-xl p-4"
            >
              <div
                className="w-7 h-7 rounded-full text-white flex items-center justify-center text-sm font-bold shrink-0"
                style={{ background: "var(--primary-button)" }}
              >
                {step}
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-sm font-semibold text-text-primary">{title}</span>
                <span className="text-xs text-text-secondary leading-relaxed">{desc}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <div className="flex-1 bg-app-background rounded-lg px-3 py-2 flex flex-col gap-1">
            <span className="text-xs text-text-secondary">TVL</span>
            <span className="text-base font-semibold text-text-primary">{fmtUsd(TVL)}</span>
          </div>
          <div className="flex-1 bg-app-background rounded-lg px-3 py-2 flex flex-col gap-1">
            <span className="text-xs text-text-secondary">Backing</span>
            <span className="text-base font-semibold text-text-primary">US T-Bills</span>
          </div>
        </div>

        <SecondaryButton text="Got it" onClick={onClose} variant="light" buttonClassName="w-full" />
      </div>
    </BaseModal>
  );
}

// ---- Deposit Modal ---------------------------------------------------------

function DepositModal({
  isOpen,
  onClose,
  accounts,
}: {
  isOpen: boolean;
  onClose: () => void;
  accounts: { accountId: string; name: string }[];
}) {
  const [amount, setAmount] = useState("");
  const [selectedWallet, setSelectedWallet] = useState(accounts[0]?.accountId ?? "");

  const monthlyEst = Number(amount || 0) * (EARN_APY / 100 / 12);

  const handleDeposit = () => {
    if (!amount || Number(amount) <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    toast.success(`Deposited ${fmtUsd(Number(amount))} into T-Bill Yield`);
    setAmount("");
    onClose();
  };

  return (
    <BaseModal isOpen={isOpen} onClose={onClose}>
      <ModalHeader title="Deposit to Earn" onClose={onClose} icon="/sidebar/earn.svg" />
      <div className="flex flex-col w-[480px] p-5 rounded-b-2xl border-2 border-t-0 border-primary-divider bg-background gap-5">
        <div className="flex flex-col gap-1.5">
          <p className="text-[14px] text-text-secondary font-barlow">From Wallet</p>
          <div className="flex gap-2">
            {accounts.map((acc) => (
              <button
                key={acc.accountId}
                onClick={() => setSelectedWallet(acc.accountId)}
                className={`flex-1 py-2 rounded-[12px] text-sm font-medium transition-all cursor-pointer border-b ${
                  selectedWallet === acc.accountId
                    ? "bg-app-background border-primary-blue text-text-primary"
                    : "bg-app-background border-primary-divider text-text-secondary"
                }`}
              >
                {acc.name}
              </button>
            ))}
          </div>
        </div>

        <InputFilled
          label="Amount (USDT)"
          placeholder="0.00"
          value={amount}
          type="number"
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAmount(e.target.value)}
        />

        {Number(amount) > 0 && (
          <div className="bg-badge-success-background border border-badge-success-border rounded-[12px] p-4 flex flex-col gap-2">
            <div className="flex justify-between text-sm">
              <span className="text-text-secondary">Current APY</span>
              <span className="text-badge-success-text font-semibold">{EARN_APY}%</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-text-secondary">Est. monthly yield</span>
              <span className="text-text-primary font-medium">{fmtUsd(monthlyEst)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-text-secondary">Est. annual yield</span>
              <span className="text-text-primary font-medium">{fmtUsd(monthlyEst * 12)}</span>
            </div>
          </div>
        )}

        <div className="bg-app-background rounded-[12px] border-b border-primary-divider p-3 flex items-start gap-2">
          <img src="/misc/info-icon.svg" alt="info" className="w-4 h-4 mt-0.5 shrink-0 opacity-40" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
          <p className="text-xs text-text-secondary leading-relaxed">
            Funds are backed by short-duration US Treasury Bills (T-Bills).
            Yield is accrued daily and distributed monthly. Withdrawals are
            processed within 24 hours (T+1 settlement).
          </p>
        </div>

        <div className="flex flex-row gap-2">
          <SecondaryButton text="Cancel" onClick={onClose} variant="light" buttonClassName="flex-1" />
          <PrimaryButton text="Deposit" onClick={handleDeposit} containerClassName="flex-1" />
        </div>
      </div>
    </BaseModal>
  );
}

// ---- Withdraw Modal --------------------------------------------------------

function WithdrawModal({
  isOpen,
  onClose,
  accounts,
}: {
  isOpen: boolean;
  onClose: () => void;
  accounts: { accountId: string; name: string }[];
}) {
  const [amount, setAmount] = useState("");
  const [selectedWallet, setSelectedWallet] = useState(accounts[0]?.accountId ?? "");

  const handleWithdraw = () => {
    if (!amount || Number(amount) <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    if (Number(amount) > AVAILABLE_TO_WITHDRAW) {
      toast.error("Insufficient balance");
      return;
    }
    toast.success(`Withdrawal of ${fmtUsd(Number(amount))} initiated. Processing within 24h.`);
    setAmount("");
    onClose();
  };

  return (
    <BaseModal isOpen={isOpen} onClose={onClose}>
      <ModalHeader title="Withdraw from Earn" onClose={onClose} icon="/sidebar/earn.svg" />
      <div className="flex flex-col w-[480px] p-5 rounded-b-2xl border-2 border-t-0 border-primary-divider bg-background gap-5">
        <div className="flex flex-col gap-1.5">
          <p className="text-[14px] text-text-secondary font-barlow">Withdraw to Wallet</p>
          <div className="flex gap-2">
            {accounts.map((acc) => (
              <button
                key={acc.accountId}
                onClick={() => setSelectedWallet(acc.accountId)}
                className={`flex-1 py-2 rounded-[12px] text-sm font-medium transition-all cursor-pointer border-b ${
                  selectedWallet === acc.accountId
                    ? "bg-app-background border-primary-blue text-text-primary"
                    : "bg-app-background border-primary-divider text-text-secondary"
                }`}
              >
                {acc.name}
              </button>
            ))}
          </div>
        </div>

        <div className="relative">
          <InputFilled
            label="Amount (USDT)"
            placeholder="0.00"
            value={amount}
            type="number"
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAmount(e.target.value)}
          />
          <button
            className="absolute right-3 top-9 text-xs font-semibold cursor-pointer"
            style={{ color: "var(--primary-blue)" }}
            onClick={() => setAmount(String(AVAILABLE_TO_WITHDRAW))}
          >
            MAX
          </button>
        </div>

        <div className="flex justify-between text-sm px-1">
          <span className="text-text-secondary">Available balance</span>
          <span className="text-text-primary font-medium">{fmtUsd(AVAILABLE_TO_WITHDRAW)}</span>
        </div>

        <div className="bg-app-background rounded-[12px] border-b border-primary-divider p-3 flex items-start gap-2">
          <img src="/misc/info-icon.svg" alt="info" className="w-4 h-4 mt-0.5 shrink-0 opacity-40" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
          <p className="text-xs text-text-secondary leading-relaxed">
            Withdrawals are processed within 24 hours due to T+1 settlement on underlying T-Bills.
            No fees are charged for withdrawals.
          </p>
        </div>

        <div className="flex flex-row gap-2">
          <SecondaryButton text="Cancel" onClick={onClose} variant="light" buttonClassName="flex-1" />
          <PrimaryButton text="Withdraw" onClick={handleWithdraw} containerClassName="flex-1" />
        </div>
      </div>
    </BaseModal>
  );
}

// ---- Main Page -------------------------------------------------------------

export default function EarnPage() {
  const { data } = useDemo();
  const [loading, setLoading] = useState(true);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [chartPeriod, setChartPeriod] = useState("daily");
  const [activityTab, setActivityTab] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(t);
  }, []);

  const accounts = useMemo(() => {
    if (!data?.accounts) return [];
    return data.accounts.map((a) => ({ accountId: a.accountId, name: a.name }));
  }, [data?.accounts]);

  const chartData = chartPeriod === "daily" ? DAILY_YIELD_DATA : MONTHLY_YIELD_DATA;

  const filteredActivity = useMemo(() => {
    if (activityTab === "all") return MOCK_ACTIVITY;
    return MOCK_ACTIVITY.filter((a) => a.type === activityTab);
  }, [activityTab]);

  const tableData = useMemo(() => {
    return filteredActivity.map((tx) => {
      const badgeStatus =
        tx.type === "yield"
          ? BadgeStatus.SUCCESS
          : tx.type === "deposit"
            ? BadgeStatus.PUBLIC
            : BadgeStatus.AWAITING;
      const badgeText =
        tx.type === "yield" ? "Yield" : tx.type === "deposit" ? "Deposit" : "Withdraw";
      const prefix = tx.type === "yield" ? "+" : tx.type === "deposit" ? "+" : "-";

      return {
        Type: (
          <div className="flex justify-center">
            <Badge status={badgeStatus} text={badgeText} className="px-3" />
          </div>
        ),
        Date: new Date(tx.date).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
        Wallet: tx.wallet,
        Amount: (
          <span
            className="font-semibold"
            style={{
              color:
                tx.type === "yield"
                  ? "var(--badge-success-text)"
                  : tx.type === "withdraw"
                    ? "var(--badge-awaiting-text)"
                    : "var(--text-primary)",
            }}
          >
            {prefix}{fmtUsd(tx.amount)}
          </span>
        ),
        Status: (
          <div className="flex justify-center">
            <Badge status={BadgeStatus.SUCCESS} text="Completed" className="px-3" />
          </div>
        ),
      };
    });
  }, [filteredActivity]);

  // Loading skeleton
  if (loading || !data) {
    return (
      <div className="flex flex-col w-full h-full p-5 gap-5">
        <div className="flex flex-row items-center gap-3 px-5">
          <div className="w-6 h-6 rounded bg-gray-200 animate-pulse" />
          <div className="w-48 h-7 rounded bg-gray-200 animate-pulse" />
        </div>
        <div className="grid grid-cols-4 gap-3 px-5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 rounded-xl bg-gray-200 animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3 px-5">
          {[1, 2].map((i) => (
            <div key={i} className="h-56 rounded-xl bg-gray-200 animate-pulse" />
          ))}
        </div>
        <div className="h-[300px] rounded-xl bg-gray-200 animate-pulse mx-5" />
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col w-full h-full p-5 gap-5 overflow-y-auto">
        {/* Header + Stats */}
        <div className="flex flex-col w-full px-5 gap-5">
          {/* Custom header with info icon */}
          <div className="flex flex-row items-center justify-between w-full">
            <div className="flex flex-row items-center justify-start gap-3">
              <img src="/sidebar/earn.svg" alt="Earn" className="w-6 h-6" />
              <span className="text-2xl font-bold">Earn</span>
              <button
                onClick={() => setShowInfoModal(true)}
                className="w-5 h-5 rounded-full border border-primary-divider flex items-center justify-center cursor-pointer hover:bg-app-background transition-colors"
              >
                <span className="text-xs text-text-secondary font-medium leading-none">i</span>
              </button>
            </div>
            <div className="flex gap-2">
              <SecondaryButton
                text="Withdraw"
                variant="light"
                onClick={() => setShowWithdrawModal(true)}
                buttonClassName="px-4"
              />
              <PrimaryButton
                text="Deposit"
                icon="/misc/plus-icon.svg"
                iconPosition="left"
                onClick={() => setShowDepositModal(true)}
                containerClassName="w-fit"
                buttonClassName="px-4"
              />
            </div>
          </div>

          {/* Stat Cards */}
          <div className="flex flex-row w-full gap-2">
            <StatCard
              title="Current APY"
              text={
                <span className="text-2xl font-bold leading-none" style={{ color: "var(--badge-success-text)" }}>
                  {EARN_APY}%
                </span>
              }
            />
            <StatCard
              title="Total Deposited"
              text={
                <span className="text-text-primary text-2xl font-bold leading-none">
                  {fmtUsd(TOTAL_DEPOSITED)}
                </span>
              }
            />
            <StatCard
              title="Available to Withdraw"
              text={
                <span className="text-text-primary text-2xl font-bold leading-none">
                  {fmtUsd(AVAILABLE_TO_WITHDRAW)}
                </span>
              }
            />
            <StatCard
              title="Total Earned"
              text={
                <span className="text-2xl font-bold leading-none" style={{ color: "var(--badge-success-text)" }}>
                  +{fmtUsd(TOTAL_EARNED)}
                </span>
              }
            />
          </div>
        </div>

        {/* Middle Row: Yield Line Chart + Earnings Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 px-5">
          {/* Yield Line Chart */}
          <div className="rounded-xl border border-primary-divider bg-background p-5">
            <div className="flex items-center justify-between mb-5">
              <span className="text-text-primary text-lg font-medium">Yield Earned</span>
              <TabContainer
                tabs={[
                  { id: "daily", label: "Daily" },
                  { id: "monthly", label: "Monthly" },
                ]}
                activeTab={chartPeriod}
                setActiveTab={setChartPeriod}
                textSize="sm"
                tabWidth={70}
              />
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--primary-divider)" vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: "var(--text-secondary)" }}
                  axisLine={false}
                  tickLine={false}
                  interval={chartPeriod === "daily" ? 4 : 0}
                />
                <YAxis
                  tickFormatter={(v) => `$${v}`}
                  tick={{ fontSize: 11, fill: "var(--text-secondary)" }}
                  axisLine={false}
                  tickLine={false}
                  width={50}
                />
                <RechartsTooltip content={<ChartTooltip />} />
                <Line
                  type="monotone"
                  dataKey="earned"
                  stroke="var(--primary-blue)"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, fill: "var(--primary-blue)", stroke: "var(--background)", strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Earnings Summary */}
          <div className="rounded-xl border border-primary-divider bg-background p-5 flex flex-col gap-4">
            <span className="text-text-primary text-lg font-medium">Earnings Summary</span>
            <div className="flex-1 flex flex-col">
              {[
                { label: "This Month", value: MONTHLY_YIELD, sub: "Mar 2026" },
                { label: "Last Month", value: MONTHLY_YIELD, sub: "Feb 2026" },
                { label: "Total Earned", value: TOTAL_EARNED, sub: "All time" },
              ].map(({ label, value, sub }) => (
                <div
                  key={label}
                  className="flex items-center justify-between py-3 border-b border-primary-divider last:border-0"
                >
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-medium text-text-primary">{label}</span>
                    <span className="text-xs text-text-secondary">{sub}</span>
                  </div>
                  <span className="text-sm font-semibold" style={{ color: "var(--badge-success-text)" }}>
                    +{fmtUsd(value)}
                  </span>
                </div>
              ))}
            </div>

            {/* Quick info row */}
            <div className="flex gap-2">
              <div className="flex-1 bg-app-background rounded-lg px-3 py-2 flex flex-col gap-1">
                <span className="text-xs text-text-secondary">TVL</span>
                <span className="text-base font-semibold text-text-primary">{fmtUsd(TVL)}</span>
              </div>
              <div className="flex-1 bg-app-background rounded-lg px-3 py-2 flex flex-col gap-1">
                <span className="text-xs text-text-secondary">Backing</span>
                <span className="text-base font-semibold text-text-primary">US T-Bills</span>
              </div>
            </div>
          </div>
        </div>

        {/* Activity Table */}
        <BaseContainer
          header={
            <div className="flex w-full justify-between items-center py-3 px-5">
              <TabContainer
                tabs={[
                  { id: "all", label: "All" },
                  { id: "deposit", label: "Deposits" },
                  { id: "yield", label: "Yield" },
                  { id: "withdraw", label: "Withdrawals" },
                ]}
                activeTab={activityTab}
                setActiveTab={setActivityTab}
              />
            </div>
          }
          childrenClassName="p-5 gap-5"
          containerClassName="w-full mx-5"
        >
          <div className="flex w-full justify-between items-center">
            <div className="flex flex-col gap-2">
              <span className="text-text-primary text-2xl font-medium leading-none">Activity</span>
              <span className="text-text-secondary text-[14px] font-medium leading-none">
                All deposit, withdrawal, and yield transactions
              </span>
            </div>
          </div>

          <Table
            headers={["Type", "Date", "Wallet", "Amount", "Status"]}
            data={tableData}
            className="w-full"
            rowClassName="py-5"
            headerClassName="py-3"
            showPagination={true}
            showFooter={false}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={setRowsPerPage}
          />
        </BaseContainer>
      </div>

      {/* Modals */}
      <HowItWorksModal isOpen={showInfoModal} onClose={() => setShowInfoModal(false)} />
      <DepositModal
        isOpen={showDepositModal}
        onClose={() => setShowDepositModal(false)}
        accounts={accounts}
      />
      <WithdrawModal
        isOpen={showWithdrawModal}
        onClose={() => setShowWithdrawModal(false)}
        accounts={accounts}
      />
    </>
  );
}

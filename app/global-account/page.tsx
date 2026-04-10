"use client";

import React, { useState } from "react";
import toast from "react-hot-toast";
import { Badge, BadgeStatus } from "@/components/Common/Badge";

// ---- Mock Account Data -----------------------------------------------------

interface VirtualAccount {
  id: string;
  currency: string;
  method: string;
  bankName: string;
  status: "active" | "pending";
  details: { label: string; value: string }[];
}

const VIRTUAL_ACCOUNTS: VirtualAccount[] = [
  {
    id: "va-usd-ach",
    currency: "USD",
    method: "ACH / Wire",
    bankName: "Lead Bank",
    status: "active",
    details: [
      { label: "Account Holder", value: "Qash Inc." },
      { label: "Account Number", value: "9401028374650" },
      { label: "Routing Number (ACH)", value: "101019644" },
      { label: "Routing Number (Wire)", value: "101019644" },
      { label: "Bank Name", value: "Lead Bank" },
      { label: "Bank Address", value: "1801 Main St, Kansas City, MO 64108" },
    ],
  },
  {
    id: "va-usd-swift",
    currency: "USD",
    method: "SWIFT",
    bankName: "Lead Bank",
    status: "active",
    details: [
      { label: "Account Holder", value: "Qash Inc." },
      { label: "IBAN", value: "US82 LEAD 0000 9401 0283 7465 0" },
      { label: "SWIFT / BIC", value: "LEABORC1" },
      { label: "Bank Name", value: "Lead Bank" },
      { label: "Bank Address", value: "1801 Main St, Kansas City, MO 64108" },
    ],
  },
  {
    id: "va-eur-sepa",
    currency: "EUR",
    method: "SEPA",
    bankName: "Banking Circle",
    status: "active",
    details: [
      { label: "Account Holder", value: "Qash Inc." },
      { label: "IBAN", value: "LU28 0019 4006 4475 0000" },
      { label: "BIC", value: "BABORLUL" },
      { label: "Bank Name", value: "Banking Circle S.A." },
      { label: "Bank Address", value: "2 Boulevard de la Foire, Luxembourg" },
    ],
  },
  {
    id: "va-aed-uaefts",
    currency: "AED",
    method: "UAEFTS",
    bankName: "Mashreq Bank",
    status: "active",
    details: [
      { label: "Account Holder", value: "Qash Inc." },
      { label: "IBAN", value: "AE07 0331 0000 0102 8374 650" },
      { label: "Bank Name", value: "Mashreq Bank PSC" },
      { label: "Bank Address", value: "Al Rigga Rd, Dubai, UAE" },
    ],
  },
];

// ---- Recent Deposits -------------------------------------------------------

const RECENT_DEPOSITS = [
  { id: "d1", currency: "USD", method: "ACH", amount: 25000, sender: "Acme Corp", date: "2026-04-04T14:30:00Z", status: "completed" },
  { id: "d2", currency: "EUR", method: "SEPA", amount: 18500, sender: "Berlin GmbH", date: "2026-04-03T09:15:00Z", status: "completed" },
  { id: "d3", currency: "USD", method: "Wire", amount: 50000, sender: "TechVentures LLC", date: "2026-04-02T16:45:00Z", status: "completed" },
  { id: "d4", currency: "AED", method: "UAEFTS", amount: 73400, sender: "Gulf Trading Co.", date: "2026-04-01T11:20:00Z", status: "completed" },
  { id: "d5", currency: "USD", method: "SWIFT", amount: 120000, sender: "Singapore Holdings Pte", date: "2026-03-30T08:00:00Z", status: "completed" },
  { id: "d6", currency: "EUR", method: "SEPA", amount: 9200, sender: "Paris Design Studio", date: "2026-03-28T13:10:00Z", status: "completed" },
];

// ---- Helpers ---------------------------------------------------------------

function fmtCurrency(amount: number, currency: string): string {
  const symbols: Record<string, string> = { USD: "$", EUR: "\u20AC", AED: "AED " };
  const prefix = symbols[currency] ?? "";
  return `${prefix}${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function copyToClipboard(text: string, label: string) {
  navigator.clipboard.writeText(text);
  toast.success(`${label} copied`);
}

// ---- Account Card ----------------------------------------------------------

function AccountCard({ account }: { account: VirtualAccount }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-xl border border-primary-divider bg-background overflow-hidden">
      {/* Header */}
      <button
        type="button"
        className="w-full flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-app-background transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-app-background border border-primary-divider flex items-center justify-center text-xs font-bold text-text-primary shrink-0">
            {account.currency}
          </div>
          <div className="flex flex-col items-start gap-0.5">
            <span className="text-sm font-semibold text-text-primary">
              {account.currency} - {account.method}
            </span>
            <span className="text-xs text-text-secondary">{account.bankName}</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge status={BadgeStatus.SUCCESS} text="Active" className="px-3" />
          <img
            src="/arrow/chevron-right.svg"
            alt="expand"
            className={`w-3 opacity-40 transition-transform duration-200 ${expanded ? "rotate-90" : ""}`}
          />
        </div>
      </button>

      {/* Details */}
      {expanded && (
        <div className="border-t border-primary-divider px-5 py-4">
          <div className="flex flex-col gap-3">
            {account.details.map((detail) => (
              <div
                key={detail.label}
                className="flex items-center justify-between py-2 border-b border-primary-divider last:border-0"
              >
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs text-text-secondary">{detail.label}</span>
                  <span className="text-sm font-medium text-text-primary font-mono">
                    {detail.value}
                  </span>
                </div>
                <button
                  type="button"
                  className="text-xs font-medium cursor-pointer px-3 py-1.5 rounded-lg hover:bg-app-background transition-colors"
                  style={{ color: "var(--primary-blue)" }}
                  onClick={() => copyToClipboard(detail.value, detail.label)}
                >
                  Copy
                </button>
              </div>
            ))}
          </div>

          {/* Copy All */}
          <button
            type="button"
            className="mt-4 w-full py-2 rounded-lg border border-primary-divider text-sm font-medium text-text-secondary hover:bg-app-background transition-colors cursor-pointer"
            onClick={() => {
              const allDetails = account.details
                .map((d) => `${d.label}: ${d.value}`)
                .join("\n");
              copyToClipboard(allDetails, "All account details");
            }}
          >
            Copy all details
          </button>
        </div>
      )}
    </div>
  );
}

// ---- Main Page -------------------------------------------------------------

export default function GlobalAccountPage() {
  return (
    <div className="flex flex-col w-full h-full p-5 gap-5 overflow-y-auto">
      {/* Header */}
      <div className="flex flex-col w-full px-5 gap-5">
        <div className="flex flex-row items-center justify-between w-full">
          <div className="flex flex-row items-center justify-start gap-3">
            <img src="/sidebar/global-account.svg" alt="Global Account" className="w-6 h-6" />
            <span className="text-2xl font-bold">Global Account</span>
          </div>
        </div>

        {/* Info Banner */}
        <div className="bg-app-background rounded-[12px] border-b border-primary-divider p-3 flex items-start gap-2">
          <img src="/misc/info-icon.svg" alt="info" className="w-4 h-4 mt-0.5 shrink-0 opacity-40" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
          <div className="flex flex-col gap-1">
            <p className="text-xs font-semibold text-text-primary">
              Receive fiat deposits from anywhere in the world
            </p>
            <p className="text-xs text-text-secondary leading-relaxed">
              Your dedicated virtual bank accounts accept deposits in USD (ACH, Wire, SWIFT), EUR (SEPA), and AED (UAEFTS).
              Incoming funds are automatically converted and routed to your Qash wallet. Accounts are permanent and reusable.
            </p>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="flex flex-row w-full gap-2">
          <div
            className="relative w-full rounded-xl border border-primary-divider p-4 flex flex-col overflow-hidden gap-3"
            style={{
              backgroundImage: "url(/card/background.svg)",
              backgroundSize: "30%",
              backgroundPosition: "right",
              backgroundRepeat: "no-repeat",
            }}
          >
            <span className="text-text-secondary text-sm leading-none">Active Accounts</span>
            <span className="text-text-primary text-2xl font-bold leading-none">4</span>
          </div>
          <div
            className="relative w-full rounded-xl border border-primary-divider p-4 flex flex-col overflow-hidden gap-3"
            style={{
              backgroundImage: "url(/card/background.svg)",
              backgroundSize: "30%",
              backgroundPosition: "right",
              backgroundRepeat: "no-repeat",
            }}
          >
            <span className="text-text-secondary text-sm leading-none">Supported Currencies</span>
            <span className="text-text-primary text-2xl font-bold leading-none">USD, EUR, AED</span>
          </div>
          <div
            className="relative w-full rounded-xl border border-primary-divider p-4 flex flex-col overflow-hidden gap-3"
            style={{
              backgroundImage: "url(/card/background.svg)",
              backgroundSize: "30%",
              backgroundPosition: "right",
              backgroundRepeat: "no-repeat",
            }}
          >
            <span className="text-text-secondary text-sm leading-none">Total Received (30d)</span>
            <span className="text-2xl font-bold leading-none" style={{ color: "var(--badge-success-text)" }}>
              $296,100.00
            </span>
          </div>
        </div>
      </div>

      {/* Account Cards */}
      <div className="flex flex-col px-5 gap-3">
        <span className="text-lg font-medium text-text-primary">Your Virtual Accounts</span>
        {VIRTUAL_ACCOUNTS.map((account) => (
          <AccountCard key={account.id} account={account} />
        ))}
      </div>

      {/* Recent Deposits */}
      <div className="flex flex-col px-5 gap-3">
        <span className="text-lg font-medium text-text-primary">Recent Deposits</span>
        <div className="rounded-xl border border-primary-divider bg-background overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-primary-divider bg-app-background">
                <th className="text-left text-xs font-medium text-text-secondary px-5 py-3">Sender</th>
                <th className="text-left text-xs font-medium text-text-secondary px-5 py-3">Method</th>
                <th className="text-left text-xs font-medium text-text-secondary px-5 py-3">Date</th>
                <th className="text-right text-xs font-medium text-text-secondary px-5 py-3">Amount</th>
                <th className="text-center text-xs font-medium text-text-secondary px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {RECENT_DEPOSITS.map((deposit) => (
                <tr key={deposit.id} className="border-b border-primary-divider last:border-0">
                  <td className="px-5 py-3.5 text-sm font-medium text-text-primary">{deposit.sender}</td>
                  <td className="px-5 py-3.5 text-sm text-text-secondary">
                    {deposit.currency} {deposit.method}
                  </td>
                  <td className="px-5 py-3.5 text-sm text-text-secondary">
                    {new Date(deposit.date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-5 py-3.5 text-sm font-semibold text-text-primary text-right">
                    {fmtCurrency(deposit.amount, deposit.currency)}
                  </td>
                  <td className="px-5 py-3.5 text-center">
                    <div className="flex justify-center">
                      <Badge status={BadgeStatus.SUCCESS} text="Completed" className="px-3" />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

"use client";

import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { Badge, BadgeStatus } from "@/components/Common/Badge";
import { SecondaryButton } from "@/components/Common/SecondaryButton";
import BaseModal from "@/components/Modal/BaseModal";
import { ModalHeader } from "@/components/Common/ModalHeader";
import { useTitle } from "@/contexts/TitleProvider";
import { NavArrowRight, Copy, Check } from "iconoir-react";

const CARD_BG_STYLE = {
  backgroundImage: "url(/card/background.svg)",
  backgroundSize: "30%",
  backgroundPosition: "right",
  backgroundRepeat: "no-repeat",
} as const;

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

// ---- Virtual Account Card (credit-card visual) -----------------------------

const CARD_GRADIENT: Record<string, string> = {
  USD: "linear-gradient(135deg, #1b3a8f 0%, #2f6df6 100%)",
  EUR: "linear-gradient(135deg, #4c1d95 0%, #7c3aed 100%)",
  AED: "linear-gradient(135deg, #064e3b 0%, #0c9f6e 100%)",
};

function primaryNumber(account: VirtualAccount): string {
  const d = account.details.find((x) => /account number|iban/i.test(x.label));
  return d?.value ?? account.details[1]?.value ?? "";
}

function CardFace({ account, className = "" }: { account: VirtualAccount; className?: string }) {
  const holder = account.details.find((d) => /holder/i.test(d.label))?.value ?? "Qash Inc.";
  return (
    <div
      className={`relative flex h-[210px] w-[340px] flex-col justify-between overflow-hidden rounded-2xl p-5 text-left text-white shadow-sm ${className}`}
      style={{ background: CARD_GRADIENT[account.currency] ?? CARD_GRADIENT.USD }}
    >
      {/* decorative shapes */}
      <span className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-white/10" />
      <span className="pointer-events-none absolute -bottom-14 -left-10 h-40 w-40 rounded-full bg-white/5" />

      {/* top row */}
      <div className="relative z-10 flex items-start justify-between">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wide text-white/60">{account.method}</p>
          <p className="text-xl font-bold leading-tight">{account.currency}</p>
        </div>
        <span className="rounded-full bg-white/20 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide">
          Active
        </span>
      </div>

      {/* chip + number */}
      <div className="relative z-10 flex flex-col gap-2">
        <span className="h-6 w-9 rounded-md bg-gradient-to-br from-white/70 to-white/40" />
        <p className="num break-all text-[15px] font-medium leading-snug tracking-[0.12em]">{primaryNumber(account)}</p>
      </div>

      {/* bottom row */}
      <div className="relative z-10 flex items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[9px] font-medium uppercase tracking-wide text-white/50">Bank</p>
          <p className="truncate text-sm font-semibold">{account.bankName}</p>
        </div>
        <div className="min-w-0 text-right">
          <p className="text-[9px] font-medium uppercase tracking-wide text-white/50">Holder</p>
          <p className="truncate text-sm font-semibold">{holder}</p>
        </div>
      </div>
    </div>
  );
}

function VirtualCard({ account, onClick }: { account: VirtualAccount; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="shrink-0 snap-start cursor-pointer rounded-2xl opacity-95 transition-all duration-200 hover:-translate-y-0.5 hover:opacity-100 focus:outline-none"
    >
      <CardFace account={account} />
    </button>
  );
}

// ---- Account Details Modal -------------------------------------------------

function AccountModal({ account, onClose }: { account: VirtualAccount; onClose: () => void }) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopyDetail = (label: string, value: string) => {
    copyToClipboard(value, label);
    setCopiedKey(label);
    window.setTimeout(() => setCopiedKey((k) => (k === label ? null : k)), 1500);
  };

  return (
    <BaseModal isOpen onClose={onClose} zIndex={1000}>
      <ModalHeader title="Account details" onClose={onClose} />
      <div className="flex max-h-[80vh] w-[520px] flex-col overflow-hidden rounded-b-2xl border-2 border-primary-divider bg-background">
        <div className="flex flex-col gap-4 overflow-y-auto p-5">
          {/* card visual */}
          <CardFace account={account} className="mx-auto" />

          {/* copy all */}
          <SecondaryButton
            variant="light"
            buttonClassName="w-fit self-center whitespace-nowrap"
            onClick={() => {
              const allDetails = account.details.map((d) => `${d.label}: ${d.value}`).join("\n");
              copyToClipboard(allDetails, "All account details");
            }}
            text={
              <span className="flex items-center gap-2">
                <Copy width={14} height={14} strokeWidth={2} />
                Copy all details
              </span>
            }
          />

          {/* detail rows */}
          <div className="flex flex-col rounded-xl border border-primary-divider px-4">
            {account.details.map((detail) => {
              const copied = copiedKey === detail.label;
              return (
                <div
                  key={detail.label}
                  className="flex items-center justify-between gap-4 border-b border-primary-divider py-3 last:border-0"
                >
                  <div className="flex min-w-0 flex-col gap-1">
                    <span className="text-[11px] font-medium uppercase tracking-wide text-text-secondary">
                      {detail.label}
                    </span>
                    <span className="num break-all text-sm font-medium text-text-primary">{detail.value}</span>
                  </div>
                  <SecondaryButton
                    variant="light"
                    buttonClassName="w-fit shrink-0 whitespace-nowrap"
                    onClick={() => handleCopyDetail(detail.label, detail.value)}
                    text={
                      <span className={`flex items-center gap-1.5 ${copied ? "text-text-primary" : ""}`}>
                        {copied ? <Check width={14} height={14} strokeWidth={2} /> : <Copy width={14} height={14} strokeWidth={2} />}
                        {copied ? "Copied" : "Copy"}
                      </span>
                    }
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </BaseModal>
  );
}

// ---- Main Page -------------------------------------------------------------

export default function GlobalAccountPage() {
  const { setTitle, setShowBackArrow } = useTitle();
  const [modalAccount, setModalAccount] = useState<VirtualAccount | null>(null);

  // Breadcrumb in the top title bar: Receive › Global Account
  useEffect(() => {
    setTitle(
      <div className="flex items-center gap-1.5 text-[14px]">
        <span className="text-text-secondary">Receive</span>
        <NavArrowRight width={12} height={12} strokeWidth={2.2} className="text-text-secondary/50" />
        <span className="font-medium text-text-primary">Global Account</span>
      </div>,
    );
    setShowBackArrow(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex w-full h-full flex-col overflow-y-auto">
      {/* Page header (same concept as the Dashboard / Invoice / Bills pages) */}
      <div className="flex w-full items-start justify-between gap-4 px-6 pt-6 pb-3">
        <div className="flex flex-col gap-0.5">
          <h1 className="text-[26px] font-bold leading-tight tracking-tight text-text-primary">Global Account</h1>
          <p className="text-[14px] text-text-secondary">Receive fiat deposits from anywhere in the world.</p>
        </div>
      </div>

      {/* Info banner */}
      <div className="px-6 pb-3">
        <div className="flex items-start gap-2 rounded-xl border border-primary-divider bg-app-background p-3">
          <img
            src="/misc/info-icon.svg"
            alt="info"
            className="mt-0.5 h-4 w-4 shrink-0 opacity-40"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
          <p className="text-xs leading-relaxed text-text-secondary">
            Your dedicated virtual bank accounts accept deposits in USD (ACH, Wire, SWIFT), EUR (SEPA), and AED (UAEFTS).
            Incoming funds are automatically converted and routed to your Qash wallet. Accounts are permanent and reusable.
          </p>
        </div>
      </div>

      {/* Stat cards */}
      <div className="flex w-full flex-row gap-2 px-6 pb-2">
        <div className="relative flex w-full flex-col gap-3 overflow-hidden rounded-xl border border-primary-divider p-4" style={CARD_BG_STYLE}>
          <span className="text-sm leading-none text-text-secondary">Active Accounts</span>
          <span className="num text-2xl leading-none text-text-primary">{VIRTUAL_ACCOUNTS.length}</span>
        </div>
        <div className="relative flex w-full flex-col gap-3 overflow-hidden rounded-xl border border-primary-divider p-4" style={CARD_BG_STYLE}>
          <span className="text-sm leading-none text-text-secondary">Supported Currencies</span>
          <span className="text-2xl font-semibold leading-none text-text-primary">USD, EUR, AED</span>
        </div>
        <div className="relative flex w-full flex-col gap-3 overflow-hidden rounded-xl border border-primary-divider p-4" style={CARD_BG_STYLE}>
          <span className="text-sm leading-none text-text-secondary">Total Received (30d)</span>
          <span className="num text-2xl leading-none" style={{ color: "var(--badge-success-text)" }}>
            $296,100.00
          </span>
        </div>
      </div>

      {/* Your Virtual Accounts (horizontal card carousel; click a card for details) */}
      <div className="flex flex-col gap-1 px-6 pb-2 pt-3">
        <span className="text-lg font-semibold text-text-primary">Your Virtual Accounts</span>
        <div className="-mx-1 flex snap-x gap-4 overflow-x-auto px-1 pb-3 pt-2">
          {VIRTUAL_ACCOUNTS.map((account) => (
            <VirtualCard key={account.id} account={account} onClick={() => setModalAccount(account)} />
          ))}
        </div>
      </div>

      {/* Recent Deposits */}
      <div className="flex flex-col gap-3 px-6 pb-6 pt-3">
        <span className="text-lg font-semibold text-text-primary">Recent Deposits</span>
        <div className="overflow-hidden rounded-2xl border border-primary-divider bg-background">
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
                  <td className="num px-5 py-3.5 text-sm font-semibold text-text-primary text-right">
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

      {modalAccount && <AccountModal account={modalAccount} onClose={() => setModalAccount(null)} />}
    </div>
  );
}

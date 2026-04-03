"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useDemo } from "@/contexts/DemoProvider";
import { PageHeader } from "@/components/Common/PageHeader";
import { PrimaryButton } from "@/components/Common/PrimaryButton";
import { Badge, BadgeStatus } from "@/components/Common/Badge";
import { BaseContainer } from "@/components/Common/BaseContainer";
import toast from "react-hot-toast";

const FIAT_OPTIONS = [
  { code: "SGD", label: "Singapore Dollar", symbol: "S$", flag: "/flag/sg.svg" },
  { code: "USD", label: "US Dollar", symbol: "$", flag: "/flag/us.svg" },
  { code: "EUR", label: "Euro", symbol: "\u20AC", flag: "/flag/eu.svg" },
];

const RATES: Record<string, number> = { SGD: 1.35, USD: 1.0, EUR: 0.92 };
const FEE_RATE = 0.0025;

function fmt(n: number, d = 2) {
  return n.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

const StatCard = ({ label, value, sub }: { label: string; value: string; sub?: string }) => (
  <div
    className="flex-1 rounded-xl border border-primary-divider p-4 flex flex-col gap-2"
    style={{ backgroundImage: "url(/card/background.svg)", backgroundSize: "30%", backgroundPosition: "right", backgroundRepeat: "no-repeat" }}
  >
    <span className="text-text-secondary text-sm leading-none">{label}</span>
    <span className="text-text-primary text-2xl font-bold leading-none">{value}</span>
    {sub && <span className="text-text-secondary text-xs">{sub}</span>}
  </div>
);

export default function CashoutPage() {
  const { data, addRampTransaction } = useDemo();
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState("");
  const [fiat, setFiat] = useState("SGD");
  const [converting, setConverting] = useState(false);
  const [showFiatDropdown, setShowFiatDropdown] = useState(false);

  useEffect(() => { const t = setTimeout(() => setLoading(false), 600); return () => clearTimeout(t); }, []);

  const parsedAmount = parseFloat(amount) || 0;
  const rate = RATES[fiat] ?? 1;
  const fiatAmount = parsedAmount * rate;
  const fee = parsedAmount * FEE_RATE;
  const netReceive = (parsedAmount - fee) * rate;
  const selectedFiat = FIAT_OPTIONS.find(f => f.code === fiat)!;

  const rampHistory = data?.rampHistory ?? [];
  const totalCashedOut = rampHistory.filter(h => h.type === "OFF_RAMP").reduce((s, h) => s + h.toAmount, 0);
  const totalDeposited = rampHistory.filter(h => h.type === "ON_RAMP").reduce((s, h) => s + h.toAmount, 0);

  const handleCashout = () => {
    if (parsedAmount <= 0) return;
    setConverting(true);
    setTimeout(() => {
      addRampTransaction({
        id: `ramp-${Date.now()}`,
        type: "OFF_RAMP",
        fromCurrency: "USDT",
        toCurrency: fiat,
        fromAmount: parsedAmount,
        toAmount: parseFloat(netReceive.toFixed(2)),
        rate,
        fee: parseFloat(fee.toFixed(2)),
        status: "COMPLETED",
        bankAccount: "DBS Bank ****6721",
        completedAt: new Date().toISOString(),
      });
      setConverting(false);
      setAmount("");
      toast.success(`${selectedFiat.symbol}${fmt(netReceive)} sent to DBS Bank ****6721`);
    }, 1500);
  };

  if (loading || !data) {
    return (
      <div className="w-full h-full p-5 flex flex-col gap-4">
        <div className="h-8 w-48 bg-primary-divider rounded animate-pulse" />
        <div className="flex gap-3">
          {[1, 2, 3].map(i => <div key={i} className="flex-1 h-24 bg-primary-divider rounded-xl animate-pulse" />)}
        </div>
        <div className="flex-1 bg-primary-divider rounded-2xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="w-full h-full p-5 flex flex-col gap-4 items-start">
      <div className="w-full px-5">
        <PageHeader icon="/sidebar/payroll.svg" label="Cashout" button={null} />
      </div>

      {/* Stat cards */}
      <div className="flex flex-row gap-3 w-full px-5">
        <StatCard label="Treasury Balance" value={`$${fmt(data.totalBalance)}`} sub="Available across all wallets" />
        <StatCard label="Total Cashed Out" value={`$${fmt(totalCashedOut)}`} sub={`${rampHistory.filter(h => h.type === "OFF_RAMP").length} withdrawals`} />
        <StatCard label="Total Deposited" value={`$${fmt(totalDeposited)}`} sub={`${rampHistory.filter(h => h.type === "ON_RAMP").length} deposits`} />
      </div>

      {/* Main content */}
      <div className="flex flex-row gap-4 w-full px-5 flex-1 min-h-0">
        {/* Cashout form */}
        <div className="w-[420px] flex flex-col gap-4">
          <div className="bg-background rounded-2xl border border-primary-divider p-6 flex flex-col gap-5">
            <div className="flex flex-col gap-1">
              <span className="text-lg font-semibold text-text-primary">Withdraw to Bank</span>
              <span className="text-sm text-text-secondary">Convert USDT from your treasury and send it to your business bank account.</span>
            </div>

            {/* Amount input */}
            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium text-text-secondary">Amount (USDT)</span>
              <div className="flex items-center gap-3 p-4 rounded-xl border border-primary-divider bg-app-background">
                <img src="/token/usdt.svg" alt="USDT" className="w-6 h-6" />
                <input
                  type="number"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="flex-1 text-2xl font-semibold text-text-primary bg-transparent outline-none placeholder:text-text-secondary/40"
                />
                <span className="text-sm text-text-secondary font-medium">USDT</span>
              </div>
            </div>

            {/* Destination currency */}
            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium text-text-secondary">Receive as</span>
              <div className="relative">
                <button
                  onClick={() => setShowFiatDropdown(!showFiatDropdown)}
                  className="w-full flex items-center justify-between p-3 rounded-xl border border-primary-divider bg-app-background cursor-pointer hover:border-text-secondary transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <img src={selectedFiat.flag} alt={fiat} className="w-6 h-4 rounded-sm object-cover" onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                    <span className="text-text-primary font-medium">{selectedFiat.label}</span>
                    <span className="text-text-secondary text-sm">({selectedFiat.code})</span>
                  </div>
                  <svg className={`w-4 h-4 text-text-secondary transition-transform ${showFiatDropdown ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {showFiatDropdown && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowFiatDropdown(false)} />
                    <div className="absolute top-full left-0 right-0 mt-1 z-20 bg-background border border-primary-divider rounded-xl shadow-lg overflow-hidden">
                      {FIAT_OPTIONS.map(f => (
                        <button
                          key={f.code}
                          className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-app-background transition-colors cursor-pointer ${f.code === fiat ? "bg-app-background" : ""}`}
                          onClick={() => { setFiat(f.code); setShowFiatDropdown(false); }}
                        >
                          <img src={f.flag} alt={f.code} className="w-6 h-4 rounded-sm object-cover" onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                          <span className="text-text-primary text-sm font-medium">{f.label}</span>
                          <span className="text-text-secondary text-xs">({f.code})</span>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Summary */}
            {parsedAmount > 0 && (
              <div className="flex flex-col gap-2.5 p-4 rounded-xl bg-app-background border border-primary-divider">
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary">Exchange rate</span>
                  <span className="text-text-primary font-medium">1 USDT = {fmt(rate, 4)} {fiat}</span>
                </div>
                <div className="border-t border-primary-divider" />
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary">Network fee (0.25%)</span>
                  <span className="text-text-primary">{fmt(fee)} USDT</span>
                </div>
                <div className="border-t border-primary-divider" />
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary">Estimated arrival</span>
                  <span className="text-text-primary">1-2 business days</span>
                </div>
                <div className="border-t border-primary-divider" />
                <div className="flex justify-between">
                  <span className="text-text-primary font-semibold">Bank receives</span>
                  <span className="text-text-primary font-bold text-lg">{selectedFiat.symbol}{fmt(netReceive)}</span>
                </div>
              </div>
            )}

            <PrimaryButton
              text={converting ? "Processing..." : parsedAmount > 0 ? `Cashout ${selectedFiat.symbol}${fmt(netReceive)}` : "Enter amount"}
              onClick={handleCashout}
              disabled={parsedAmount <= 0 || converting}
              loading={converting}
            />
          </div>

          {/* Bank account */}
          <div className="bg-background rounded-2xl border border-primary-divider p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-[#E2000F] flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-bold">DBS</span>
            </div>
            <div className="flex flex-col flex-1">
              <span className="text-sm font-medium text-text-primary">DBS Business Current Account</span>
              <span className="text-xs text-text-secondary">****6721 - SGD / USD / EUR</span>
            </div>
            <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
        </div>

        {/* Transaction history */}
        <div className="flex-1 flex flex-col min-h-0">
          <BaseContainer
            header={
              <div className="flex items-center justify-between w-full p-5">
                <span className="text-lg font-semibold text-text-primary">Withdrawal History</span>
                <span className="text-sm text-text-secondary">{rampHistory.length} transactions</span>
              </div>
            }
            childrenClassName="p-0 overflow-auto"
          >
            <table className="w-full">
              <thead>
                <tr className="border-b border-primary-divider">
                  <th className="text-left text-xs font-medium text-text-secondary uppercase px-5 py-3">Date</th>
                  <th className="text-left text-xs font-medium text-text-secondary uppercase px-5 py-3">Type</th>
                  <th className="text-right text-xs font-medium text-text-secondary uppercase px-5 py-3">Crypto</th>
                  <th className="text-right text-xs font-medium text-text-secondary uppercase px-5 py-3">Fiat</th>
                  <th className="text-left text-xs font-medium text-text-secondary uppercase px-5 py-3">Bank</th>
                  <th className="text-center text-xs font-medium text-text-secondary uppercase px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {rampHistory.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-16 text-text-secondary text-sm">
                      <img src="/misc/hexagon-multisig-icon.svg" alt="empty" className="w-20 mx-auto mb-3 opacity-50" />
                      No withdrawals yet
                    </td>
                  </tr>
                ) : (
                  rampHistory.map(entry => {
                    const isWithdraw = entry.type === "OFF_RAMP";
                    return (
                      <tr key={entry.id} className="border-b border-primary-divider last:border-b-0 hover:bg-app-background transition-colors">
                        <td className="px-5 py-3.5 text-sm text-text-primary">{fmtDate(entry.completedAt)}</td>
                        <td className="px-5 py-3.5">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${isWithdraw ? "bg-red-50 text-red-600" : "bg-blue-50 text-blue-600"}`}>
                            {isWithdraw ? "Withdraw" : "Deposit"}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-sm text-right font-medium text-text-primary">
                          {isWithdraw ? "-" : "+"}{fmt(isWithdraw ? entry.fromAmount : entry.toAmount)} {isWithdraw ? entry.fromCurrency : entry.toCurrency}
                        </td>
                        <td className="px-5 py-3.5 text-sm text-right font-medium text-text-primary">
                          {isWithdraw ? "+" : "-"}{fmt(isWithdraw ? entry.toAmount : entry.fromAmount)} {isWithdraw ? entry.toCurrency : entry.fromCurrency}
                        </td>
                        <td className="px-5 py-3.5 text-sm text-text-secondary">{entry.bankAccount}</td>
                        <td className="px-5 py-3.5 text-center">
                          <Badge text={entry.status} status={BadgeStatus.Success} className="px-3" />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </BaseContainer>
        </div>
      </div>
    </div>
  );
}

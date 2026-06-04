"use client";
import React, { useMemo } from "react";
import { useMultisigAssets, useListAccountsByCompany } from "@/services/api/multisig";
import { useGetMyCompany } from "@/services/api/company";
import { useGetPayrollStats } from "@/services/api/payroll";
import type { AccountBalanceStatDto } from "@qash/types/dto/multisig";

function formatPayDate(isoDate: string): string {
  const d = new Date(isoDate);
  const day = d.getDate();
  const suffix =
    day === 1 || day === 21 || day === 31
      ? "st"
      : day === 2 || day === 22
        ? "nd"
        : day === 3 || day === 23
          ? "rd"
          : "th";
  return d.toLocaleDateString("en-US", { month: "short", year: "numeric" }).replace(",", ` ${day}${suffix},`);
}

// Decorative mini bar "sparkline" — most bars muted, a couple accented (dark).
const StatSparkline = ({ heights, accent }: { heights: number[]; accent: number[] }) => (
  <div className="flex h-9 items-end gap-[3px]" aria-hidden>
    {heights.map((h, i) => (
      <span
        key={i}
        className={`w-[3px] rounded-full ${accent.includes(i) ? "bg-text-primary" : "bg-primary-divider"}`}
        style={{ height: `${h}%` }}
      />
    ))}
  </div>
);

const PAYROLL_SPARK = [38, 28, 50, 33, 62, 44, 72, 92, 98, 58, 40, 52, 30, 44];

// Demo token prices (USD) for the composition share — real per-token USD isn't in the demo data.
const TOKEN_PRICE: Record<string, number> = {
  USDC: 1,
  USDT: 1,
  DAI: 1,
  ETH: 3000,
  WETH: 3000,
  BTC: 60000,
  WBTC: 60000,
  STRK: 1.2,
  PARA: 0.5,
  MID: 2,
};
const priceOf = (s: string) => TOKEN_PRICE[(s || "").toUpperCase()] ?? 1;

const TOKEN_BRAND: Record<string, string> = {
  USDC: "#2775CA",
  USDT: "#26A17B",
  DAI: "#F5AC37",
  ETH: "#627EEA",
  WETH: "#627EEA",
  BTC: "#F7931A",
  STRK: "#EC796B",
};
const tokenColor = (s: string) => TOKEN_BRAND[(s || "").toUpperCase()] ?? "#6b7280";

// Segmented composition bar (reference "AVG. CHEQUE SIZE" style): labels + a
// proportional colored bar (segment widths ∝ share).
const BreakdownBar = ({ segments }: { segments: { label: string; pct: number; color: string }[] }) => (
  <div className="flex flex-col gap-2">
    <div className="flex gap-2">
      {segments.map(s => (
        <div key={s.label} style={{ flexGrow: Math.max(s.pct, 8) }} className="min-w-0 basis-0">
          <p className="truncate text-xs text-text-secondary">
            <span className="num font-semibold text-text-primary">{s.pct}%</span> {s.label}
          </p>
        </div>
      ))}
    </div>
    <div className="flex h-2 gap-1.5">
      {segments.map(s => (
        <div
          key={s.label}
          style={{ flexGrow: Math.max(s.pct, 8), backgroundColor: s.color }}
          className="basis-0 rounded-full"
        />
      ))}
    </div>
  </div>
);

const StatCardShell = ({
  label,
  icon,
  spark,
  children,
  footer,
}: {
  label: string;
  icon: string;
  spark: { heights: number[]; accent: number[] };
  children: React.ReactNode;
  footer: React.ReactNode;
}) => (
  <div className="flex h-[180px] w-full min-w-[300px] flex-col justify-between rounded-2xl border border-primary-divider bg-background p-5">
    <div className="flex items-start justify-between gap-3">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-text-secondary">{label}</span>
      <StatSparkline heights={spark.heights} accent={spark.accent} />
    </div>

    <div className="flex items-baseline gap-2">{children}</div>

    <div className="flex items-center justify-between border-t border-primary-divider pt-3">
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-app-background">
        <img src={icon} alt="" className="h-3.5 w-3.5" />
      </span>
      <span className="num text-xs text-text-secondary">{footer}</span>
    </div>
  </div>
);

const TreasuryCard = ({
  text,
  subtitle,
  tokens,
}: {
  text: string;
  subtitle: string;
  tokens?: { symbol: string; amount: number }[];
}) => {
  const segments = useMemo(() => {
    const list = (tokens ?? []).map(t => ({ symbol: t.symbol || "Token", usd: (t.amount || 0) * priceOf(t.symbol) }));
    const total = list.reduce((s, t) => s + t.usd, 0) || 1;
    return list
      .filter(t => t.usd > 0)
      .sort((a, b) => b.usd - a.usd)
      .slice(0, 4)
      .map(t => ({ label: t.symbol, pct: Math.round((t.usd / total) * 100), color: tokenColor(t.symbol) }));
  }, [tokens]);

  return (
    <div className="flex h-[180px] w-full min-w-[300px] flex-col justify-between rounded-2xl border border-primary-divider bg-background p-5">
      <div>
        <span className="text-[11px] font-semibold uppercase tracking-wider text-text-secondary">{text}</span>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="num text-3xl text-text-primary">{subtitle}</span>
        </div>
      </div>
      {segments.length > 0 && (
        <div className="border-t border-primary-divider pt-3">
          <BreakdownBar segments={segments} />
        </div>
      )}
    </div>
  );
};

const UpcomingPayrollCard = ({
  text,
  subtitle,
  icon,
  nextPayDate,
  totalPayees,
}: {
  text: string;
  subtitle: string;
  icon: string;
  nextPayDate: string | null;
  totalPayees: number;
}) => (
  <StatCardShell
    label={text}
    icon={icon}
    spark={{ heights: PAYROLL_SPARK, accent: [7, 8] }}
    footer={
      nextPayDate ? (
        <>
          Due on <span className="font-semibold text-text-primary">{formatPayDate(nextPayDate)}</span>
        </>
      ) : (
        <span>No upcoming payroll</span>
      )
    }
  >
    <span className="num text-3xl text-text-primary">{subtitle}</span>
    <span className="text-sm text-text-secondary">
      {totalPayees} {totalPayees === 1 ? "Payee" : "Payees"}
    </span>
  </StatCardShell>
);

export const CardContainer = () => {
  const { data: myCompany } = useGetMyCompany();
  const { data: multisigAccounts } = useListAccountsByCompany(myCompany?.id, { enabled: !!myCompany?.id });

  const accountIds = multisigAccounts?.map(acc => acc.accountId);
  const { data: assetsData } = useMultisigAssets(accountIds);
  const { data: payrollStats } = useGetPayrollStats();

  const treasuryStats: AccountBalanceStatDto | undefined = useMemo(() => {
    if (!assetsData) return undefined;
    return {
      totalUSD: assetsData.totalUsd,
      tokens: assetsData.balances.map(b => ({
        faucetId: b.assetId,
        symbol: b.symbol,
        amount: parseFloat(b.balance) || 0,
        amountUSD: parseFloat(b.balance) || 0,
      })),
    };
  }, [assetsData]);

  const payrollAmount = payrollStats
    ? `$${payrollStats.totalMonthlyAmount.toLocaleString("en-US", { maximumFractionDigits: 2 })}`
    : "$0.00";

  return (
    <div id="tour-cards" className="w-full flex flex-row gap-4">
      <TreasuryCard
        text="Total Treasury Balance"
        subtitle={`$${(treasuryStats?.totalUSD ?? 0).toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`}
        tokens={treasuryStats?.tokens}
      />
      <UpcomingPayrollCard
        text="Upcoming Payroll"
        subtitle={payrollAmount}
        icon="/card/calendar-icon.svg"
        nextPayDate={payrollStats?.nextPayDate ?? null}
        totalPayees={payrollStats?.totalPayees ?? 0}
      />
    </div>
  );
};

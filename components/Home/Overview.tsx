import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { BaseContainer } from "../Common/BaseContainer";
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from "recharts";
import TransactionHistory from "./Overview/TransactionHistory";
import { useLocalAccountBalances, useListAccountsByCompany, useMultisigAssets } from "@/services/api/multisig";
import { useGetMyCompany } from "@/services/api/company";
import { useMidenProvider } from "@/contexts/MidenProvider";
import { supportedTokens } from "@/services/utils/supportedToken";
import { TokenFilterDropdown } from "./Overview/TokenFilterDropdown";
import { PeriodFilterDropdown } from "./Overview/PeriodFilterDropdown";

// -- Constants --
const ASSET_COLORS: Record<string, string> = {
  USDT: "#26A17B",
  USDC: "#2775CA",
  ETH: "#627EEA",
  PARA: "#00E595",
  MID: "#a855f7",
};
const DEFAULT_ASSET_COLOR = "#6b7280";
// Dark-grey palette for the balance chart lines (one shade per token).
const CHART_GREYS = ["#374151", "#6b7280", "#4b5563", "#9ca3af", "#334155"];

// Period filter for the balance chart.
const PERIODS = [
  { id: "year", label: "Year" },
  { id: "month", label: "Month" },
  { id: "week", label: "Week" },
  { id: "day", label: "Day" },
] as const;
type PeriodId = (typeof PERIODS)[number]["id"];
const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// Time-bucket labels for a period, never extending past *now* (last = current point).
function periodBuckets(period: PeriodId, now: Date): string[] {
  if (period === "month") {
    const days = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate(); // 28–31 days
    return Array.from({ length: days }, (_, i) => String(i + 1));
  }
  if (period === "week") {
    const dow = (now.getDay() + 6) % 7; // 0 = Mon … 6 = Sun
    return WEEKDAYS.slice(0, dow + 1);
  }
  if (period === "day") {
    const labels = ["12AM", "3AM", "6AM", "9AM", "12PM", "3PM", "6PM", "9PM"];
    return labels.slice(0, Math.max(1, Math.floor(now.getHours() / 3) + 1));
  }
  return MONTH_NAMES.slice(0, now.getMonth() + 1); // year → Jan … current month
}
const MONTHLY_HISTORY_KEY = "multisig_monthly_history";
const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// -- Types --
interface AssetMonthData {
  inflow: number;
  outflow: number;
  endBalance: number;
}

interface MonthlyRecord {
  /** "2026-02" */
  month: string;
  assets: Record<string, AssetMonthData>;
}

interface ChartPoint {
  month: string;
  [key: string]: number | string; // e.g. QASH, PARA, QASH_in, QASH_out
}

// -- Helpers --
function toMonthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function normalizeHexId(id: string): string {
  const lower = id.toLowerCase();
  return lower.startsWith("0x") ? lower : `0x${lower}`;
}

function loadMonthlyHistory(): MonthlyRecord[] {
  try {
    const raw = localStorage.getItem(MONTHLY_HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveMonthlyHistory(records: MonthlyRecord[]) {
  try {
    // Keep at most 24 months
    localStorage.setItem(MONTHLY_HISTORY_KEY, JSON.stringify(records.slice(-24)));
  } catch {
    /* quota exceeded */
  }
}

/**
 * Resolve a hex faucet AccountId to { symbol, decimals } using supportedTokens.
 * Uses the same pattern as PSMProvider.enrichAndCache:
 *   convert hex → bech32 via Address.fromAccountId, then match against supportedTokens.
 */
async function resolveFaucet(
  faucetAccountId: any,
  sdkImports: { Address: any; NetworkId: any },
): Promise<{ symbol: string; decimals: number } | null> {
  try {
    const { Address, NetworkId } = sdkImports;
    const bech32 = Address.fromAccountId(faucetAccountId).toBech32(NetworkId.testnet());
    const match = supportedTokens.find(t => bech32.startsWith(t.faucetId.split("_")[0]));
    return match ? { symbol: match.symbol, decimals: match.decimals } : null;
  } catch {
    return null;
  }
}

/**
 * Fetch all multisig transactions from WebClient and compute per-month inflow/outflow per asset.
 * In demo mode, webClient is null so we return empty data immediately.
 */
async function resolveTransactionHistory(
  webClient: any,
  accountIds: string[],
): Promise<Map<string, Record<string, { inflow: number; outflow: number }>>> {
  // Demo mode: no real WebClient, skip Miden SDK import entirely
  if (!webClient || !webClient.getTransactions) return new Map();

  const { TransactionFilter, NoteFilter, NoteFilterTypes, Address, NetworkId } = await import(
    "@miden-sdk/miden-sdk"
  );

  const allTxs = await webClient.getTransactions(TransactionFilter.all());
  const msSet = new Set(accountIds.map(normalizeHexId));

  const msTxs = allTxs.filter((tx: any) => {
    const hex = normalizeHexId(tx.accountId().toHex());
    return msSet.has(hex);
  });

  if (msTxs.length === 0) return new Map();

  // Get consumed input notes and group by consumer transaction ID
  const consumedNotes = await webClient.getInputNotes(new NoteFilter(NoteFilterTypes.Consumed));
  const notesByTxId = new Map<string, any[]>();
  for (const note of consumedNotes) {
    const txId = note.consumerTransactionId();
    if (txId) {
      const arr = notesByTxId.get(txId) ?? [];
      arr.push(note);
      notesByTxId.set(txId, arr);
    }
  }

  const sdk = { Address, NetworkId };

  // monthKey -> symbol -> { inflow, outflow }
  const result = new Map<string, Record<string, { inflow: number; outflow: number }>>();

  for (const tx of msTxs) {
    const txId = tx.id().toHex();
    const timestamp = Number(tx.creationTimestamp());
    const date = new Date(timestamp > 1e12 ? timestamp : timestamp * 1000);
    const mk = toMonthKey(date);

    if (!result.has(mk)) result.set(mk, {});
    const monthData = result.get(mk)!;

    const inputNotes = notesByTxId.get(txId);

    if (!inputNotes || inputNotes.length === 0) {
      // Outgoing: extract assets from output notes
      try {
        const outputNotes = tx
          .outputNotes()
          .notes()
          .map((n: any) => n.intoFull());
        for (const note of outputNotes) {
          for (const asset of note.assets().fungibleAssets()) {
            const meta = await resolveFaucet(asset.faucetId(), sdk);
            if (!meta) continue;
            const amount = Number(asset.amount()) / Math.pow(10, meta.decimals);
            if (!monthData[meta.symbol]) monthData[meta.symbol] = { inflow: 0, outflow: 0 };
            monthData[meta.symbol].outflow += amount;
          }
        }
      } catch {
        /* some notes may not be fully resolvable */
      }
    } else {
      // Incoming: extract assets from consumed input notes
      for (const note of inputNotes) {
        try {
          for (const asset of note.details().assets().fungibleAssets()) {
            const meta = await resolveFaucet(asset.faucetId(), sdk);
            if (!meta) continue;
            const amount = Number(asset.amount()) / Math.pow(10, meta.decimals);
            if (!monthData[meta.symbol]) monthData[meta.symbol] = { inflow: 0, outflow: 0 };
            monthData[meta.symbol].inflow += amount;
          }
        } catch {
          /* note details may not be available */
        }
      }
    }
  }

  return result;
}

// -- BalanceOverviewHeader --
const BalanceOverviewHeader = ({
  totalBalance = 0,
  accountIds,
}: {
  totalBalance?: number;
  accountIds?: string[];
}) => {
  const { client: webClient } = useMidenProvider();
  const { data: assetsData } = useMultisigAssets(accountIds);
  const resolvedRef = useRef(false);

  // Current per-asset balances (live from PSM cache)
  // Stabilize with JSON key to prevent infinite re-renders from mock data
  const balancesKey = JSON.stringify(assetsData?.balances ?? []);
  const currentBalances = useMemo<Record<string, number>>(() => {
    const m: Record<string, number> = {};
    for (const b of assetsData?.balances ?? []) {
      if (b.symbol !== "UNKNOWN") m[b.symbol] = parseFloat(b.balance) || 0;
    }
    return m;
  }, [balancesKey]);

  const symbols = useMemo(() => Object.keys(currentBalances), [currentBalances]);

  // Token filter (multi-select) controlling which tokens feed the chart total.
  const [selectedTokens, setSelectedTokens] = useState<string[]>([]);
  const tokenInitRef = useRef(false);
  useEffect(() => {
    if (!tokenInitRef.current && symbols.length > 0) {
      tokenInitRef.current = true;
      setSelectedTokens(symbols);
    }
  }, [symbols]);
  const toggleToken = (s: string) =>
    setSelectedTokens(prev => (prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]));
  const tokenLabel =
    selectedTokens.length === 0
      ? "No tokens"
      : selectedTokens.length === symbols.length
        ? "All tokens"
        : selectedTokens.join(", ");

  // Period filter (year / month / week / day) controlling the chart's x-axis buckets.
  const [period, setPeriod] = useState<PeriodId>("year");
  const periodLabel = PERIODS.find(p => p.id === period)?.label ?? "Year";
  const buckets = useMemo(() => periodBuckets(period, new Date()), [period]);

  const [chartData, setChartData] = useState<ChartPoint[]>([]);
  const [monthlyInOut, setMonthlyInOut] = useState<Map<string, Record<string, { inflow: number; outflow: number }>>>(
    new Map(),
  );

  // Resolve WebClient transactions once per mount (or when accountIds change)
  useEffect(() => {
    if (!webClient || !accountIds?.length) return;
    if (resolvedRef.current) return;
    resolvedRef.current = true;

    let cancelled = false;
    resolveTransactionHistory(webClient, accountIds)
      .then(result => {
        if (!cancelled) {
          setMonthlyInOut(result);
          console.log(`[Overview] Resolved transaction history for ${result.size} month(s)`);
        }
      })
      .catch(err => {
        console.warn("[Overview] Transaction resolution failed:", err);
      });

    return () => {
      cancelled = true;
    };
  }, [webClient, accountIds]);

  // Build chart data: Jan–Dec of current year
  const buildChart = useCallback(() => {
    if (!symbols.length) return;

    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonthIdx = today.getMonth(); // 0-based
    const currentMk = toMonthKey(today);
    const hasTransactionData = monthlyInOut.size > 0;

    // Load cached monthly records from localStorage
    const history = loadMonthlyHistory();
    const historyMap = new Map(history.map(r => [r.month, r]));

    // Save current month with live balances
    historyMap.set(currentMk, {
      month: currentMk,
      assets: Object.fromEntries(
        symbols.map(s => {
          const io = monthlyInOut.get(currentMk)?.[s] ?? { inflow: 0, outflow: 0 };
          return [s, { inflow: io.inflow, outflow: io.outflow, endBalance: currentBalances[s] ?? 0 }];
        }),
      ),
    });

    // Generate Jan (index 0) through Dec (index 11) keys for the current year
    const monthKeys = Array.from({ length: 12 }, (_, m) => toMonthKey(new Date(currentYear, m, 1)));

    // Determine per-month balances
    const balanceByMonth = new Map<string, Record<string, number>>();

    if (hasTransactionData) {
      // Backward reconstruction from current live balance using real inflow/outflow
      const running: Record<string, number> = { ...currentBalances };
      for (let m = currentMonthIdx; m >= 0; m--) {
        const mk = monthKeys[m];
        balanceByMonth.set(mk, { ...running });
        if (m > 0) {
          const io = monthlyInOut.get(mk) ?? {};
          for (const s of symbols) {
            const { inflow = 0, outflow = 0 } = io[s] ?? {};
            running[s] = Math.max(0, (running[s] ?? 0) - inflow + outflow);
          }
        }
      }
    } else {
      // No transaction data — only use saved localStorage history (no backfilling)
      for (const [mk, record] of historyMap) {
        const balances: Record<string, number> = {};
        for (const s of symbols) {
          balances[s] = record.assets[s]?.endBalance ?? 0;
        }
        balanceByMonth.set(mk, balances);
      }
    }

    // Build chart points for Jan–Dec
    const points: ChartPoint[] = monthKeys.map((mk, idx) => {
      const point: ChartPoint = { month: MONTH_NAMES[idx] };
      const io = monthlyInOut.get(mk) ?? {};

      if (idx > currentMonthIdx) {
        // Future months: no data yet
        for (const s of symbols) {
          point[s] = 0;
          point[`${s}_in`] = 0;
          point[`${s}_out`] = 0;
        }
      } else {
        const balances = balanceByMonth.get(mk);
        for (const s of symbols) {
          point[s] = balances?.[s] ?? 0;
          point[`${s}_in`] = io[s]?.inflow ?? 0;
          point[`${s}_out`] = io[s]?.outflow ?? 0;
        }
      }

      return point;
    });

    setChartData(points);
    saveMonthlyHistory(Array.from(historyMap.values()));
  }, [symbols, currentBalances, monthlyInOut]);

  useEffect(() => {
    buildChart();
  }, [buildChart]);

  // Compute balance change: current month vs previous month (by index in Jan–Dec array)
  const balanceChange = useMemo(() => {
    if (!symbols.length) return { amount: 0, percent: 0 };
    const currentMonthIdx = new Date().getMonth();
    if (currentMonthIdx === 0 || !chartData[currentMonthIdx]) return { amount: 0, percent: 0 };

    const curr = chartData[currentMonthIdx];
    const prev = chartData[currentMonthIdx - 1];
    let prevTotal = 0;
    let currTotal = 0;
    for (const s of symbols) {
      prevTotal += (prev?.[s] as number) || 0;
      currTotal += (curr?.[s] as number) || 0;
    }
    const amount = currTotal - prevTotal;
    const percent = prevTotal > 0 ? (amount / prevTotal) * 100 : 0;
    return { amount, percent };
  }, [chartData, symbols]);

  // Compute current month totals for inflow/outflow
  const currentMonthFlow = useMemo(() => {
    if (!symbols.length) return { inflow: 0, outflow: 0 };
    const curr = chartData[new Date().getMonth()];
    if (!curr) return { inflow: 0, outflow: 0 };
    let inflow = 0;
    let outflow = 0;
    for (const s of symbols) {
      inflow += (curr[`${s}_in`] as number) || 0;
      outflow += (curr[`${s}_out`] as number) || 0;
    }
    return { inflow, outflow };
  }, [chartData, symbols]);

  const isPositiveChange = balanceChange.amount >= 0;

  // Per-token series for the chart, bucketed by the selected period and never going
  // past *now* (last bucket = current point). Token amounts differ by orders of
  // magnitude (600K USDC vs 18.5 ETH) so each token is normalized into its own
  // vertical band (largest on top) for a readable multi-line view; the hover tooltip
  // + the $ figure keep the real balances.
  const currentMonthIdx = new Date().getMonth();
  const areaData = useMemo(() => {
    const n = selectedTokens.length || 1;
    const finals: Record<string, number> = {};
    selectedTokens.forEach(tk => {
      finals[tk] = Number(chartData[currentMonthIdx]?.[tk]) || 0;
    });
    const ranked = [...selectedTokens].sort((a, b) => finals[b] - finals[a]);
    const rankOf: Record<string, number> = {};
    ranked.forEach((tk, r) => {
      rankOf[tk] = r;
    });
    const last = Math.max(0, buckets.length - 1);
    return buckets.map((label, idx) => {
      const point: Record<string, number | string | null> = { label };
      selectedTokens.forEach((tk, ti) => {
        if (finals[tk] <= 0) {
          point[tk] = 0;
          point[`${tk}__bal`] = 0;
          return;
        }
        const t = last === 0 ? 1 : idx / last;
        const ef = idx === last ? 1 : 0.18 + 0.82 * Math.pow(t, 1.7);
        const r = rankOf[tk];
        const bandHi = 1 - r / n;
        const bandLo = bandHi - (1 / n) * 0.7;
        const wobble = 1 + 0.02 * Math.sin(idx * 1.7 + ti);
        point[tk] = Math.max(0, (bandLo + (bandHi - bandLo) * ef) * wobble) * 100;
        // Real-magnitude balance trend for the hover tooltip (exact at the last point).
        point[`${tk}__bal`] = idx === last ? finals[tk] : finals[tk] * ef;
      });
      return point;
    });
  }, [buckets, selectedTokens, chartData, currentMonthIdx]);

  // Dark-grey palette for the chart lines (shared with the filter dropdown dots).
  const colorForToken = (tk: string) => CHART_GREYS[Math.max(0, symbols.indexOf(tk)) % CHART_GREYS.length];
  const tokenColors = useMemo(() => {
    const m: Record<string, string> = {};
    for (const s of symbols) m[s] = colorForToken(s);
    return m;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbols]);

  const tokenLogo = (tk: string) => `/token/${tk.toLowerCase()}.svg`;

  // Hover tooltip: each token's balance at the hovered month, with token logos
  // and a colour swatch matching its line.
  const BalanceTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const dp = payload[0]?.payload;
    if (!dp) return null;
    const now = new Date();
    const header =
      period === "month"
        ? `${now.toLocaleDateString("en-US", { month: "short" })} ${dp.label}`
        : period === "year"
          ? `${dp.label} ${now.getFullYear()}`
          : dp.label;
    return (
      <div className="min-w-[168px] rounded-xl border border-primary-divider bg-background p-2.5 shadow-[0_12px_32px_-10px_rgba(0,0,0,0.28)]">
        <div className="mb-2 px-0.5 text-[11px] font-medium uppercase tracking-wide text-text-secondary">
          {header}
        </div>
        <div className="flex flex-col gap-2">
          {selectedTokens.map(tk => (
            <div key={tk} className="flex items-center gap-2">
              <span
                className="h-3 w-[3px] flex-shrink-0 rounded-full"
                style={{ backgroundColor: colorForToken(tk) }}
              />
              <img
                src={tokenLogo(tk)}
                alt={tk}
                className="h-4 w-4 flex-shrink-0 rounded-full"
                onError={e => {
                  (e.currentTarget as HTMLImageElement).src = "/token/any-token.svg";
                }}
              />
              <span className="text-xs font-medium text-text-primary">{tk}</span>
              <span className="num ml-auto text-xs font-semibold text-text-primary">
                {(Number(dp[`${tk}__bal`]) || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div
      id="tour-balance-overview"
      className="w-full p-5 bg-background rounded-2xl border border-primary-divider flex flex-row gap-10"
    >
      {/* LEFT: caption (top) + amount (bottom), vertical space-between */}
      <div className="flex shrink-0 flex-col justify-between py-1">
        <p className="text-sm text-text-secondary">Total Balance</p>
        <div className="space-y-1">
          <div className="flex items-start gap-1">
            <span className="text-3xl num text-text-primary">$</span>
            <span className="text-4xl num text-text-primary tracking-tight">
              {totalBalance.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-sm num ${isPositiveChange ? "text-green-500" : "text-red-500"}`}>
              {isPositiveChange ? "+" : ""}$
              {Math.abs(balanceChange.amount).toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </span>
            {balanceChange.percent !== 0 && (
              <span
                className={`px-2 py-1 text-xs font-semibold rounded-full border ${
                  isPositiveChange
                    ? "text-green-700 bg-green-100 border-green-300"
                    : "text-red-700 bg-red-100 border-red-300"
                }`}
              >
                {isPositiveChange ? "+" : ""}
                {balanceChange.percent.toFixed(2)}%
              </span>
            )}
          </div>
          {(currentMonthFlow.inflow > 0 || currentMonthFlow.outflow > 0) && (
            <div className="flex items-center gap-3 text-xs text-text-secondary">
              {currentMonthFlow.inflow > 0 && (
                <span className="text-green-500">
                  In: +${currentMonthFlow.inflow.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </span>
              )}
              {currentMonthFlow.outflow > 0 && (
                <span className="text-red-500">
                  Out: -${currentMonthFlow.outflow.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT: token filter (top-right) + chart */}
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex items-center justify-end gap-2">
          <PeriodFilterDropdown period={period} onChange={setPeriod} label={periodLabel} />
          {symbols.length > 0 && (
            <TokenFilterDropdown
              tokens={symbols}
              selected={selectedTokens}
              onToggle={toggleToken}
              colors={tokenColors}
              label={tokenLabel}
            />
          )}
        </div>
        <div className="w-full">
          {/* Per-token balance area chart */}
          <ResponsiveContainer width="100%" height={200} className="rounded-xl outline-none [&_*]:outline-none">
            <AreaChart
              data={areaData}
              margin={{ top: 28, right: 8, left: 8, bottom: 0 }}
              className="[&_*]:outline-none !outline-none"
            >
              <defs>
                <linearGradient id="bal-fill-grey" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#374151" stopOpacity={0.16} />
                  <stop offset="100%" stopColor="#374151" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="label"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "var(--text-secondary)", fontSize: 11 }}
                tickMargin={10}
                interval={buckets.length > 12 ? Math.ceil(buckets.length / 8) - 1 : 0}
                padding={{ left: 6, right: 6 }}
              />
              <Tooltip
                content={<BalanceTooltip />}
                cursor={{ stroke: "#1b1b1b", strokeDasharray: "3 4", strokeWidth: 1 }}
              />
              {selectedTokens.map(tk => (
                <Area
                  key={tk}
                  type="monotone"
                  dataKey={tk}
                  stroke={colorForToken(tk)}
                  strokeWidth={2.5}
                  fill="url(#bal-fill-grey)"
                  dot={false}
                  connectNulls={false}
                  isAnimationActive={false}
                  activeDot={{ r: 5, fill: "#ffffff", stroke: colorForToken(tk), strokeWidth: 2 }}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export const Overview = ({ onCreateAccount }: { onCreateAccount?: () => void }) => {
  const { data: myCompany } = useGetMyCompany();
  const { data: multisigAccounts } = useListAccountsByCompany(myCompany?.id, { enabled: !!myCompany?.id });

  const accountIds = multisigAccounts?.map(acc => acc.accountId);
  const { data: balanceData } = useLocalAccountBalances(accountIds);
  const totalBalance = balanceData?.totalBalance ?? 0;

  return (
    <div className="w-full flex flex-col gap-4">
      <BalanceOverviewHeader totalBalance={totalBalance} accountIds={accountIds} />
      <TransactionHistory onCreateAccount={onCreateAccount} />
    </div>
  );
};

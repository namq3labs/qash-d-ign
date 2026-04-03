/** Normalize legacy "QASH" symbols stored in DB to display as "USDT" */
export function n(symbol: string | undefined | null): string {
  if (!symbol) return "USDT";
  return symbol.toUpperCase() === "QASH" ? "USDT" : symbol;
}

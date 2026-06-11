"use client";
import React, { useEffect, useState } from "react";
import { formatUnits } from "viem";
import { MultisigProposalResponseDto } from "@qash/types/dto/multisig";
import { MultisigProposalStatusEnum } from "@qash/types/enums";
import { useGetConsumableNotes } from "@/services/api/multisig";
import { supportedTokens } from "@/services/utils/supportedToken";
import { formatAddress } from "@/services/utils/miden/address";
import { useMidenProvider } from "@/contexts/MidenProvider";
import { getFaucetMetadata } from "@/services/utils/miden/faucet";
import { usePSMProvider } from "@/contexts/PSMProvider";
import { QASH_TOKEN_HEX_ADDRESS, QASH_TOKEN_SYMBOL, QASH_TOKEN_DECIMALS } from "@/services/utils/constant";

/**
 * Renders the token logo + amount for a multisig proposal inside a table cell.
 * Encapsulates the (hook-based) token metadata resolution that previously lived
 * in ProposalRow so the Transactions table can map proposals to rows.
 */
export function ProposalAmountCell({ proposal }: { proposal: MultisigProposalResponseDto }) {
  const { client: midenClient } = useMidenProvider();
  const { accountCacheMap } = usePSMProvider();
  const status = proposal.status as MultisigProposalStatusEnum;

  const isHistoryProposal =
    status === MultisigProposalStatusEnum.EXECUTED ||
    status === MultisigProposalStatusEnum.FAILED ||
    status === MultisigProposalStatusEnum.CANCELLED;

  // Keep the consumable-notes query warm for live CONSUME proposals (parity with old ProposalRow)
  useGetConsumableNotes(proposal.accountId, {
    enabled: proposal.proposalType === "CONSUME" && !isHistoryProposal,
  });

  const faucetId = proposal.tokens?.[0]?.address || "";
  const token = proposal.tokens?.[0];
  const [faucetMeta, setFaucetMeta] = useState<{ symbol: string; decimals: number } | null>(null);

  const accountKey = proposal.accountId
    ? proposal.accountId.toLowerCase().startsWith("0x")
      ? proposal.accountId.toLowerCase()
      : `0x${proposal.accountId}`.toLowerCase()
    : "";
  const accountCache = accountKey ? accountCacheMap.get(accountKey) : undefined;
  const enrichedMatch = accountCache?.enrichedBalances.find(eb => eb.faucetId.toLowerCase() === faucetId.toLowerCase());

  const knownToken = enrichedMatch
    ? supportedTokens.find(t => enrichedMatch.faucetBech32.startsWith(t.faucetId.split("_")[0]))
    : undefined;

  useEffect(() => {
    if (!midenClient || !faucetId || enrichedMatch?.symbol) return;
    let cancelled = false;
    getFaucetMetadata(midenClient, faucetId)
      .then(meta => {
        if (!cancelled) setFaucetMeta(meta);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [midenClient, faucetId, enrichedMatch?.symbol]);

  const isQashByHex = faucetId.toLowerCase().replace(/^0x/, "") === QASH_TOKEN_HEX_ADDRESS.toLowerCase().replace(/^0x/, "");
  const isHexLike = (s: string) => /^0x[0-9a-fA-F]+$/.test(s);
  const sanitizedTokenSymbol = token?.symbol && !isHexLike(token.symbol) ? token.symbol : "";

  const resolvedSymbol = isQashByHex
    ? QASH_TOKEN_SYMBOL
    : enrichedMatch?.symbol || faucetMeta?.symbol || sanitizedTokenSymbol || "";
  const tokenIsQash = isQashByHex || resolvedSymbol.toUpperCase() === "USDT";

  const matchedSupportedToken = resolvedSymbol
    ? supportedTokens.find(t => t.symbol.toUpperCase() === resolvedSymbol.toUpperCase())
    : undefined;

  const tokenSymbol = matchedSupportedToken?.symbol || resolvedSymbol;
  const tokenDecimals = isQashByHex
    ? QASH_TOKEN_DECIMALS
    : matchedSupportedToken?.decimals ?? enrichedMatch?.decimals ?? faucetMeta?.decimals ?? token?.decimals ?? 0;
  const tokenLogo = tokenIsQash
    ? "/token/usdt.svg"
    : knownToken
      ? `/token/${knownToken.symbol.toLowerCase()}.svg`
      : matchedSupportedToken
        ? `/token/${matchedSupportedToken.symbol.toLowerCase()}.svg`
        : "/token/any-token.svg";
  const displayAmount = token?.amount
    ? (() => {
        try {
          return formatUnits(BigInt(token.amount), tokenDecimals);
        } catch {
          return "-";
        }
      })()
    : "-";

  if (proposal.proposalType === "CONFIG" || (!token && displayAmount === "-")) {
    return <span className="text-sm text-text-secondary">N/A</span>;
  }

  return (
    <div className="flex items-center justify-center gap-2">
      <img
        src={tokenLogo}
        alt={tokenSymbol || "Token"}
        className="w-5 h-5"
        onError={e => {
          (e.target as HTMLImageElement).src = "/token/any-token.svg";
        }}
      />
      <span className="text-sm font-medium text-text-primary whitespace-nowrap">
        {displayAmount} {tokenSymbol || formatAddress(faucetId)}
      </span>
    </div>
  );
}

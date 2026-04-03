// Demo mode: mock multisig API hooks
import { useDemo } from "@/contexts/DemoProvider";
import { QASH_TOKEN_HEX_ADDRESS } from "@/services/utils/constant";

// Type stubs for compatibility
export interface ConsumableNoteAsset {
  faucet_id: string;
  faucet_bech32: string;
  symbol: string;
  decimals: number;
  amount: number | string;
}

export interface ConsumableNote {
  note_id: string;
  assets: ConsumableNoteAsset[];
  sender: string;
  note_type: string;
}

// Async function stubs (no-ops in demo)
export const createMultisigAccount = async () => ({});
export const getMultisigAccount = async () => ({});
export const listAccountsByCompany = async () => [];
export const getAccountMembers = async () => ({ members: [] });
export const createConsumeProposal = async () => ({});
export const createSendProposal = async () => ({});
export const createBatchSendProposal = async () => ({});
export const createProposalFromBills = async () => ({});
export const getProposal = async () => ({});
export const listProposals = async () => [];
export const listProposalsByCompany = async () => [];
export const submitSignature = async () => ({});
export const submitRejection = async () => ({});
export const markProposalExecuted = async () => ({});
export const cancelProposal = async () => ({});
export const createTestCompany = async () => ({});

// ─── React Query Hook Mocks ─────────────────────────────────────────────────

export function useCreateMultisigAccount() {
  const { addAccount } = useDemo();
  return {
    mutateAsync: async (params: {
      accountId?: string;
      name: string;
      description?: string;
      teamMemberIds: string[];
      threshold: number;
      companyId: number;
      logo?: string;
      members?: { name: string; commitment: string; role: string }[];
      thresholdControl?: { amountThreshold: number; highSigners: number; lowSigners: number };
    }) => {
      const accountId = params.accountId || `0x${Date.now().toString(16)}`;
      const id = `acc-${Date.now()}`;
      const account = {
        id,
        uuid: id,
        accountId,
        name: params.name,
        description: params.description || "",
        threshold: params.threshold,
        companyId: params.companyId,
        logo: params.logo || null,
        publicKeys: (params.members || []).map(m => m.commitment),
        members: params.members || [],
        thresholdControl: params.thresholdControl,
        createdAt: new Date().toISOString(),
      };
      addAccount(account);
      return { accountId };
    },
    mutate: () => {},
    isPending: false,
    isError: false,
  };
}

export function useUpdateMultisigAccount() {
  const { updateAccount } = useDemo();
  return {
    mutateAsync: async (accountId: string, updates: Record<string, any>) => {
      updateAccount(accountId, updates);
      return { success: true };
    },
    mutate: () => {},
    isPending: false,
    isError: false,
  };
}

export function useGetMultisigAccount(_accountId?: string, _options?: any) {
  const { data } = useDemo();
  const account = data?.accounts.find(a => a.accountId === _accountId);
  return { data: account, isLoading: false, isError: false, error: null };
}

export function useListAccountsByCompany(_companyId?: number, _options?: any) {
  const { data, isLoaded } = useDemo();
  return {
    data: data?.accounts ?? [],
    isLoading: !isLoaded,
    isError: false,
    error: null,
    refetch: async () => {},
  };
}

export function useGetConsumableNotes(_accountId?: string, _options?: any) {
  return { data: { notes: [] }, isLoading: false, refetch: async () => {} };
}

export function useLocalAccountBalances(_accountIds?: string[], _options?: any) {
  const { data } = useDemo();
  if (!data || !_accountIds?.length) {
    return { data: { totalBalance: 0, accounts: [] }, isLoading: false };
  }

  const accounts = _accountIds.map(id => {
    const balances = data.balances[id] || [];
    const balance = balances.reduce((sum: number, b: any) => sum + (b.usdValue ?? b.amount), 0);
    return { accountId: id, balance };
  });
  const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0);

  return { data: { totalBalance, accounts }, isLoading: false };
}

export function useMultisigAssets(_accountIds?: string[], _options?: any) {
  const { data } = useDemo();
  if (!data || !_accountIds?.length) {
    return { data: { balances: [], totalUsd: 0 }, isLoading: false };
  }

  // Aggregate balances by faucetId to avoid duplicate keys
  const assetMap = new Map<string, { amount: number; decimals: number; symbol: string }>();
  for (const id of _accountIds) {
    const balances = data.balances[id] || [];
    for (const b of balances) {
      const existing = assetMap.get(b.faucetId);
      if (existing) {
        existing.amount += b.amount;
      } else {
        assetMap.set(b.faucetId, { amount: b.amount, decimals: b.decimals, symbol: b.symbol });
      }
    }
  }

  const allBalances = Array.from(assetMap.entries()).map(([faucetId, v]) => ({
    assetId: faucetId,
    balance: v.amount.toString(),
    decimals: v.decimals,
    symbol: v.symbol,
  }));
  const totalUsd = allBalances.reduce((sum, b) => sum + (parseFloat(b.balance) || 0), 0);
  return { data: { balances: allBalances, totalUsd }, isLoading: false };
}

export function useGetAccountMembers(_accountId?: string, _options?: any) {
  const { data } = useDemo();
  const account = data?.accounts.find(a => a.accountId === _accountId);
  return { data: { members: account?.members ?? [] }, isLoading: false, isError: false };
}

export function useMintTokens() {
  return { mutateAsync: async () => ({ transactionId: "demo-tx" }), mutate: () => {}, isPending: false };
}

export function useCreateConsumeProposal() {
  return { mutateAsync: async () => ({}), mutate: () => {}, isPending: false };
}

export function useCreateSendProposal() {
  return { mutateAsync: async () => ({}), mutate: () => {}, isPending: false };
}

export function useCreateBatchSendProposal() {
  return { mutateAsync: async () => ({}), mutate: () => {}, isPending: false };
}

export function useCreateProposalFromBills() {
  return { mutateAsync: async () => ({}), mutate: () => {}, isPending: false };
}

export function useGetProposal(_proposalId?: number | string, _options?: any) {
  const { data } = useDemo();
  if (!_proposalId || !data?.pendingProposals) {
    return { data: undefined, isLoading: false, isError: false, refetch: async () => {} };
  }

  const idStr = String(_proposalId);
  const p = data.pendingProposals.find(p => p.id === idStr || p.id === `prop-${idStr.padStart(3, "0")}`);
  if (!p) {
    return { data: undefined, isLoading: false, isError: false, refetch: async () => {} };
  }

  const account = data.accounts.find(a => a.accountId === p.accountId);
  const members = account?.members ?? [];

  // Build linked items based on proposal category
  const cat = (p as any).proposalCategory || "paying_bill";
  let bills: any[] = [];

  if (cat === "paying_payroll") {
    // Attach employee payroll line items
    const teamMembers = data.teamMembers ?? [];
    bills = teamMembers.map((m: any, idx: number) => ({
      uuid: `payroll-line-${idx}`,
      invoiceNumber: `PAY-${String(idx + 1).padStart(3, "0")}`,
      recipientName: `${m.firstName} ${m.lastName}`,
      amount: String(m.salary),
      paymentToken: { name: "USDT", symbol: "USDT" },
      group: null,
    }));
  } else if (cat === "paying_bill") {
    // Attach vendor invoice line item
    bills = [{
      uuid: "bill-line-001",
      invoiceNumber: "BILL-001",
      recipientName: p.to,
      amount: String(p.amount),
      paymentToken: { name: "USDT", symbol: "USDT" },
      group: null,
    }];
  } else if (cat === "paying_reimbursement") {
    bills = [{
      uuid: "reimb-line-001",
      invoiceNumber: "REIMB-001",
      recipientName: p.to,
      amount: String(p.amount),
      paymentToken: { name: "USDT", symbol: "USDT" },
      group: null,
      isReimbursement: true,
      receiptDetails: {
        employee: p.to,
        description: p.label,
        amount: p.amount,
        category: "Meals",
        date: p.createdAt,
        receiptName: "dinner_receipt.jpg",
      },
    }];
  }

  const proposal = {
    ...p,
    id: _proposalId,
    proposalType: p.type === "CONFIG" ? "CONFIG" : "SEND",
    proposalCategory: cat,
    description: p.label,
    signaturesCount: p.signatures?.length ?? 0,
    threshold: p.requiredSignatures,
    tokens: p.amount > 0
      ? [{ address: QASH_TOKEN_HEX_ADDRESS, symbol: "USDT", decimals: 6, name: "USDT", amount: String(Math.round(p.amount * 1e6)) }]
      : [],
    signatures: (p.signatures ?? []).map(sig => ({
      ...sig,
      approverPublicKey: sig.signer === "Alex Chen" ? "0xabc001" : sig.signer === "Sarah Kim" ? "0xabc002" : "0x000000",
    })),
    approvers: members.map(m => {
      const sig = p.signatures?.find(s => s.signer === m.name);
      return {
        id: m.commitment,
        firstName: m.name.split(" ")[0],
        lastName: m.name.split(" ").slice(1).join(" "),
        publicKey: m.commitment,
        signed: !!sig,
        signature: sig ? { createdAt: sig.signedAt } : null,
      };
    }),
    rejections: [],
    bills,
    noteIds: [],
    recipientId: p.toAddress,
  };

  return { data: proposal, isLoading: false, isError: false, refetch: async () => {} };
}

export function useListProposals(_accountId?: string, _options?: any) {
  const { data } = useDemo();
  const proposals = data?.pendingProposals.filter(p => p.accountId === _accountId) ?? [];
  return { data: proposals, isLoading: false, isError: false, refetch: async () => {} };
}

export function useListProposalsByCompany(_companyId?: number, _options?: any) {
  const { data, isLoaded } = useDemo();
  const proposals = (data?.pendingProposals ?? []).map(p => ({
    ...p,
    proposalType: p.type === "CONFIG" ? "CONFIG" : "SEND",
    proposalCategory: (p as any).proposalCategory || "paying_bill",
    description: p.label,
    signaturesCount: p.signatures?.length ?? 0,
    threshold: p.requiredSignatures,
    tokens: p.amount > 0
      ? [{ address: QASH_TOKEN_HEX_ADDRESS, symbol: "USDT", decimals: 6, name: "USDT", amount: String(Math.round(p.amount * 1e6)) }]
      : [],
    signatures: (p.signatures ?? []).map(sig => ({
      ...sig,
      approverPublicKey: sig.signer === "Alex Chen" ? "0xabc001" : sig.signer === "Sarah Kim" ? "0xabc002" : "0x000000",
    })),
  }));
  return {
    data: proposals,
    isLoading: !isLoaded,
    isError: false,
    error: null,
    refetch: async () => {},
  };
}

export function useSignProposal() {
  return { mutateAsync: async () => ({}), mutate: () => {}, isPending: false };
}

export function useSubmitSignature() {
  return { mutateAsync: async () => ({}), mutate: () => {}, isPending: false };
}

export function useSubmitRejection() {
  return { mutateAsync: async () => ({}), mutate: () => {}, isPending: false };
}

export function useExecuteProposal() {
  return { mutateAsync: async () => ({}), mutate: () => {}, isPending: false };
}

export function useCancelProposal() {
  return { mutateAsync: async () => ({}), mutate: () => {}, isPending: false };
}

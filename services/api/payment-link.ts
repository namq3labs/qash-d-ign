// Demo mode: mock payment link API hooks
import { useDemo } from "@/contexts/DemoProvider";

export function useGetPaymentLinks() {
  const { data, isLoaded } = useDemo();
  return { data: data?.paymentLinks ?? [], isLoading: !isLoaded, isError: false, refetch: async () => {} };
}

export function useGetPaymentLinkByCode(code?: string) {
  const { data } = useDemo();
  const link = data?.paymentLinks.find(pl => pl.code === code);
  return { data: link, isLoading: false, isError: false };
}

export function useGetPaymentLinkByCodeForOwner(code?: string) {
  const { data } = useDemo();
  const link = data?.paymentLinks.find(pl => pl.code === code);
  if (!link) return { data: undefined, isLoading: false, isError: false };
  const transformed = {
    ...link,
    acceptedTokens: [{ symbol: link.currency, address: "0x0", name: link.currency }],
    records: (link.payments || []).map((p: any) => ({
      id: p.id,
      payer: p.payer || "0x0000000000000000",
      payerName: p.payerName || null,
      txid: p.txid || null,
      paymentMethod: p.paymentMethod || "crypto",
      createdAt: p.createdAt || p.paidAt,
    })),
  };
  return { data: transformed, isLoading: false, isError: false };
}

const noopMutation = () => ({
  mutateAsync: async (..._args: any[]) => ({}) as any,
  mutate: () => {},
  isPending: false,
  isError: false,
});

export const useCreatePaymentLink = noopMutation;
export const useRecordPayment = noopMutation;
export const useUpdatePaymentLink = noopMutation;
export const useDeactivatePaymentLink = noopMutation;
export const useActivatePaymentLink = noopMutation;
export const useUpdatePaymentTxid = noopMutation;
export const useUpdatePaymentLinkOrder = noopMutation;
export const useDeletePaymentLinks = noopMutation;

export { useGetPaymentLinks as default };

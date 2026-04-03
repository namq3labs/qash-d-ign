// Demo mode: mock transaction API

const noopMutation = () => ({
  mutateAsync: async (..._args: any[]) => ({}) as any,
  mutate: () => {},
  isPending: false,
  isError: false,
});

export const getConsumable = async () => ({ consumableTxs: [], recallableTxs: [] });
export const getRecallable = async () => ({ data: [] });
export const sendSingleTransaction = async () => ({});
export const sendBatchTransaction = async () => ({});
export const consumeTransactions = async () => ({});
export const consumePublicTransactions = async () => ({});

export const useConsumePublicNotes = noopMutation;
export const useRecallBatch = noopMutation;

export function useTopInteractedWallets() {
  return { data: [], isLoading: false, isError: false };
}

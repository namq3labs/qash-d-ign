// Demo mode: mock bill API hooks
import { useDemo } from "@/contexts/DemoProvider";

export function useGetBills(_query?: any) {
  const { data, isLoaded } = useDemo();

  // Transform demo bills to match the BillModel shape the BillContainer expects
  const bills = (data?.bills ?? []).map(b => ({
    ...b,
    invoice: {
      uuid: b.uuid,
      invoiceNumber: `BILL-${b.id}`,
      fromDetails: { name: b.vendor, companyName: b.vendor },
      total: b.amount,
      paymentToken: { name: "USDT" },
      employee: null,
    },
  }));

  return {
    data: {
      bills,
      pagination: { total: bills.length, page: 1, limit: 10, totalPages: 1 },
    },
    isLoading: !isLoaded,
    isError: false,
    refetch: async () => {},
  };
}

export function useGetBillStats() {
  const { data, isLoaded } = useDemo();
  return { data: data?.billStats, isLoading: !isLoaded, isError: false };
}

export function usePayBills() {
  return { mutateAsync: async () => ({}), mutate: () => {}, isPending: false };
}

export function useUpdateBillStatus() {
  return { mutateAsync: async () => ({}), mutate: () => {}, isPending: false };
}

export function useDeleteBill() {
  return { mutateAsync: async () => ({}), mutate: () => {}, isPending: false };
}

export function useGetBillDetail(uuid?: string, _options?: any) {
  const { data } = useDemo();
  const bill = data?.bills.find(b => b.uuid === uuid);
  return { data: bill ? { bill, timeline: [] } : undefined, isLoading: false, isError: false };
}

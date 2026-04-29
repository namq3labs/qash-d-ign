// Demo mode: mock payroll API hooks
import { useDemo } from "@/contexts/DemoProvider";

export function useGetPayrolls(_query?: any) {
  const { data, isLoaded } = useDemo();

  // Transform demo batch payrolls into per-employee payroll records
  // matching the PayrollModel shape the PayrollContainer expects
  const payrolls = (data?.teamMembers ?? []).map((member, idx) => ({
    id: idx + 1,
    uuid: `payroll-${member.uuid}`,
    employee: {
      id: member.id,
      name: `${member.firstName} ${member.lastName}`,
      groupId: 1,
    },
    token: { symbol: "USDT", decimals: 6 },
    amount: member.salary,
    paydayDay: 28,
    payrollCycle: 1,
    status: "ACTIVE",
    createdAt: member.joinedAt,
    accountId: "0xa1b2c3d4e5f60002",
    accountName: "Operations",
  }));

  return {
    data: {
      payrolls,
      pagination: { total: payrolls.length, page: 1, limit: 10, totalPages: 1 },
    },
    isLoading: !isLoaded,
    isError: false,
    refetch: async () => {},
  };
}

export { useGetPayrolls as default };

export function useGetPayrollStats() {
  const { data, isLoaded } = useDemo();
  // Merge demo stats with fields the CardContainer expects
  const stats = data?.payrollStats ? {
    ...data.payrollStats,
    totalMonthlyAmount: data.payrollStats.averagePerPayroll ?? 72000,
    nextPayDate: data.payrollStats.nextPayrollDate ?? null,
    totalPayees: data.teamMembers?.length ?? 8,
  } : undefined;
  return { data: stats, isLoading: !isLoaded, isError: false };
}

export function useGetPayrollDetails(id?: number) {
  const { data } = useDemo();

  // First try matching a payroll record from the generated per-employee list
  const employee = data?.employees?.find(e => e.id === id);
  const teamMember = data?.teamMembers?.find(m => m.id === id);

  // Build a payroll-like object from employee data
  const payrollData = employee || teamMember ? (() => {
    const emp = employee || teamMember;
    const name = employee?.name || (teamMember ? `${teamMember.firstName} ${teamMember.lastName}` : "");
    const email = employee?.email || teamMember?.email || "";
    const walletAddress = employee?.walletAddress || teamMember?.walletAddress || "";
    const salary = (teamMember as any)?.salary || 3000;

    return {
      id: id,
      employee: {
        id: id,
        name,
        email,
        walletAddress,
        groupId: employee?.groupId || 1,
      },
      company: { companyName: data?.company?.companyName || "", companyType: data?.company?.industry || "" },
      network: employee?.network || { name: "Miden", chainId: 1 },
      token: employee?.token || { symbol: "USDT", decimals: 6, address: "", name: "USDT" },
      amount: salary,
      paydayDay: 28,
      payStartDate: employee?.createdAt || teamMember?.joinedAt || new Date().toISOString(),
      payrollCycle: 12,
      description: `Monthly salary for ${name}`,
      note: "",
      metadata: { durationUnit: "year" as const, payDay: 28 },
      joiningDate: employee?.createdAt || teamMember?.joinedAt || new Date().toISOString(),
      payEndDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: employee?.createdAt || teamMember?.joinedAt || new Date().toISOString(),
      invoices: Array.from({ length: 6 }, (_, i) => {
        const month = new Date();
        month.setMonth(month.getMonth() - i);
        const isPaid = i > 0;
        const tokenSymbol = employee?.token?.symbol || "USDT";
        return {
          uuid: `inv-${id}-${i}`,
          invoiceNumber: `INV-${String(id).padStart(3, "0")}-${String(6 - i).padStart(3, "0")}`,
          status: isPaid ? "PAID" : "SENT",
          total: salary,
          currency: tokenSymbol,
          createdAt: new Date(month.getFullYear(), month.getMonth(), 1).toISOString(),
          dueDate: new Date(month.getFullYear(), month.getMonth(), 28).toISOString(),
          paidAt: isPaid ? new Date(month.getFullYear(), month.getMonth(), 28).toISOString() : null,
          fromDetails: { name, email },
          paymentToken: employee?.token || { symbol: "USDT" },
        };
      }),
    };
  })() : undefined;

  return { data: payrollData, isLoading: false, isError: false };
}

export function useGetPayrollPendingReviews(_id?: number) {
  return { data: { pending: [] }, isLoading: false, isError: false };
}

export function useCreateSandboxPayroll() {
  return { mutateAsync: async () => ({}), mutate: () => {}, isPending: false };
}

export function useCreatePayroll() {
  return { mutateAsync: async () => ({}), mutate: () => {}, isPending: false };
}

export function useUpdatePayroll() {
  return { mutateAsync: async () => ({}), mutate: () => {}, isPending: false };
}

export function usePausePayroll() {
  return { mutateAsync: async () => ({}), mutate: () => {}, isPending: false };
}

export function useResumePayroll() {
  return { mutateAsync: async () => ({}), mutate: () => {}, isPending: false };
}

export function useDeletePayroll() {
  return { mutateAsync: async () => ({}), mutate: () => {}, isPending: false };
}

// Demo mode: employee API hooks backed by DemoProvider
import { useDemo } from "@/contexts/DemoProvider";
import { useCallback, useState } from "react";

export function useGetAllEmployees(_page?: number, _limit?: number, _options?: any) {
  const { data, isLoaded } = useDemo();
  const employees = data?.employees ?? [];
  return {
    data: {
      data: employees,
      pagination: { total: employees.length, page: 1, limit: 1000, totalPages: 1 },
    },
    isLoading: !isLoaded,
    isError: false,
    refetch: async () => {},
  };
}


export function useGetAllEmployeeGroups(_options?: any) {
  const { data, isLoaded } = useDemo();
  const groups = (data?.employeeGroups ?? []) as any[];
  return { data: groups, isLoading: !isLoaded, isError: false, refetch: async () => {} };
}

export function useSearchEmployees(_search?: string, _groupId?: number, _page?: number, _limit?: number) {
  const { data } = useDemo();
  const employees = data?.employees ?? [];
  return { data: { data: employees, pagination: {} }, isLoading: false };
}

export function useGetEmployeesByGroup(groupId?: number, _page?: number, _limit?: number) {
  const { data } = useDemo();
  const employees = (data?.employees ?? []).filter(e => !groupId || e.groupId === groupId);
  return { data: { data: employees, pagination: {} }, isLoading: false };
}

export function useGetEmployeeStatistics() {
  const { data } = useDemo();
  const total = data?.employees?.length ?? 0;
  return { data: { total, active: total, inactive: 0 }, isLoading: false };
}

export function useGetEmployeeById(id?: number) {
  const { data } = useDemo();
  const emp = data?.employees?.find(e => e.id === id);
  return { data: emp, isLoading: false };
}

export function useCheckEmployeeNameDuplicate() { return { data: { isDuplicate: false }, isLoading: false }; }
export function useCheckEmployeeAddressDuplicate() { return { data: { isDuplicate: false }, isLoading: false }; }
export function useCheckEmployeeGroupExists() { return { data: { exists: false }, isLoading: false }; }

export function useCreateEmployee() {
  const { addEmployee } = useDemo();
  const [isPending, setIsPending] = useState(false);

  const mutateAsync = useCallback(async (payload: any) => {
    setIsPending(true);
    try {
      const now = new Date().toISOString();
      const newEmployee = {
        id: Date.now(),
        name: payload.name,
        walletAddress: payload.walletAddress,
        email: payload.email || "",
        groupId: payload.groupId,
        companyId: 1,
        paymentMethod: payload.paymentMethod || "crypto",
        fiatDetails: payload.fiatDetails ?? null,
        token: payload.token || null,
        network: payload.network || null,
        employeeType: payload.employeeType || "employee",
        isActive: payload.isActive ?? true,
        order: 0,
        createdAt: now,
        updatedAt: now,
      };
      addEmployee(newEmployee);
      return newEmployee;
    } finally {
      setIsPending(false);
    }
  }, [addEmployee]);

  return {
    mutateAsync,
    mutate: mutateAsync,
    isPending,
    isError: false,
  };
}

export function useCreateEmployeeGroup() {
  const { addEmployeeGroup } = useDemo();
  const [isPending, setIsPending] = useState(false);

  const mutateAsync = useCallback(async (payload: any) => {
    setIsPending(true);
    try {
      const now = new Date().toISOString();
      const newGroup = {
        id: Date.now(),
        name: payload.name,
        shape: payload.shape || "CIRCLE",
        color: payload.color || "#35ADE9",
        order: 0,
        companyId: 1,
        createdAt: now,
        updatedAt: now,
      };
      addEmployeeGroup(newGroup);
      return newGroup;
    } finally {
      setIsPending(false);
    }
  }, [addEmployeeGroup]);

  return {
    mutateAsync,
    mutate: mutateAsync,
    isPending,
    isError: false,
  };
}

export function useUpdateEmployee() {
  const { updateEmployee } = useDemo();
  return {
    mutateAsync: async (id: number, updates: any) => { updateEmployee(id, updates); },
    mutate: (id: number, updates: any) => { updateEmployee(id, updates); },
    isPending: false,
    isError: false,
  };
}

export function useUpdateEmployeesOrder() {
  return {
    mutateAsync: async (..._args: any[]) => ({}) as any,
    mutate: () => {},
    isPending: false,
    isError: false,
  };
}

export function useDeleteEmployee() {
  const { deleteEmployee } = useDemo();
  return {
    mutateAsync: async (id: number) => { deleteEmployee(id); },
    mutate: (id: number) => { deleteEmployee(id); },
    isPending: false,
    isError: false,
  };
}

export function useBulkDeleteEmployees() {
  const { bulkDeleteEmployees } = useDemo();
  return {
    mutateAsync: async (ids: number[]) => { bulkDeleteEmployees(ids); },
    mutate: (ids: number[], callbacks?: any) => {
      bulkDeleteEmployees(ids);
      callbacks?.onSuccess?.();
    },
    isPending: false,
    isError: false,
  };
}

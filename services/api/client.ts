// Demo mode: client API hooks backed by DemoProvider
import { useDemo } from "@/contexts/DemoProvider";
import { useCallback, useState } from "react";

export function useGetClients(_params?: any, _options?: any) {
  const { data, isLoaded } = useDemo();
  const clients = (data?.clients ?? []).map((c, idx) => ({ ...c, id: idx + 1 }));
  return {
    data: {
      data: clients,
      pagination: { total: clients.length, page: 1, limit: 1000, totalPages: 1 },
    },
    isLoading: !isLoaded,
    isError: false,
    refetch: async () => {},
  };
}

export function useGetClientById(uuid?: string, _options?: any) {
  const { data } = useDemo();
  const client = data?.clients?.find(c => c.uuid === uuid);
  return { data: client, isLoading: false, isError: false };
}

export function useCreateClient() {
  const { addDemoClient } = useDemo();
  const [isPending, setIsPending] = useState(false);

  const mutateAsync = useCallback(async (payload: any) => {
    setIsPending(true);
    try {
      const now = new Date().toISOString();
      const newClient = {
        uuid: `cl-${Date.now()}`,
        email: payload.email,
        companyName: payload.companyName,
        companyType: payload.companyType,
        country: payload.country,
        city: payload.city,
        address1: payload.address1,
        address2: payload.address2,
        taxId: payload.taxId,
        postalCode: payload.postalCode,
        registrationNumber: payload.registrationNumber,
        createdAt: now,
        updatedAt: now,
      };
      addDemoClient(newClient);
      return newClient;
    } finally {
      setIsPending(false);
    }
  }, [addDemoClient]);

  return {
    mutateAsync,
    mutate: mutateAsync,
    isPending,
    isError: false,
  };
}

export function useUpdateClient() {
  return {
    mutateAsync: async (..._args: any[]) => ({}) as any,
    mutate: () => {},
    isPending: false,
    isError: false,
  };
}

export function useDeleteClient() {
  const { deleteDemoClient } = useDemo();
  return {
    mutateAsync: async (uuid: string) => { deleteDemoClient(uuid); },
    mutate: (uuid: string, callbacks?: any) => {
      deleteDemoClient(uuid);
      callbacks?.onSuccess?.();
    },
    isPending: false,
    isError: false,
  };
}

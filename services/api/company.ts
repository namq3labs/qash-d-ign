// Demo mode: mock company API hooks
import { useDemo } from "@/contexts/DemoProvider";

export function useGetMyCompany(_options?: { enabled?: boolean }) {
  const { data, isLoaded } = useDemo();
  return {
    data: data?.company ?? undefined,
    isLoading: !isLoaded,
    isError: false,
    error: null,
    refetch: async () => {},
  };
}

export function useCreateCompany() {
  return {
    mutateAsync: async () => {},
    mutate: () => {},
    isPending: false,
    isError: false,
  };
}

export function useUpdateCompany() {
  return {
    mutateAsync: async () => {},
    mutate: () => {},
    isPending: false,
    isError: false,
  };
}

export function useDeleteCompany() {
  return {
    mutateAsync: async () => {},
    mutate: () => {},
    isPending: false,
    isError: false,
  };
}

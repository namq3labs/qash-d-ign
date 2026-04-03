// Demo mode: mock address book API hooks
import { useDemo } from "@/contexts/DemoProvider";

const noopMutation = () => ({
  mutateAsync: async (..._args: any[]) => ({}) as any,
  mutate: () => {},
  isPending: false,
  isError: false,
});

export function useGetCategories() {
  const { data, isLoaded } = useDemo();
  return { data: data?.contactCategories ?? [], isLoading: !isLoaded, isError: false };
}

export function useGetAddressBooks() {
  const { data, isLoaded } = useDemo();
  // Group contacts by category
  const grouped = (data?.contactCategories ?? []).map(cat => ({
    ...cat,
    addressBooks: (data?.contacts ?? []).filter(c => c.category === cat.name),
  }));
  return { data: grouped, isLoading: !isLoaded, isError: false, refetch: async () => {} };
}

export const useCreateAddressBook = noopMutation;
export const useCreateCategory = noopMutation;
export const useUpdateCategoryOrder = noopMutation;
export const useUpdateAddressBook = noopMutation;
export const useDeleteAddressBook = noopMutation;
export const useUpdateAddressBookOrder = noopMutation;

export { useGetCategories as default };

// Demo mode: mock notification API hooks

const noopMutation = () => ({
  mutateAsync: async (..._args: any[]) => ({}) as any,
  mutate: () => {},
  isPending: false,
  isError: false,
});

export function useGetNotifications(_page?: number, _limit?: number, _type?: any, _status?: any) {
  return {
    data: { notifications: [], pagination: { total: 0, page: 1, limit: 20, totalPages: 0 } },
    isLoading: false,
    isError: false,
  };
}

export { useGetNotifications as default };

export function useGetNotificationsInfinite(_limit?: number, _type?: any, _status?: any) {
  return {
    data: { pages: [{ notifications: [], pagination: { total: 0 } }] },
    isLoading: false,
    isError: false,
    hasNextPage: false,
    fetchNextPage: async () => {},
    isFetchingNextPage: false,
  };
}

export function useGetUnreadCount() {
  return { data: { count: 0 }, isLoading: false, isError: false };
}

export function useGetNotification(_id?: number, _enabled?: boolean) {
  return { data: null, isLoading: false, isError: false };
}

export const useMarkNotificationAsRead = noopMutation;
export const useMarkNotificationAsUnread = noopMutation;
export const useMarkAllNotificationsAsRead = noopMutation;
export const useDeleteNotification = noopMutation;

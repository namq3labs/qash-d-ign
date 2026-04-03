// Stubbed: socket.io-client removed from dependencies.
// All exports are no-ops that preserve the original interface.

// Minimal Socket stub type
interface Socket {
  on: (event: string, callback: (...args: any[]) => void) => void;
  emit: (event: string, ...args: any[]) => void;
  disconnect: () => void;
  connected: boolean;
}

interface NotificationData {
  id: number;
  title: string;
  message: string;
  type: "SEND" | "CLAIM" | "REFUND" | "BATCH_SEND" | "WALLET_CREATE";
  status: "UNREAD" | "READ";
  metadata?: any;
  actionUrl?: string;
  userId: number;
  createdAt: string;
  updatedAt: string;
  readAt?: string;
}

interface SocketEventData {
  type: string;
  data?: any;
  timestamp: string;
  count?: number;
  notificationId?: number;
}

export const connectWebSocket = (_baseSocketUrl: string): Promise<Socket> => {
  console.warn("WebSocket stubbed out: socket.io-client not available");
  return Promise.reject(new Error("WebSocket not available in demo mode"));
};

export const joinWalletRoom = (_socket: Socket, _walletAddress: string) => {
  // no-op
};

export const leaveWalletRoom = (_socket: Socket) => {
  // no-op
};

export const pingServer = (_socket: Socket) => {
  // no-op
};

export const createNotificationClient = (_baseUrl: string, _walletAddress?: string) => {
  console.warn("Notification client stubbed out: socket.io-client not available");
  return Promise.reject(new Error("WebSocket not available in demo mode"));
};

export type { NotificationData, SocketEventData, Socket };

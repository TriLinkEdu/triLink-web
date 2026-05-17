/**
 * Thin Socket.IO client wrapper for the chat namespace.
 * Handles auth via the same httpOnly cookie + ws-info token handshake,
 * and exposes a focused surface (join, send, on-message, typing, presence).
 */
import { io, type Socket } from "socket.io-client";
import { getApiBase } from "./api";
import { chatWsInfo } from "./admin-api";

export type SocketMessagePayload = {
  id: string;
  conversationId: string;
  text: string | null;
  senderId: string;
  createdAt: string;
  attachments?: Array<{ id: string; url?: string; mime?: string; filename?: string }>;
};

export type SocketTypingPayload = {
  conversationId: string;
  userId: string;
  isTyping: boolean;
};

export type SocketPresencePayload = {
  userId: string;
  online: boolean;
  lastSeen?: string;
};

type Listener<T> = (payload: T) => void;

let socket: Socket | null = null;
let connectPromise: Promise<Socket> | null = null;

const messageListeners = new Set<Listener<SocketMessagePayload>>();
const typingListeners = new Set<Listener<SocketTypingPayload>>();
const presenceListeners = new Set<Listener<SocketPresencePayload>>();

async function ensureSocket(): Promise<Socket> {
  if (socket && socket.connected) return socket;
  if (connectPromise) return connectPromise;

  connectPromise = (async () => {
    let token: string | undefined;
    let url = getApiBase();
    let namespace = "/chat";
    try {
      const info = await chatWsInfo();
      if (info?.url) url = info.url;
      if (info?.namespace) namespace = info.namespace;
      if (info?.token) token = info.token;
    } catch {
      // ws-info isn't strictly required; cookie auth may still work
    }

    const s = io(`${url}${namespace}`, {
      withCredentials: true,
      transports: ["websocket", "polling"],
      auth: token ? { token } : undefined,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    s.on("message", (msg: SocketMessagePayload) => {
      messageListeners.forEach((fn) => {
        try {
          fn(msg);
        } catch {
          /* listener error */
        }
      });
    });
    s.on("typing", (p: SocketTypingPayload) => {
      typingListeners.forEach((fn) => {
        try {
          fn(p);
        } catch {
          /* listener error */
        }
      });
    });
    s.on("presence", (p: SocketPresencePayload) => {
      presenceListeners.forEach((fn) => {
        try {
          fn(p);
        } catch {
          /* listener error */
        }
      });
    });

    socket = s;
    return s;
  })();

  try {
    return await connectPromise;
  } finally {
    connectPromise = null;
  }
}

export async function joinConversation(conversationId: string): Promise<void> {
  const s = await ensureSocket();
  s.emit("join", { conversationId });
}

export async function leaveConversation(conversationId: string): Promise<void> {
  const s = await ensureSocket();
  s.emit("leave", { conversationId });
}

export async function sendSocketMessage(conversationId: string, text: string): Promise<void> {
  const s = await ensureSocket();
  s.emit("message", { conversationId, text });
}

export async function emitTyping(conversationId: string, isTyping: boolean): Promise<void> {
  const s = await ensureSocket();
  s.emit("typing", { conversationId, isTyping });
}

export function onMessage(fn: Listener<SocketMessagePayload>): () => void {
  messageListeners.add(fn);
  void ensureSocket().catch(() => {});
  return () => messageListeners.delete(fn);
}

export function onTyping(fn: Listener<SocketTypingPayload>): () => void {
  typingListeners.add(fn);
  void ensureSocket().catch(() => {});
  return () => typingListeners.delete(fn);
}

export function onPresence(fn: Listener<SocketPresencePayload>): () => void {
  presenceListeners.add(fn);
  void ensureSocket().catch(() => {});
  return () => presenceListeners.delete(fn);
}

export function disconnectChatSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
  messageListeners.clear();
  typingListeners.clear();
  presenceListeners.clear();
}

export function isChatSocketConnected(): boolean {
  return !!socket && socket.connected;
}

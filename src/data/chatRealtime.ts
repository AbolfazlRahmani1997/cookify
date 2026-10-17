/** Client for chat-realtime (unified WebSocket + createRoom). */

import { getChatJwt } from "@/data/client";

export function chatToken(): string {
  return getChatJwt() ?? "";
}

export function chatWsUrl(token: string): string {
  const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${proto}//${window.location.host}/chat/ws?token=${encodeURIComponent(token)}`;
}

export function newMessageId(): string {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
}

export interface ChatQuote {
  id: string;
  text: string;
  username: string;
}

export type ChatMessageKind = "text" | "voice" | "file";

export interface ChatRoomMessage {
  id: string;
  text: string;
  kind: ChatMessageKind;
  clientId: string;
  username: string;
  at: string;
  replyTo?: ChatQuote;
  forwardFrom?: ChatQuote;
  /** Server accepted the send. */
  sent: boolean;
  /** Reached the other person. */
  delivered: boolean;
  seen: boolean;
  edited?: boolean;
}

export async function uploadChatFile(file: Blob, filename: string): Promise<string> {
  const body = new FormData();
  body.append("file", file, filename);
  const res = await fetch(`/chat/files?token=${encodeURIComponent(chatToken())}`, {
    method: "POST",
    body,
  });
  if (!res.ok) throw new Error("آپلود انجام نشد");
  const data = (await res.json()) as { url?: string };
  if (!data.url) throw new Error("آپلود انجام نشد");
  return data.url;
}

export function isImageUrl(url: string): boolean {
  return /\.(png|jpe?g|gif|webp|avif)(\?|$)/i.test(url);
}

export interface ChatRoom {
  id: string;
  name: string;
  memberIds: string[];
  preview: string;
  at: string;
  messages: ChatRoomMessage[];
}

type Listener = (event: Record<string, unknown>) => void;

export class ChatSocket {
  private ws: WebSocket | null = null;
  private listeners = new Set<Listener>();
  private token = "";
  private closed = false;
  private retry: number | null = null;

  connect(token: string) {
    this.closed = false;
    this.token = token;
    this.open();
  }

  private open() {
    if (this.closed || !this.token) return;
    const prev = this.ws;
    this.ws = null;
    prev?.close();
    const ws = new WebSocket(chatWsUrl(this.token));
    this.ws = ws;
    ws.onopen = () => {
      this.listeners.forEach((fn) => {
        try {
          fn({ event_type: "reconnected" });
        } catch {
          /* keep the socket alive */
        }
      });
    };
    ws.onmessage = (ev) => {
      try {
        const data = JSON.parse(String(ev.data)) as Record<string, unknown>;
        this.listeners.forEach((fn) => {
          try {
            fn(data);
          } catch {
            /* keep the socket alive */
          }
        });
      } catch {
        /* ignore non-json */
      }
    };
    ws.onclose = () => {
      if (this.ws !== ws) return;
      this.ws = null;
      if (this.closed) return;
      this.retry = window.setTimeout(() => this.open(), 800);
    };
  }

  close() {
    this.closed = true;
    if (this.retry != null) window.clearTimeout(this.retry);
    this.retry = null;
    this.ws?.close();
    this.ws = null;
  }

  on(fn: Listener) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  send(payload: Record<string, unknown>) {
    const ws = this.ws;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    ws.send(JSON.stringify(payload));
  }
}

export async function createDirectRoom(
  meId: string,
  other: { id: string; name: string },
): Promise<string> {
  const id = `cookify-${[meId, other.id].sort().join("-")}`;
  const res = await fetch("/chat/api/createRoom", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      Id: id,
      Name: other.name,
      Member: [
        { Id: meId, Notification: true, Pin: false },
        { Id: other.id, Notification: true, Pin: false },
      ],
      Owner: [meId],
      Writer: [meId, other.id],
    }),
  });
  if (!res.ok) throw new Error("ساخت گفت‌وگو انجام نشد");
  return id;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

function str(value: unknown): string {
  return value == null ? "" : String(value);
}

export function parseRooms(content: unknown): ChatRoom[] {
  const list = Array.isArray(content) ? content : [];
  return list.map((raw) => {
    const room = asRecord(raw) ?? {};
    const message = asRecord(room.Message) ?? asRecord(room.last_message) ?? {};
    const text = str(message.Content || message.content || room.preview);
    const members = Array.isArray(room.members) ? room.members : Array.isArray(room.Members) ? room.Members : [];
    const at = str(message.CreatedAt || message.created_at || message.createdAt);
    return {
      id: str(room.Id || room.id),
      name: str(room.Name || room.name || "گفت‌وگو"),
      memberIds: members.map((member) => str(asRecord(member)?.Id || asRecord(member)?.id)).filter(Boolean),
      preview: text,
      at,
      messages: [],
    };
  }).filter((room) => room.id);
}

function parseQuote(value: unknown): ChatQuote | undefined {
  const quote = asRecord(value);
  if (!quote) return undefined;
  const text = str(quote.content || quote.Content);
  if (!text) return undefined;
  return {
    id: str(quote.id || quote.ID),
    text,
    username: str(quote.username || quote.Username),
  };
}

export function parseHistory(content: unknown): ChatRoomMessage[] {
  const list = Array.isArray(content) ? content : [];
  return list.map((raw) => {
    const msg = asRecord(raw) ?? {};
    const read = Array.isArray(msg.Read) ? msg.Read.map(str) : [];
    const clientId = str(msg.ClientID || msg.clientId);
    const deliveredTo = Array.isArray(msg.Deliver) ? msg.Deliver.map(str) : [];
    const kindRaw = str(msg.Type || msg.type || msg.message_type).toLowerCase();
    const kind: ChatMessageKind = kindRaw === "voice" || kindRaw === "file" ? kindRaw : "text";
    return {
      id: str(msg.UniqId || msg._id || msg.id),
      text: str(msg.Content || msg.content),
      kind,
      clientId,
      username: str(msg.Username || msg.username),
      at: str(msg.CreatedAt || new Date().toISOString()),
      replyTo: parseQuote(msg.ReplyTo || msg.reply_to),
      forwardFrom: parseQuote(msg.ForwardFrom || msg.forward_from),
      sent: true,
      delivered: deliveredTo.some((id) => id && id !== clientId),
      seen: read.length > 0,
      edited: msg.edited === true || msg.Edited === true,
    };
  }).filter((msg) => msg.id);
}

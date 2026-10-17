import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Check, CheckCheck, ChevronLeft, ChevronRight, ImagePlus, MessageCircle, Mic, Reply, Send, Square, X } from "lucide-react";
import { Avatar } from "@/components/common/Avatar";
import { Button } from "@/components/common/Button";
import { EmptyState } from "@/components/common/EmptyState";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/data/api";
import {
  ChatSocket,
  chatToken,
  createDirectRoom,
  isImageUrl,
  newMessageId,
  parseHistory,
  parseRooms,
  uploadChatFile,
  type ChatQuote,
  type ChatRoom,
  type ChatRoomMessage,
} from "@/data/chatRealtime";
import type { User } from "@/data/types";
import { messageTime } from "@/lib/format";
import { cn } from "@/lib/cn";

function byLatest(a: ChatRoom, b: ChatRoom): number {
  const left = Date.parse(a.at);
  const right = Date.parse(b.at);
  return (Number.isNaN(right) ? 0 : right) - (Number.isNaN(left) ? 0 : left);
}

function dedupeRooms(list: ChatRoom[]): ChatRoom[] {
  const seen = new Set<string>();
  return list.filter((room) => {
    const key = room.memberIds.length
      ? [...room.memberIds].sort().join("-")
      : room.id;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function MessagesPage() {
  const { isLoggedIn, user } = useAuth();
  const [params, setParams] = useSearchParams();
  const meId = String(user.chatId ?? "");
  const [people, setPeople] = useState<User[]>([]);
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [activeId, setActiveId] = useState("");
  const [mobileChat, setMobileChat] = useState(false);
  const [draft, setDraft] = useState("");
  const [replyTo, setReplyTo] = useState<ChatQuote | null>(null);
  const [forwardId, setForwardId] = useState("");
  const [held, setHeld] = useState<ChatRoomMessage | null>(null);
  const [heldBox, setHeldBox] = useState<{ top: number; left: number; width: number } | null>(null);
  const [editingId, setEditingId] = useState("");
  const pressTimer = useRef<number | null>(null);
  const [recording, setRecording] = useState(false);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const [status, setStatus] = useState("در حال اتصال به چت…");
  const [roomsReady, setRoomsReady] = useState(false);
  const [unread, setUnread] = useState<Record<string, number>>({});
  const [typing, setTyping] = useState<Record<string, number>>({});
  const socketRef = useRef<ChatSocket | null>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const activeIdRef = useRef(activeId);
  const mobileChatRef = useRef(mobileChat);
  const meIdRef = useRef(meId);
  const countedRef = useRef(new Set<string>());
  const typingSentRef = useRef(0);
  activeIdRef.current = activeId;
  mobileChatRef.current = mobileChat;
  meIdRef.current = meId;

  useEffect(() => {
    if (!isLoggedIn) return;
    const socket = new ChatSocket();
    socketRef.current = socket;
    const off = socket.on((event) => {
      const type = String(event.event_type ?? "");
      const content = event.content ?? event.Content;
      if (type === "init" || type === "listRooms") {
        if (type === "listRooms" || Array.isArray(content)) setRoomsReady(true);
        const next = dedupeRooms(parseRooms(content));
        if (next.length) {
          setRooms((prev) =>
            next.map((room) => {
              const existing = prev.find((item) => item.id === room.id);
              return existing ? { ...room, messages: existing.messages, preview: existing.preview || room.preview } : room;
            }),
          );
          setActiveId((id) => id || next[0].id);
        }
        setStatus("");
      }
      if (type === "roomHistory") {
        const roomId = String(event.room_id ?? "");
        const messages = parseHistory(content).slice().reverse();
        setRooms((prev) =>
          prev.map((room) =>
            room.id === roomId
              ? {
                  ...room,
                  messages,
                  preview: messages.at(-1)?.text || room.preview,
                  at: messages.at(-1)?.at || room.at,
                }
              : room,
          ),
        );
      }
      if (type === "incomeMessage") {
        const note = (event.Content ?? event.content) as Record<string, unknown> | undefined;
        const roomId = String(note?.room_id ?? "");
        const id = String(note?.message_id ?? "");
        const text = String(note?.content ?? "");
        const kindRaw = String(note?.type ?? "text").toLowerCase();
        const kind = kindRaw === "voice" || kindRaw === "file" ? kindRaw : "text";
        if (!roomId || !id) return;
        const viewing =
          activeIdRef.current === roomId &&
          (window.matchMedia("(min-width: 1024px)").matches || mobileChatRef.current);
        if (!viewing && !countedRef.current.has(id)) {
          countedRef.current.add(id);
          setUnread((prev) => ({ ...prev, [roomId]: (prev[roomId] ?? 0) + 1 }));
        }
        const message: ChatRoomMessage = {
          id,
          text,
          kind,
          clientId: "",
          username: [note?.firstname, note?.lastname].filter(Boolean).join(" "),
          at: new Date().toISOString(),
          sent: true,
          delivered: true,
          seen: false,
        };
        setRooms((prev) => {
          const exists = prev.some((room) => room.id === roomId);
          const apply = (room: ChatRoom): ChatRoom =>
            room.id !== roomId
              ? room
              : {
                  ...room,
                  preview: text,
                  at: message.at,
                  messages: room.messages.some((item) => item.id === id)
                    ? room.messages
                    : [...room.messages, message],
                };
          return exists
            ? prev.map(apply)
            : [...prev, { id: roomId, name: message.username || "گفت‌وگوی جدید", memberIds: [], preview: text, at: message.at, messages: [message] }];
        });
      }
      if (type === "roomMessage") {
        const raw = (event.content ?? event.Content) as Record<string, unknown> | undefined;
        const message: ChatRoomMessage = parseHistory([raw?.content && typeof raw.content === "object" ? raw.content : raw])[0];
        const roomId = String(event.room_id ?? (raw?.RoomID as string) ?? "");
        if (!message || !roomId) return;
        setRooms((prev) => {
          const exists = prev.some((room) => room.id === roomId);
          const apply = (room: ChatRoom): ChatRoom =>
            room.id !== roomId
              ? room
              : {
                  ...room,
                  preview: message.text,
                  at: message.at,
                  messages: room.messages.some((item) => item.id === message.id)
                    ? room.messages.map((item) =>
                        item.id === message.id
                          ? { ...item, sent: true, delivered: item.delivered || message.delivered, seen: item.seen || message.seen }
                          : item,
                      )
                    : [...room.messages, message],
                };
          return exists
            ? prev.map(apply)
            : [
                ...prev,
                {
                  id: roomId,
                  name: "گفت‌وگوی جدید",
                  memberIds: [],
                  preview: message.text,
                  at: message.at,
                  messages: [message],
                },
              ];
        });
      }
      if (type === "deliverMessage") {
        const id = typeof content === "string" ? content : "";
        if (id && id !== "ping") {
          setRooms((prev) =>
            prev.map((room) => ({
              ...room,
              messages: room.messages.map((item) => (item.id === id ? { ...item, sent: true } : item)),
            })),
          );
        }
      }
      if (type === "seenMessage") {
        const body = content && typeof content === "object" ? (content as Record<string, unknown>) : {};
        const messageId = String(body.message_id ?? "");
        const roomId = String(body.room_id ?? event.room_id ?? "");
        if (messageId) {
          setRooms((prev) =>
            prev.map((room) =>
              roomId && room.id !== roomId
                ? room
                : {
                    ...room,
                    messages: room.messages.map((item) =>
                      item.id === messageId ? { ...item, sent: true, delivered: true, seen: true } : item,
                    ),
                  },
            ),
          );
        }
      }
      if (type === "editMessage") {
        const messageId = String(event.message_id ?? "");
        const text = typeof content === "string" ? content : "";
        const roomId = String(event.room_id ?? "");
        if (messageId && text) {
          setRooms((prev) =>
            prev.map((room) =>
              roomId && room.id !== roomId
                ? room
                : {
                    ...room,
                    messages: room.messages.map((item) =>
                      item.id === messageId ? { ...item, text, edited: true } : item,
                    ),
                  },
            ),
          );
        }
      }
      if (type === "createNewRoom" || type === "reconnected") {
        socket.send({ event_type: "listRooms", item: "1" });
        const roomId = activeIdRef.current;
        if (roomId) socket.send({ event_type: "joinRoom", room_id: roomId, page: "1" });
      }
      if (type === "typing") {
        const body = (event.Content ?? event.content) as Record<string, unknown> | undefined;
        const roomId = String(event.room_id ?? body?.room_id ?? "");
        const who = String(event.user_id ?? body?.user_id ?? "");
        if (roomId && who && who !== meIdRef.current) {
          setTyping((prev) => ({ ...prev, [roomId]: Date.now() }));
        }
      }
      if (type === "error") {
        setStatus(String(event.content ?? event.Content ?? "خطای چت"));
      }
    });
    socket.connect(chatToken());
    const waitOpen = window.setInterval(() => {
      socket.send({ event_type: "listRooms", item: "1" });
    }, 400);
    const stop = window.setTimeout(() => window.clearInterval(waitOpen), 2400);
    return () => {
      window.clearInterval(waitOpen);
      window.clearTimeout(stop);
      off();
      socket.close();
    };
  }, [isLoggedIn, user.id]);

  useEffect(() => {
    if (!activeId) return;
    setReplyTo(null);
    socketRef.current?.send({ event_type: "joinRoom", room_id: activeId, page: "1" });
  }, [activeId]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setTyping((prev) => {
        const now = Date.now();
        const next: Record<string, number> = {};
        for (const [id, at] of Object.entries(prev)) {
          if (now - at < 900) next[id] = at;
        }
        return Object.keys(next).length === Object.keys(prev).length ? prev : next;
      });
    }, 300);
    return () => window.clearInterval(timer);
  }, []);

  const orderedRooms = useMemo(() => [...rooms].sort(byLatest), [rooms]);

  const active = useMemo(
    () => rooms.find((room) => room.id === activeId) ?? orderedRooms[0],
    [rooms, orderedRooms, activeId],
  );

  useEffect(() => {
    if (!isLoggedIn) return;
    api.listUsers().then(setPeople).catch(() => setPeople([]));
  }, [isLoggedIn]);

  const withUsername = params.get("with");
  useEffect(() => {
    if (!isLoggedIn || !meId || !withUsername || !roomsReady) return;
    const other = people.find((person) => person.username === withUsername);
    if (!other?.chatId || other.id === user.id) return;
    const otherId = String(other.chatId);
    const existing = rooms.find(
      (room) =>
        room.memberIds.includes(meId) && room.memberIds.includes(otherId),
    );
    if (existing) {
      setActiveId(existing.id);
      setMobileChat(true);
      setParams({}, { replace: true });
      return;
    }
    const roomId = `cookify-${[meId, otherId].sort().join("-")}`;
    if (rooms.some((room) => room.id === roomId)) {
      setActiveId(roomId);
      setMobileChat(true);
      setParams({}, { replace: true });
      return;
    }
    createDirectRoom(meId, { id: otherId, name: other.name })
      .then((id) => {
        setRooms((prev) =>
          prev.some((room) => room.id === id || (room.memberIds.includes(meId) && room.memberIds.includes(otherId)))
            ? prev
            : [{ id, name: other.name, memberIds: [meId, otherId], preview: "", at: new Date().toISOString(), messages: [] }, ...prev],
        );
        setActiveId(id);
        setMobileChat(true);
        setParams({}, { replace: true });
        socketRef.current?.send({ event_type: "listRooms", item: "1" });
      })
      .catch(() => setStatus("ساخت گفت‌وگو انجام نشد"));
  }, [isLoggedIn, meId, withUsername, people, rooms, roomsReady, user.id, setParams]);

  const roomTitle = (room: ChatRoom) => {
    const otherId = room.memberIds.find((id) => id !== meId);
    const person = people.find((item) => String(item.chatId) === otherId);
    return person?.name || room.name;
  };

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [active?.id, active?.messages.length, active?.messages.at(-1)?.id]);

  useEffect(() => {
    if (!active) return;
    const lastOther = [...active.messages].reverse().find((msg) => msg.clientId !== meId);
    if (!lastOther) return;
    socketRef.current?.send({ event_type: "seenMessage", item: lastOther.id });
  }, [active, meId]);

  const sendPayload = (content: string, type: "text" | "voice" | "file") => {
    if (!active) return;
    const id = newMessageId();
    const quote = replyTo;
    setRooms((prev) =>
      prev.map((room) =>
        room.id !== active.id
          ? room
          : {
              ...room,
              preview: content,
              at: new Date().toISOString(),
              messages: [
                ...room.messages,
                {
                  id,
                  text: content,
                  kind: type,
                  clientId: meId,
                  username: user.username,
                  at: new Date().toISOString(),
                  sent: false,
                  delivered: false,
                  seen: false,
                  ...(quote ? { replyTo: quote } : {}),
                },
              ],
            },
      ),
    );
    socketRef.current?.send({
      event_type: "sendMessage",
      room_id: active.id,
      ulid: id,
      content,
      type,
      ...(quote && type === "text"
        ? { reply_to: { id: quote.id, content: quote.text, username: quote.username } }
        : {}),
    });
    setReplyTo(null);
  };

  const sendFile = async (file: File, type: "voice" | "file") => {
    if (!active) return;
    setStatus("در حال ارسال…");
    try {
      const url = await uploadChatFile(file, file.name);
      sendPayload(url, type);
      setStatus("");
    } catch {
      setStatus("ارسال فایل انجام نشد");
    }
  };

  const toggleRecord = async () => {
    if (recording) {
      recorderRef.current?.stop();
      setRecording(false);
      return;
    }
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream);
    const chunks: Blob[] = [];
    recorder.ondataavailable = (event) => {
      if (event.data.size) chunks.push(event.data);
    };
    recorder.onstop = () => {
      stream.getTracks().forEach((track) => track.stop());
      const blob = new Blob(chunks, { type: recorder.mimeType || "audio/webm" });
      const file = new File([blob], `voice-${Date.now()}.webm`, { type: blob.type });
      sendFile(file, "voice").catch(() => setStatus("ارسال ویس انجام نشد"));
    };
    recorderRef.current = recorder;
    recorder.start();
    setRecording(true);
  };

  const forwardTo = (targetId: string) => {
    if (!active || !forwardId) return;
    socketRef.current?.send({
      event_type: "forwardMessage",
      room_id: active.id,
      message_id: forwardId,
      target_room: targetId,
    });
    setForwardId("");
    setHeld(null);
  };

  const clearPress = () => {
    if (pressTimer.current) window.clearTimeout(pressTimer.current);
    pressTimer.current = null;
  };

  const send = (e: React.FormEvent) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text || !active) return;
    if (editingId) {
      setRooms((prev) =>
        prev.map((room) =>
          room.id !== active.id
            ? room
            : {
                ...room,
                messages: room.messages.map((item) =>
                  item.id === editingId ? { ...item, text, edited: true } : item,
                ),
              },
        ),
      );
      socketRef.current?.send({
        event_type: "editMessage",
        room_id: active.id,
        message_id: editingId,
        content: text,
      });
      setDraft("");
      setEditingId("");
      return;
    }
    setDraft("");
    sendPayload(text, "text");
  };

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col max-lg:pb-16">
      <h1 className="sr-only">پیام‌ها</h1>

      {!isLoggedIn ? (
        <EmptyState
          icon={<MessageCircle className="size-7" />}
          title="برای دیدن پیام‌ها وارد شو"
          description="گفت‌وگوها روی سرویس چت ذخیره می‌شوند."
          action={
            <Link to="/login">
              <Button>ورود</Button>
            </Link>
          }
        />
      ) : (
        <div className="grid h-full min-h-0 w-full flex-1 overflow-hidden bg-surface max-lg:rounded-none lg:grid-cols-[280px_minmax(0,1fr)] lg:rounded-2xl lg:border lg:border-line lg:shadow-card">
          <aside className={cn("no-scrollbar min-h-0 overflow-y-auto border-b border-line lg:border-b-0 lg:border-l", mobileChat && "hidden lg:block")}>
            {status && <p className="px-4 py-3 text-xs text-muted">{status}</p>}
            <ul>
              {orderedRooms.map((thread) => (
                <li key={thread.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveId(thread.id);
                      setMobileChat(true);
                      setUnread((prev) => ({ ...prev, [thread.id]: 0 }));
                    }}
                    className={cn(
                      "flex min-h-16 w-full items-center gap-3 px-4 py-3 text-right transition duration-200 active:bg-canvas",
                      active?.id === thread.id ? "bg-canvas" : "hover:bg-canvas/70",
                    )}
                  >
                    <Avatar name={roomTitle(thread)} size={48} />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center justify-between gap-2">
                        <span className={cn("truncate text-sm text-ink", unread[thread.id] ? "font-extrabold" : "font-bold")}>{roomTitle(thread)}</span>
                        <span className={cn("shrink-0 text-[11px]", unread[thread.id] ? "font-bold text-primary" : "text-muted")}>{messageTime(thread.at)}</span>
                      </span>
                      <span className="mt-1 flex items-center gap-2">
                          <span className={cn("min-w-0 flex-1 truncate text-xs", typing[thread.id] || unread[thread.id] ? "font-semibold text-ink" : "text-muted")}>
                            {typing[thread.id] ? "در حال نوشتن…" : thread.preview || "گفت‌وگو"}
                          </span>
                          {unread[thread.id] ? (
                            <span className="grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-white">
                              {unread[thread.id]}
                            </span>
                          ) : null}
                        </span>
                    </span>
                    <ChevronLeft className="size-3.5 shrink-0 text-muted/70 lg:hidden" />
                  </button>
                </li>
              ))}
            </ul>
          </aside>

          {active ? (
            <div className={cn(
              "flex h-full min-h-0 min-w-0 flex-col bg-surface",
              !mobileChat && "hidden lg:flex",
              mobileChat && "chat-in fixed inset-0 z-[60] lg:static lg:animate-none",
            )}>
              <div className="flex items-center gap-2.5 border-b border-line/80 bg-surface/95 px-3 py-2.5 pt-[max(0.5rem,env(safe-area-inset-top))] backdrop-blur-md sm:px-4">
                <button
                  type="button"
                  aria-label="بازگشت به گفت‌وگوها"
                  onClick={() => setMobileChat(false)}
                  className="flex h-11 items-center gap-1 rounded-xl px-2 text-sm font-bold text-primary lg:hidden"
                >
                  <ChevronRight className="size-5" />
                  گفت‌وگوها
                </button>
                <Avatar name={roomTitle(active)} size={40} ring />
                <div>
                  <p className="text-sm font-extrabold text-ink">{roomTitle(active)}</p>
                  {typing[active.id] ? <p className="text-[11px] text-primary">در حال نوشتن…</p> : null}
                </div>
              </div>

              <div className="relative min-h-0 flex-1">
              {held && (
                <button
                  type="button"
                  aria-label="بستن"
                  className="absolute inset-0 z-20 bg-transparent"
                  onClick={() => {
                    setHeld(null);
                    setHeldBox(null);
                    setForwardId("");
                  }}
                />
              )}
              <ul ref={listRef} className="no-scrollbar flex h-full flex-col overflow-y-auto bg-canvas/60 px-4 py-4">
                {active.messages.map((msg, index) => {
                  const grouped = active.messages[index - 1]?.clientId === msg.clientId;
                  return (
                  <li
                    key={msg.id}
                    className={cn(
                      "flex w-[min(18rem,82%)] max-w-full flex-col transition duration-500 ease-out",
                      grouped ? "mt-1" : "mt-3",
                      msg.clientId === meId ? "self-end" : "self-start",
                      held && held.id !== msg.id && "opacity-40 blur-[1px]",
                    )}
                  >
                  <div
                    onContextMenu={(event) => {
                      event.preventDefault();
                      const rect = event.currentTarget.getBoundingClientRect();
                      setForwardId("");
                      setHeldBox({ top: rect.top, left: rect.left, width: rect.width });
                      setHeld(msg);
                      navigator.vibrate?.(12);
                    }}
                    onPointerDown={(event) => {
                      const el = event.currentTarget;
                      const startX = event.clientX;
                      const startY = event.clientY;
                      clearPress();
                      const cancelIfMoved = (move: PointerEvent) => {
                        if (Math.abs(move.clientX - startX) > 6 || Math.abs(move.clientY - startY) > 6) {
                          clearPress();
                          el.removeEventListener("pointermove", cancelIfMoved);
                        }
                      };
                      el.addEventListener("pointermove", cancelIfMoved);
                      pressTimer.current = window.setTimeout(() => {
                        el.removeEventListener("pointermove", cancelIfMoved);
                        const rect = el.getBoundingClientRect();
                        setForwardId("");
                        setHeldBox({ top: rect.top, left: rect.left, width: rect.width });
                        setHeld(msg);
                        navigator.vibrate?.(12);
                      }, 520);
                    }}
                    onPointerUp={clearPress}
                    onPointerCancel={clearPress}
                    className={cn(
                      "px-3 py-2 text-[13px] leading-6",
                      msg.clientId === meId
                        ? "rounded-2xl rounded-ee-md bg-primary text-white"
                        : "rounded-2xl rounded-es-md border border-line/80 bg-surface text-ink shadow-sm",
                      held?.id === msg.id && "relative z-30",
                    )}
                  >
                    {msg.forwardFrom && (
                      <p className={cn("mb-1 text-[11px]", msg.clientId === meId ? "text-white/80" : "text-muted")}>
                        هدایت‌شده از {msg.forwardFrom.username || "گفت‌وگو"}: {msg.forwardFrom.text}
                      </p>
                    )}
                    {msg.replyTo && (
                      <p className={cn(
                        "mb-1 rounded-lg border-r-2 px-2 py-1 text-[11px] leading-5",
                        msg.clientId === meId ? "border-white/70 bg-white/10" : "border-primary bg-surface",
                      )}>
                        {msg.replyTo.username ? `${msg.replyTo.username}: ` : ""}
                        {msg.replyTo.text}
                      </p>
                    )}
                    {msg.kind === "voice" ? (
                      <audio controls src={msg.text} className="max-w-full" />
                    ) : msg.kind === "file" && isImageUrl(msg.text) ? (
                      <img src={msg.text} alt="" className="max-h-56 rounded-lg" />
                    ) : msg.kind === "file" ? (
                      <a href={msg.text} target="_blank" rel="noreferrer" className="underline">
                        فایل
                      </a>
                    ) : (
                      msg.text
                    )}
                    {msg.edited && (
                      <p className={cn("mt-1 text-[10px]", msg.clientId === meId ? "text-white/70" : "text-muted")}>ویرایش شده</p>
                    )}
                    <div className={cn("mt-1 flex items-center justify-end gap-1 text-[10px]", msg.clientId === meId ? "text-white/70" : "text-muted")}>
                      <span className="flex items-center gap-1">
                      <span>{messageTime(msg.at)}</span>
                      {msg.clientId === meId && (
                        <span aria-label={msg.seen ? "دیده شده" : msg.delivered ? "تحویل شده" : msg.sent ? "ارسال شده" : "در حال ارسال"}>
                          {msg.seen || msg.delivered ? (
                            <CheckCheck className={cn("size-3.5", msg.seen ? "text-sky-200" : "text-white/80")} />
                          ) : (
                            <Check className={cn("size-3.5", msg.sent ? "text-white/80" : "text-white/40")} />
                          )}
                        </span>
                      )}
                      </span>
                    </div>
                  </div>
                  {held?.id === msg.id && heldBox && (
                    <div
                      className="fixed z-50 w-max min-w-36 overflow-hidden rounded-2xl border border-line bg-surface py-1 text-ink shadow-pop"
                      style={{ top: heldBox.top, left: heldBox.left, transform: "translateY(calc(-100% - 8px))" }}
                    >
                      {forwardId === msg.id ? (
                        <>
                          {rooms.filter((room) => room.id !== active.id).map((room) => (
                            <button
                              key={room.id}
                              type="button"
                              onClick={() => forwardTo(room.id)}
                              className="block min-h-11 w-full px-4 text-right text-sm leading-[2.75rem] hover:bg-canvas"
                            >
                              هدایت به {roomTitle(room)}
                            </button>
                          ))}
                          <button type="button" onClick={() => setForwardId("")} className="block min-h-11 w-full px-4 text-right text-sm leading-[2.75rem] text-muted hover:bg-canvas">
                            بازگشت
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              setReplyTo({ id: msg.id, text: msg.text, username: msg.username || roomTitle(active) });
                              setEditingId("");
                              setHeld(null);
                            }}
                            className="block min-h-11 w-full px-4 text-right text-sm leading-[2.75rem] hover:bg-canvas"
                          >
                            پاسخ
                          </button>
                          {msg.clientId === meId && msg.kind === "text" && (
                            <button
                              type="button"
                              onClick={() => {
                                setEditingId(msg.id);
                                setDraft(msg.text);
                                setReplyTo(null);
                                setHeld(null);
                              }}
                              className="block min-h-11 w-full px-4 text-right text-sm leading-[2.75rem] hover:bg-canvas"
                            >
                              ویرایش
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => setForwardId(msg.id)}
                            className="block min-h-11 w-full px-4 text-right text-sm leading-[2.75rem] hover:bg-canvas"
                          >
                            هدایت
                          </button>
                        </>
                      )}
                    </div>
                  )}
                  </li>
                  );
                })}
              </ul>
              </div>

              <form onSubmit={send} className="shrink-0 border-t border-line/80 bg-surface px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
                {editingId && (
                  <div className="mb-2 flex items-center gap-2 rounded-xl bg-canvas px-3 py-2 text-xs text-muted">
                    <span className="min-w-0 flex-1 truncate">ویرایش پیام</span>
                    <button type="button" aria-label="لغو ویرایش" onClick={() => { setEditingId(""); setDraft(""); }}>
                      <X className="size-3.5" />
                    </button>
                  </div>
                )}
                {replyTo && (
                  <div className="mb-2 flex items-center gap-2 rounded-xl bg-canvas px-3 py-2 text-xs text-muted">
                    <Reply className="size-3.5 shrink-0 text-primary" />
                    <span className="min-w-0 flex-1 truncate">پاسخ به: {replyTo.text}</span>
                    <button type="button" aria-label="لغو پاسخ" onClick={() => setReplyTo(null)}>
                      <X className="size-3.5" />
                    </button>
                  </div>
                )}
                <div className="flex items-center gap-2">
                <label className="grid size-10 cursor-pointer place-items-center rounded-full text-muted hover:bg-canvas hover:text-ink">
                  <ImagePlus className="size-4" />
                  <input
                    type="file"
                    accept="image/*,.pdf,.zip"
                    className="hidden"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      event.target.value = "";
                      if (file) sendFile(file, "file").catch(() => setStatus("ارسال فایل انجام نشد"));
                    }}
                  />
                </label>
                <button
                  type="button"
                  aria-label={recording ? "پایان ویس" : "ضبط ویس"}
                  onClick={() => toggleRecord().catch(() => setStatus("دسترسی میکروفون داده نشد"))}
                  className={cn(
                    "grid size-10 place-items-center rounded-full",
                    recording ? "bg-primary text-white" : "text-muted",
                  )}
                >
                  {recording ? <Square className="size-4" /> : <Mic className="size-4" />}
                </button>
                <input
                  value={draft}
                  onChange={(e) => {
                    const value = e.target.value;
                    setDraft(value);
                    if (!value.trim() || !active) return;
                    const now = Date.now();
                    if (now - typingSentRef.current < 400) return;
                    typingSentRef.current = now;
                    socketRef.current?.send({ event_type: "typing", room_id: active.id });
                  }}
                  placeholder="پیام خود را بنویسید…"
                  aria-label="متن پیام"
                  className="h-10 min-w-0 flex-1 rounded-full border border-line/80 bg-canvas px-4 text-sm placeholder:text-muted/60 focus:border-primary/40 focus:bg-surface focus:outline-none"
                />
                <button
                  type="submit"
                  aria-label="ارسال"
                  className="grid size-10 place-items-center rounded-full bg-primary text-white hover:bg-primary-dark"
                >
                  <Send className="size-4" />
                </button>
                </div>
              </form>
            </div>
          ) : (
            <EmptyState
              icon={<MessageCircle className="size-7" />}
              title="هنوز گفت‌وگویی نیست"
              description="از پروفایل آشپز، دکمهٔ پیام را بزن."
            />
          )}
        </div>
      )}
    </div>
  );
}

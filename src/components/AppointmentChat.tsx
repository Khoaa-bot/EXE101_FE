import { useEffect, useRef, useState } from "react";
import {
  getAppointmentMessages,
  getNotificationStreamUrl,
  getStoredAuthSession,
  markAppointmentMessagesRead,
  sendAppointmentMessage,
  type AppointmentMessage,
} from "../services/api";

// Khi kênh SSE đang mở, polling chỉ là lưới an toàn; khi SSE chưa mở hoặc rớt thì polling nhanh hơn.
const FAST_POLL_MS = 5000;
const SAFETY_POLL_MS = 30000;
const MAX_LENGTH = 1000;

type AppointmentChatProps = {
  appointmentId: number | string;
  // Lịch đã huỷ/không đến/bàn giao: vẫn đọc được lịch sử nhưng không gửi thêm.
  closed?: boolean;
  callPhone?: string | null;
  callLabel?: string;
};

const ROLE_LABEL: Record<string, string> = {
  customer: "Khách",
  engineer: "Kỹ thuật viên",
  reception: "Lễ tân",
  garage_owner: "Chủ garage",
  admin: "Quản trị",
};

function formatTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
}

// Khung chat theo lịch hẹn. Tin mới và dấu "đã xem" đến real-time qua kênh SSE
// (/notifications/stream); polling chỉ là dự phòng. Dùng `key={appointmentId}`
// ở nơi gọi để chat được khởi tạo lại khi đổi sang lịch hẹn khác.
export default function AppointmentChat({
  appointmentId,
  closed = false,
  callPhone,
  callLabel = "Gọi điện",
}: AppointmentChatProps) {
  const [messages, setMessages] = useState<AppointmentMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lastIdRef = useRef(0);
  const listRef = useRef<HTMLDivElement | null>(null);
  const hasUnreadIncomingRef = useRef(false);
  const myId = getStoredAuthSession()?.id;

  const isVisible = () => typeof document === "undefined" || document.visibilityState === "visible";

  // Chỉ đánh dấu "đã xem" khi người dùng thực sự đang nhìn thấy trang.
  const markRead = () => {
    if (!isVisible()) {
      hasUnreadIncomingRef.current = true;
      return;
    }
    hasUnreadIncomingRef.current = false;
    markAppointmentMessagesRead(appointmentId).catch(() => {
      // Không quan trọng: lần tải sau sẽ thử lại.
    });
  };

  // Lấy các tin mới hơn tin cuối đã có.
  const poll = async () => {
    try {
      const fresh = await getAppointmentMessages(appointmentId, lastIdRef.current || undefined);
      if (fresh.length === 0) return;
      lastIdRef.current = fresh[fresh.length - 1].id;
      setMessages((current) => {
        const known = new Set(current.map((message) => message.id));
        return [...current, ...fresh.filter((message) => !known.has(message.id))];
      });
      if (fresh.some((message) => message.senderId !== myId)) markRead();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không tải được tin nhắn.");
    }
  };

  // Tải lại toàn bộ để cập nhật dấu "đã xem" của các tin cũ.
  const reload = async () => {
    try {
      const all = await getAppointmentMessages(appointmentId);
      if (all.length === 0) return;
      lastIdRef.current = all[all.length - 1].id;
      setMessages(all);
    } catch {
      // Giữ nguyên danh sách hiện tại.
    }
  };

  useEffect(() => {
    let timer: number | undefined;
    let source: EventSource | null = null;

    const schedule = (ms: number) => {
      window.clearInterval(timer);
      timer = window.setInterval(() => void poll(), ms);
    };

    const streamUrl = getNotificationStreamUrl();
    if (streamUrl && typeof EventSource !== "undefined") {
      const concernsThisChat = (event: Event) => {
        try {
          const payload = JSON.parse((event as MessageEvent).data) as { appointmentId?: number };
          return Number(payload.appointmentId) === Number(appointmentId);
        } catch {
          return false;
        }
      };

      source = new EventSource(streamUrl);
      source.addEventListener("chat-message", (event) => {
        if (concernsThisChat(event)) void poll();
      });
      source.addEventListener("chat-read", (event) => {
        if (concernsThisChat(event)) void reload();
      });
      source.onopen = () => schedule(SAFETY_POLL_MS);
      source.onerror = () => schedule(FAST_POLL_MS);
    }

    const onVisible = () => {
      if (document.visibilityState === "visible" && hasUnreadIncomingRef.current) markRead();
    };
    document.addEventListener("visibilitychange", onVisible);

    schedule(FAST_POLL_MS);
    void poll();

    return () => {
      window.clearInterval(timer);
      source?.close();
      document.removeEventListener("visibilitychange", onVisible);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appointmentId]);

  useEffect(() => {
    const list = listRef.current;
    if (list) list.scrollTop = list.scrollHeight;
  }, [messages.length]);

  const send = async () => {
    const content = draft.trim();
    if (!content || isSending) return;
    setIsSending(true);
    setError(null);
    try {
      await sendAppointmentMessage(appointmentId, content);
      setDraft("");
      await poll();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không gửi được tin nhắn.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <section className="rounded-xl border border-outline-variant bg-surface-container-lowest p-lg">
      <div className="mb-md flex flex-wrap items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 font-headline-md text-headline-md">
          <span className="material-symbols-outlined text-primary">chat</span>
          Trao đổi về lịch hẹn
        </h3>
        {callPhone && (
          <a
            href={`tel:${callPhone}`}
            className="inline-flex items-center gap-1 rounded-lg border border-primary px-3 py-1.5 text-sm font-medium text-primary transition hover:bg-primary-container/10"
          >
            <span className="material-symbols-outlined text-[18px]">call</span>
            {callLabel}: {callPhone}
          </a>
        )}
      </div>

      <div
        ref={listRef}
        className="mb-md max-h-72 space-y-2 overflow-y-auto rounded-lg bg-surface-container-low p-3"
      >
        {messages.length === 0 && (
          <p className="py-4 text-center text-sm text-on-surface-variant">
            Chưa có tin nhắn nào.
          </p>
        )}
        {messages.map((message) => {
          const mine = message.senderId === myId;
          return (
            <div key={message.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                  mine
                    ? "bg-primary text-on-primary"
                    : "border border-outline-variant bg-surface-container-lowest"
                }`}
              >
                {!mine && (
                  <p className="mb-0.5 text-[11px] font-semibold text-primary">
                    {message.senderName} · {ROLE_LABEL[message.senderRole] ?? message.senderRole}
                  </p>
                )}
                <p className="whitespace-pre-wrap break-words">{message.content}</p>
                <p className={`mt-0.5 text-[10px] ${mine ? "text-on-primary/80" : "text-on-surface-variant"}`}>
                  {formatTime(message.createdAt)}
                  {mine && ` · ${message.readAt ? "Đã xem" : "Đã gửi"}`}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {error && <p className="mb-2 text-sm text-error">{error}</p>}

      {closed ? (
        <p className="text-sm text-on-surface-variant">
          Cuộc trò chuyện đã đóng vì lịch hẹn đã kết thúc.
        </p>
      ) : (
        <form
          className="flex gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            void send();
          }}
        >
          <input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            maxLength={MAX_LENGTH}
            placeholder="Nhập tin nhắn..."
            className="flex-1 rounded-lg border border-outline-variant bg-surface-container-low px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          />
          <button
            type="submit"
            disabled={isSending || draft.trim().length === 0}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-on-primary transition hover:opacity-90 disabled:opacity-50"
          >
            {isSending ? "Đang gửi..." : "Gửi"}
          </button>
        </form>
      )}
    </section>
  );
}

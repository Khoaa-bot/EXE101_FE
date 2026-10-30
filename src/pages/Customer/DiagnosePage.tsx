import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent, type ReactNode } from "react";
import {
  getChatConversation,
  getChatConversations,
  getChatQuota,
  getMyFleet,
  sendChatFeedback,
  sendChatMessage,
  type AiQuota,
  type ChatConversation,
  type ChatMessage,
  type DiagnosisLikelihood,
  type DiagnosisResult,
  type DiagnosisSeverity,
  type Vehicle,
} from "../../services/api";

type DiagnosePageProps = {
  initialVehicleId: number | null;
  onBookServiceClick: (serviceId: number) => void;
  onAddVehicleClick: () => void;
};

const MAX_MESSAGE = 1000;
const GREETING =
  "Xin chào! Mình là trợ lý AI của Servio. Hãy cho mình biết xe của bạn đang gặp vấn đề gì — mình có thể hỏi thêm vài câu để chẩn đoán chính xác hơn.";
const STARTER_CHIPS: Array<[label: string, icon: string]> = [
  ["Tiếng kêu lạ", "volume_up"],
  ["Đèn báo lỗi", "warning"],
  ["Xe rung lắc", "vibration"],
  ["Khó nổ máy", "key"],
  ["Hao xăng", "local_gas_station"],
  ["Điều hòa kém lạnh", "ac_unit"],
];

const cardClass =
  "rounded-3xl border border-outline-variant/40 bg-surface-container-lowest shadow-[0_10px_26px_-14px_rgba(25,28,29,0.28)]";

const severityMeta: Record<
  DiagnosisSeverity,
  { label: string; chip: string; banner: string; icon: string }
> = {
  URGENT: {
    label: "Khẩn cấp",
    chip: "bg-error-container text-on-error-container",
    banner: "border-[#f3b6af] bg-error-container text-on-error-container",
    icon: "report",
  },
  MEDIUM: {
    label: "Trung bình",
    chip: "bg-[#ffe9c7] text-[#6b4000]",
    banner: "border-[#f1d29b] bg-[#fff7ea] text-[#6b4000]",
    icon: "schedule",
  },
  LOW: {
    label: "Thấp",
    chip: "bg-[#d7f5dc] text-on-tertiary-fixed-variant",
    banner: "border-[#bfe5c6] bg-[#eefaf0] text-on-tertiary-fixed-variant",
    icon: "check_circle",
  },
};

const likelihoodMeta: Record<DiagnosisLikelihood, { label: string }> = {
  HIGH: { label: "Khả năng cao" },
  MEDIUM: { label: "Khả năng trung bình" },
  LOW: { label: "Khả năng thấp" },
};

// Bong bóng lựa chọn nằm bên phải như tin của khách: chạm vào là chọn.
type OptionVariant = "default" | "selected" | "go" | "danger";
const optionClass = (variant: OptionVariant = "default") =>
  `inline-flex min-h-11 items-center gap-2 rounded-[22px_22px_6px_22px] border-[1.5px] px-4 py-2 text-left text-sm font-semibold leading-snug transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
    {
      default: "border-primary bg-surface-container-lowest text-on-primary-fixed-variant hover:bg-primary-fixed/40",
      selected: "border-primary bg-primary-fixed text-on-primary-fixed-variant",
      go: "border-transparent bg-gradient-to-br from-primary to-primary-container text-on-primary shadow-[0_12px_22px_-14px_rgba(0,89,187,0.9)] hover:opacity-95",
      danger: "border-transparent bg-error text-on-error hover:opacity-95",
    }[variant]
  }`;

function bannerCopy(result: DiagnosisResult): { title: string; body: string } {
  if (result.stopDriving) {
    return {
      title: "Khẩn cấp: nên ngừng lái xe và gọi cứu hộ",
      body: "Triệu chứng có thể ảnh hưởng an toàn. Đừng tiếp tục lái cho đến khi kỹ thuật viên kiểm tra.",
    };
  }
  if (result.severity === "URGENT") {
    return { title: "Cần kiểm tra ngay", body: "Nên đưa xe đến garage càng sớm càng tốt." };
  }
  if (result.severity === "MEDIUM") {
    return { title: "Nên kiểm tra sớm", body: "Chưa nguy hiểm ngay nhưng không nên để lâu." };
  }
  return { title: "Mức độ thấp", body: "Tiếp tục theo dõi và kiểm tra khi đến kỳ bảo dưỡng." };
}

function formatDateTime(iso: string | null): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatPrice(price: number | null): string {
  return price != null ? `${price.toLocaleString("vi-VN")} đ` : "";
}

function errorText(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

export default function DiagnosePage({
  initialVehicleId,
  onBookServiceClick,
  onAddVehicleClick,
}: DiagnosePageProps) {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [quota, setQuota] = useState<AiQuota | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [selectedVehicleId, setSelectedVehicleId] = useState<number | null>(initialVehicleId);
  const [conversation, setConversation] = useState<ChatConversation | null>(null);
  const [pending, setPending] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isSendingFeedback, setIsSendingFeedback] = useState(false);
  const [isOpeningConversation, setIsOpeningConversation] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [error, setError] = useState("");

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      getMyFleet(),
      // Lịch sử và số tin nhắn chỉ là thông tin phụ — lỗi thì bỏ qua, vẫn chat được.
      getChatConversations().catch(() => [] as ChatConversation[]),
      getChatQuota().catch(() => null),
    ])
      .then(([fleet, history, myQuota]) => {
        if (cancelled) return;
        setVehicles(fleet);
        setConversations(history);
        setQuota(myQuota);
        setSelectedVehicleId((previous) =>
          previous !== null && fleet.some((vehicle) => vehicle.id === previous)
            ? previous
            : (fleet[0]?.id ?? null),
        );
      })
      .catch((requestError) => {
        if (cancelled) return;
        setLoadError(errorText(requestError, "Không tải được danh sách xe."));
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const messages: ChatMessage[] = conversation?.messages ?? [];

  // Luôn cuộn xuống tin mới nhất khi có tin nhắn, bong bóng chờ hoặc chỉ báo "đang gõ".
  useEffect(() => {
    const container = scrollRef.current;
    if (container) container.scrollTop = container.scrollHeight;
  }, [messages.length, pending, isSending, conversation?.id]);

  const isQuotaExhausted = quota !== null && quota.used >= quota.limit;
  const canSend = selectedVehicleId !== null && !isSending && !isQuotaExhausted;
  const lastMessage = messages[messages.length - 1];
  const lastConclusionIndex = messages.reduce(
    (found, message, index) => (message.diagnosis ? index : found),
    -1,
  );

  const send = async (rawText: string) => {
    const text = rawText.trim();
    if (!text || !canSend) return;

    setIsSending(true);
    setError("");
    setPending(text);
    setInput("");
    try {
      const response = await sendChatMessage(
        conversation
          ? { conversationId: conversation.id, message: text }
          : { vehicleId: selectedVehicleId ?? undefined, message: text },
      );
      setConversation(response.conversation);
      setQuota(response.quota);
      setConversations((items) =>
        [{ ...response.conversation, messages: null }, ...items.filter((item) => item.id !== response.conversation.id)].slice(
          0,
          20,
        ),
      );
    } catch (requestError) {
      // Tin nhắn không được lưu khi AI lỗi, nên trả lại nội dung vào ô nhập để khách gửi lại.
      setInput(text);
      setError(errorText(requestError, "Không thể gửi tin nhắn lúc này. Vui lòng thử lại."));
    } finally {
      setPending(null);
      setIsSending(false);
    }
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    void send(input);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      void send(input);
    }
  };

  const handleFeedback = async (helpful: boolean) => {
    if (!conversation) return;
    setIsSendingFeedback(true);
    setError("");
    try {
      const updated = await sendChatFeedback(conversation.id, helpful);
      setConversation((current) =>
        current && current.id === updated.id ? { ...current, helpful: updated.helpful } : current,
      );
      setConversations((items) =>
        items.map((item) => (item.id === updated.id ? { ...item, helpful: updated.helpful } : item)),
      );
    } catch (requestError) {
      setError(errorText(requestError, "Không gửi được đánh giá. Vui lòng thử lại."));
    } finally {
      setIsSendingFeedback(false);
    }
  };

  const openConversation = async (id: number) => {
    setShowHistory(false);
    if (conversation?.id === id) return;
    setIsOpeningConversation(true);
    setError("");
    try {
      setConversation(await getChatConversation(id));
      setInput("");
    } catch (requestError) {
      setError(errorText(requestError, "Không mở được cuộc trò chuyện."));
    } finally {
      setIsOpeningConversation(false);
    }
  };

  const startNew = () => {
    setConversation(null);
    setPending(null);
    setInput("");
    setError("");
    setShowHistory(false);
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-6xl p-6 md:p-8">
        <p className="text-on-surface-variant">Đang tải...</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="mx-auto max-w-6xl p-6 md:p-8">
        <p className="rounded-2xl bg-error-container px-4 py-3 text-sm text-on-error-container">{loadError}</p>
      </div>
    );
  }

  if (vehicles.length === 0) {
    return (
      <div className="mx-auto max-w-6xl space-y-4 p-6 md:p-8">
        <h2 className="text-3xl font-extrabold tracking-tight text-on-surface">Chẩn đoán xe bằng AI</h2>
        <p className="text-[15px] text-on-surface-variant">
          Bạn chưa có xe nào để chẩn đoán. Hãy thêm phương tiện trước.
        </p>
        <button
          type="button"
          onClick={onAddVehicleClick}
          className="min-h-12 rounded-2xl bg-gradient-to-br from-primary to-primary-container px-6 text-sm font-bold text-on-primary shadow-[0_12px_22px_-14px_rgba(0,89,187,0.9)]"
        >
          Thêm phương tiện
        </button>
      </div>
    );
  }

  const vehicleLabel = conversation
    ? conversation.vehicleLabel
    : (vehicles.find((vehicle) => vehicle.id === selectedVehicleId)?.model ?? "");
  const showStarterChips = !conversation && !pending && !isSending;
  const quickReplies =
    !isSending && !pending && lastMessage?.role === "ASSISTANT" ? lastMessage.quickReplies : [];
  const replyOptions: Array<[label: string, icon: string | null]> = showStarterChips
    ? STARTER_CHIPS
    : quickReplies.map((reply) => [reply, null]);

  const historyPanel = (
    <div className={`${cardClass} space-y-3 p-[18px]`}>
      <h3 className="text-base font-extrabold text-on-surface">Lịch sử trò chuyện</h3>
      {conversations.length === 0 ? (
        <p className="text-[13px] text-on-surface-variant">Chưa có cuộc trò chuyện nào.</p>
      ) : (
        conversations.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => void openConversation(item.id)}
            className={`flex w-full flex-col gap-1 rounded-2xl border p-3 text-left transition-colors hover:bg-surface-container-low ${
              conversation?.id === item.id ? "border-primary bg-primary-fixed/30" : "border-outline-variant/60"
            }`}
          >
            <span className="flex items-center justify-between gap-2">
              <span className="line-clamp-1 text-[13px] font-bold text-on-surface">{item.title}</span>
              {item.severity && (
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold ${severityMeta[item.severity].chip}`}>
                  {severityMeta[item.severity].label}
                </span>
              )}
            </span>
            <span className="text-xs text-on-surface-variant">
              {item.vehicleLabel} · {formatDateTime(item.updatedAt)}
            </span>
          </button>
        ))
      )}
    </div>
  );

  return (
    <div className="mx-auto max-w-6xl space-y-5 p-6 pb-28 md:p-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div className="min-w-0">
          <h2 className="flex items-center gap-2.5 text-3xl font-extrabold tracking-tight text-on-surface">
            <AiAvatar size="lg" />
            Chẩn đoán xe bằng AI
          </h2>
          <p className="mt-1 text-[15px] text-on-surface-variant">
            Trò chuyện với trợ lý để tìm nguyên nhân khả dĩ và dịch vụ phù hợp tại garage.
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={() => setShowHistory((open) => !open)}
            aria-expanded={showHistory}
            className="inline-flex min-h-11 items-center gap-1.5 rounded-2xl border-[1.5px] border-outline-variant bg-surface-container-lowest px-4 text-sm font-bold hover:bg-surface-container-low lg:hidden"
          >
            <span className="material-symbols-outlined text-xl" aria-hidden="true">
              history
            </span>
            Lịch sử
          </button>
          <button
            type="button"
            onClick={startNew}
            className="inline-flex min-h-11 items-center gap-1.5 rounded-2xl border-[1.5px] border-outline-variant bg-surface-container-lowest px-4 text-sm font-bold hover:bg-surface-container-low"
          >
            <span className="material-symbols-outlined text-xl text-primary" aria-hidden="true">
              add_comment
            </span>
            <span className="hidden sm:inline">Cuộc trò chuyện mới</span>
            <span className="sm:hidden">Mới</span>
          </button>
        </div>
      </div>

      {showHistory && <div className="lg:hidden">{historyPanel}</div>}

      <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
        <section
          aria-label="Cuộc trò chuyện với trợ lý AI"
          className={`${cardClass} flex min-w-0 flex-1 flex-col overflow-hidden`}
        >
          <div className="flex flex-wrap items-center gap-3 border-b border-outline-variant/40 bg-surface-container-low px-5 py-3.5">
            <span className="material-symbols-outlined text-primary" aria-hidden="true">
              directions_car
            </span>
            {conversation ? (
              <span className="text-sm font-bold text-on-surface">{vehicleLabel}</span>
            ) : (
              <>
                <label htmlFor="diagnose-vehicle" className="text-sm text-on-surface-variant">
                  Chẩn đoán cho xe:
                </label>
                <select
                  id="diagnose-vehicle"
                  value={selectedVehicleId ?? ""}
                  onChange={(event) => setSelectedVehicleId(Number(event.target.value))}
                  disabled={isSending}
                  className="min-h-10 rounded-xl border border-outline-variant bg-surface-container-lowest px-3 text-sm outline-none focus:border-primary"
                >
                  {vehicles.map((vehicle) => (
                    <option key={vehicle.id} value={vehicle.id}>
                      {vehicle.model}
                      {vehicle.licensePlate ? ` · ${vehicle.licensePlate}` : ""}
                    </option>
                  ))}
                </select>
              </>
            )}
          </div>

          <div
            ref={scrollRef}
            role="log"
            aria-live="polite"
            aria-busy={isSending || isOpeningConversation}
            className="max-h-[62vh] min-h-[360px] space-y-3 overflow-y-auto p-5"
          >
            {isOpeningConversation ? (
              <p className="text-on-surface-variant">Đang tải cuộc trò chuyện...</p>
            ) : (
              <>
                {!conversation && <AssistantBubble text={GREETING} />}
                {messages.map((message, index) =>
                  message.role === "USER" ? (
                    <UserBubble key={message.id} text={message.content} />
                  ) : (
                    <AssistantBubble
                      key={message.id}
                      text={message.content}
                      message={message}
                      showFeedback={index === lastConclusionIndex}
                      helpful={conversation?.helpful ?? null}
                      isSendingFeedback={isSendingFeedback}
                      onFeedback={handleFeedback}
                      onBook={onBookServiceClick}
                    />
                  ),
                )}
                {pending && <UserBubble text={pending} />}
                {isSending && (
                  <div className="flex items-center gap-2 text-[13px] text-on-surface-variant" role="status">
                    <span className="material-symbols-outlined animate-spin text-lg" aria-hidden="true">
                      sync
                    </span>
                    AI đang phân tích...
                  </div>
                )}
                {replyOptions.length > 0 && (
                  <div className="flex flex-wrap justify-end gap-2" aria-label="Gợi ý trả lời nhanh">
                    {replyOptions.map(([label, icon]) => (
                      <button
                        key={label}
                        type="button"
                        disabled={!canSend}
                        onClick={() => void send(label)}
                        className={optionClass()}
                      >
                        {icon && (
                          <span className="material-symbols-outlined text-lg" aria-hidden="true">
                            {icon}
                          </span>
                        )}
                        {label}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {error && (
            <p role="alert" className="mx-5 mb-3 rounded-2xl bg-error-container px-4 py-3 text-sm text-on-error-container">
              {error}
            </p>
          )}

          <form onSubmit={handleSubmit} className="border-t border-outline-variant/40 px-5 pb-4 pt-3.5">
            <div className="flex items-end gap-2.5">
              <textarea
                aria-label="Nhập tin nhắn"
                rows={1}
                maxLength={MAX_MESSAGE}
                value={input}
                disabled={isSending || isQuotaExhausted}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  isQuotaExhausted ? "Bạn đã dùng hết tin nhắn hôm nay." : "Mô tả triệu chứng hoặc trả lời AI..."
                }
                className="max-h-32 min-h-[52px] flex-1 resize-none rounded-[18px] border border-outline-variant bg-surface-container-lowest px-4 py-3.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:bg-surface-container-low"
              />
              <button
                type="submit"
                aria-label="Gửi tin nhắn"
                disabled={!canSend || !input.trim()}
                className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary-container text-on-primary shadow-[0_12px_22px_-14px_rgba(0,89,187,0.9)] transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <span className="material-symbols-outlined" aria-hidden="true">
                  send
                </span>
              </button>
            </div>
            <div className="mt-2 flex flex-wrap justify-between gap-2 text-xs text-on-surface-variant">
              <span>
                {quota
                  ? isQuotaExhausted
                    ? "Bạn đã dùng hết tin nhắn hôm nay."
                    : `Còn ${quota.limit - quota.used}/${quota.limit} tin nhắn hôm nay`
                  : ""}
              </span>
              <span>Enter để gửi, Shift+Enter để xuống dòng</span>
            </div>
          </form>
        </section>

        <div className="hidden w-80 shrink-0 space-y-4 lg:block">
          {historyPanel}
          <p className="flex gap-2.5 rounded-[18px] bg-[#fff1cc] p-3.5 text-[12.5px] leading-relaxed text-[#6b4200]">
            <span className="material-symbols-outlined text-xl" aria-hidden="true">
              info
            </span>
            Kết quả chỉ mang tính tham khảo, không thay thế việc kỹ thuật viên kiểm tra trực tiếp. Khi phanh yếu,
            khói, mùi cháy hoặc đèn đỏ, hãy dừng xe và gọi cứu hộ.
          </p>
        </div>
      </div>
    </div>
  );
}

function AiAvatar({ size = "sm" }: { size?: "sm" | "lg" }) {
  return (
    <span
      aria-hidden="true"
      className={`flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary-fixed to-secondary-fixed-dim text-on-primary-fixed-variant ${
        size === "lg" ? "h-11 w-11" : "h-[34px] w-[34px]"
      }`}
    >
      <span
        className={`material-symbols-outlined ${size === "lg" ? "text-[26px]" : "text-xl"}`}
        style={{ fontVariationSettings: "'FILL' 1" }}
      >
        auto_awesome
      </span>
    </span>
  );
}

// Một lượt nói của AI: ảnh đại diện bên trái và các bong bóng xếp dọc.
function AiRow({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-start gap-2.5">
      <AiAvatar />
      <div className="flex min-w-0 max-w-[85%] flex-col gap-2">{children}</div>
    </div>
  );
}

function AiBubble({ children }: { children: ReactNode }) {
  return (
    <p className="whitespace-pre-line rounded-[20px] rounded-bl-md bg-surface-container-low px-4 py-3 text-sm leading-relaxed text-on-surface">
      {children}
    </p>
  );
}

function UserBubble({ text }: { text: string }) {
  return (
    <div className="flex justify-end">
      <p className="max-w-[78%] whitespace-pre-line rounded-[20px] rounded-br-md bg-gradient-to-br from-primary to-primary-container px-4 py-3 text-sm leading-relaxed text-on-primary">
        {text}
      </p>
    </div>
  );
}

function AssistantBubble({
  text,
  message,
  showFeedback = false,
  helpful = null,
  isSendingFeedback = false,
  onFeedback,
  onBook,
}: {
  text: string;
  message?: ChatMessage;
  showFeedback?: boolean;
  helpful?: boolean | null;
  isSendingFeedback?: boolean;
  onFeedback?: (helpful: boolean) => void;
  onBook?: (serviceId: number) => void;
}) {
  const diagnosis = message?.diagnosis ?? null;

  return (
    <>
      {text && (
        <AiRow>
          <AiBubble>{text}</AiBubble>
        </AiRow>
      )}
      {diagnosis && message && (
        <ConclusionBubbles
          diagnosis={diagnosis}
          message={message}
          showFeedback={showFeedback}
          helpful={helpful}
          isSendingFeedback={isSendingFeedback}
          onFeedback={onFeedback}
          onBook={onBook}
        />
      )}
    </>
  );
}

// Kết luận chẩn đoán trình bày như một chuỗi bong bóng: mức độ, nguyên nhân (chạm để xem giải thích),
// lời khuyên, dịch vụ gợi ý (chạm để đặt lịch) và đánh giá.
function ConclusionBubbles({
  diagnosis,
  message,
  showFeedback,
  helpful,
  isSendingFeedback,
  onFeedback,
  onBook,
}: {
  diagnosis: DiagnosisResult;
  message: ChatMessage;
  showFeedback: boolean;
  helpful: boolean | null;
  isSendingFeedback: boolean;
  onFeedback?: (helpful: boolean) => void;
  onBook?: (serviceId: number) => void;
}) {
  const meta = severityMeta[diagnosis.severity];
  const banner = bannerCopy(diagnosis);
  const urgent = diagnosis.severity === "URGENT";
  const [openCause, setOpenCause] = useState(0);
  const cause = diagnosis.causes[openCause];

  return (
    <>
      <AiRow>
        <div
          role="status"
          className={`rounded-[20px] rounded-bl-md border px-4 py-3 ${meta.banner}`}
        >
          <p className="flex items-center gap-1.5 text-sm font-bold">
            <span className="material-symbols-outlined text-[22px]" aria-hidden="true">
              {meta.icon}
            </span>
            {banner.title} · mức độ {meta.label}
          </p>
          <p className="mt-0.5 text-sm">{banner.body}</p>
        </div>
        {diagnosis.causes.length > 0 && (
          <AiBubble>
            Mình nghĩ có {diagnosis.causes.length} nguyên nhân khả dĩ. Chạm vào từng cái để xem giải thích:
          </AiBubble>
        )}
      </AiRow>

      {diagnosis.causes.length > 0 && (
        <div className="flex flex-wrap justify-end gap-2" role="group" aria-label="Nguyên nhân khả dĩ">
          {diagnosis.causes.map((item, index) => (
            <button
              key={`${item.name}-${index}`}
              type="button"
              aria-pressed={openCause === index}
              onClick={() => setOpenCause(index)}
              className={optionClass(openCause === index ? "selected" : "default")}
            >
              <span>
                {item.name}
                <small className="block text-xs font-medium text-on-surface-variant">
                  {likelihoodMeta[item.likelihood].label}
                </small>
              </span>
              {openCause === index && (
                <span className="material-symbols-outlined text-xl" aria-hidden="true">
                  check
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {(cause || diagnosis.advice || message.suggestedServices.length > 0) && (
        <AiRow>
          {cause && (
            <AiBubble>
              <b>{cause.name}.</b> {cause.explanation}
            </AiBubble>
          )}
          {diagnosis.advice && (
            <AiBubble>
              <b>Lời khuyên:</b> {diagnosis.advice}
            </AiBubble>
          )}
          {message.suggestedServices.length > 0 && <AiBubble>Bạn muốn đặt dịch vụ nào tại Servio?</AiBubble>}
        </AiRow>
      )}

      {message.suggestedServices.length > 0 && (
        <div className="flex flex-wrap justify-end gap-2" role="group" aria-label="Dịch vụ gợi ý tại Servio">
          {message.suggestedServices.map((service) => (
            <button
              key={service.id}
              type="button"
              onClick={() => onBook?.(service.id)}
              className={optionClass(urgent ? "danger" : "go")}
            >
              <span className="material-symbols-outlined text-xl" aria-hidden="true">
                build
              </span>
              <span>
                {service.name}
                <small className="block text-xs font-medium opacity-90">
                  {[formatPrice(service.price), "Đặt lịch ngay"].filter(Boolean).join(" · ")}
                </small>
              </span>
            </button>
          ))}
        </div>
      )}

      {showFeedback && onFeedback && (
        <>
          <AiRow>
            <AiBubble>{helpful === null ? "Kết quả này có hữu ích không?" : "Cảm ơn bạn đã đánh giá."}</AiBubble>
          </AiRow>
          <div className="flex flex-wrap justify-end gap-2" role="group" aria-label="Đánh giá kết quả">
            <FeedbackButton
              icon="thumb_up"
              label="Hữu ích"
              active={helpful === true}
              disabled={isSendingFeedback}
              onClick={() => onFeedback(true)}
            />
            <FeedbackButton
              icon="thumb_down"
              label="Chưa đúng"
              active={helpful === false}
              disabled={isSendingFeedback}
              onClick={() => onFeedback(false)}
            />
          </div>
        </>
      )}

      <p className="pl-[44px] text-xs text-outline">
        Kết quả chỉ mang tính tham khảo do AI tạo ra, không thay thế việc kỹ thuật viên kiểm tra trực tiếp.
      </p>
    </>
  );
}

function FeedbackButton({
  icon,
  label,
  active,
  disabled,
  onClick,
}: {
  icon: string;
  label: string;
  active: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      aria-pressed={active}
      onClick={onClick}
      className={optionClass(active ? "selected" : "default")}
    >
      <span className="material-symbols-outlined text-xl" aria-hidden="true">
        {icon}
      </span>
      {label}
    </button>
  );
}

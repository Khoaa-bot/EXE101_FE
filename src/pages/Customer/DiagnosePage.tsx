import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
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
const STARTER_CHIPS = ["Tiếng kêu lạ", "Đèn báo lỗi", "Xe rung lắc", "Khó nổ máy", "Hao xăng", "Điều hòa kém lạnh"];

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

const likelihoodMeta: Record<DiagnosisLikelihood, { label: string; className: string }> = {
  HIGH: { label: "Khả năng cao", className: "bg-primary-fixed text-on-primary-fixed" },
  MEDIUM: {
    label: "Khả năng trung bình",
    className: "bg-surface-container-highest text-on-surface-variant",
  },
  LOW: { label: "Khả năng thấp", className: "bg-surface-container-low text-outline" },
};

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
      <div className="mx-auto max-w-6xl p-margin-mobile md:p-margin-desktop">
        <p className="font-body-md text-body-md text-on-surface-variant">Đang tải...</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="mx-auto max-w-6xl p-margin-mobile md:p-margin-desktop">
        <p className="rounded-lg bg-error-container px-4 py-3 text-sm text-on-error-container">{loadError}</p>
      </div>
    );
  }

  if (vehicles.length === 0) {
    return (
      <div className="mx-auto max-w-6xl space-y-md p-margin-mobile md:p-margin-desktop">
        <h2 className="font-display-lg text-display-lg text-on-surface">Chẩn đoán xe bằng AI</h2>
        <p className="font-body-md text-body-md text-on-surface-variant">
          Bạn chưa có xe nào để chẩn đoán. Hãy thêm phương tiện trước.
        </p>
        <button
          type="button"
          onClick={onAddVehicleClick}
          className="min-h-11 rounded-lg bg-primary px-lg font-label-md text-label-md text-on-primary"
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

  const historyPanel = (
    <div className="space-y-sm rounded-xl border border-outline-variant bg-white p-lg">
      <h3 className="font-headline-md text-headline-md text-on-surface">Lịch sử trò chuyện</h3>
      {conversations.length === 0 ? (
        <p className="font-label-md text-label-md text-on-surface-variant">Chưa có cuộc trò chuyện nào.</p>
      ) : (
        conversations.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => void openConversation(item.id)}
            className={`flex w-full flex-col gap-1 rounded-xl border p-3 text-left transition-colors hover:bg-surface-container-low ${
              conversation?.id === item.id ? "border-primary bg-primary-fixed/30" : "border-outline-variant"
            }`}
          >
            <span className="flex items-center justify-between gap-2">
              <span className="line-clamp-1 font-label-md text-label-md font-semibold text-on-surface">
                {item.title}
              </span>
              {item.severity && (
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 font-label-sm text-label-sm font-semibold ${severityMeta[item.severity].chip}`}
                >
                  {severityMeta[item.severity].label}
                </span>
              )}
            </span>
            <span className="font-label-sm text-label-sm text-outline">
              {item.vehicleLabel} · {formatDateTime(item.updatedAt)}
            </span>
          </button>
        ))
      )}
    </div>
  );

  return (
    <div className="mx-auto max-w-6xl space-y-md p-margin-mobile pb-28 md:p-margin-desktop">
      <div className="flex flex-col justify-between gap-md sm:flex-row sm:items-start">
        <div className="min-w-0">
          <h2 className="flex items-center gap-2 font-display-lg text-display-lg text-on-surface">
            <span className="material-symbols-outlined text-[32px] text-primary" aria-hidden="true">
              auto_awesome
            </span>
            Chẩn đoán xe bằng AI
          </h2>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Trò chuyện với trợ lý để tìm nguyên nhân khả dĩ và dịch vụ phù hợp tại garage.
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={() => setShowHistory((open) => !open)}
            aria-expanded={showHistory}
            className="flex min-h-11 items-center gap-2 rounded-lg border border-outline-variant bg-white px-4 font-label-md text-label-md text-on-surface transition-colors hover:bg-surface-container-low lg:hidden"
          >
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
              history
            </span>
            Lịch sử
          </button>
          <button
            type="button"
            onClick={startNew}
            className="flex min-h-11 items-center gap-2 rounded-lg border border-outline-variant bg-white px-4 font-label-md text-label-md text-primary transition-colors hover:bg-surface-container-low"
          >
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
              add_comment
            </span>
            <span className="hidden sm:inline">Cuộc trò chuyện mới</span>
            <span className="sm:hidden">Mới</span>
          </button>
        </div>
      </div>

      {showHistory && <div className="lg:hidden">{historyPanel}</div>}

      <div className="flex flex-col gap-lg lg:flex-row lg:items-start">
        <section
          aria-label="Cuộc trò chuyện với trợ lý AI"
          className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-xl border border-outline-variant bg-white"
        >
          <div className="flex flex-wrap items-center gap-md border-b border-outline-variant bg-surface-container-low px-md py-3">
            <span className="material-symbols-outlined text-[20px] text-primary" aria-hidden="true">
              directions_car
            </span>
            {conversation ? (
              <span className="font-label-md text-label-md font-semibold text-on-surface">{vehicleLabel}</span>
            ) : (
              <>
                <label htmlFor="diagnose-vehicle" className="font-label-md text-label-md text-on-surface-variant">
                  Chẩn đoán cho xe:
                </label>
                <select
                  id="diagnose-vehicle"
                  value={selectedVehicleId ?? ""}
                  onChange={(event) => setSelectedVehicleId(Number(event.target.value))}
                  disabled={isSending}
                  className="min-h-9 rounded-lg border border-outline-variant bg-white px-3 font-label-md text-label-md text-on-surface outline-none focus:border-primary"
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
            className="max-h-[60vh] min-h-[320px] space-y-md overflow-y-auto p-md"
          >
            {isOpeningConversation ? (
              <p className="font-body-md text-body-md text-on-surface-variant">Đang tải cuộc trò chuyện...</p>
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
                  <div className="flex items-center gap-2 font-label-md text-label-md text-on-surface-variant" role="status">
                    <span className="material-symbols-outlined animate-spin text-[18px]" aria-hidden="true">
                      sync
                    </span>
                    AI đang phân tích...
                  </div>
                )}
              </>
            )}
          </div>

          {(showStarterChips || quickReplies.length > 0) && (
            <div className="flex flex-wrap gap-2 px-md pb-3" aria-label="Gợi ý trả lời nhanh">
              {(showStarterChips ? STARTER_CHIPS : quickReplies).map((chip) => (
                <button
                  key={chip}
                  type="button"
                  disabled={!canSend}
                  onClick={() => void send(chip)}
                  className="min-h-9 rounded-full border border-primary bg-white px-3 font-label-md text-label-md text-primary transition-colors hover:bg-primary-fixed/40 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {chip}
                </button>
              ))}
            </div>
          )}

          {error && (
            <p role="alert" className="mx-md mb-3 rounded-lg bg-error-container px-4 py-3 text-sm text-on-error-container">
              {error}
            </p>
          )}

          <form onSubmit={handleSubmit} className="border-t border-outline-variant p-md">
            <div className="flex items-end gap-2">
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
                className="max-h-32 min-h-11 flex-1 resize-none rounded-xl border border-outline-variant bg-white px-3 py-2.5 font-body-md text-body-md outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:bg-surface-container-low"
              />
              <button
                type="submit"
                aria-label="Gửi tin nhắn"
                disabled={!canSend || !input.trim()}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary text-on-primary transition-all hover:shadow-lg active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <span className="material-symbols-outlined" aria-hidden="true">
                  send
                </span>
              </button>
            </div>
            <div className="mt-2 flex flex-wrap justify-between gap-2 font-label-sm text-label-sm text-outline">
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

        <div className="hidden w-80 shrink-0 space-y-md lg:block">
          {historyPanel}
          <p className="flex gap-2 rounded-lg bg-surface-container-low p-3 font-label-sm text-label-sm text-on-surface-variant">
            <span className="material-symbols-outlined text-[18px] text-outline" aria-hidden="true">
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

function UserBubble({ text }: { text: string }) {
  return (
    <div className="flex justify-end">
      <p className="max-w-[85%] whitespace-pre-line rounded-2xl rounded-br-sm bg-primary px-4 py-2.5 font-body-md text-body-md text-on-primary">
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
    <div className="flex items-start gap-2">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-fixed text-primary">
        <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
          auto_awesome
        </span>
      </span>
      <div className={`min-w-0 space-y-sm ${diagnosis ? "flex-1" : "max-w-[90%]"}`}>
        {text && (
          <p className="whitespace-pre-line rounded-2xl rounded-tl-sm bg-surface-container-low px-4 py-2.5 font-body-md text-body-md text-on-surface">
            {text}
          </p>
        )}
        {diagnosis && message && (
          <ConclusionCard
            diagnosis={diagnosis}
            message={message}
            showFeedback={showFeedback}
            helpful={helpful}
            isSendingFeedback={isSendingFeedback}
            onFeedback={onFeedback}
            onBook={onBook}
          />
        )}
      </div>
    </div>
  );
}

function ConclusionCard({
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

  return (
    <div className="space-y-md rounded-xl border border-outline-variant bg-white p-md">
      <div className={`flex items-start gap-md rounded-xl border p-md ${meta.banner}`} role="status">
        <span className="material-symbols-outlined text-[28px]" aria-hidden="true">
          {meta.icon}
        </span>
        <div>
          <p className="font-label-md text-label-md font-bold">{banner.title}</p>
          <p className="font-label-md text-label-md">{banner.body}</p>
        </div>
      </div>

      {diagnosis.causes.length > 0 && (
        <div>
          <h4 className="mb-sm font-label-md text-label-md font-semibold text-on-surface">Nguyên nhân khả dĩ</h4>
          <ul className="space-y-sm">
            {diagnosis.causes.map((cause, index) => (
              <li key={`${cause.name}-${index}`} className="rounded-xl border border-outline-variant p-3">
                <div className="flex items-center justify-between gap-md">
                  <span className="font-label-md text-label-md font-semibold text-on-surface">{cause.name}</span>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-0.5 font-label-sm text-label-sm font-semibold ${likelihoodMeta[cause.likelihood].className}`}
                  >
                    {likelihoodMeta[cause.likelihood].label}
                  </span>
                </div>
                <p className="mt-1 font-label-md text-label-md text-on-surface-variant">{cause.explanation}</p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {diagnosis.advice && (
        <div className="rounded-lg bg-surface-container-low p-3">
          <p className="font-label-md text-label-md font-semibold text-on-surface">Lời khuyên</p>
          <p className="font-body-md text-body-md text-on-surface-variant">{diagnosis.advice}</p>
        </div>
      )}

      {message.suggestedServices.length > 0 && (
        <div className="space-y-sm">
          <h4 className="font-label-md text-label-md font-semibold text-on-surface">Dịch vụ gợi ý tại Servio</h4>
          {message.suggestedServices.map((service) => (
            <div
              key={service.id}
              className="flex flex-col gap-md rounded-xl border border-outline-variant p-3 sm:flex-row sm:items-center"
            >
              <div className="min-w-0 flex-1">
                <p className="font-label-md text-label-md font-semibold text-on-surface">{service.name}</p>
                <p className="font-label-sm text-label-sm text-on-surface-variant">{formatPrice(service.price)}</p>
              </div>
              <button
                type="button"
                onClick={() => onBook?.(service.id)}
                className={`min-h-11 shrink-0 rounded-lg px-lg font-label-md text-label-md text-white transition-all hover:shadow-lg active:scale-95 ${
                  urgent ? "bg-error" : "bg-primary"
                }`}
              >
                Đặt lịch ngay
              </button>
            </div>
          ))}
        </div>
      )}

      {showFeedback && onFeedback && (
        <div className="flex flex-wrap items-center justify-between gap-md border-t border-surface-container-highest pt-md">
          <span className="font-label-md text-label-md font-semibold text-on-surface">
            {helpful === null ? "Kết quả này có hữu ích không?" : "Cảm ơn bạn đã đánh giá."}
          </span>
          <div className="flex gap-2" role="group" aria-label="Đánh giá kết quả">
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
        </div>
      )}

      <p className="font-label-sm text-label-sm text-outline">
        Kết quả chỉ mang tính tham khảo do AI tạo ra, không thay thế việc kỹ thuật viên kiểm tra trực tiếp.
      </p>
    </div>
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
      className={`flex min-h-11 items-center gap-1.5 rounded-lg border px-4 font-label-md text-label-md font-semibold transition-colors disabled:opacity-60 ${
        active
          ? "border-primary bg-primary-fixed text-on-primary-fixed"
          : "border-outline-variant bg-white text-on-surface hover:bg-surface-container-low"
      }`}
    >
      <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
        {icon}
      </span>
      {label}
    </button>
  );
}

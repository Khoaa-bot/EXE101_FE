import { useEffect, useRef, useState } from "react";
import StarRating from "../../components/StarRating";
import { useDialogA11y } from "../../hooks/useDialogA11y";
import {
  getMyGarageReviews,
  getMyProfile,
  replyToReview,
  type GarageOwnerReviews,
  type ReviewItem,
} from "../../services/api";
import AdminShell, { FilterChip, StatusPill, type AdminNavProps } from "./AdminShell";

const PAGE_SIZE = 10;
const REPLY_LIMIT = 500;

type Mode = "all" | "unreplied" | "replied" | "low";

const AVATAR_TONES = [
  "bg-primary-fixed text-on-primary-fixed-variant",
  "bg-[#d9f7dd] text-[#00531a]",
  "bg-[#ffe4d6] text-[#7a2e00]",
  "bg-[#e6defa] text-[#3b2a7a]",
];

function formatDate(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleDateString("vi-VN");
}

const cardClass =
  "rounded-2xl border border-outline-variant/40 bg-surface-container-lowest shadow-[0_10px_26px_-14px_rgba(25,28,29,0.28)]";

type Result = { key: string; data: GarageOwnerReviews | null; error: string | null };

export type AdminReviewsPageProps = AdminNavProps;

export default function AdminReviewsPage(navProps: AdminReviewsPageProps) {
  const [mode, setMode] = useState<Mode>("all");
  const [query, setQuery] = useState("");
  const [appliedQuery, setAppliedQuery] = useState("");
  const [page, setPage] = useState(0);
  const [garageName, setGarageName] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [replying, setReplying] = useState<ReviewItem | null>(null);
  const [notice, setNotice] = useState("");

  const requestKey = JSON.stringify([mode, appliedQuery, page]);
  const isLoading = result?.key !== requestKey;
  const data = !isLoading ? (result?.data ?? null) : null;
  const loadError = !isLoading ? (result?.error ?? null) : null;

  useEffect(() => {
    getMyProfile()
      .then((profile) => setGarageName(profile.garageName ?? ""))
      .catch(() => undefined);
  }, []);

  // Gõ xong khoảng nửa giây mới tìm để không gọi API mỗi phím.
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setAppliedQuery((prev) => {
        const next = query.trim();
        if (next !== prev) setPage(0);
        return next;
      });
    }, 400);
    return () => window.clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    let cancelled = false;
    getMyGarageReviews({
      mode: mode === "low" ? "all" : mode,
      maxRating: mode === "low" ? 3 : undefined,
      q: appliedQuery,
      page,
      size: PAGE_SIZE,
    })
      .then((reviews) => {
        if (!cancelled) setResult({ key: requestKey, data: reviews, error: null });
      })
      .catch((err) => {
        if (!cancelled) {
          setResult({
            key: requestKey,
            data: null,
            error: err instanceof Error ? err.message : "Không tải được danh sách đánh giá.",
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [mode, appliedQuery, page, requestKey]);

  const showNotice = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 3000);
  };

  const changeMode = (next: Mode) => {
    setMode(next);
    setPage(0);
  };

  const applyReply = (updated: ReviewItem, wasReplied: boolean) => {
    setResult((prev) =>
      prev && prev.data
        ? {
            ...prev,
            data: {
              ...prev.data,
              items: prev.data.items
                .map((item) => (item.id === updated.id ? updated : item))
                // Đang ở tab "Chưa phản hồi" thì đánh giá vừa trả lời không còn thuộc tab này.
                .filter((item) => mode !== "unreplied" || item.reply === null),
              unreplied: wasReplied ? prev.data.unreplied : Math.max(0, prev.data.unreplied - 1),
              replied: wasReplied ? prev.data.replied : prev.data.replied + 1,
            },
          }
        : prev,
    );
  };

  const totalPages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1;

  const kpis = data
    ? [
        {
          icon: "star",
          tone: "bg-[#fff1cc] text-[#6b4200]",
          label: "Điểm trung bình",
          value:
            data.summary.average !== null
              ? data.summary.average.toLocaleString("vi-VN", { minimumFractionDigits: 1 })
              : "—",
          hint: `${data.summary.count.toLocaleString("vi-VN")} đánh giá`,
        },
        { icon: "mark_chat_unread", tone: "bg-[#ffe4d6] text-[#7a2e00]", label: "Chưa phản hồi", value: String(data.unreplied), hint: "" },
        { icon: "reply", tone: "bg-[#d9f7dd] text-[#00531a]", label: "Đã phản hồi", value: String(data.replied), hint: "" },
        {
          icon: "thumb_down",
          tone: "bg-error-container text-on-error-container",
          label: "Từ 2 sao trở xuống (30 ngày)",
          value: String(data.lowLast30Days),
          hint: "",
        },
      ]
    : [];

  const tabs: Array<{ key: Mode; label: string }> = [
    { key: "all", label: "Tất cả" },
    { key: "unreplied", label: data ? `Chưa phản hồi · ${data.unreplied}` : "Chưa phản hồi" },
    { key: "replied", label: "Đã phản hồi" },
    { key: "low", label: "Từ 3 sao trở xuống" },
  ];

  return (
    <>
      <AdminShell
        activeTab="reviews"
        title="Đánh giá"
        description="Xem và phản hồi đánh giá của khách tại garage."
        garageName={garageName}
        notice={notice}
        maxWidthClass="max-w-7xl"
        {...navProps}
      >
        {kpis.length > 0 && (
          <section aria-label="Số liệu đánh giá" className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {kpis.map((kpi) => (
              <article key={kpi.label} className={`${cardClass} flex items-center gap-3.5 p-[18px]`}>
                <span aria-hidden="true" className={`flex h-11 w-11 items-center justify-center rounded-[14px] ${kpi.tone}`}>
                  <span className="material-symbols-outlined">{kpi.icon}</span>
                </span>
                <div>
                  <p className="text-[13px] text-on-surface-variant">{kpi.label}</p>
                  <p className="text-[26px] font-extrabold leading-tight">{kpi.value}</p>
                  {kpi.hint && <p className="text-xs text-on-surface-variant">{kpi.hint}</p>}
                </div>
              </article>
            ))}
          </section>
        )}

        <div className="mb-5 flex flex-wrap items-center gap-3">
          <input
            aria-label="Tìm theo tên khách hoặc nội dung"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm tên khách, nội dung"
            className="min-h-11 w-80 max-w-full rounded-xl border border-outline-variant bg-surface-container-lowest px-3.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          />
          <div role="group" aria-label="Lọc đánh giá" className="flex flex-wrap gap-2">
            {tabs.map((tab) => (
              <FilterChip key={tab.key} active={mode === tab.key} onClick={() => changeMode(tab.key)}>
                {tab.label}
              </FilterChip>
            ))}
          </div>
          {data && (
            <span aria-live="polite" className="ml-auto text-[13px] text-on-surface-variant">
              Hiển thị {data.items.length} / {data.total.toLocaleString("vi-VN")} đánh giá
            </span>
          )}
        </div>

        {isLoading && <p className={`${cardClass} p-8 text-center text-on-surface-variant`}>Đang tải đánh giá...</p>}
        {loadError && (
          <p className="rounded-2xl border border-error/30 bg-error-container/10 p-8 text-center text-error">{loadError}</p>
        )}

        {data && (
          <>
            <section aria-label="Danh sách đánh giá" className={`${cardClass} overflow-hidden`}>
              {data.items.length === 0 && (
                <p className="p-8 text-center text-on-surface-variant">Chưa có đánh giá phù hợp.</p>
              )}
              <ul>
                {data.items.map((review, index) => (
                  <li
                    key={review.id}
                    className={`space-y-2.5 border-t border-outline-variant/40 px-[22px] py-5 first:border-t-0 ${
                      review.hidden ? "opacity-70" : ""
                    }`}
                  >
                    <div className="flex flex-wrap items-center gap-3.5">
                      <span
                        aria-hidden="true"
                        className={`flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-full font-extrabold ${AVATAR_TONES[index % AVATAR_TONES.length]}`}
                      >
                        {review.customerName.charAt(0).toUpperCase()}
                      </span>
                      <div className="min-w-0 flex-1">
                        <b>{review.customerName}</b>
                        <div className="text-[13px] text-on-surface-variant">
                          <StarRating value={review.rating} size={16} /> · {formatDate(review.createdAt)}
                          {review.vehicleLicensePlate ? ` · ${review.vehicleLicensePlate}` : ""}
                        </div>
                      </div>
                      {review.serviceName && (
                        <span className="rounded-full bg-surface-container px-2.5 py-1 text-xs font-semibold text-on-surface-variant">
                          {review.serviceName}
                        </span>
                      )}
                      {review.hidden ? (
                        <StatusPill tone="neutral">Quản trị viên đã ẩn</StatusPill>
                      ) : review.reply ? (
                        <StatusPill tone="success">Đã phản hồi</StatusPill>
                      ) : (
                        <StatusPill tone="warning">Chưa phản hồi</StatusPill>
                      )}
                    </div>

                    {review.hidden ? (
                      <p className="ml-14 text-sm leading-relaxed text-on-surface-variant">
                        Đánh giá này đã bị ẩn khỏi trang công khai nên không thể phản hồi và không tính vào điểm trung bình.
                      </p>
                    ) : (
                      <>
                        {review.comment && <p className="ml-14 text-sm leading-relaxed">{review.comment}</p>}
                        {review.reply ? (
                          <div className="ml-14 flex gap-2.5 rounded-2xl bg-surface-container px-3.5 py-3 text-[13px] leading-relaxed text-on-surface-variant">
                            <span aria-hidden="true" className="material-symbols-outlined text-xl text-primary">
                              subdirectory_arrow_right
                            </span>
                            <div className="min-w-0 flex-1">
                              <b className="text-on-surface">
                                Phản hồi của bạn{review.repliedAt ? ` · ${formatDate(review.repliedAt)}` : ""}
                              </b>
                              <p>{review.reply}</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => setReplying(review)}
                              className="inline-flex h-8 items-center gap-1 self-start rounded-lg px-2 text-[13px] font-bold text-on-primary-fixed-variant hover:bg-surface-container-high"
                            >
                              <span aria-hidden="true" className="material-symbols-outlined text-lg">
                                edit
                              </span>
                              Sửa
                            </button>
                          </div>
                        ) : (
                          <div className="ml-14">
                            <button
                              type="button"
                              onClick={() => setReplying(review)}
                              className="inline-flex min-h-10 items-center gap-1 rounded-xl bg-primary px-4 text-sm font-bold text-on-primary hover:opacity-90"
                            >
                              <span aria-hidden="true" className="material-symbols-outlined text-lg">
                                reply
                              </span>
                              Trả lời
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </li>
                ))}
              </ul>
            </section>

            {totalPages > 1 && (
              <nav aria-label="Phân trang" className="mt-4 flex items-center justify-between text-xs text-on-surface-variant">
                <span>
                  Trang {page + 1}/{totalPages}
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={page === 0}
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    className="min-h-9 rounded-xl border border-outline-variant px-3 text-[13px] font-semibold hover:bg-surface-container-low disabled:opacity-45"
                  >
                    Trước
                  </button>
                  <button
                    type="button"
                    disabled={page + 1 >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
                    className="min-h-9 rounded-xl border border-outline-variant px-3 text-[13px] font-semibold hover:bg-surface-container-low disabled:opacity-45"
                  >
                    Sau
                  </button>
                </div>
              </nav>
            )}
          </>
        )}
      </AdminShell>

      {replying && (
        <ReplyDialog
          review={replying}
          onCancel={() => setReplying(null)}
          onSaved={(updated) => {
            applyReply(updated, replying.reply !== null);
            showNotice(replying.reply !== null ? "Đã cập nhật phản hồi." : "Đã gửi phản hồi, khách sẽ nhận được thông báo.");
            setReplying(null);
          }}
        />
      )}
    </>
  );
}

// Hộp thoại soạn phản hồi. Gắn vào DOM chỉ khi đang mở nên nội dung luôn khởi tạo lại cho mỗi lần mở.
function ReplyDialog({
  review,
  onCancel,
  onSaved,
}: {
  review: ReviewItem;
  onCancel: () => void;
  onSaved: (updated: ReviewItem) => void;
}) {
  const [text, setText] = useState(review.reply ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  useDialogA11y(true, dialogRef, onCancel);

  const trimmed = text.trim();

  const submit = () => {
    if (!trimmed) {
      setError("Vui lòng nhập nội dung phản hồi.");
      return;
    }
    setBusy(true);
    setError(null);
    replyToReview(review.id, trimmed)
      .then(onSaved)
      .catch((err) => setError(err instanceof Error ? err.message : "Không gửi được phản hồi."))
      .finally(() => setBusy(false));
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-4">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="reply-dialog-title"
        className="max-h-[92dvh] w-full max-w-[36rem] overflow-y-auto rounded-3xl bg-surface-container-lowest p-7 shadow-[0_30px_70px_-20px_rgba(0,0,0,0.55)]"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id="reply-dialog-title" className="text-xl font-extrabold tracking-tight">
              Phản hồi đánh giá
            </h2>
            <p className="mt-1 text-[13px] text-on-surface-variant">
              Phản hồi hiển thị công khai dưới đánh giá và khách sẽ nhận được thông báo.
            </p>
          </div>
          <button
            type="button"
            aria-label="Đóng"
            onClick={onCancel}
            className="flex h-9 w-9 items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container-low"
          >
            <span aria-hidden="true" className="material-symbols-outlined">
              close
            </span>
          </button>
        </div>

        <div className="mt-4 space-y-1.5 rounded-2xl bg-surface-container-low px-4 py-3.5">
          <div className="flex flex-wrap items-center gap-2 text-[13px]">
            <b>{review.customerName}</b>
            <StarRating value={review.rating} size={16} />
            <span className="text-on-surface-variant">
              · {formatDate(review.createdAt)}
              {review.serviceName ? ` · ${review.serviceName}` : ""}
            </span>
          </div>
          {review.comment && <p className="text-sm leading-relaxed">{review.comment}</p>}
        </div>

        <div className="mt-4 space-y-1.5">
          <label htmlFor="review-reply" className="block text-[13px] font-bold">
            Nội dung phản hồi
          </label>
          <textarea
            id="review-reply"
            rows={5}
            maxLength={REPLY_LIMIT}
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full resize-none rounded-2xl border border-outline-variant bg-surface-container-lowest px-3.5 py-3 text-sm leading-relaxed outline-none focus:border-primary focus:ring-2 focus:ring-primary"
          />
          <div className="flex justify-between text-xs text-on-surface-variant">
            <span>Tối đa {REPLY_LIMIT} ký tự.</span>
            <span aria-live="polite">
              {text.length} / {REPLY_LIMIT}
            </span>
          </div>
        </div>

        <p className="mt-3 flex items-start gap-2.5 rounded-2xl bg-[#fff1cc] px-3.5 py-3 text-[13px] leading-snug text-[#6b4200]">
          <span aria-hidden="true" className="material-symbols-outlined text-xl">
            info
          </span>
          Hãy trả lời lịch sự, không nêu thông tin cá nhân của khách. Bạn có thể sửa phản hồi sau khi gửi.
        </p>

        {error && <p className="mt-3 text-sm text-error">{error}</p>}

        <div className="mt-5 flex justify-end gap-2.5">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="min-h-11 rounded-xl border-[1.5px] border-outline-variant bg-surface-container-lowest px-5 text-sm font-bold hover:bg-surface-container-low disabled:opacity-60"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={busy}
            className="flex min-h-11 items-center gap-1.5 rounded-xl bg-primary px-5 text-sm font-bold text-on-primary disabled:opacity-60"
          >
            <span aria-hidden="true" className="material-symbols-outlined text-xl">
              send
            </span>
            {busy ? "Đang gửi..." : "Gửi phản hồi"}
          </button>
        </div>
      </div>
    </div>
  );
}

import { useEffect, useRef, useState, type FormEvent } from "react";
import StarRating from "../../components/StarRating";
import { useDialogA11y } from "../../hooks/useDialogA11y";
import {
  getAdminWebFeedbacks,
  getAdminWebFeedbackStats,
  replyWebFeedback,
  setWebFeedbackHidden,
  type WebFeedback,
  type WebFeedbackPage,
  type WebFeedbackStats,
} from "../../services/api";
import { webFeedbackCategoryLabel } from "../../utils/webFeedback";
import ReasonConfirmDialog, { type DialogEffect } from "./ReasonConfirmDialog";
import { FilterChip } from "./SuperAdminChips";

const PAGE_SIZE = 20;
const REPLY_LIMIT = 500;

type RatingFilter = "all" | "5" | "4" | "3" | "2" | "1";

const RATING_FILTERS: Array<{ key: RatingFilter; label: string }> = [
  { key: "all", label: "Tất cả" },
  { key: "5", label: "5 sao" },
  { key: "4", label: "4 sao" },
  { key: "3", label: "3 sao" },
  { key: "2", label: "2 sao" },
  { key: "1", label: "1 sao" },
];

function formatDate(value: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString("vi-VN");
}

const HIDE_EFFECTS: DialogEffect[] = [
  { icon: "visibility_off", tone: "warning", text: "Đánh giá không còn hiển thị trên trang chủ." },
  { icon: "star_half", tone: "warning", text: "Điểm trung bình của website không tính đánh giá này." },
  { icon: "person", tone: "ok", text: "Người gửi vẫn thấy đánh giá của mình trong trang Cá nhân." },
  { icon: "undo", tone: "ok", text: "Có thể bỏ ẩn lại bất cứ lúc nào." },
];

type Applied = { q: string; rating: RatingFilter; includeHidden: boolean };
const EMPTY_APPLIED: Applied = { q: "", rating: "all", includeHidden: false };

type Props = {
  notify: (message: string, type?: "success" | "error") => void;
};

const cardClass =
  "rounded-2xl border border-outline-variant/50 bg-surface-container-lowest shadow-[0_10px_26px_-14px_rgba(25,28,29,0.28)]";

function senderName(feedback: WebFeedback) {
  return feedback.fullName || feedback.username || "Ẩn danh";
}

// Đánh giá website Servio: lọc, trả lời, ẩn / bỏ ẩn (không xóa).
export default function SuperAdminWebReviewsTab({ notify }: Props) {
  const [draftQuery, setDraftQuery] = useState("");
  const [applied, setApplied] = useState<Applied>(EMPTY_APPLIED);
  const [page, setPage] = useState(0);
  const [stats, setStats] = useState<WebFeedbackStats | null>(null);
  const [hiddenCount, setHiddenCount] = useState<number | null>(null);
  const [pending, setPending] = useState<WebFeedback | null>(null);
  const [replying, setReplying] = useState<WebFeedback | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ key: string; data: WebFeedbackPage | null; error: string | null } | null>(null);

  const requestKey = JSON.stringify([applied, page]);
  const isLoading = result?.key !== requestKey;
  const data = !isLoading ? (result?.data ?? null) : null;
  const loadError = !isLoading ? (result?.error ?? null) : null;

  const refreshStats = () => {
    getAdminWebFeedbackStats()
      .then(setStats)
      .catch(() => undefined);
    getAdminWebFeedbacks({ hidden: true, size: 1 })
      .then((hidden) => setHiddenCount(hidden.total))
      .catch(() => undefined);
  };

  useEffect(() => {
    let cancelled = false;
    getAdminWebFeedbackStats()
      .then((value) => {
        if (!cancelled) setStats(value);
      })
      .catch(() => undefined);
    getAdminWebFeedbacks({ hidden: true, size: 1 })
      .then((hidden) => {
        if (!cancelled) setHiddenCount(hidden.total);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    getAdminWebFeedbacks({
      rating: applied.rating === "all" ? undefined : Number(applied.rating),
      hidden: applied.includeHidden ? undefined : false,
      search: applied.q,
      page,
      size: PAGE_SIZE,
    })
      .then((feedbacks) => {
        if (!cancelled) setResult({ key: requestKey, data: feedbacks, error: null });
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
  }, [applied, page, requestKey]);

  const change = (patch: Partial<Applied>) => {
    setPage(0);
    setApplied((prev) => ({ ...prev, ...patch }));
  };

  const submitSearch = (event: FormEvent) => {
    event.preventDefault();
    change({ q: draftQuery.trim() });
  };

  const applyUpdated = (updated: WebFeedback, droppedFromList: boolean) => {
    setResult((prev) =>
      prev && prev.data
        ? {
            ...prev,
            data: {
              ...prev.data,
              items: prev.data.items
                .map((item) => (item.id === updated.id ? updated : item))
                .filter((item) => applied.includeHidden || !item.hidden),
              total: droppedFromList ? prev.data.total - 1 : prev.data.total,
            },
          }
        : prev,
    );
  };

  const confirmPending = () => {
    if (!pending) return;
    const hiding = !pending.hidden;
    setBusy(true);
    setWebFeedbackHidden(pending.id, hiding)
      .then((updated) => {
        applyUpdated(updated, hiding && !applied.includeHidden);
        notify(hiding ? "Đã ẩn đánh giá." : "Đã bỏ ẩn đánh giá.");
        refreshStats();
      })
      .catch((err) => notify(err instanceof Error ? err.message : "Không cập nhật được đánh giá.", "error"))
      .finally(() => {
        setBusy(false);
        setPending(null);
      });
  };

  const totalPages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1;
  const maxCount = stats ? Math.max(1, ...[1, 2, 3, 4, 5].map((star) => stats.ratingCounts[String(star)] ?? 0)) : 1;

  return (
    <div className="space-y-5">
      <section aria-label="Số liệu đánh giá website" className="grid gap-4 md:grid-cols-[1.3fr_1fr_1fr]">
        <article className={`${cardClass} flex items-center gap-4 p-[18px]`}>
          <div>
            <p className="text-xs text-on-surface-variant">Điểm trung bình website</p>
            <p className="text-3xl font-extrabold">
              {stats && stats.totalFeedbacks > 0
                ? stats.averageRating.toLocaleString("vi-VN", { minimumFractionDigits: 1 })
                : "—"}{" "}
              <span className="text-xs font-normal text-on-surface-variant">/ 5</span>
            </p>
          </div>
          <ul aria-label="Phân bố số sao" className="flex-1 space-y-1 text-[11px] text-on-surface-variant">
            {[5, 4, 3, 2, 1].map((star) => (
              <li key={star} className="flex items-center gap-1.5">
                <span className="w-3">{star}</span>
                <span className="h-1.5 flex-1 overflow-hidden rounded bg-surface-container">
                  <i
                    className="block h-full rounded bg-[#c47f00]"
                    style={{ width: `${stats ? ((stats.ratingCounts[String(star)] ?? 0) / maxCount) * 100 : 0}%` }}
                  />
                </span>
              </li>
            ))}
          </ul>
        </article>
        <article className={`${cardClass} flex items-center gap-3.5 p-[18px]`}>
          <span aria-hidden="true" className="flex h-12 w-12 items-center justify-center rounded-[14px] bg-primary-fixed text-on-primary-fixed-variant">
            <span className="material-symbols-outlined">forum</span>
          </span>
          <div>
            <p className="text-xs text-on-surface-variant">Đang hiển thị công khai</p>
            <p className="text-2xl font-extrabold">{stats ? stats.totalFeedbacks.toLocaleString("vi-VN") : "—"}</p>
          </div>
        </article>
        <article className={`${cardClass} flex items-center gap-3.5 p-[18px]`}>
          <span aria-hidden="true" className="flex h-12 w-12 items-center justify-center rounded-[14px] bg-[#e9eaeb] text-[#3a3f4b]">
            <span className="material-symbols-outlined">visibility_off</span>
          </span>
          <div>
            <p className="text-xs text-on-surface-variant">Đang bị ẩn</p>
            <p className="text-2xl font-extrabold">{hiddenCount === null ? "—" : hiddenCount.toLocaleString("vi-VN")}</p>
          </div>
        </article>
      </section>

      <div className="flex flex-wrap items-center gap-3">
        <form onSubmit={submitSearch} className="flex items-center gap-2">
          <input
            aria-label="Tìm theo tên, email hoặc nội dung"
            value={draftQuery}
            onChange={(e) => setDraftQuery(e.target.value)}
            placeholder="Tìm tên, email, nội dung"
            className="min-h-11 w-72 max-w-full rounded-xl border border-outline-variant bg-surface-container-lowest px-3.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          />
          <button type="submit" className="min-h-11 rounded-xl bg-primary px-4 text-sm font-bold text-on-primary hover:opacity-90">
            Tìm
          </button>
        </form>
        <div role="group" aria-label="Lọc theo số sao" className="flex flex-wrap gap-2">
          {RATING_FILTERS.map((option) => (
            <FilterChip key={option.key} active={applied.rating === option.key} onClick={() => change({ rating: option.key })}>
              {option.label}
            </FilterChip>
          ))}
          <FilterChip active={applied.includeHidden} onClick={() => change({ includeHidden: !applied.includeHidden })}>
            <span aria-hidden="true" className="material-symbols-outlined text-lg">
              visibility_off
            </span>
            Hiện cả đã ẩn
          </FilterChip>
        </div>
        {data && (
          <span className="ml-auto text-xs text-on-surface-variant" aria-live="polite">
            Hiển thị {data.items.length} / {data.total.toLocaleString("vi-VN")} đánh giá
          </span>
        )}
      </div>

      {isLoading && <p className="text-body-sm text-on-surface-variant">Đang tải đánh giá...</p>}
      {loadError && <p className="text-body-sm text-error">{loadError}</p>}

      {data && (
        <>
          <div className={`${cardClass} overflow-x-auto`}>
            <table className="w-full min-w-[1040px] text-left text-sm">
              <thead className="bg-surface-container-low text-[11px] uppercase tracking-wider text-on-surface-variant">
                <tr>
                  <th className="px-3.5 py-3 font-bold">Ngày</th>
                  <th className="px-3.5 py-3 font-bold">Người gửi</th>
                  <th className="px-3.5 py-3 font-bold">Danh mục</th>
                  <th className="px-3.5 py-3 font-bold">Sao</th>
                  <th className="px-3.5 py-3 font-bold">Nội dung</th>
                  <th className="px-3.5 py-3 font-bold">Phản hồi</th>
                  <th className="px-3.5 py-3 font-bold">Trạng thái</th>
                  <th className="px-3.5 py-3 text-right font-bold">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/50 align-top">
                {data.items.map((feedback) => (
                  <tr key={feedback.id} className={feedback.hidden ? "opacity-60" : "hover:bg-surface-container-low"}>
                    <td className="px-3.5 py-3">{formatDate(feedback.createdAt)}</td>
                    <td className="px-3.5 py-3">
                      <b>{senderName(feedback)}</b>
                      <div className="text-xs text-on-surface-variant">{feedback.email || "—"}</div>
                      <span
                        className={`mt-1 inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          feedback.userId ? "bg-primary-fixed text-on-primary-fixed-variant" : "bg-[#e9eaeb] text-[#3a3f4b]"
                        }`}
                      >
                        {feedback.userId ? "Tài khoản" : "Khách vãng lai"}
                      </span>
                    </td>
                    <td className="px-3.5 py-3">
                      <span className="whitespace-nowrap rounded-full bg-[#e9eaeb] px-2.5 py-0.5 text-xs font-semibold text-[#3a3f4b]">
                        {webFeedbackCategoryLabel(feedback.category)}
                      </span>
                    </td>
                    <td className="px-3.5 py-3">
                      <StarRating value={feedback.rating} size={16} />
                    </td>
                    <td className="max-w-[260px] px-3.5 py-3 leading-snug">
                      {feedback.title && <b className="block">{feedback.title}</b>}
                      {feedback.comment}
                    </td>
                    <td className="max-w-[220px] px-3.5 py-3">
                      {feedback.adminReply ? (
                        <>
                          <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-[#d9f7dd] px-2.5 py-1 text-xs font-semibold text-[#00531a]">
                            <i className="h-[7px] w-[7px] rounded-full bg-tertiary-container" />
                            Đã trả lời
                          </span>
                          <p className="mt-1 line-clamp-2 text-xs text-on-surface-variant">
                            {formatDate(feedback.repliedAt)} · {feedback.adminReply}
                          </p>
                        </>
                      ) : feedback.hidden ? (
                        "—"
                      ) : (
                        <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-[#ffe4d6] px-2.5 py-1 text-xs font-semibold text-[#7a2e00]">
                          <i className="h-[7px] w-[7px] rounded-full bg-[#c47f00]" />
                          Chưa trả lời
                        </span>
                      )}
                    </td>
                    <td className="px-3.5 py-3">
                      <span
                        className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${
                          feedback.hidden ? "bg-[#e9eaeb] text-[#3a3f4b]" : "bg-[#d9f7dd] text-[#00531a]"
                        }`}
                      >
                        <i className={`h-[7px] w-[7px] rounded-full ${feedback.hidden ? "bg-outline" : "bg-tertiary-container"}`} />
                        {feedback.hidden ? "Đã ẩn" : "Hiển thị"}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-3.5 py-3 text-right">
                      {!feedback.hidden && (
                        <button
                          type="button"
                          onClick={() => setReplying(feedback)}
                          className={`mr-1.5 inline-flex min-h-9 items-center gap-1 rounded-[10px] border-[1.5px] px-3 text-xs font-bold ${
                            feedback.adminReply
                              ? "border-outline-variant bg-surface-container-lowest hover:bg-surface-container-low"
                              : "border-primary bg-primary text-on-primary hover:opacity-90"
                          }`}
                        >
                          <span aria-hidden="true" className="material-symbols-outlined text-base">
                            {feedback.adminReply ? "edit" : "reply"}
                          </span>
                          {feedback.adminReply ? "Sửa trả lời" : "Trả lời"}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setPending(feedback)}
                        className="inline-flex min-h-9 items-center gap-1 rounded-[10px] border-[1.5px] border-outline-variant bg-surface-container-lowest px-3 text-xs font-bold hover:bg-surface-container-low"
                      >
                        <span aria-hidden="true" className="material-symbols-outlined text-base">
                          {feedback.hidden ? "visibility" : "visibility_off"}
                        </span>
                        {feedback.hidden ? "Bỏ ẩn" : "Ẩn"}
                      </button>
                    </td>
                  </tr>
                ))}
                {data.items.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-on-surface-variant">
                      Không có đánh giá phù hợp.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <nav aria-label="Phân trang" className="flex items-center justify-between text-sm text-on-surface-variant">
              <span>
                Trang {page + 1}/{totalPages}
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={page === 0}
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  className="min-h-9 rounded-xl border border-outline-variant px-3 font-semibold hover:bg-surface-container-low disabled:opacity-50"
                >
                  Trước
                </button>
                <button
                  type="button"
                  disabled={page + 1 >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="min-h-9 rounded-xl border border-outline-variant px-3 font-semibold hover:bg-surface-container-low disabled:opacity-50"
                >
                  Sau
                </button>
              </div>
            </nav>
          )}
        </>
      )}

      {pending && (
        <ReasonConfirmDialog
          {...(pending.hidden
            ? {
                tone: "warning" as const,
                icon: "visibility",
                confirmTitle: `Bỏ ẩn đánh giá của “${senderName(pending)}”?`,
                confirmDescription: "Đánh giá sẽ hiện lại trên trang chủ và được tính vào điểm trung bình.",
                confirmLabel: "Bỏ ẩn",
                confirmIcon: "visibility",
              }
            : {
                tone: "warning" as const,
                icon: "visibility_off",
                confirmTitle: `Ẩn đánh giá của “${senderName(pending)}”?`,
                confirmDescription: `Đánh giá ${pending.rating} sao ngày ${formatDate(pending.createdAt)}. Khi ẩn, những điều sau sẽ xảy ra:`,
                effects: HIDE_EFFECTS,
                confirmLabel: "Ẩn đánh giá",
                confirmIcon: "visibility_off",
              })}
          busy={busy}
          onCancel={() => setPending(null)}
          onConfirm={confirmPending}
        />
      )}

      {replying && (
        <ReplyDialog
          feedback={replying}
          onCancel={() => setReplying(null)}
          onSaved={(updated) => {
            applyUpdated(updated, false);
            notify(replying.adminReply ? "Đã cập nhật phản hồi." : "Đã gửi phản hồi.");
            setReplying(null);
          }}
        />
      )}
    </div>
  );
}

// Hộp thoại soạn phản hồi. Gắn vào DOM chỉ khi đang mở nên nội dung luôn khởi tạo lại cho mỗi lần mở.
function ReplyDialog({
  feedback,
  onCancel,
  onSaved,
}: {
  feedback: WebFeedback;
  onCancel: () => void;
  onSaved: (updated: WebFeedback) => void;
}) {
  const [text, setText] = useState(feedback.adminReply ?? "");
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
    replyWebFeedback(feedback.id, trimmed)
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
        aria-labelledby="web-reply-title"
        className="max-h-[92dvh] w-full max-w-[36rem] overflow-y-auto rounded-3xl bg-surface-container-lowest p-7 shadow-[0_30px_70px_-20px_rgba(0,0,0,0.55)]"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id="web-reply-title" className="text-xl font-extrabold tracking-tight">
              Trả lời đánh giá web
            </h2>
            <p className="mt-1 text-[13px] text-on-surface-variant">Phản hồi hiển thị công khai dưới tên “Servio”.</p>
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

        <div className="mt-4 space-y-1.5 rounded-2xl bg-surface-container-low px-4 py-3.5 text-sm">
          <div className="flex flex-wrap items-center gap-2.5">
            <b>{senderName(feedback)}</b>
            <span className="text-xs text-on-surface-variant">
              {feedback.email ? `${feedback.email} · ` : ""}
              {formatDate(feedback.createdAt)}
            </span>
            <span className="ml-auto rounded-full bg-[#e9eaeb] px-2.5 py-0.5 text-xs font-semibold text-[#3a3f4b]">
              {webFeedbackCategoryLabel(feedback.category)}
            </span>
          </div>
          <StarRating value={feedback.rating} size={16} />
          {feedback.title && <b className="block">{feedback.title}</b>}
          <p className="leading-relaxed text-on-surface-variant">{feedback.comment}</p>
        </div>

        <div className="mt-4 space-y-1.5">
          <label htmlFor="web-reply-text" className="block text-[13px] font-bold">
            Nội dung phản hồi
          </label>
          <textarea
            id="web-reply-text"
            rows={4}
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

        {!feedback.userId && (
          <p className="mt-3 flex items-start gap-2.5 rounded-2xl bg-primary-fixed/60 px-3.5 py-3 text-[13px] leading-snug text-on-primary-fixed-variant">
            <span aria-hidden="true" className="material-symbols-outlined text-xl">
              info
            </span>
            Người gửi là khách vãng lai nên sẽ không nhận được thông báo trong ứng dụng. Phản hồi vẫn hiển thị ở trang chủ.
          </p>
        )}

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
            className="min-h-11 rounded-xl bg-primary px-5 text-sm font-bold text-on-primary disabled:opacity-60"
          >
            {busy ? "Đang gửi..." : "Gửi phản hồi"}
          </button>
        </div>
      </div>
    </div>
  );
}

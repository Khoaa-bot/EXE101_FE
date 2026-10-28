import { useEffect, useState } from "react";
import StarRating from "../../components/StarRating";
import WebFeedbackDialog from "../../components/WebFeedbackDialog";
import { deleteMyWebFeedback, getMyWebFeedbacks, type WebFeedback } from "../../services/api";
import { webFeedbackCategoryLabel } from "../../utils/webFeedback";

function formatDate(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleDateString("vi-VN");
}

function StatusPill({ feedback }: { feedback: WebFeedback }) {
  if (feedback.hidden) {
    return (
      <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-[#e9eaeb] px-2.5 py-1 text-xs font-bold text-[#3a3f4b]">
        <span aria-hidden="true" className="material-symbols-outlined text-sm">
          visibility_off
        </span>
        Servio đã ẩn khỏi trang công khai
      </span>
    );
  }
  if (!feedback.adminReply) {
    return (
      <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-[#fff1cc] px-2.5 py-1 text-xs font-bold text-[#6b4200]">
        <i className="h-[7px] w-[7px] rounded-full bg-[#c47f00]" />
        Chưa có phản hồi
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-[#d9f7dd] px-2.5 py-1 text-xs font-bold text-[#00531a]">
      <i className="h-[7px] w-[7px] rounded-full bg-[#008730]" />
      Đang hiển thị công khai
    </span>
  );
}

// Đánh giá website Servio của chính khách: xem phản hồi, xóa, và viết đánh giá mới.
export default function MyWebFeedbackSection({ accountName }: { accountName: string }) {
  const [reloadKey, setReloadKey] = useState(0);
  const [loaded, setLoaded] = useState<{ key: number; items: WebFeedback[]; error: string | null } | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [confirmingId, setConfirmingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [notice, setNotice] = useState("");

  const isLoading = loaded?.key !== reloadKey;
  const items = !isLoading ? (loaded?.items ?? []) : [];
  const error = !isLoading ? (loaded?.error ?? null) : null;

  useEffect(() => {
    let cancelled = false;
    getMyWebFeedbacks()
      .then((list) => {
        if (!cancelled) setLoaded({ key: reloadKey, items: list, error: null });
      })
      .catch((err) => {
        if (!cancelled) {
          setLoaded({
            key: reloadKey,
            items: [],
            error: err instanceof Error ? err.message : "Không tải được đánh giá của bạn.",
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const remove = (feedback: WebFeedback) => {
    setDeletingId(feedback.id);
    deleteMyWebFeedback(feedback.id)
      .then(() => {
        setLoaded((prev) =>
          prev && prev.key === reloadKey ? { ...prev, items: prev.items.filter((item) => item.id !== feedback.id) } : prev,
        );
        setNotice("Đã xóa đánh giá.");
      })
      .catch((err) => setNotice(err instanceof Error ? err.message : "Không xóa được đánh giá."))
      .finally(() => {
        setDeletingId(null);
        setConfirmingId(null);
      });
  };

  return (
    <section
      aria-labelledby="my-web-feedback-title"
      className="rounded-3xl border border-outline-variant/40 bg-surface-container-lowest p-6 shadow-[0_10px_26px_-14px_rgba(25,28,29,0.28)]"
    >
      <div className="flex flex-wrap items-center justify-between gap-3.5">
        <div>
          <h3 id="my-web-feedback-title" className="text-lg font-extrabold">
            Đánh giá về Servio của tôi
          </h3>
          <p className="mt-1 text-[13px] text-on-surface-variant">
            Góp ý của bạn giúp Servio tốt hơn. Bạn có thể xóa đánh giá của mình bất cứ lúc nào.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setNotice("");
            setDialogOpen(true);
          }}
          className="inline-flex min-h-11 items-center gap-1.5 rounded-xl bg-primary px-5 text-sm font-bold text-on-primary hover:opacity-90"
        >
          <span aria-hidden="true" className="material-symbols-outlined text-xl">
            rate_review
          </span>
          Viết đánh giá
        </button>
      </div>

      <p role="status" aria-live="polite" className={notice ? "mt-3 text-sm font-semibold text-tertiary" : "sr-only"}>
        {notice}
      </p>

      {isLoading && <p className="mt-4 text-sm text-on-surface-variant">Đang tải...</p>}
      {error && <p className="mt-4 text-sm text-error">{error}</p>}
      {!isLoading && !error && items.length === 0 && (
        <p className="mt-4 text-sm text-on-surface-variant">Bạn chưa gửi đánh giá nào về Servio.</p>
      )}

      <div className="mt-4 space-y-3.5">
        {items.map((feedback) => (
          <article
            key={feedback.id}
            className={`space-y-2.5 rounded-[18px] border-[1.5px] p-[18px] ${
              confirmingId === feedback.id
                ? "border-error bg-[#fffafa]"
                : feedback.hidden
                  ? "border-outline-variant/50 bg-surface-container-low"
                  : "border-outline-variant/50"
            }`}
          >
            <div className="flex flex-wrap items-center gap-2.5">
              <StarRating value={feedback.rating} size={18} />
              <span className="text-[13px] text-on-surface-variant">{formatDate(feedback.createdAt)}</span>
              <span className="rounded-full bg-surface-container px-2.5 py-0.5 text-xs font-semibold text-on-surface-variant">
                {webFeedbackCategoryLabel(feedback.category)}
              </span>
              <span className="ml-auto">
                <StatusPill feedback={feedback} />
              </span>
            </div>
            <div className={feedback.hidden ? "text-on-surface-variant" : undefined}>
              {feedback.title && <b className="text-[15px]">{feedback.title}</b>}
              <p className="text-sm leading-relaxed">{feedback.comment}</p>
            </div>
            {feedback.adminReply && (
              <div className="flex gap-2.5 rounded-2xl bg-surface-container px-3.5 py-3 text-[13px] leading-relaxed text-on-surface-variant">
                <span aria-hidden="true" className="material-symbols-outlined text-xl text-primary">
                  subdirectory_arrow_right
                </span>
                <div>
                  <b className="text-on-surface">
                    Phản hồi từ Servio{feedback.repliedAt ? ` · ${formatDate(feedback.repliedAt)}` : ""}
                  </b>
                  <p>{feedback.adminReply}</p>
                </div>
              </div>
            )}

            {confirmingId === feedback.id ? (
              <div
                role="alertdialog"
                aria-labelledby={`confirm-delete-${feedback.id}`}
                className="flex flex-wrap items-center gap-3 rounded-2xl bg-error-container px-3.5 py-3"
              >
                <span aria-hidden="true" className="material-symbols-outlined text-on-error-container">
                  warning
                </span>
                <div className="min-w-[12rem] flex-1 text-[13px] leading-snug text-on-error-container">
                  <b id={`confirm-delete-${feedback.id}`}>Xóa đánh giá này?</b> Đánh giá sẽ bị xóa khỏi trang công khai và
                  không thể khôi phục.
                </div>
                <button
                  type="button"
                  onClick={() => setConfirmingId(null)}
                  disabled={deletingId === feedback.id}
                  className="min-h-10 rounded-xl border-[1.5px] border-outline-variant bg-surface-container-lowest px-4 text-sm font-bold"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={() => remove(feedback)}
                  disabled={deletingId === feedback.id}
                  className="min-h-10 rounded-xl bg-error px-4 text-sm font-bold text-on-error disabled:opacity-60"
                >
                  {deletingId === feedback.id ? "Đang xóa..." : "Xóa"}
                </button>
              </div>
            ) : (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setConfirmingId(feedback.id)}
                  className="inline-flex min-h-9 items-center gap-1 rounded-[10px] border-[1.5px] border-outline-variant bg-surface-container-lowest px-3 text-[13px] font-bold text-error hover:bg-surface-container-low"
                >
                  <span aria-hidden="true" className="material-symbols-outlined text-lg">
                    delete
                  </span>
                  Xóa đánh giá
                </button>
              </div>
            )}
          </article>
        ))}
      </div>

      {dialogOpen && (
        <WebFeedbackDialog
          accountName={accountName}
          onClose={() => setDialogOpen(false)}
          onSubmitted={() => {
            setDialogOpen(false);
            setNotice("Cảm ơn bạn! Đánh giá của bạn đã được gửi.");
            setReloadKey((key) => key + 1);
          }}
        />
      )}
    </section>
  );
}

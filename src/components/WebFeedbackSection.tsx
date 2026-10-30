import { useEffect, useState } from "react";
import {
  getPublicWebFeedbacks,
  getStoredAuthSession,
  getWebFeedbackStats,
  type WebFeedback,
  type WebFeedbackStats,
} from "../services/api";
import StarRating from "./StarRating";
import { webFeedbackCategoryLabel } from "../utils/webFeedback";
import WebFeedbackDialog from "./WebFeedbackDialog";

const PAGE_SIZE = 5;

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

type Loaded = { stats: WebFeedbackStats; items: WebFeedback[]; total: number; page: number };

// Khối "Khách hàng nói gì về Servio" ở trang chủ: điểm trung bình, phân bố sao, đánh giá mới nhất và nút gửi đánh giá.
export default function WebFeedbackSection({ onLoginClick }: { onLoginClick?: () => void }) {
  const [loaded, setLoaded] = useState<{ key: number; data: Loaded | null; error: string | null } | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [thanks, setThanks] = useState(false);

  const isLoading = loaded?.key !== reloadKey;
  const data = !isLoading ? (loaded?.data ?? null) : null;
  const error = !isLoading ? (loaded?.error ?? null) : null;
  const session = getStoredAuthSession();
  const accountName = session?.token ? session.username : null;

  useEffect(() => {
    let cancelled = false;
    Promise.all([getWebFeedbackStats(), getPublicWebFeedbacks(0, PAGE_SIZE)])
      .then(([stats, firstPage]) => {
        if (!cancelled) {
          setLoaded({
            key: reloadKey,
            data: { stats, items: firstPage.items, total: firstPage.total, page: firstPage.page },
            error: null,
          });
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setLoaded({
            key: reloadKey,
            data: null,
            error: err instanceof Error ? err.message : "Không tải được đánh giá.",
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const loadMore = () => {
    if (!data || loadingMore) return;
    setLoadingMore(true);
    getPublicWebFeedbacks(data.page + 1, PAGE_SIZE)
      .then((next) => {
        setLoaded((prev) =>
          prev && prev.data && prev.key === reloadKey
            ? {
                ...prev,
                data: { ...prev.data, items: [...prev.data.items, ...next.items], total: next.total, page: next.page },
              }
            : prev,
        );
      })
      .catch(() => undefined)
      .finally(() => setLoadingMore(false));
  };

  const stats = data?.stats;
  const maxCount = stats ? Math.max(1, ...[1, 2, 3, 4, 5].map((star) => stats.ratingCounts[String(star)] ?? 0)) : 1;
  const hasReviews = Boolean(stats && stats.totalFeedbacks > 0);

  return (
    <section id="danh-gia" aria-labelledby="web-feedback-section-title" className="scroll-mt-4 bg-surface-container-low py-20">
      <div className="mx-auto max-w-6xl px-lg">
        <div className="mx-auto max-w-[42rem] text-center">
          <p className="text-sm font-bold uppercase tracking-widest text-primary">Đánh giá từ người dùng</p>
          <h2 id="web-feedback-section-title" className="mt-2 text-[30px] font-extrabold tracking-tight md:text-[36px]">
            Khách hàng nói gì về Servio
          </h2>
        </div>

        <div className="mt-10 grid items-start gap-6 lg:grid-cols-[21.25rem_1fr]">
          <div className="space-y-4 rounded-3xl bg-surface-container-lowest p-6 shadow-sm">
            {hasReviews && stats ? (
              <>
                <div className="flex items-baseline gap-2.5">
                  <b className="text-[52px] font-extrabold leading-none tracking-tight">
                    {stats.averageRating.toLocaleString("vi-VN", { minimumFractionDigits: 1 })}
                  </b>
                  <span className="text-[13px] text-on-surface-variant">
                    trên 5 · {stats.totalFeedbacks.toLocaleString("vi-VN")} đánh giá
                  </span>
                </div>
                <StarRating value={stats.averageRating} size={20} />
                <ul className="space-y-2.5" aria-label="Phân bố số sao">
                  {[5, 4, 3, 2, 1].map((star) => {
                    const count = stats.ratingCounts[String(star)] ?? 0;
                    return (
                      <li key={star} className="flex items-center gap-2.5 text-[13px]">
                        <span className="w-9">{star} sao</span>
                        <span className="h-2 flex-1 overflow-hidden rounded bg-surface-container">
                          <i className="block h-full rounded bg-[#c47f00]" style={{ width: `${(count / maxCount) * 100}%` }} />
                        </span>
                        <span className="w-10 text-right text-on-surface-variant">{count.toLocaleString("vi-VN")}</span>
                      </li>
                    );
                  })}
                </ul>
              </>
            ) : (
              <p className="text-sm text-on-surface-variant">
                {isLoading ? "Đang tải..." : error ?? "Chưa có đánh giá nào. Hãy là người đầu tiên!"}
              </p>
            )}
            <button
              type="button"
              onClick={() => {
                setThanks(false);
                setDialogOpen(true);
              }}
              className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-on-primary hover:opacity-90"
            >
              <span aria-hidden="true" className="material-symbols-outlined text-xl">
                rate_review
              </span>
              Viết đánh giá về Servio
            </button>
            <p className="text-xs leading-snug text-on-surface-variant">
              {accountName ? `Bạn đang đăng nhập với tên ${accountName}.` : "Không cần đăng nhập. Email của bạn không hiển thị công khai."}
            </p>
            <p role="status" aria-live="polite" className={thanks ? "text-sm font-semibold text-tertiary" : "sr-only"}>
              {thanks ? "Cảm ơn bạn! Đánh giá của bạn đã được gửi." : ""}
            </p>
          </div>

          <div className="rounded-3xl bg-surface-container-lowest p-6 shadow-sm">
            <h3 className="text-lg font-extrabold">Đánh giá mới nhất</h3>
            {data && data.items.length === 0 && (
              <p className="py-6 text-sm text-on-surface-variant">Chưa có đánh giá nào để hiển thị.</p>
            )}
            <ul className="mt-2">
              {data?.items.map((review, index) => (
                <li key={review.id} className="space-y-2 border-t border-outline-variant/40 py-5 first:border-t-0">
                  <div className="flex items-center gap-3.5">
                    <span
                      aria-hidden="true"
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-extrabold ${AVATAR_TONES[index % AVATAR_TONES.length]}`}
                    >
                      {(review.fullName ?? "K").charAt(0).toUpperCase()}
                    </span>
                    <div className="min-w-0 flex-1">
                      <b>{review.fullName ?? "Khách hàng"}</b>
                      <div className="text-[13px] text-on-surface-variant">
                        <StarRating value={review.rating} size={16} /> · {formatDate(review.createdAt)}
                      </div>
                    </div>
                    <span className="rounded-full bg-surface-container px-2.5 py-1 text-xs font-semibold text-on-surface-variant">
                      {webFeedbackCategoryLabel(review.category)}
                    </span>
                  </div>
                  <div className="ml-[54px]">
                    {review.title && <b className="text-[15px]">{review.title}</b>}
                    <p className="text-sm leading-relaxed">{review.comment}</p>
                  </div>
                  {review.adminReply && (
                    <div className="ml-[54px] flex gap-2.5 rounded-2xl bg-surface-container px-3.5 py-3 text-[13px] leading-relaxed text-on-surface-variant">
                      <span aria-hidden="true" className="material-symbols-outlined text-xl text-primary">
                        subdirectory_arrow_right
                      </span>
                      <div>
                        <b className="text-on-surface">
                          Phản hồi từ Servio{review.repliedAt ? ` · ${formatDate(review.repliedAt)}` : ""}
                        </b>
                        <p>{review.adminReply}</p>
                      </div>
                    </div>
                  )}
                </li>
              ))}
            </ul>
            {data && data.total > 0 && (
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-outline-variant/40 pt-4">
                <span aria-live="polite" className="text-[13px] text-on-surface-variant">
                  Hiển thị {data.items.length} / {data.total.toLocaleString("vi-VN")} đánh giá
                </span>
                {data.items.length < data.total && (
                  <button
                    type="button"
                    onClick={loadMore}
                    disabled={loadingMore}
                    className="inline-flex min-h-10 items-center gap-1 rounded-xl border-[1.5px] border-outline-variant bg-surface-container-lowest px-4 text-sm font-bold hover:bg-surface-container-low disabled:opacity-60"
                  >
                    {loadingMore ? "Đang tải..." : "Xem thêm đánh giá"}
                    <span aria-hidden="true" className="material-symbols-outlined text-xl">
                      expand_more
                    </span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {dialogOpen && (
        <WebFeedbackDialog
          accountName={accountName}
          onLoginClick={onLoginClick}
          onClose={() => setDialogOpen(false)}
          onSubmitted={() => {
            setDialogOpen(false);
            setThanks(true);
            setReloadKey((key) => key + 1);
          }}
        />
      )}
    </section>
  );
}

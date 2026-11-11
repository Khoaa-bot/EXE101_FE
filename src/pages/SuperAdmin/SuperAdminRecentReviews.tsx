import { useEffect, useState } from "react";
import StarRating from "../../components/StarRating";
import { getAdminWebFeedbacks, getAdminWebFeedbackStats, type WebFeedback } from "../../services/api";

type Stats = { average: number | null; count: number };

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString("vi-VN");
}

// Đánh giá website gần đây cho trang Tổng quan: điểm trung bình và 3 đánh giá mới nhất.
export default function SuperAdminRecentReviews({ onSeeAll }: { onSeeAll: () => void }) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const [stats, setStats] = useState<Stats>({ average: null, count: 0 });
  const [recent, setRecent] = useState<WebFeedback[]>([]);

  useEffect(() => {
    let cancelled = false;
    Promise.all([getAdminWebFeedbackStats(), getAdminWebFeedbacks({ hidden: false, size: 3 })])
      .then(([feedbackStats, page]) => {
        if (cancelled) return;
        setStats({
          average: feedbackStats.totalFeedbacks > 0 ? feedbackStats.averageRating : null,
          count: feedbackStats.totalFeedbacks,
        });
        setRecent(page.items);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      })
      .finally(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section
      aria-labelledby="recent-reviews-title"
      className="rounded-2xl border border-outline-variant/40 bg-surface-container-lowest p-5"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="recent-reviews-title" className="font-headline-md text-headline-md font-bold">
          Đánh giá website gần đây
        </h2>
        <button
          type="button"
          onClick={onSeeAll}
          className="flex min-h-9 items-center gap-1 rounded-[10px] border-[1.5px] border-primary bg-surface-container-lowest px-3 text-xs font-bold text-on-primary-fixed-variant hover:bg-primary-fixed/40"
        >
          Xem tất cả
          <span aria-hidden="true" className="material-symbols-outlined text-[18px]">
            arrow_forward
          </span>
        </button>
      </div>

      {!loaded ? (
        <p className="mt-4 text-body-sm text-on-surface-variant">Đang tải đánh giá...</p>
      ) : failed ? (
        <p className="mt-4 text-body-sm text-error">Không tải được đánh giá.</p>
      ) : (
        <div className="mt-4 grid gap-5 md:grid-cols-[220px_1fr]">
          <div>
            <p className="text-3xl font-extrabold">
              {stats.average === null
                ? "—"
                : stats.average.toLocaleString("vi-VN", { minimumFractionDigits: 1 })}
              <span className="ml-1 text-xs font-normal text-on-surface-variant">/ 5</span>
            </p>
            <StarRating value={stats.average ?? 0} size={16} />
            <p className="mt-1 text-xs text-on-surface-variant">
              {stats.count.toLocaleString("vi-VN")} đánh giá đang hiển thị
            </p>
          </div>

          <ul className="space-y-2.5">
            {recent.map((item) => (
              <li key={item.id} className="rounded-xl border border-outline-variant/40 bg-surface px-4 py-3">
                <div className="flex flex-wrap items-center gap-2">
                  <b className="text-sm">{item.fullName || item.username || "Ẩn danh"}</b>
                  <span className="ml-auto text-[11px] text-on-surface-variant">{formatDate(item.createdAt)}</span>
                </div>
                <div className="mt-0.5 flex items-center gap-2">
                  <StarRating value={item.rating} size={14} />
                  <p className="min-w-0 truncate text-xs text-on-surface-variant">{item.comment}</p>
                </div>
              </li>
            ))}
            {recent.length === 0 && (
              <li className="rounded-xl bg-surface px-4 py-6 text-center text-sm text-on-surface-variant">
                Chưa có đánh giá nào.
              </li>
            )}
          </ul>
        </div>
      )}
    </section>
  );
}

import { useEffect, useState } from "react";
import StarRating from "../../components/StarRating";
import {
  getAdminReviews,
  getAdminReviewStats,
  getAdminWebFeedbacks,
  getAdminWebFeedbackStats,
} from "../../services/api";

type Recent = {
  key: string;
  name: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  source: "Garage" | "Website";
};

type RatingSummary = { average: number | null; count: number };

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString("vi-VN");
}

// Điểm trung bình toàn nền tảng: gộp đánh giá garage và đánh giá website, có trọng số theo số lượt.
function combine(garage: RatingSummary, web: RatingSummary) {
  const count = garage.count + web.count;
  if (count === 0) return { average: null, count };
  const sum = (garage.average ?? 0) * garage.count + (web.average ?? 0) * web.count;
  return { average: Math.round((sum / count) * 10) / 10, count };
}

// Đánh giá gần đây cho trang Tổng quan: điểm trung bình chung và 3 đánh giá mới nhất (garage + website).
export default function SuperAdminRecentReviews({ onSeeAll }: { onSeeAll: () => void }) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const [garage, setGarage] = useState<RatingSummary>({ average: null, count: 0 });
  const [web, setWeb] = useState<RatingSummary>({ average: null, count: 0 });
  const [recent, setRecent] = useState<Recent[]>([]);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      getAdminReviewStats(),
      // BE trả danh sách mới nhất trước; lấy rộng rồi tự sắp lại để chắc chắn đúng 3 đánh giá mới nhất.
      getAdminReviews({ size: 1000 }),
      getAdminWebFeedbackStats(),
      getAdminWebFeedbacks({ hidden: false, size: 20 }),
    ])
      .then(([garageStats, garagePage, webStats, webPage]) => {
        if (cancelled) return;
        setGarage({ average: garageStats.reviewAverage, count: garageStats.reviewCount });
        setWeb({
          average: webStats.totalFeedbacks > 0 ? webStats.averageRating : null,
          count: webStats.totalFeedbacks,
        });
        const items: Recent[] = [
          ...garagePage.items.map((item) => ({
            key: `g-${item.id}`,
            name: item.customerName,
            rating: item.rating,
            comment: item.comment,
            createdAt: item.createdAt,
            source: "Garage" as const,
          })),
          ...webPage.items.map((item) => ({
            key: `w-${item.id}`,
            name: item.fullName || item.username || "Ẩn danh",
            rating: item.rating,
            comment: item.comment,
            createdAt: item.createdAt,
            source: "Website" as const,
          })),
        ];
        items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setRecent(items.slice(0, 3));
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

  const overall = combine(garage, web);

  return (
    <section
      aria-labelledby="recent-reviews-title"
      className="rounded-2xl border border-outline-variant/40 bg-surface-container-lowest p-5"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="recent-reviews-title" className="font-headline-md text-headline-md font-bold">
          Đánh giá gần đây
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
              {overall.average === null
                ? "—"
                : overall.average.toLocaleString("vi-VN", { minimumFractionDigits: 1 })}
              <span className="ml-1 text-xs font-normal text-on-surface-variant">/ 5</span>
            </p>
            <StarRating value={overall.average ?? 0} size={16} />
            <p className="mt-1 text-xs text-on-surface-variant">
              {overall.count.toLocaleString("vi-VN")} đánh giá trên toàn hệ thống
            </p>
            <dl className="mt-3 space-y-1 text-xs text-on-surface-variant">
              <div className="flex justify-between gap-2">
                <dt>Garage</dt>
                <dd className="font-bold text-on-surface">
                  {garage.average === null ? "—" : garage.average.toLocaleString("vi-VN")} ({garage.count})
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt>Website</dt>
                <dd className="font-bold text-on-surface">
                  {web.average === null ? "—" : web.average.toLocaleString("vi-VN")} ({web.count})
                </dd>
              </div>
            </dl>
          </div>

          <ul className="space-y-2.5">
            {recent.map((item) => (
              <li key={item.key} className="rounded-xl border border-outline-variant/40 bg-surface px-4 py-3">
                <div className="flex flex-wrap items-center gap-2">
                  <b className="text-sm">{item.name}</b>
                  <span className="rounded-full bg-[#e9eaeb] px-2 py-0.5 text-[11px] font-semibold text-[#3a3f4b]">
                    {item.source}
                  </span>
                  <span className="ml-auto text-[11px] text-on-surface-variant">{formatDate(item.createdAt)}</span>
                </div>
                <div className="mt-0.5 flex items-center gap-2">
                  <StarRating value={item.rating} size={14} />
                  {item.comment && (
                    <p className="min-w-0 truncate text-xs text-on-surface-variant">{item.comment}</p>
                  )}
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

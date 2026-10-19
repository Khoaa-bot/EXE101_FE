import { useEffect, useState } from "react";
import StarRating from "../../components/StarRating";
import { getGarageReviews, type ReviewItem, type ReviewSummary } from "../../services/api";

const PAGE_SIZE = 5;

type Filter = "all" | "5" | "4" | "low";

const FILTERS: Array<{ key: Filter; label: string }> = [
  { key: "all", label: "Tất cả" },
  { key: "5", label: "5 sao" },
  { key: "4", label: "4 sao" },
  { key: "low", label: "Từ 3 sao trở xuống" },
];

const AVATAR_TONES = [
  "bg-primary-fixed text-on-primary-fixed-variant",
  "bg-[#d9f7dd] text-[#00531a]",
  "bg-[#ffe4d6] text-[#7a2e00]",
  "bg-[#e6defa] text-[#3b2a7a]",
];

function rangeOf(filter: Filter): { minRating?: number; maxRating?: number } {
  if (filter === "5") return { minRating: 5, maxRating: 5 };
  if (filter === "4") return { minRating: 4, maxRating: 4 };
  if (filter === "low") return { maxRating: 3 };
  return {};
}

function formatDate(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleDateString("vi-VN");
}

type Loaded = {
  filterKey: string;
  items: ReviewItem[];
  total: number;
  page: number;
  error: string | null;
};

const cardClass =
  "rounded-xl border border-outline-variant bg-white shadow-sm";

// Điểm trung bình, phân bố sao và danh sách đánh giá công khai của một garage.
export default function GarageReviewsSection({ garageId }: { garageId: number | string }) {
  const [filter, setFilter] = useState<Filter>("all");
  const [summary, setSummary] = useState<ReviewSummary | null>(null);
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);

  const filterKey = `${garageId}|${filter}`;
  const isLoading = loaded?.filterKey !== filterKey;

  useEffect(() => {
    let cancelled = false;
    getGarageReviews(garageId, { ...rangeOf(filter), page: 0, size: PAGE_SIZE })
      .then((data) => {
        if (cancelled) return;
        setSummary(data.summary);
        setLoaded({ filterKey, items: data.items, total: data.total, page: data.page, error: null });
      })
      .catch((err) => {
        if (!cancelled) {
          setLoaded({
            filterKey,
            items: [],
            total: 0,
            page: 0,
            error: err instanceof Error ? err.message : "Không tải được đánh giá.",
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [garageId, filter, filterKey]);

  const loadMore = () => {
    if (!loaded || loadingMore) return;
    setLoadingMore(true);
    getGarageReviews(garageId, { ...rangeOf(filter), page: loaded.page + 1, size: PAGE_SIZE })
      .then((data) => {
        setLoaded((prev) =>
          prev && prev.filterKey === filterKey
            ? { ...prev, items: [...prev.items, ...data.items], total: data.total, page: data.page }
            : prev,
        );
      })
      .catch(() => undefined)
      .finally(() => setLoadingMore(false));
  };

  const items = !isLoading && loaded ? loaded.items : [];
  const total = !isLoading && loaded ? loaded.total : 0;
  const error = !isLoading && loaded ? loaded.error : null;
  const maxCount = summary ? Math.max(1, ...summary.distribution) : 1;

  return (
    <section aria-labelledby="garage-reviews-title" className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[21.25rem_1fr]">
      <div className={`${cardClass} space-y-3.5 p-[22px]`}>
        <h2 id="garage-reviews-title" className="text-lg font-extrabold">
          Điểm trung bình
        </h2>
        {summary && summary.count > 0 && summary.average !== null ? (
          <>
            <div className="flex items-baseline gap-2.5">
              <b className="text-[52px] font-extrabold leading-none tracking-tight">
                {summary.average.toLocaleString("vi-VN", { minimumFractionDigits: 1 })}
              </b>
              <span className="text-[13px] text-on-surface-variant">
                trên 5 · {summary.count.toLocaleString("vi-VN")} đánh giá
              </span>
            </div>
            <StarRating value={summary.average} size={20} />
            <ul className="space-y-2.5 pt-1" aria-label="Phân bố số sao">
              {[5, 4, 3, 2, 1].map((star) => {
                const count = summary.distribution[star - 1] ?? 0;
                return (
                  <li key={star} className="flex items-center gap-2.5 text-[13px]">
                    <span className="w-9">{star} sao</span>
                    <span className="h-2 flex-1 overflow-hidden rounded bg-surface-container">
                      <i className="block h-full rounded bg-[#c47f00]" style={{ width: `${(count / maxCount) * 100}%` }} />
                    </span>
                    <span className="w-8 text-right text-on-surface-variant">{count}</span>
                  </li>
                );
              })}
            </ul>
          </>
        ) : (
          <p className="text-sm text-on-surface-variant">
            {summary ? "Garage này chưa có đánh giá nào." : "Đang tải..."}
          </p>
        )}
      </div>

      <div className={`${cardClass} p-[22px]`}>
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <h2 className="text-lg font-extrabold">Đánh giá từ khách hàng</h2>
          <div role="group" aria-label="Lọc theo số sao" className="flex flex-wrap gap-2">
            {FILTERS.map((option) => (
              <button
                key={option.key}
                type="button"
                aria-pressed={filter === option.key}
                onClick={() => setFilter(option.key)}
                className={`min-h-9 rounded-full border px-3.5 text-[13px] font-semibold ${
                  filter === option.key
                    ? "border-primary bg-primary-fixed text-on-primary-fixed-variant"
                    : "border-outline-variant bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container-low"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {isLoading && <p className="py-6 text-sm text-on-surface-variant">Đang tải đánh giá...</p>}
        {error && <p className="py-6 text-sm text-error">{error}</p>}
        {!isLoading && !error && items.length === 0 && (
          <p className="py-6 text-sm text-on-surface-variant">Chưa có đánh giá phù hợp.</p>
        )}

        <ul className="mt-3.5">
          {items.map((review, index) => (
            <li key={review.id} className="space-y-2 border-t border-outline-variant/40 py-[18px] first:border-t-0">
              <div className="flex items-center gap-3.5">
                <span
                  aria-hidden="true"
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-extrabold ${AVATAR_TONES[index % AVATAR_TONES.length]}`}
                >
                  {review.customerName.charAt(0).toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <b>{review.customerName}</b>
                  <div className="text-[13px] text-on-surface-variant">
                    <StarRating value={review.rating} size={16} /> · {formatDate(review.createdAt)}
                  </div>
                </div>
                {review.serviceName && (
                  <span className="rounded-full bg-surface-container px-2.5 py-1 text-xs font-semibold text-on-surface-variant">
                    {review.serviceName}
                  </span>
                )}
              </div>
              {review.comment && <p className="ml-[54px] text-sm leading-relaxed">{review.comment}</p>}
              {review.reply && (
                <div className="ml-[54px] flex gap-2.5 rounded-2xl bg-surface-container px-3.5 py-3 text-[13px] leading-relaxed text-on-surface-variant">
                  <span aria-hidden="true" className="material-symbols-outlined text-xl text-primary">
                    subdirectory_arrow_right
                  </span>
                  <div>
                    <b className="text-on-surface">
                      Phản hồi từ garage{review.repliedAt ? ` · ${formatDate(review.repliedAt)}` : ""}
                    </b>
                    <p>{review.reply}</p>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>

        {!isLoading && !error && total > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-outline-variant/40 pt-4">
            <span aria-live="polite" className="text-[13px] text-on-surface-variant">
              Hiển thị {items.length} / {total.toLocaleString("vi-VN")} đánh giá
            </span>
            {items.length < total && (
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
    </section>
  );
}

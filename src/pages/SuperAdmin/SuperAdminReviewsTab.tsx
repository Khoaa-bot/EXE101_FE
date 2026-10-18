import { useEffect, useState, type ComponentProps, type FormEvent } from "react";
import StarRating from "../../components/StarRating";
import {
  getAdminGarages,
  getAdminReviewStats,
  getAdminReviews,
  setReviewHidden,
  type ReviewStats,
  type ReviewItem,
  type ReviewPage,
  type SuperAdminGarage,
} from "../../services/api";
import ReasonConfirmDialog, { type DialogEffect } from "./ReasonConfirmDialog";
import { FilterChip } from "./SuperAdminChips";

const PAGE_SIZE = 20;

type RatingFilter = "all" | "5" | "4" | "low";
type DialogConfig = Omit<ComponentProps<typeof ReasonConfirmDialog>, "busy" | "onCancel" | "onConfirm">;

const RATING_FILTERS: Array<{ key: RatingFilter; label: string }> = [
  { key: "all", label: "Tất cả" },
  { key: "5", label: "5 sao" },
  { key: "4", label: "4 sao" },
  { key: "low", label: "Từ 2 sao trở xuống" },
];

function rangeOf(filter: RatingFilter): { minRating?: number; maxRating?: number } {
  if (filter === "5") return { minRating: 5, maxRating: 5 };
  if (filter === "4") return { minRating: 4, maxRating: 4 };
  if (filter === "low") return { maxRating: 2 };
  return {};
}

function formatDate(value: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString("vi-VN");
}

const HIDE_EFFECTS: DialogEffect[] = [
  { icon: "visibility_off", tone: "warning", text: "Đánh giá không còn hiển thị trên trang garage." },
  { icon: "star_half", tone: "warning", text: "Điểm trung bình của garage không tính đánh giá này." },
  { icon: "person", tone: "ok", text: "Khách vẫn thấy đánh giá của mình trong Lịch sử." },
  { icon: "undo", tone: "ok", text: "Có thể bỏ ẩn lại bất cứ lúc nào." },
];

function buildDialog(review: ReviewItem): DialogConfig {
  const who = review.customerUsername || review.customerName;
  if (review.hidden) {
    return {
      tone: "warning",
      icon: "visibility",
      confirmTitle: `Bỏ ẩn đánh giá của “${who}”?`,
      confirmDescription: "Đánh giá sẽ hiện lại trên trang garage và được tính vào điểm trung bình.",
      confirmLabel: "Bỏ ẩn",
      confirmIcon: "visibility",
    };
  }
  return {
    tone: "warning",
    icon: "visibility_off",
    confirmTitle: `Ẩn đánh giá của “${who}”?`,
    confirmDescription: `Đánh giá ${review.rating} sao cho ${review.garageName ?? "garage"} ngày ${formatDate(review.createdAt)}. Khi ẩn, những điều sau sẽ xảy ra:`,
    effects: HIDE_EFFECTS,
    confirmLabel: "Ẩn đánh giá",
    confirmIcon: "visibility_off",
  };
}

type Applied = { q: string; garageId: string; rating: RatingFilter; includeHidden: boolean };
const EMPTY_APPLIED: Applied = { q: "", garageId: "", rating: "all", includeHidden: false };

type Props = {
  notify: (message: string, type?: "success" | "error") => void;
};

const cardClass =
  "rounded-2xl border border-outline-variant/50 bg-surface-container-lowest shadow-[0_10px_26px_-14px_rgba(25,28,29,0.28)]";

// Đánh giá của khách trên mọi garage: lọc, xem và ẩn / bỏ ẩn (không xóa).
export default function SuperAdminReviewsTab({ notify }: Props) {
  const [draftQuery, setDraftQuery] = useState("");
  const [applied, setApplied] = useState<Applied>(EMPTY_APPLIED);
  const [page, setPage] = useState(0);
  const [garages, setGarages] = useState<SuperAdminGarage[]>([]);
  const [overview, setOverview] = useState<ReviewStats | null>(null);
  const [pending, setPending] = useState<ReviewItem | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ key: string; data: ReviewPage | null; error: string | null } | null>(null);

  const requestKey = JSON.stringify([applied, page]);
  const isLoading = result?.key !== requestKey;
  const data = !isLoading ? (result?.data ?? null) : null;
  const loadError = !isLoading ? (result?.error ?? null) : null;

  useEffect(() => {
    getAdminGarages(true)
      .then(setGarages)
      .catch(() => undefined);
    getAdminReviewStats()
      .then(setOverview)
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    let cancelled = false;
    getAdminReviews({
      garageId: applied.garageId ? Number(applied.garageId) : undefined,
      ...rangeOf(applied.rating),
      includeHidden: applied.includeHidden,
      q: applied.q,
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
  }, [applied, page, requestKey]);

  const change = (patch: Partial<Applied>) => {
    setPage(0);
    setApplied((prev) => ({ ...prev, ...patch }));
  };

  const submitSearch = (event: FormEvent) => {
    event.preventDefault();
    change({ q: draftQuery.trim() });
  };

  const confirmPending = () => {
    if (!pending) return;
    const hiding = !pending.hidden;
    setBusy(true);
    setReviewHidden(pending.id, hiding)
      .then((updated) => {
        setResult((prev) =>
          prev && prev.data
            ? {
                ...prev,
                data: {
                  ...prev.data,
                  items: prev.data.items
                    .map((item) => (item.id === updated.id ? updated : item))
                    .filter((item) => applied.includeHidden || !item.hidden),
                  total: applied.includeHidden ? prev.data.total : prev.data.total - (hiding ? 1 : 0),
                },
              }
            : prev,
        );
        notify(hiding ? "Đã ẩn đánh giá." : "Đã bỏ ẩn đánh giá.");
        getAdminReviewStats()
          .then(setOverview)
          .catch(() => undefined);
      })
      .catch((err) => notify(err instanceof Error ? err.message : "Không cập nhật được đánh giá.", "error"))
      .finally(() => {
        setBusy(false);
        setPending(null);
      });
  };

  const totalPages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1;
  const growth =
    overview && overview.reviewsPrevious30Days > 0
      ? Math.round(((overview.reviewsLast30Days - overview.reviewsPrevious30Days) / overview.reviewsPrevious30Days) * 100)
      : null;

  return (
    <div className="space-y-5">
      <section aria-label="Số liệu đánh giá" className="grid gap-4 md:grid-cols-3">
        <article className={`${cardClass} flex items-center gap-3.5 p-[18px]`}>
          <span aria-hidden="true" className="flex h-12 w-12 items-center justify-center rounded-[14px] bg-[#fff1cc] text-[#6b4200]">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
              star
            </span>
          </span>
          <div>
            <p className="text-xs text-on-surface-variant">Điểm trung bình toàn hệ thống</p>
            <p className="text-2xl font-extrabold">
              {overview?.reviewAverage != null ? overview.reviewAverage.toLocaleString("vi-VN", { minimumFractionDigits: 1 }) : "—"}{" "}
              <span className="text-xs font-normal text-on-surface-variant">
                / 5 · {overview ? overview.reviewCount.toLocaleString("vi-VN") : "—"} đánh giá
              </span>
            </p>
          </div>
        </article>
        <article className={`${cardClass} flex items-center gap-3.5 p-[18px]`}>
          <span aria-hidden="true" className="flex h-12 w-12 items-center justify-center rounded-[14px] bg-primary-fixed text-on-primary-fixed-variant">
            <span className="material-symbols-outlined">schedule</span>
          </span>
          <div>
            <p className="text-xs text-on-surface-variant">Đánh giá 30 ngày qua</p>
            <p className="text-2xl font-extrabold">
              {overview ? overview.reviewsLast30Days.toLocaleString("vi-VN") : "—"}{" "}
              {growth !== null && (
                <span className="text-xs font-normal text-on-surface-variant">
                  {growth >= 0 ? "▲" : "▼"} {Math.abs(growth)}% so với 30 ngày trước
                </span>
              )}
            </p>
          </div>
        </article>
        <article className={`${cardClass} flex items-center gap-3.5 p-[18px]`}>
          <span aria-hidden="true" className="flex h-12 w-12 items-center justify-center rounded-[14px] bg-[#e9eaeb] text-[#3a3f4b]">
            <span className="material-symbols-outlined">visibility_off</span>
          </span>
          <div>
            <p className="text-xs text-on-surface-variant">Đang bị ẩn</p>
            <p className="text-2xl font-extrabold">
              {overview ? overview.hiddenReviewCount.toLocaleString("vi-VN") : "—"}{" "}
              <span className="text-xs font-normal text-on-surface-variant">đánh giá</span>
            </p>
          </div>
        </article>
      </section>

      <div className="flex flex-wrap items-center gap-3">
        <form onSubmit={submitSearch} className="flex items-center gap-2">
          <input
            aria-label="Tìm theo tên khách hoặc nội dung"
            value={draftQuery}
            onChange={(e) => setDraftQuery(e.target.value)}
            placeholder="Tìm tên khách, nội dung"
            className="min-h-11 w-72 max-w-full rounded-xl border border-outline-variant bg-surface-container-lowest px-3.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          />
          <button
            type="submit"
            className="min-h-11 rounded-xl bg-primary px-4 text-sm font-bold text-on-primary hover:opacity-90"
          >
            Tìm
          </button>
        </form>
        <select
          aria-label="Lọc theo garage"
          value={applied.garageId}
          onChange={(e) => change({ garageId: e.target.value })}
          className="min-h-11 rounded-xl border border-outline-variant bg-surface-container-lowest px-3 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
        >
          <option value="">Tất cả garage</option>
          {garages.map((garage) => (
            <option key={garage.id} value={garage.id}>
              {garage.name}
            </option>
          ))}
        </select>
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
            <table className="w-full min-w-[960px] text-left text-sm">
              <thead className="bg-surface-container-low text-[11px] uppercase tracking-wider text-on-surface-variant">
                <tr>
                  <th className="px-4 py-3 font-bold">Ngày</th>
                  <th className="px-4 py-3 font-bold">Khách hàng</th>
                  <th className="px-4 py-3 font-bold">Garage · Dịch vụ</th>
                  <th className="px-4 py-3 font-bold">Sao</th>
                  <th className="px-4 py-3 font-bold">Nội dung</th>
                  <th className="px-4 py-3 font-bold">Trạng thái</th>
                  <th className="px-4 py-3 text-right font-bold">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/50 align-top">
                {data.items.map((review) => (
                  <tr key={review.id} className={review.hidden ? "opacity-60" : "hover:bg-surface-container-low"}>
                    <td className="px-4 py-3">{formatDate(review.createdAt)}</td>
                    <td className="px-4 py-3">
                      <b>{review.customerUsername || review.customerName}</b>
                      <div className="text-xs text-on-surface-variant">{review.customerName}</div>
                    </td>
                    <td className="px-4 py-3">
                      {review.garageName || "—"}
                      <div className="text-xs text-on-surface-variant">{review.serviceName || ""}</div>
                    </td>
                    <td className="px-4 py-3">
                      <StarRating value={review.rating} size={16} />
                    </td>
                    <td className="max-w-[300px] px-4 py-3 leading-snug">{review.comment || "—"}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${
                          review.hidden ? "bg-[#e9eaeb] text-[#3a3f4b]" : "bg-[#d9f7dd] text-[#00531a]"
                        }`}
                      >
                        <i className={`h-[7px] w-[7px] rounded-full ${review.hidden ? "bg-outline" : "bg-tertiary-container"}`} />
                        {review.hidden ? "Đã ẩn" : "Hiển thị"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => setPending(review)}
                        className="inline-flex min-h-9 items-center gap-1 rounded-[10px] border-[1.5px] border-outline-variant bg-surface-container-lowest px-3 text-xs font-bold hover:bg-surface-container-low"
                      >
                        <span aria-hidden="true" className="material-symbols-outlined text-base">
                          {review.hidden ? "visibility" : "visibility_off"}
                        </span>
                        {review.hidden ? "Bỏ ẩn" : "Ẩn"}
                      </button>
                    </td>
                  </tr>
                ))}
                {data.items.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-on-surface-variant">
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
          {...buildDialog(pending)}
          busy={busy}
          onCancel={() => setPending(null)}
          onConfirm={confirmPending}
        />
      )}
    </div>
  );
}

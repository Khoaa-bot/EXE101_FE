import { useEffect, useMemo, useState } from "react";
import { getAdminGarages, type SuperAdminGarage } from "../../services/api";
import {
  getSuperAdminReviewHistory,
  type SuperAdminReviewFilters,
  type SuperAdminReviewHistoryPage,
} from "../../services/superAdminReviewHistory";
import { FilterChip } from "./SuperAdminChips";

const EMPTY_RESULT: SuperAdminReviewHistoryPage = {
  items: [], total: 0, page: 0, size: 10, averageRating: 0,
  ratingCounts: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }, source: "placeholder",
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function Stars({ value, label = false }: { value: number; label?: boolean }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${value} trên 5 sao`}>
      {Array.from({ length: 5 }, (_, index) => (
        <span key={index} aria-hidden="true" className={`material-symbols-outlined text-[18px] ${index < value ? "text-[#b56b00]" : "text-outline-variant"}`}>star</span>
      ))}
      {label && <strong className="ml-1 text-sm text-on-surface">{value.toFixed(1)}</strong>}
    </span>
  );
}

export default function SuperAdminReviewHistoryTab() {
  const [filters, setFilters] = useState<SuperAdminReviewFilters>({});
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<SuperAdminReviewHistoryPage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [garages, setGarages] = useState<SuperAdminGarage[]>([]);
  const requestKey = JSON.stringify(filters);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    getSuperAdminReviewHistory(filters)
      .then((data) => { if (!cancelled) setResult(data); })
      .catch(() => { if (!cancelled) setError("Không tải được lịch sử đánh giá. Vui lòng thử lại."); });
    return () => { cancelled = true; };
  }, [requestKey]);

  useEffect(() => {
    getAdminGarages().then(setGarages).catch(() => setGarages([]));
  }, []);

  const data = result ?? EMPTY_RESULT;
  const activeRating = filters.rating ?? 0;
  const hasFilters = Boolean(filters.garageId || filters.rating || filters.fromDate || filters.toDate || filters.q);
  const distribution = useMemo(() => [5, 4, 3, 2, 1].map((rating) => ({
    rating, count: data.ratingCounts[rating as 1 | 2 | 3 | 4 | 5],
  })), [data.ratingCounts]);
  const update = (next: Partial<SuperAdminReviewFilters>) => setFilters((current) => ({ ...current, ...next, page: 0 }));

  return (
    <div>
      <div className="mb-5 flex items-start gap-3 rounded-2xl border border-primary/20 bg-primary-fixed/45 px-4 py-3.5 text-sm text-on-primary-fixed">
        <span aria-hidden="true" className="material-symbols-outlined mt-0.5 text-primary">info</span>
        <p><strong>Dữ liệu mẫu để hoàn thiện giao diện.</strong> Trang đã có sẵn bộ lọc và phân trang; khi API đánh giá sẵn sàng, chỉ cần thay adapter dữ liệu.</p>
      </div>

      <section aria-label="Tóm tắt đánh giá" className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1.7fr)]">
        <div className="rounded-2xl bg-surface-container-lowest p-5 shadow-[0_10px_26px_-14px_rgba(25,28,29,0.28)]">
          <p className="text-sm font-semibold text-on-surface-variant">Điểm đánh giá trung bình</p>
          <div className="mt-2 flex items-end gap-3"><strong className="text-4xl leading-none tracking-[-0.03em]">{data.averageRating.toFixed(1)}</strong><span className="mb-1 text-sm text-on-surface-variant">/ 5</span></div>
          <div className="mt-3"><Stars value={Math.round(data.averageRating)} /><p className="mt-2 text-xs text-on-surface-variant">Từ {data.total} đánh giá phù hợp bộ lọc</p></div>
        </div>
        <div className="rounded-2xl bg-surface-container-lowest p-5 shadow-[0_10px_26px_-14px_rgba(25,28,29,0.28)]">
          <p className="text-sm font-semibold text-on-surface-variant">Phân bố theo số sao</p>
          <div className="mt-3 space-y-2">{distribution.map(({ rating, count }) => {
            const percentage = data.total ? (count / data.total) * 100 : 0;
            return <button key={rating} type="button" onClick={() => update({ rating: activeRating === rating ? undefined : rating })} className="flex w-full items-center gap-3 rounded-lg px-1 py-0.5 text-left hover:bg-surface-container-low" aria-pressed={activeRating === rating}>
              <span className="w-10 text-xs font-semibold text-on-surface-variant">{rating} sao</span><span className="h-2 flex-1 overflow-hidden rounded-full bg-surface-container-high"><span className="block h-full rounded-full bg-[#b56b00]" style={{ width: `${percentage}%` }} /></span><span className="w-5 text-right text-xs font-semibold tabular-nums text-on-surface-variant">{count}</span>
            </button>;
          })}</div>
        </div>
      </section>

      <section className="mt-6" aria-label="Bộ lọc lịch sử đánh giá">
        <div className="flex flex-wrap items-center gap-3">
          <label className="relative min-w-[min(100%,18rem)] flex-1"><span className="sr-only">Tìm đánh giá</span><span aria-hidden="true" className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">search</span><input value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") update({ q: query }); }} placeholder="Tìm khách, garage, dịch vụ..." className="min-h-11 w-full rounded-xl border border-outline-variant bg-surface-container-lowest py-2 pl-10 pr-3.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary" /></label>
          <select aria-label="Lọc theo garage" value={filters.garageId ?? ""} onChange={(event) => update({ garageId: event.target.value ? Number(event.target.value) : undefined })} className="min-h-11 rounded-xl border border-outline-variant bg-surface-container-lowest px-3 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"><option value="">Tất cả garage</option>{garages.map((garage) => <option key={garage.id} value={garage.id}>{garage.name}</option>)}</select>
          <label className="text-sm text-on-surface-variant">Từ ngày<input aria-label="Từ ngày" type="date" value={filters.fromDate ?? ""} onChange={(event) => update({ fromDate: event.target.value || undefined })} className="ml-2 min-h-10 rounded-lg border border-outline-variant bg-surface-container-lowest px-2 text-sm text-on-surface outline-none focus:border-primary" /></label>
          <label className="text-sm text-on-surface-variant">Đến ngày<input aria-label="Đến ngày" type="date" value={filters.toDate ?? ""} onChange={(event) => update({ toDate: event.target.value || undefined })} className="ml-2 min-h-10 rounded-lg border border-outline-variant bg-surface-container-lowest px-2 text-sm text-on-surface outline-none focus:border-primary" /></label>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2"><span className="mr-1 text-xs font-semibold text-on-surface-variant">Số sao:</span><FilterChip active={activeRating === 0} onClick={() => update({ rating: undefined })}>Tất cả</FilterChip>{[5, 4, 3, 2, 1].map((rating) => <FilterChip key={rating} active={activeRating === rating} onClick={() => update({ rating: activeRating === rating ? undefined : rating })}>{rating} sao</FilterChip>)}{hasFilters && <button type="button" onClick={() => { setQuery(""); setFilters({}); }} className="ml-auto min-h-9 px-2 text-xs font-bold text-primary hover:underline">Xóa bộ lọc</button>}</div>
      </section>

      {error && <p role="alert" className="mt-6 text-sm text-error">{error}</p>}
      {!result && !error && <p className="mt-6 text-sm text-on-surface-variant">Đang tải lịch sử đánh giá...</p>}
      {result && !error && <section className="mt-5 overflow-hidden rounded-2xl bg-surface-container-lowest shadow-[0_10px_26px_-14px_rgba(25,28,29,0.28)]" aria-label="Danh sách đánh giá"><div className="border-b border-outline-variant/60 px-5 py-3 text-sm text-on-surface-variant">Hiển thị <strong className="text-on-surface">{data.items.length}</strong> / {data.total} đánh giá</div><div className="divide-y divide-outline-variant/50">{data.items.map((review) => <article key={review.id} className="p-5"><div className="flex flex-wrap items-start gap-3"><span aria-hidden="true" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-fixed text-xs font-extrabold text-on-primary-fixed">{review.customerInitials}</span><div className="min-w-[12rem] flex-1"><div className="flex flex-wrap items-center gap-x-2 gap-y-1"><h2 className="text-sm font-extrabold">{review.customerName}</h2><Stars value={review.rating} /></div><p className="mt-1 text-xs text-on-surface-variant">{review.garageName} · {review.serviceName} · {formatDate(review.createdAt)}</p></div><span className="rounded-full bg-surface-container-low px-2.5 py-1 text-xs font-semibold text-on-surface-variant">#{review.appointmentId}</span></div><p className="mt-3 max-w-[75ch] text-sm leading-6 text-on-surface">{review.comment}</p>{review.reply && <div className="mt-3 rounded-xl bg-surface-container-low px-3.5 py-3 text-sm text-on-surface-variant"><strong className="mr-1 text-on-surface">Phản hồi từ garage:</strong>{review.reply}</div>}</article>)}{data.items.length === 0 && <div className="px-5 py-12 text-center"><span aria-hidden="true" className="material-symbols-outlined text-3xl text-outline">rate_review</span><p className="mt-2 font-semibold">Chưa có đánh giá phù hợp</p><p className="mt-1 text-sm text-on-surface-variant">Hãy điều chỉnh bộ lọc hoặc tìm với từ khóa khác.</p></div>}</div></section>}
    </div>
  );
}

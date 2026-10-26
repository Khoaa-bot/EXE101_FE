import { useEffect, useMemo, useState } from "react";
import { getGarages, type Garage } from "../../services/api";

type FindGaragePageProps = {
  onBookingClick: (garageId: string) => void;
};

const FALLBACK_PHOTOS = [
  "/landing/hero-1.jpg",
  "/landing/hero-2.jpg",
  "/landing/hero-3.jpg",
];

export default function FindGaragePage({ onBookingClick }: FindGaragePageProps) {
  const [garages, setGarages] = useState<Garage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [sortByRating, setSortByRating] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    getGarages()
      .then((data) => {
        if (!cancelled) setGarages(data);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Không tải được danh sách garage.");
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const visibleGarages = useMemo(() => {
    const query = search.trim().toLowerCase();
    let list = garages;
    if (query) {
      list = list.filter(
        (garage) =>
          garage.name.toLowerCase().includes(query) ||
          garage.address.toLowerCase().includes(query),
      );
    }
    if (sortByRating) {
      list = [...list].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
    }
    return list;
  }, [garages, search, sortByRating]);

  const chipClass = (active: boolean) =>
    `inline-flex min-h-9 items-center gap-1.5 rounded-full border px-3.5 text-[13px] font-semibold ${
      active
        ? "border-primary bg-primary-fixed text-on-primary-fixed-variant"
        : "border-outline-variant bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container-low"
    }`;

  return (
    <div className="mx-auto max-w-7xl space-y-5 p-6 md:p-8">
      <div>
        <h2 className="text-3xl font-extrabold tracking-tight text-on-surface">Tìm garage</h2>
        <p className="mt-1 text-[15px] text-on-surface-variant">
          Chọn garage bạn muốn bảo dưỡng hoặc sửa chữa xe, rồi đặt lịch ngay.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <label className="flex h-12 w-full items-center gap-2 rounded-2xl border border-outline-variant bg-surface-container-lowest px-3.5 text-outline focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/30 md:w-96">
          <span aria-hidden="true" className="material-symbols-outlined text-[22px]">
            search
          </span>
          <input
            aria-label="Tìm garage, khu vực..."
            className="min-w-0 flex-1 bg-transparent text-sm text-on-surface outline-none"
            placeholder="Tên garage hoặc khu vực"
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>
        <div role="group" aria-label="Sắp xếp garage" className="flex gap-2">
          <button type="button" aria-pressed={!sortByRating} onClick={() => setSortByRating(false)} className={chipClass(!sortByRating)}>
            Tất cả
          </button>
          <button type="button" aria-pressed={sortByRating} onClick={() => setSortByRating(true)} className={chipClass(sortByRating)}>
            <span aria-hidden="true" className="material-symbols-outlined text-lg">
              star
            </span>
            Đánh giá cao
          </button>
        </div>
        {!isLoading && !error && (
          <span aria-live="polite" className="ml-auto text-[13px] text-on-surface-variant">
            {visibleGarages.length} garage
          </span>
        )}
      </div>

      {isLoading && (
        <div className="rounded-3xl border border-outline-variant/40 bg-surface-container-lowest p-8 text-center text-on-surface-variant">
          Đang tải danh sách garage...
        </div>
      )}

      {!isLoading && error && (
        <div className="rounded-3xl border border-error/30 bg-error-container/10 p-8 text-center text-error">
          {error}
        </div>
      )}

      {!isLoading && !error && visibleGarages.length === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-3xl border border-outline-variant/40 bg-surface-container-lowest p-10 text-center">
          <span
            aria-hidden="true"
            className="flex h-[72px] w-[72px] items-center justify-center rounded-3xl bg-surface-container text-outline"
          >
            <span className="material-symbols-outlined text-4xl">storefront</span>
          </span>
          <p className="text-lg font-extrabold">Không tìm thấy garage phù hợp</p>
          <p className="text-sm text-on-surface-variant">Thử đổi từ khóa tìm kiếm hoặc xóa bộ lọc.</p>
        </div>
      )}

      {!isLoading && !error && visibleGarages.length > 0 && (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {visibleGarages.map((garage, index) => (
            <article
              key={garage.id}
              className="flex flex-col overflow-hidden rounded-3xl border border-outline-variant/40 bg-surface-container-lowest shadow-[0_10px_26px_-14px_rgba(25,28,29,0.28)] transition-transform hover:-translate-y-0.5"
            >
              <div className="relative h-[150px] bg-primary-fixed">
                <img
                  src={garage.imageUrl || FALLBACK_PHOTOS[index % FALLBACK_PHOTOS.length]}
                  alt=""
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="flex flex-1 flex-col gap-2.5 p-[18px]">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-[17px] font-extrabold">{garage.name}</h3>
                  {garage.rating != null && (
                    <b className="flex shrink-0 items-center gap-0.5 text-sm text-[#6b4200]">
                      <span
                        aria-hidden="true"
                        className="material-symbols-outlined text-lg text-[#c47f00]"
                        style={{ fontVariationSettings: "'FILL' 1" }}
                      >
                        star
                      </span>
                      {garage.rating.toLocaleString("vi-VN", { minimumFractionDigits: 1 })}
                      <span className="font-normal text-on-surface-variant">({garage.reviewCount ?? 0})</span>
                    </b>
                  )}
                </div>
                <p className="flex items-start gap-1.5 text-[13px] text-on-surface-variant">
                  <span aria-hidden="true" className="material-symbols-outlined text-lg">
                    location_on
                  </span>
                  {garage.address}
                </p>
                {garage.phone && (
                  <p className="flex items-center gap-1.5 text-[13px] text-on-surface-variant">
                    <span aria-hidden="true" className="material-symbols-outlined text-lg">
                      call
                    </span>
                    {garage.phone}
                  </p>
                )}
                {garage.description && (
                  <p className="line-clamp-2 text-[13px] text-on-surface-variant">{garage.description}</p>
                )}
                <button
                  type="button"
                  onClick={() => onBookingClick(String(garage.id))}
                  className="mt-auto flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-primary to-primary-container text-sm font-bold text-on-primary shadow-[0_12px_22px_-14px_rgba(0,89,187,0.9)] transition-all active:scale-[0.98]"
                >
                  Chọn garage này
                  <span aria-hidden="true" className="material-symbols-outlined text-[18px]">
                    arrow_forward
                  </span>
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

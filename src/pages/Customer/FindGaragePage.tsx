import { useEffect, useMemo, useState } from "react";
import { getGarages, type Garage } from "../../services/api";

type FindGaragePageProps = {
  onBookingClick: (garageId: string) => void;
};

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

  return (
    <div className="mx-auto max-w-7xl p-6 md:p-8">
      <div className="mb-6">
        <h2 className="mb-1 text-2xl font-bold text-on-surface">Garage gần bạn</h2>
        <p className="text-on-surface-variant">
          Chọn garage bạn muốn bảo dưỡng hoặc sửa chữa xe, rồi đặt lịch ngay.
        </p>
      </div>

      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center">
        <div className="relative w-full md:w-80 lg:w-96">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">
            search
          </span>
          <input
            className="w-full rounded-full border border-outline-variant bg-surface-container-low py-2.5 pl-10 pr-4 text-sm outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary"
            placeholder="Tìm garage, khu vực..."
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={() => setSortByRating(false)}
            className={`rounded-full px-5 py-2 text-sm font-medium transition-colors ${
              !sortByRating
                ? "bg-primary text-white"
                : "border border-outline-variant bg-surface text-on-surface hover:bg-surface-container"
            }`}
          >
            Mặc định
          </button>
          <button
            onClick={() => setSortByRating(true)}
            className={`rounded-full px-5 py-2 text-sm font-medium transition-colors ${
              sortByRating
                ? "bg-primary text-white"
                : "border border-outline-variant bg-surface text-on-surface hover:bg-surface-container"
            }`}
          >
            Đánh giá cao
          </button>
        </div>
      </div>

      {isLoading && (
        <div className="rounded-xl border border-outline-variant bg-white p-8 text-center text-on-surface-variant">
          Đang tải danh sách garage...
        </div>
      )}

      {!isLoading && error && (
        <div className="rounded-xl border border-error/30 bg-error-container/10 p-8 text-center text-error">
          {error}
        </div>
      )}

      {!isLoading && !error && visibleGarages.length === 0 && (
        <div className="rounded-xl border border-outline-variant bg-white p-8 text-center text-on-surface-variant">
          Không tìm thấy garage phù hợp.
        </div>
      )}

      {!isLoading && !error && visibleGarages.length > 0 && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {visibleGarages.map((garage) => (
            <div
              key={garage.id}
              className="flex flex-col justify-between rounded-xl border border-outline-variant bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-primary">
                      <span className="material-symbols-outlined text-2xl">
                        build
                      </span>
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-on-surface">
                        {garage.name}
                      </h3>
                      <div className="mt-1 flex items-center gap-1 text-sm text-on-surface-variant">
                        <span className="material-symbols-outlined text-[16px]">
                          location_on
                        </span>
                        {garage.address}
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-on-surface-variant">
                        {garage.rating !== undefined && (
                          <div className="flex items-center gap-1 font-medium text-orange-500">
                            <span className="material-symbols-outlined text-[16px]">
                              star
                            </span>
                            {garage.rating}
                          </div>
                        )}
                        {garage.phone && (
                          <div className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-[16px]">
                              call
                            </span>
                            {garage.phone}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {garage.description && (
                  <p className="mt-4 text-sm text-on-surface-variant">
                    {garage.description}
                  </p>
                )}
              </div>

              <button
                onClick={() => onBookingClick(String(garage.id))}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
              >
                Chọn garage này
                <span className="material-symbols-outlined text-[18px]">
                  arrow_forward
                </span>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

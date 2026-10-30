import { useEffect, useState } from "react";
import {
  getAllServices,
  getGarageById,
  type Garage,
  type MaintenanceService,
} from "../../services/api";
import GarageReviewsSection from "./GarageReviewsSection";

type GarageDetailPageProps = {
  garageId: number | string | null;
  onBackClick: () => void;
  onBookingClick: (serviceId: number) => void;
};

function formatCurrency(value: number | null | undefined) {
  if (value === null || value === undefined) return "Liên hệ";
  return `${value.toLocaleString("vi-VN")}đ`;
}

export default function GarageDetailPage({
  garageId,
  onBackClick,
  onBookingClick,
}: GarageDetailPageProps) {
  const [garage, setGarage] = useState<Garage | null>(null);
  const [services, setServices] = useState<MaintenanceService[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (garageId === null || garageId === undefined) {
      setIsLoading(false);
      setError("Không xác định được garage. Vui lòng quay lại danh sách và chọn lại.");
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    Promise.all([getGarageById(garageId), getAllServices(garageId)])
      .then(([garageData, serviceData]) => {
        if (!cancelled) {
          setGarage(garageData);
          setServices(serviceData);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Không tải được thông tin garage.");
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [garageId]);

  const cardClass =
    "rounded-3xl border border-outline-variant/40 bg-surface-container-lowest shadow-[0_10px_26px_-14px_rgba(25,28,29,0.28)]";

  return (
    <div className="mx-auto max-w-7xl space-y-5 px-4 py-6 md:px-8">
      <button
        type="button"
        onClick={onBackClick}
        className="inline-flex min-h-10 items-center gap-1 rounded-xl border-[1.5px] border-outline-variant bg-surface-container-lowest px-3.5 text-sm font-bold hover:bg-surface-container-low"
      >
        <span aria-hidden="true" className="material-symbols-outlined text-xl">
          arrow_back
        </span>
        Tìm garage
      </button>

      {isLoading && (
        <div className={`${cardClass} p-8 text-center text-on-surface-variant`}>Đang tải thông tin garage...</div>
      )}

      {!isLoading && error && (
        <div className="rounded-3xl border border-error/30 bg-error-container/10 p-8 text-center text-error">
          {error}
        </div>
      )}

      {!isLoading && !error && garage && (
        <>
          <div className="relative h-60 w-full overflow-hidden rounded-[28px] bg-primary-fixed md:h-72">
            <img
              src={garage.imageUrl || "/landing/hero-1.jpg"}
              alt=""
              className="h-full w-full object-cover"
            />
            <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />
            <div className="absolute inset-x-7 bottom-5 text-white">
              <h1 className="text-3xl font-extrabold tracking-tight">{garage.name}</h1>
              <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm opacity-95">
                {garage.rating != null && (
                  <span className="flex items-center gap-1 font-bold text-[#ffd479]">
                    <span
                      aria-hidden="true"
                      className="material-symbols-outlined icon-fill-solid text-lg"
                    >
                      star
                    </span>
                    {garage.rating.toLocaleString("vi-VN", { minimumFractionDigits: 1 })}
                    <span className="font-normal text-white/90">({garage.reviewCount ?? 0} đánh giá)</span>
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <span aria-hidden="true" className="material-symbols-outlined text-lg">
                    location_on
                  </span>
                  {garage.address}
                </span>
                {garage.phone && (
                  <span className="flex items-center gap-1">
                    <span aria-hidden="true" className="material-symbols-outlined text-lg">
                      call
                    </span>
                    {garage.phone}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-2">
            <div className="space-y-5">
            <section aria-labelledby="garage-services-title" className={`${cardClass} p-[22px]`}>
              <h2 id="garage-services-title" className="mb-1 text-lg font-extrabold">
                Dịch vụ &amp; bảng giá
              </h2>

              {services.length === 0 && (
                <p className="py-4 text-sm text-on-surface-variant">Hiện chưa có dịch vụ nào được cấu hình.</p>
              )}

              <ul className="divide-y divide-outline-variant/40">
                {services.map((service) => (
                  <li key={service.id} className="flex flex-col gap-3 py-3.5 sm:flex-row sm:items-center sm:gap-4">
                    <span
                      aria-hidden="true"
                      className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-primary-fixed text-on-primary-fixed-variant sm:flex"
                    >
                      <span className="material-symbols-outlined">build</span>
                    </span>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold">{service.name}</h3>
                      {service.description && (
                        <p className="mt-0.5 text-[13px] text-on-surface-variant">{service.description}</p>
                      )}
                    </div>
                    <div className="flex shrink-0 items-center justify-between gap-4 sm:justify-end">
                      <span className="text-base font-extrabold text-on-primary-fixed-variant">
                        {formatCurrency(service.price)}
                      </span>
                      <button
                        type="button"
                        onClick={() => onBookingClick(service.id)}
                        className="min-h-10 rounded-xl bg-gradient-to-br from-primary to-primary-container px-5 text-sm font-bold text-on-primary active:scale-95"
                      >
                        Đặt lịch
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </section>

              <section className={`${cardClass} p-[22px]`} aria-labelledby="garage-about-title">
                <h2 id="garage-about-title" className="mb-2 text-base font-extrabold">
                  Về garage
                </h2>
                <p className="text-sm leading-relaxed text-on-surface-variant">
                  {garage.description ||
                    `${garage.name} tại ${garage.address}, sẵn sàng phục vụ nhu cầu bảo dưỡng và sửa chữa xe của bạn.`}
                </p>
                <div className="mt-4 space-y-2.5 border-t border-outline-variant/40 pt-4 text-sm">
                  <p className="flex items-start gap-2.5">
                    <span aria-hidden="true" className="material-symbols-outlined text-xl text-primary">
                      location_on
                    </span>
                    {garage.address}
                  </p>
                  {garage.phone && (
                    <p className="flex items-center gap-2.5">
                      <span aria-hidden="true" className="material-symbols-outlined text-xl text-primary">
                        call
                      </span>
                      {garage.phone}
                    </p>
                  )}
                </div>
              </section>
            </div>

            <GarageReviewsSection garageId={garage.id} />
          </div>
        </>
      )}
    </div>
  );
}

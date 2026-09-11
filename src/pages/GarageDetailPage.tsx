import { useEffect, useState } from "react";
import {
  getAllServices,
  getGarageById,
  type Garage,
  type MaintenanceService,
} from "../services/api";

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

    Promise.all([getGarageById(garageId), getAllServices()])
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

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 md:px-8">
      {/* Breadcrumbs */}
      <nav className="mb-4 flex items-center gap-2 text-sm text-on-surface-variant">
        <button
          onClick={onBackClick}
          className="hover:text-primary transition-colors cursor-pointer"
        >
          Tìm garage
        </button>
        <span className="material-symbols-outlined text-[16px]">chevron_right</span>
        <span className="text-on-surface font-medium">{garage?.name ?? "Chi tiết garage"}</span>
      </nav>

      {isLoading && (
        <div className="rounded-xl border border-outline-variant bg-white p-8 text-center text-on-surface-variant">
          Đang tải thông tin garage...
        </div>
      )}

      {!isLoading && error && (
        <div className="rounded-xl border border-error/30 bg-error-container/10 p-8 text-center text-error">
          {error}
        </div>
      )}

      {!isLoading && !error && garage && (
        <>
          {/* Banner */}
          <div className="relative mb-6 h-64 w-full overflow-hidden rounded-2xl bg-black md:h-80 shadow-md">
            <img
              src="https://images.unsplash.com/photo-1617788138017-80ad40651399?auto=format&fit=crop&q=80&w=1200"
              alt={garage.name}
              className="h-full w-full object-cover opacity-80"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

            <div className="absolute bottom-6 left-6 right-6 flex flex-col justify-between gap-4 md:flex-row md:items-end">
              <div className="text-white">
                <h1 className="text-2xl font-bold md:text-3xl">{garage.name}</h1>
                <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-gray-300">
                  {garage.rating !== undefined && (
                    <div className="flex items-center gap-1 font-medium text-orange-400">
                      <span className="material-symbols-outlined text-[16px]">star</span>
                      {garage.rating}
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px]">location_on</span>
                    {garage.address}
                  </div>
                  {garage.phone && (
                    <div className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[16px]">call</span>
                      {garage.phone}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Columns */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Left Column: Services list */}
            <div className="lg:col-span-2 space-y-4">
              <h2 className="text-lg font-bold text-on-surface mb-2">Dịch vụ cung cấp</h2>

              {services.length === 0 && (
                <div className="rounded-xl border border-outline-variant bg-white p-5 text-sm text-on-surface-variant">
                  Hiện chưa có dịch vụ nào được cấu hình.
                </div>
              )}

              <div className="space-y-3">
                {services.map((service) => (
                  <div
                    key={service.id}
                    className="flex flex-col justify-between gap-4 rounded-xl border border-outline-variant bg-white p-5 sm:flex-row sm:items-center transition-shadow hover:shadow-sm"
                  >
                    <div>
                      <h3 className="text-base font-bold text-on-surface">{service.name}</h3>
                      {service.description && (
                        <p className="mt-1 text-sm text-on-surface-variant">
                          {service.description}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between gap-4 sm:justify-end shrink-0">
                      <div className="text-left sm:text-right">
                        <span className="block text-[10px] text-on-surface-variant uppercase tracking-wider">Giá</span>
                        <span className="text-base font-bold text-primary">
                          {formatCurrency(service.price)}
                        </span>
                      </div>
                      <button
                        onClick={() => onBookingClick(service.id)}
                        className="rounded-lg bg-primary px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
                      >
                        Đặt lịch
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Column: About */}
            <div className="space-y-6">
              <div className="rounded-xl border border-outline-variant bg-white p-5 shadow-sm">
                <h2 className="text-base font-bold text-on-surface mb-3">Về garage</h2>
                <p className="text-sm text-on-surface-variant leading-relaxed">
                  {garage.description ||
                    `${garage.name} tại ${garage.address}, sẵn sàng phục vụ nhu cầu bảo dưỡng và sửa chữa xe của bạn.`}
                </p>

                <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm text-on-surface-variant border-t border-gray-100 pt-4">
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[18px] text-blue-500">
                      location_on
                    </span>
                    {garage.address}
                  </div>
                  {garage.phone && (
                    <div className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[18px] text-blue-500">
                        call
                      </span>
                      {garage.phone}
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-xl border border-outline-variant bg-white p-5 shadow-sm text-sm text-on-surface-variant">
                Tính năng xem đánh giá của garage đang được phát triển.
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

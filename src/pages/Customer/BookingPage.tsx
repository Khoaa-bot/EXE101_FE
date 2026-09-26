import { useEffect, useMemo, useState } from "react";
import AppSidebar, { type AppSection } from "../../components/AppSidebar";
import {
  createAppointment,
  getAllServices,
  getAvailableSchedules,
  getGarages,
  getMyFleet,
  type Garage,
  type MaintenanceService,
  type Schedule,
  type Vehicle,
} from "../../services/api";

type BookingPageProps = {
  onHomeClick: () => void;
  onHistoryClick: () => void;
  onNotificationsClick: () => void;
  onProfileClick: () => void;
  onTrackingClick: () => void;
  garageId?: number | string | null;
  serviceId?: number | string | null;
};

const garageImage =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuCsGSI4JjM9x3QPl7Bms7s1o8sTvJs_rkpjaqqlh5ApkhV_4ijq2JZGikR9PoI-M9pTxm59Nwk258n8G_kWkMcMqToFxVK6dq5IPy63YQAed7BIT6jwyx94BY1TSNVmMlQsSCvExq7H4-EUWjsSFZfcudAh5Rfwr0wiFL8diBAAZz0IqivtDqLJnp2IPW_s6LFSrW7V_eoP3q-QW3PevB0Ivh0uLM1-f576wwF8y7sL26dAWGvaoLGHfqiqffTzJb-7UUnbHfFTHcBp";

const avatarImage =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuAoOtpd2mA6tCtPpc_xOKGgqUmp2z_Z-EfI2YOhRqwHtUTN9nhgCwDcip3VZDzsTcF9QqXS2OQOH4-0RXuePu4pK54_EjXHC3NKbjQTW7MQHtAFhC9x9A7N6FQkOxRGnLtLZ0A9seeVNnU1RnN2EAhFyDypvbKu8f_5qkTQZk1QVBYmjjAkVsdqd7FGvJt73-0TUO0k_DolFun55eyGrmB9A3JFcNmwDvtJJ31qXNF4gLLh1oT8xPVEKvvuRROeA6KOJhlFiAy8b3_u";

function formatCurrency(value: number | null | undefined) {
  if (value === null || value === undefined) return "Liên hệ";
  return `${value.toLocaleString("vi-VN")}đ`;
}

function isTodayOrFuture(dateStr: string) {
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return true;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);
  return date >= today;
}

export default function BookingPage({
  onHomeClick,
  onHistoryClick,
  onNotificationsClick,
  onProfileClick,
  onTrackingClick,
  garageId,
  serviceId,
}: BookingPageProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [garages, setGarages] = useState<Garage[]>([]);
  const [services, setServices] = useState<MaintenanceService[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);

  const [isLoadingOptions, setIsLoadingOptions] = useState(true);
  const [optionsError, setOptionsError] = useState<string | null>(null);
  const [isLoadingSchedules, setIsLoadingSchedules] = useState(false);

  const [selectedVehicleId, setSelectedVehicleId] = useState("");
  const [selectedGarageId, setSelectedGarageId] = useState(
    garageId !== null && garageId !== undefined ? String(garageId) : "",
  );
  const [selectedServiceId, setSelectedServiceId] = useState(
    serviceId !== null && serviceId !== undefined ? String(serviceId) : "",
  );
  const [selectedScheduleId, setSelectedScheduleId] = useState("");
  const [notes, setNotes] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const handleNavigate = (section: AppSection) => {
    if (section === "home") onHomeClick();
    if (section === "history") onHistoryClick();
    if (section === "notifications") onNotificationsClick();
    if (section === "tracking") onTrackingClick();
    if (section === "profile") onProfileClick();
  };

  useEffect(() => {
    let cancelled = false;
    setIsLoadingOptions(true);
    setOptionsError(null);

    Promise.all([getMyFleet(), getGarages()])
      .then(([vehicleData, garageData]) => {
        if (!cancelled) {
          setVehicles(vehicleData);
          setGarages(garageData);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setOptionsError(
            err instanceof Error ? err.message : "Không tải được dữ liệu đặt lịch.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoadingOptions(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!selectedGarageId) {
      setServices([]);
      setSelectedServiceId("");
      return;
    }

    let cancelled = false;

    // Dịch vụ có thể là dùng chung cho mọi garage hoặc riêng của 1 garage —
    // phải nạp lại theo đúng garage đang chọn, không dùng chung 1 danh sách
    // cho tất cả (mỗi garage có thể có bảng giá/dịch vụ riêng khác nhau).
    getAllServices(selectedGarageId)
      .then((data) => {
        if (cancelled) return;
        setServices(data);
        // Chỉ bỏ chọn dịch vụ hiện tại nếu nó không còn thuộc garage vừa
        // chọn — giữ nguyên lựa chọn khi vào thẳng từ trang garage kèm sẵn
        // serviceId, hoặc khi danh sách reload nhưng dịch vụ đó vẫn còn.
        setSelectedServiceId((current) =>
          current && data.some((service) => String(service.id) === current) ? current : "",
        );
      })
      .catch(() => {
        if (!cancelled) setServices([]);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedGarageId]);

  useEffect(() => {
    if (!selectedGarageId) {
      setSchedules([]);
      setSelectedScheduleId("");
      return;
    }

    let cancelled = false;
    setIsLoadingSchedules(true);
    setSelectedScheduleId("");

    getAvailableSchedules(selectedGarageId)
      .then((data) => {
        if (!cancelled) setSchedules(data.filter((schedule) => isTodayOrFuture(schedule.date)));
      })
      .catch(() => {
        if (!cancelled) setSchedules([]);
      })
      .finally(() => {
        if (!cancelled) setIsLoadingSchedules(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedGarageId]);

  const selectedGarage = useMemo(
    () => garages.find((g) => String(g.id) === selectedGarageId),
    [garages, selectedGarageId],
  );
  const selectedService = useMemo(
    () => services.find((s) => String(s.id) === selectedServiceId),
    [services, selectedServiceId],
  );

  const canSubmit =
    Boolean(selectedVehicleId) &&
    Boolean(selectedGarageId) &&
    Boolean(selectedServiceId) &&
    Boolean(selectedScheduleId) &&
    !isSubmitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      await createAppointment({
        vehicleId: Number(selectedVehicleId),
        serviceId: Number(selectedServiceId),
        scheduleId: Number(selectedScheduleId),
        notes: notes.trim() || undefined,
      });
      setSubmitSuccess(true);
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "Đặt lịch không thành công. Vui lòng thử lại.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-dvh bg-background font-sans text-on-background">
      <AppSidebar
        active="home"
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onNavigate={handleNavigate}
      />

      <header className="fixed top-0 z-50 flex h-16 w-full items-center justify-between border-b border-outline-variant bg-surface px-margin-mobile md:px-margin-desktop">
        <div className="flex items-center gap-2">
          <button
            className="-ml-2 rounded-full p-2 text-on-surface-variant transition-colors hover:bg-surface-container md:hidden"
            type="button"
            aria-label="Mở menu"
            onClick={() => setIsSidebarOpen(true)}
          >
            <span className="material-symbols-outlined">menu</span>
          </button>
          <span className="material-symbols-outlined text-[32px] text-primary">
            electric_car
          </span>
          <h1 className="font-headline-lg text-headline-lg font-bold text-primary">
            Servio
          </h1>
        </div>

        <nav className="hidden items-center gap-8 md:flex">
          <button
            className="font-label-md text-label-md text-on-surface-variant transition-colors hover:text-primary"
            type="button"
            onClick={onHomeClick}
          >
            Trang chủ
          </button>
          <button
            className="font-label-md text-label-md text-on-surface-variant transition-colors hover:text-primary"
            type="button"
            onClick={onHistoryClick}
          >
            Lịch sử
          </button>
          <button
            className="font-label-md text-label-md text-on-surface-variant transition-colors hover:text-primary"
            type="button"
            onClick={onTrackingClick}
          >
            Theo dõi
          </button>
          <button
            className="font-label-md text-label-md text-on-surface-variant transition-colors hover:text-primary"
            type="button"
            onClick={onNotificationsClick}
          >
            Thông báo
          </button>
          <button
            className="font-label-md text-label-md text-on-surface-variant transition-colors hover:text-primary"
            type="button"
            onClick={onProfileClick}
          >
            Cá nhân
          </button>
        </nav>

        <div className="flex items-center gap-4">
          <button
            className="rounded-full p-2 transition-colors hover:bg-surface-container"
            type="button"
            onClick={onNotificationsClick}
          >
            <span className="material-symbols-outlined text-on-surface-variant">
              notifications
            </span>
          </button>
          <button
            className="h-10 w-10 overflow-hidden rounded-full border border-outline-variant"
            type="button"
            onClick={onProfileClick}
          >
            <img
              className="h-full w-full object-cover"
              src={avatarImage}
              alt="Ảnh đại diện người dùng"
            />
          </button>
        </div>
      </header>

      <main className="mx-auto min-h-screen max-w-[1440px] px-margin-mobile pb-32 pt-24 md:px-margin-desktop">
        <div className="flex flex-col items-start gap-lg lg:flex-row">
          <section className="w-full flex-1 space-y-lg">
            <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-lg shadow-sm md:p-xl">
              <div className="mb-xl">
                <h2 className="mb-2 font-headline-lg text-headline-lg text-on-surface">
                  Đặt lịch dịch vụ
                </h2>
                <p className="font-body-md text-body-md text-on-surface-variant">
                  Vui lòng điền thông tin chi tiết để chúng tôi sắp xếp kỹ thuật
                  viên tốt nhất cho xe của bạn.
                </p>
              </div>

              {isLoadingOptions && (
                <div className="rounded-lg border border-outline-variant bg-surface-container-low p-lg text-center font-body-md text-body-md text-on-surface-variant">
                  Đang tải dữ liệu đặt lịch...
                </div>
              )}

              {!isLoadingOptions && optionsError && (
                <div className="rounded-lg border border-error/30 bg-error-container/10 p-lg text-center font-body-md text-body-md text-error">
                  {optionsError}
                </div>
              )}

              {!isLoadingOptions && !optionsError && submitSuccess && (
                <div className="mb-lg flex items-center justify-between gap-md rounded-lg border border-tertiary/30 bg-tertiary-container/20 p-lg">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-tertiary">
                      check_circle
                    </span>
                    <p className="font-body-md text-body-md text-on-surface">
                      Đặt lịch thành công! Bạn có thể theo dõi tiến độ ngay bây giờ.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={onTrackingClick}
                    className="shrink-0 rounded-lg bg-primary px-4 py-2 font-label-md text-label-md text-white transition-colors hover:bg-blue-700"
                  >
                    Theo dõi
                  </button>
                </div>
              )}

              {!isLoadingOptions && !optionsError && vehicles.length === 0 && (
                <div className="mb-lg rounded-lg border border-outline-variant bg-surface-container-low p-lg font-body-md text-body-md text-on-surface-variant">
                  Bạn chưa có phương tiện nào. Vui lòng thêm xe trước khi đặt lịch.
                </div>
              )}

              {!isLoadingOptions && !optionsError && (
                <form
                  className="space-y-lg"
                  onSubmit={(event) => {
                    event.preventDefault();
                    void handleSubmit();
                  }}
                >
                  <div className="mb-xl flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary font-label-md text-label-md text-on-primary">
                        1
                      </span>
                      <span className="font-label-md text-label-md text-primary">
                        Thông tin chính
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-lg md:grid-cols-2">
                    <SelectField
                      label="Chọn xe"
                      icon="directions_car"
                      value={selectedVehicleId}
                      onChange={setSelectedVehicleId}
                      placeholder="Chọn xe của bạn"
                      options={vehicles.map((vehicle) => ({
                        value: String(vehicle.id),
                        label: `${vehicle.model} · ${vehicle.vin}`,
                      }))}
                    />
                    <SelectField
                      label="Chọn Garage"
                      icon="expand_more"
                      value={selectedGarageId}
                      onChange={setSelectedGarageId}
                      placeholder="Chọn garage"
                      options={garages.map((garage) => ({
                        value: String(garage.id),
                        label: garage.name,
                      }))}
                    />
                    <SelectField
                      label="Loại dịch vụ"
                      icon="build"
                      value={selectedServiceId}
                      onChange={setSelectedServiceId}
                      placeholder={!selectedGarageId ? "Chọn garage trước" : "Chọn dịch vụ"}
                      disabled={!selectedGarageId}
                      options={services.map((service) => ({
                        value: String(service.id),
                        label: `${service.name} — ${formatCurrency(service.price)}`,
                      }))}
                    />
                    <SelectField
                      label="Lịch hẹn còn trống"
                      icon="schedule"
                      value={selectedScheduleId}
                      onChange={setSelectedScheduleId}
                      placeholder={
                        !selectedGarageId
                          ? "Chọn garage trước"
                          : isLoadingSchedules
                            ? "Đang tải lịch..."
                            : schedules.length === 0
                              ? "Garage chưa có lịch trống"
                              : "Chọn ngày & giờ"
                      }
                      disabled={!selectedGarageId || isLoadingSchedules || schedules.length === 0}
                      options={schedules.map((schedule) => ({
                        value: String(schedule.id),
                        label: `${schedule.date} • ${schedule.timeFrame} (còn ${schedule.availableSlots}/${schedule.totalSlots} chỗ)`,
                      }))}
                    />
                  </div>

                  {selectedGarageId && !isLoadingSchedules && schedules.length > 0 && (
                    <p className="-mt-2 px-1 text-xs text-on-surface-variant">
                      Mỗi khung giờ chỉ nhận số lượng xe bằng số kỹ thuật viên đang có của garage. Khung giờ đã hết chỗ (khách khác đặt hết) sẽ tự động biến mất khỏi danh sách trên.
                    </p>
                  )}

                  <div className="space-y-sm pt-4">
                    <label className="px-1 font-label-md text-label-md text-on-surface-variant">
                      Ghi chú thêm (Tình trạng xe, yêu cầu đặc biệt)
                    </label>
                    <textarea
                      className="w-full resize-none rounded-lg border border-outline-variant bg-surface-container-low px-4 py-3 font-body-md text-body-md outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary"
                      placeholder="Ví dụ: Xe có tiếng kêu lạ ở phía sau khi phanh..."
                      rows={4}
                      value={notes}
                      onChange={(event) => setNotes(event.target.value)}
                    />
                  </div>

                  {submitError && (
                    <p className="font-body-md text-body-md text-error">{submitError}</p>
                  )}

                  <div className="flex justify-end pt-8">
                    <button
                      className="flex items-center gap-3 rounded-lg bg-primary px-xl py-4 font-headline-md text-headline-md text-on-primary shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] hover:bg-surface-tint active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
                      type="submit"
                      disabled={!canSubmit}
                    >
                      {isSubmitting ? "Đang gửi..." : "Xác nhận đặt lịch"}
                      <span className="material-symbols-outlined">arrow_forward</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          </section>

          <aside className="w-full space-y-lg lg:sticky lg:top-24 lg:w-[400px]">
            <section className="overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest shadow-sm">
              <div className="relative h-48 overflow-hidden">
                <img
                  className="h-full w-full object-cover"
                  src={garageImage}
                  alt="Garage Servio hiện đại"
                />
                {selectedGarage?.rating !== undefined && (
                  <div className="absolute right-4 top-4 flex items-center gap-1 rounded-full bg-tertiary px-3 py-1 font-label-sm text-label-sm text-on-tertiary">
                    <span className="material-symbols-outlined text-[14px]">star</span>
                    {selectedGarage.rating}
                  </div>
                )}
              </div>
              <div className="p-lg">
                <h3 className="mb-1 font-headline-md text-headline-md text-on-surface">
                  {selectedGarage?.name ?? "Chưa chọn garage"}
                </h3>
                <p className="mb-4 flex items-center gap-2 font-body-md text-body-md text-on-surface-variant">
                  <span className="material-symbols-outlined text-[18px] text-primary">
                    location_on
                  </span>
                  {selectedGarage?.address ?? "Vui lòng chọn garage để xem địa chỉ"}
                </p>
              </div>
            </section>

            <section className="rounded-xl border border-primary/20 bg-primary-container/10 p-lg">
              <h4 className="mb-4 font-label-md text-label-md uppercase tracking-widest text-primary">
                Tóm tắt dịch vụ
              </h4>
              <ul className="space-y-4">
                <li className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">
                      directions_car
                    </span>
                    <span className="font-body-md text-on-surface">
                      Dịch vụ chính
                    </span>
                  </div>
                  <span className="text-right font-label-md text-label-md text-on-surface">
                    {selectedService?.name ?? "Chưa chọn"}
                  </span>
                </li>
                <li className="flex items-center justify-between border-t border-primary/10 pt-4">
                  <span className="font-body-md text-on-surface-variant">
                    Chi phí tạm tính
                  </span>
                  <span className="font-headline-md text-headline-md text-primary">
                    {formatCurrency(selectedService?.price)}
                  </span>
                </li>
              </ul>
              <p className="mt-4 text-[11px] leading-tight text-on-surface-variant italic">
                * Phí cuối cùng sẽ được báo chính xác sau khi kỹ thuật viên kiểm
                tra thực tế tình trạng xe.
              </p>
            </section>

            <section className="flex items-center gap-4 rounded-xl bg-surface-container-high p-md">
              <div className="flex h-12 w-12 items-center justify-center rounded-full border border-outline-variant bg-surface-container-lowest text-primary">
                <span className="material-symbols-outlined">support_agent</span>
              </div>
              <div>
                <p className="font-label-md text-label-md text-on-surface">
                  Cần hỗ trợ ngay?
                </p>
                <p className="font-body-md text-body-md font-bold text-primary">
                  1900 6789
                </p>
              </div>
            </section>
          </aside>
        </div>
      </main>

      <nav className="fixed bottom-0 left-0 z-50 flex h-20 w-full items-center justify-around border-t border-outline-variant bg-surface px-2 md:hidden">
        <button
          className="flex flex-col items-center justify-center text-on-surface-variant"
          type="button"
          onClick={onHomeClick}
        >
          <span className="material-symbols-outlined">home</span>
          <span className="font-label-sm text-label-sm">Trang chủ</span>
        </button>
        <button
          className="flex flex-col items-center justify-center text-on-surface-variant"
          type="button"
          onClick={onTrackingClick}
        >
          <span className="material-symbols-outlined">location_searching</span>
          <span className="font-label-sm text-label-sm">Theo dõi</span>
        </button>
        <button
          className="flex flex-col items-center justify-center rounded-full bg-secondary-container px-4 py-1 text-on-secondary-container"
          type="button"
        >
          <span className="material-symbols-outlined">calendar_month</span>
          <span className="font-label-sm text-label-sm">Đặt lịch</span>
        </button>
        <button
          className="flex flex-col items-center justify-center text-on-surface-variant"
          type="button"
          onClick={onProfileClick}
        >
          <span className="material-symbols-outlined">person</span>
          <span className="font-label-sm text-label-sm">Cá nhân</span>
        </button>
      </nav>
    </div>
  );
}

function SelectField({
  label,
  icon,
  value,
  onChange,
  options,
  placeholder = "Chọn...",
  disabled = false,
}: {
  label: string;
  icon: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-sm">
      <label className="px-1 font-label-md text-label-md text-on-surface-variant">
        {label}
      </label>
      <div className="relative">
        <select
          className="w-full appearance-none rounded-lg border border-outline-variant bg-surface-container-low px-4 py-3 font-body-md text-body-md outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary disabled:cursor-not-allowed disabled:opacity-50"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          disabled={disabled}
        >
          <option value="">{placeholder}</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <span className="material-symbols-outlined pointer-events-none absolute right-3 top-3 text-on-surface-variant">
          {icon}
        </span>
      </div>
    </div>
  );
}

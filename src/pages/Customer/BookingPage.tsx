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

const avatarImage =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuAoOtpd2mA6tCtPpc_xOKGgqUmp2z_Z-EfI2YOhRqwHtUTN9nhgCwDcip3VZDzsTcF9QqXS2OQOH4-0RXuePu4pK54_EjXHC3NKbjQTW7MQHtAFhC9x9A7N6FQkOxRGnLtLZ0A9seeVNnU1RnN2EAhFyDypvbKu8f_5qkTQZk1QVBYmjjAkVsdqd7FGvJt73-0TUO0k_DolFun55eyGrmB9A3JFcNmwDvtJJ31qXNF4gLLh1oT8xPVEKvvuRROeA6KOJhlFiAy8b3_u";

const BOOKING_STEPS = ["Chọn xe", "Dịch vụ & thời gian", "Xác nhận"];

const bookingCardClass =
  "rounded-3xl border border-outline-variant/40 bg-surface-container-lowest shadow-[0_10px_26px_-14px_rgba(25,28,29,0.28)]";

const optionClass = (active: boolean) =>
  `flex w-full items-center gap-3 rounded-[18px] border-[1.5px] px-4 py-3.5 ${
    active ? "border-primary bg-primary-fixed/40" : "border-outline-variant/50 bg-surface-container-lowest hover:bg-surface-container-low"
  }`;

function formatCurrency(value: number | null | undefined) {
  if (value === null || value === undefined) return "Liên hệ";
  return `${value.toLocaleString("vi-VN")}đ`;
}

function isSlotUpcoming(dateStr: string, timeFrame: string) {
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return true;
  const startHour = Number.parseInt(timeFrame, 10);
  date.setHours(Number.isNaN(startHour) ? 0 : Math.min(Math.max(startHour, 0), 23), 0, 0, 0);
  return date >= new Date();
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
  const [selectedDate, setSelectedDate] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

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
        if (!cancelled) setSchedules(data.filter((schedule) => isSlotUpcoming(schedule.date, schedule.timeFrame)));
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

  const selectedVehicle = useMemo(
    () => vehicles.find((v) => String(v.id) === selectedVehicleId),
    [vehicles, selectedVehicleId],
  );
  const selectedSchedule = useMemo(
    () => schedules.find((s) => String(s.id) === selectedScheduleId),
    [schedules, selectedScheduleId],
  );
  const scheduleDates = useMemo(
    () => [...new Set(schedules.map((schedule) => schedule.date))].sort(),
    [schedules],
  );
  const activeDate = scheduleDates.includes(selectedDate) ? selectedDate : (scheduleDates[0] ?? "");
  const schedulesOfActiveDate = useMemo(
    () => schedules.filter((schedule) => schedule.date === activeDate),
    [schedules, activeDate],
  );
  const bookingStep = !selectedVehicleId || !selectedGarageId ? 0 : !selectedServiceId || !selectedScheduleId ? 1 : 2;

  const servicePrice = selectedService?.price ?? 0;

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
      const booking = await createAppointment({
        vehicleId: Number(selectedVehicleId),
        serviceId: Number(selectedServiceId),
        scheduleId: Number(selectedScheduleId),
        notes: notes.trim() || undefined,
      });
      if (servicePrice > 0) {
        // Dịch vụ có phí: chuyển sang PayOS để trả ngay; kết quả được xử lý ở trang /payment-result.
        if (!booking.paymentUrl) {
          throw new Error("Không nhận được liên kết thanh toán. Vui lòng thử lại.");
        }
        window.location.href = booking.paymentUrl;
        return;
      }
      onTrackingClick();
      return;
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "Đặt lịch không thành công. Vui lòng thử lại.",
      );
    }
    setIsSubmitting(false);
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
          <button aria-label="Thông báo"
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
        <div className="mb-5">
          <h2 className="text-3xl font-extrabold tracking-tight text-on-surface">Đặt lịch</h2>
          <p className="mt-1 text-[15px] text-on-surface-variant">
            {selectedGarage ? `${selectedGarage.name} · ` : ""}hoàn tất 3 bước để giữ chỗ cho xe của bạn.
          </p>
        </div>

        {isLoadingOptions && (
          <div className="rounded-3xl border border-outline-variant/40 bg-surface-container-lowest p-8 text-center text-on-surface-variant">
            Đang tải dữ liệu đặt lịch...
          </div>
        )}

        {!isLoadingOptions && optionsError && (
          <div className="rounded-3xl border border-error/30 bg-error-container/10 p-8 text-center text-error">
            {optionsError}
          </div>
        )}

        {!isLoadingOptions && !optionsError && (
          <form
            className="flex flex-col items-start gap-5 lg:flex-row"
            onSubmit={(event) => {
              event.preventDefault();
              void handleSubmit();
            }}
          >
            <div className="w-full flex-1 space-y-5">
              <ol
                aria-label={`Tiến trình đặt lịch: bước ${bookingStep + 1} trên 3`}
                className={`${bookingCardClass} flex items-center gap-3 px-6 py-4`}
              >
                {BOOKING_STEPS.map((label, index) => (
                  <li
                    key={label}
                    aria-current={index === bookingStep ? "step" : undefined}
                    className="flex flex-1 items-center gap-3 last:flex-none"
                  >
                    <span
                      className={`flex items-center gap-2.5 text-[13px] ${
                        index < bookingStep
                          ? "font-semibold text-[#00531a]"
                          : index === bookingStep
                            ? "font-extrabold text-on-primary-fixed-variant"
                            : "font-semibold text-outline"
                      }`}
                    >
                      <b
                        className={`flex h-[30px] w-[30px] items-center justify-center rounded-full ${
                          index < bookingStep
                            ? "bg-[#008730] text-white"
                            : index === bookingStep
                              ? "bg-primary text-on-primary ring-4 ring-primary/20"
                              : "bg-surface-container-high"
                        }`}
                      >
                        {index < bookingStep ? "✓" : index + 1}
                      </b>
                      {label}
                    </span>
                    {index < BOOKING_STEPS.length - 1 && (
                      <span
                        aria-hidden="true"
                        className={`h-[3px] flex-1 rounded-full ${index < bookingStep ? "bg-[#008730]" : "bg-surface-container-high"}`}
                      />
                    )}
                  </li>
                ))}
              </ol>

              <section aria-labelledby="booking-vehicle-title" className={`${bookingCardClass} p-[22px]`}>
                <h3 id="booking-vehicle-title" className="mb-3 text-lg font-extrabold">
                  Xe &amp; garage
                </h3>
                {vehicles.length === 0 ? (
                  <p className="rounded-2xl bg-surface-container-low p-4 text-sm text-on-surface-variant">
                    Bạn chưa có phương tiện nào. Vui lòng thêm xe trước khi đặt lịch.
                  </p>
                ) : (
                  <div role="radiogroup" aria-label="Chọn xe" className="grid gap-3 md:grid-cols-2">
                    {vehicles.map((vehicle) => {
                      const active = selectedVehicleId === String(vehicle.id);
                      return (
                        <button
                          key={vehicle.id}
                          type="button"
                          role="radio"
                          aria-checked={active}
                          onClick={() => setSelectedVehicleId(String(vehicle.id))}
                          className={optionClass(active)}
                        >
                          <span
                            aria-hidden="true"
                            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-primary-fixed text-on-primary-fixed-variant"
                          >
                            <span className="material-symbols-outlined">two_wheeler</span>
                          </span>
                          <span className="min-w-0 flex-1 text-left">
                            <b className="block truncate">{vehicle.model}</b>
                            <span className="block truncate text-[13px] text-on-surface-variant">
                              {vehicle.licensePlate || vehicle.vin}
                            </span>
                          </span>
                          {active && (
                            <span aria-hidden="true" className="material-symbols-outlined text-primary">
                              check_circle
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
                <div className="mt-4">
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
                </div>
              </section>

              <section aria-labelledby="booking-service-title" className={`${bookingCardClass} p-[22px]`}>
                <h3 id="booking-service-title" className="mb-3 text-lg font-extrabold">
                  Dịch vụ
                </h3>
                {!selectedGarageId ? (
                  <p className="rounded-2xl bg-surface-container-low p-4 text-sm text-on-surface-variant">
                    Chọn garage trước để xem dịch vụ.
                  </p>
                ) : services.length === 0 ? (
                  <p className="rounded-2xl bg-surface-container-low p-4 text-sm text-on-surface-variant">
                    Garage này chưa có dịch vụ nào.
                  </p>
                ) : (
                  <div role="radiogroup" aria-label="Chọn dịch vụ" className="grid gap-3 md:grid-cols-2">
                    {services.map((service) => {
                      const active = selectedServiceId === String(service.id);
                      return (
                        <button
                          key={service.id}
                          type="button"
                          role="radio"
                          aria-checked={active}
                          onClick={() => setSelectedServiceId(String(service.id))}
                          className={optionClass(active)}
                        >
                          <span className="min-w-0 flex-1 text-left">
                            <b className="block">{service.name}</b>
                            {service.description && (
                              <span className="block truncate text-[13px] text-on-surface-variant">
                                {service.description}
                              </span>
                            )}
                          </span>
                          <b className="shrink-0">{formatCurrency(service.price)}</b>
                        </button>
                      );
                    })}
                  </div>
                )}
              </section>

              <section aria-labelledby="booking-time-title" className={`${bookingCardClass} p-[22px]`}>
                <h3 id="booking-time-title" className="mb-3 text-lg font-extrabold">
                  Ngày &amp; giờ
                </h3>
                {!selectedGarageId && (
                  <p className="rounded-2xl bg-surface-container-low p-4 text-sm text-on-surface-variant">
                    Chọn garage trước để xem lịch trống.
                  </p>
                )}
                {selectedGarageId && isLoadingSchedules && (
                  <p className="text-sm text-on-surface-variant">Đang tải lịch...</p>
                )}
                {selectedGarageId && !isLoadingSchedules && scheduleDates.length === 0 && (
                  <p className="rounded-2xl bg-surface-container-low p-4 text-sm text-on-surface-variant">
                    Garage chưa có lịch trống.
                  </p>
                )}
                {selectedGarageId && !isLoadingSchedules && scheduleDates.length > 0 && (
                  <>
                    <div role="radiogroup" aria-label="Chọn ngày" className="mb-4 flex gap-2.5 overflow-x-auto pb-1">
                      {scheduleDates.map((date) => {
                        const parsed = new Date(date);
                        const valid = !Number.isNaN(parsed.getTime());
                        const active = date === activeDate;
                        return (
                          <button
                            key={date}
                            type="button"
                            role="radio"
                            aria-checked={active}
                            onClick={() => {
                              setSelectedDate(date);
                              setSelectedScheduleId("");
                            }}
                            className={`flex h-[76px] w-16 shrink-0 flex-col items-center justify-center gap-0.5 rounded-2xl border-[1.5px] ${
                              active
                                ? "border-primary bg-primary text-on-primary"
                                : "border-outline-variant bg-surface-container-lowest hover:bg-surface-container-low"
                            }`}
                          >
                            <span className={`text-xs ${active ? "" : "text-on-surface-variant"}`}>
                              {valid ? parsed.toLocaleDateString("vi-VN", { weekday: "short" }) : ""}
                            </span>
                            <b className="text-lg">{valid ? parsed.getDate() : date}</b>
                            <span className={`text-[10px] ${active ? "" : "text-on-surface-variant"}`}>
                              {valid ? `Th${parsed.getMonth() + 1}` : ""}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                    <div role="radiogroup" aria-label="Chọn giờ" className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 xl:grid-cols-4">
                      {schedulesOfActiveDate.map((schedule) => {
                        const active = selectedScheduleId === String(schedule.id);
                        const full = schedule.availableSlots <= 0;
                        return (
                          <button
                            key={schedule.id}
                            type="button"
                            role="radio"
                            aria-checked={active}
                            disabled={full}
                            onClick={() => setSelectedScheduleId(String(schedule.id))}
                            className={`min-h-[52px] rounded-xl border-[1.5px] px-2 text-[13px] font-bold ${
                              active
                                ? "border-primary bg-primary text-on-primary"
                                : full
                                  ? "cursor-not-allowed border-outline-variant/40 bg-surface-container text-outline line-through"
                                  : "border-outline-variant bg-surface-container-lowest hover:bg-surface-container-low"
                            }`}
                          >
                            {schedule.timeFrame}
                            <span className={`block text-[11px] font-medium ${active ? "opacity-85" : "text-on-surface-variant"}`}>
                              còn {schedule.availableSlots}/{schedule.totalSlots} chỗ
                            </span>
                          </button>
                        );
                      })}
                    </div>
                    <p className="mt-3 text-xs text-on-surface-variant">
                      Mỗi khung giờ chỉ nhận số xe bằng số kỹ thuật viên đang có của garage; khung giờ đã hết chỗ sẽ tự biến mất.
                    </p>
                  </>
                )}

                <div className="mt-5 space-y-2">
                  <label htmlFor="pages-customer-bookingpage-field-1" className="px-1 text-[13px] font-bold text-on-surface-variant">
                    Ghi chú thêm (tình trạng xe, yêu cầu đặc biệt)
                  </label>
                  <textarea
                    id="pages-customer-bookingpage-field-1"
                    className="w-full resize-none rounded-2xl border border-outline-variant bg-surface-container-lowest px-4 py-3 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/30"
                    placeholder="Ví dụ: Xe có tiếng kêu lạ ở phía sau khi phanh..."
                    rows={3}
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                  />
                </div>
              </section>
            </div>

            <aside className="w-full space-y-5 lg:sticky lg:top-24 lg:w-[22.5rem]">
              <section aria-labelledby="booking-summary-title" className={`${bookingCardClass} space-y-3.5 p-[22px]`}>
                <h3 id="booking-summary-title" className="text-lg font-extrabold">
                  Tóm tắt đặt lịch
                </h3>
                <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-2 text-sm">
                  <dt className="text-on-surface-variant">Garage</dt>
                  <dd className="text-right font-bold">{selectedGarage?.name ?? "Chưa chọn"}</dd>
                  <dt className="text-on-surface-variant">Xe</dt>
                  <dd className="text-right font-bold">{selectedVehicle?.model ?? "Chưa chọn"}</dd>
                  <dt className="text-on-surface-variant">Thời gian</dt>
                  <dd className="text-right font-bold">
                    {selectedSchedule ? `${selectedSchedule.date} · ${selectedSchedule.timeFrame}` : "Chưa chọn"}
                  </dd>
                  <dt className="text-on-surface-variant">Dịch vụ</dt>
                  <dd className="text-right font-bold">{selectedService?.name ?? "Chưa chọn"}</dd>
                </dl>
                <div className="flex items-baseline justify-between border-t border-outline-variant/40 pt-3">
                  <b>Tạm tính</b>
                  <b className="text-[26px] text-on-primary-fixed-variant">{formatCurrency(selectedService?.price)}</b>
                </div>
                <p className="text-[11px] italic leading-tight text-on-surface-variant">
                  * Phí cuối cùng được báo chính xác sau khi kỹ thuật viên kiểm tra thực tế tình trạng xe.
                </p>

                {servicePrice > 0 && (
                  <p
                    data-testid="booking-payment"
                    className="flex items-start gap-2 rounded-2xl bg-primary-fixed/50 p-3 text-xs leading-relaxed text-on-primary-fixed-variant"
                  >
                    <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
                      qr_code_2
                    </span>
                    Sau khi bấm "Xác nhận và thanh toán", bạn được chuyển sang PayOS để trả {formatCurrency(servicePrice)}. Lịch chỉ được giữ khi thanh toán thành công; bạn có 15 phút để hoàn tất.
                  </p>
                )}

                {submitError && (
                  <p role="alert" className="text-sm text-error">
                    {submitError}
                  </p>
                )}

                <button
                  className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-primary to-primary-container text-[15px] font-bold text-on-primary shadow-[0_12px_22px_-14px_rgba(0,89,187,0.9)] transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                  type="submit"
                  disabled={!canSubmit}
                >
                  {isSubmitting
                    ? servicePrice > 0
                      ? "Đang chuyển sang PayOS..."
                      : "Đang gửi..."
                    : servicePrice > 0
                      ? "Xác nhận và thanh toán"
                      : "Xác nhận đặt lịch"}
                  <span aria-hidden="true" className="material-symbols-outlined">
                    arrow_forward
                  </span>
                </button>
              </section>

              <section className="flex items-center gap-4 rounded-3xl bg-surface-container-high p-4">
                <div
                  aria-hidden="true"
                  className="flex h-12 w-12 items-center justify-center rounded-full border border-outline-variant bg-surface-container-lowest text-primary"
                >
                  <span className="material-symbols-outlined">support_agent</span>
                </div>
                <div>
                  <p className="text-sm font-bold text-on-surface">Cần hỗ trợ ngay?</p>
                  <p className="font-bold text-on-primary-fixed-variant">1900 6789</p>
                </div>
              </section>
            </aside>
          </form>
        )}
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
    <div className="space-y-2">
      <label className="px-1 text-[13px] font-bold text-on-surface-variant">
        {label}
      </label>
      <div className="relative">
        <select aria-label={label}
          className="min-h-12 w-full appearance-none rounded-2xl border border-outline-variant bg-surface-container-lowest px-4 py-3 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-50"
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
        <span className="material-symbols-outlined pointer-events-none absolute right-3 top-3 text-outline">
          {icon}
        </span>
      </div>
    </div>
  );
}

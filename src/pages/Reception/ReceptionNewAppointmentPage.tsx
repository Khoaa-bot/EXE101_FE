import { useEffect, useMemo, useState } from "react";
import {
  createReceptionAppointment,
  getAllServices,
  getAvailableSchedules,
  getReceptionDashboard,
  getVehicles,
  type MaintenanceService,
  type Schedule,
  type Vehicle,
} from "../../services/api";

const navItems = [
  ["dashboard", "Dashboard"],
  ["calendar_today", "Schedule"],
  ["event_note", "Appointments"],
  ["person", "Customers"],
];

type ReceptionNewAppointmentPageProps = {
  onDashboardClick?: () => void;
  onScheduleClick?: () => void;
  onAppointmentsClick?: () => void;
  onCustomersClick?: () => void;
  onLogout?: () => void;
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium">{label}</label>
      {children}
    </div>
  );
}

function formatVND(amount: number) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);
}

export default function ReceptionNewAppointmentPage({
  onDashboardClick,
  onScheduleClick,
  onAppointmentsClick,
  onCustomersClick,
  onLogout,
}: ReceptionNewAppointmentPageProps) {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [services, setServices] = useState<MaintenanceService[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [dashboardCustomers, setDashboardCustomers] = useState<{ id: number; name: string }[]>([]);
  const [isLoadingOptions, setIsLoadingOptions] = useState(true);
  const [optionsError, setOptionsError] = useState<string | null>(null);

  const [customerId, setCustomerId] = useState("");
  const [vehicleId, setVehicleId] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [scheduleId, setScheduleId] = useState("");
  const [notes, setNotes] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notice, setNotice] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setIsLoadingOptions(true);
    setOptionsError(null);

    Promise.all([
      getReceptionDashboard(),
      getVehicles(),
      getAllServices(),
      getAvailableSchedules(),
    ])
      .then(([dashboard, vehicleData, serviceData, scheduleData]) => {
        if (cancelled) return;
        const map = new Map<number, string>();
        dashboard.appointments.forEach((a) => {
          if (!map.has(a.customerId)) map.set(a.customerId, a.customerName);
        });
        setDashboardCustomers([...map.entries()].map(([id, name]) => ({ id, name })));
        setVehicles(vehicleData);
        setServices(serviceData);
        setSchedules(scheduleData);
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

  const customers = useMemo(
    () => dashboardCustomers.filter((c) => vehicles.some((v) => v.customerId === c.id)),
    [dashboardCustomers, vehicles],
  );

  const customerVehicles = useMemo(
    () => vehicles.filter((v) => String(v.customerId) === customerId),
    [vehicles, customerId],
  );

  const selectedService = useMemo(
    () => services.find((s) => String(s.id) === serviceId),
    [services, serviceId],
  );

  const selectedSchedule = useMemo(
    () => schedules.find((s) => String(s.id) === scheduleId),
    [schedules, scheduleId],
  );

  const canSubmit =
    Boolean(customerId) &&
    Boolean(vehicleId) &&
    Boolean(serviceId) &&
    Boolean(scheduleId) &&
    !isSubmitting;

  const showNotice = (msg: string) => {
    setNotice(msg);
    window.setTimeout(() => setNotice(""), 3000);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) {
      setSubmitError("Chọn khách, xe, dịch vụ và khung giờ trước khi tạo lịch.");
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      await createReceptionAppointment({
        customerId: Number(customerId),
        vehicleId: Number(vehicleId),
        serviceId: Number(serviceId),
        scheduleId: Number(scheduleId),
        notes: notes.trim() || undefined,
      });
      showNotice("Tạo lịch hẹn thành công.");
      window.setTimeout(() => onAppointmentsClick?.(), 800);
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "Tạo lịch hẹn không thành công.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-background font-sans text-on-surface">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-outline-variant bg-surface-container-lowest p-lg md:flex">
        <div className="mb-xl">
          <div className="flex items-center gap-2 text-primary">
            <span className="material-symbols-outlined text-3xl">electric_car</span>
            <span className="font-headline-lg text-headline-lg font-bold">Servio</span>
          </div>
          <p className="mt-1 text-xs text-on-surface-variant">Garage Lễ tân</p>
        </div>
        <nav className="space-y-1">
          {navItems.map(([icon, label]) => {
            const isCurrent = label === "Appointments";
            return (
              <button
                key={label}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left font-body-md text-body-md transition-colors active:scale-[0.98] ${
                  isCurrent
                    ? "bg-primary-container/15 font-semibold text-primary"
                    : "text-on-surface-variant hover:bg-surface-container-low"
                }`}
                type="button"
                onClick={() => {
                  if (label === "Dashboard") onDashboardClick?.();
                  else if (label === "Schedule") onScheduleClick?.();
                  else if (label === "Appointments") onAppointmentsClick?.();
                  else if (label === "Customers") onCustomersClick?.();
                }}
              >
                <span className="material-symbols-outlined">{icon}</span>
                {label}
              </button>
            );
          })}
        </nav>
        {onLogout && (
          <button
            onClick={onLogout}
            className="mt-auto flex items-center gap-3 rounded-lg px-3 py-2.5 text-error hover:bg-error-container/10 transition-colors"
            type="button"
          >
            <span className="material-symbols-outlined">logout</span>
            Đăng xuất
          </button>
        )}
      </aside>

      <main className="min-h-[100dvh] md:ml-60">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-outline-variant bg-surface/95 px-4 backdrop-blur md:px-8">
          <button className="rounded-full p-2 text-on-surface-variant md:hidden" type="button" aria-label="Mở menu">
            <span className="material-symbols-outlined">menu</span>
          </button>
          <div className="ml-auto flex items-center gap-2">
            <button className="rounded-full p-2 text-on-surface-variant hover:bg-surface-container" type="button" aria-label="Thông báo">
              <span className="material-symbols-outlined">notifications</span>
            </button>
            <div className="ml-2 flex items-center gap-2 border-l border-outline-variant pl-3">
              <div className="hidden text-right sm:block">
                <p className="font-label-md text-label-md">Nguyễn Lễ Tân</p>
                <p className="text-[11px] text-on-surface-variant">Lễ tân</p>
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-fixed font-bold text-on-primary-fixed">
                L
              </div>
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-[1440px] p-4 md:p-8">
          {notice && (
            <div className="mb-4 rounded-lg bg-primary-container/10 text-primary px-4 py-3 text-sm font-medium">{notice}</div>
          )}
          {submitError && (
            <div className="mb-4 rounded-lg bg-error-container/10 text-error px-4 py-3 text-sm font-medium">{submitError}</div>
          )}

          <button
            onClick={onAppointmentsClick}
            className="inline-flex items-center gap-2 text-sm text-primary hover:underline mb-4"
          >
            <span className="material-symbols-outlined">arrow_back</span>
            Quay lại danh sách lịch hẹn
          </button>

          <form onSubmit={onSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <article className="lg:col-span-2 rounded-xl border border-outline-variant bg-surface-container-lowest">
              <div className="p-6 md:p-8 space-y-8">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold">Tạo lịch hẹn mới</h1>
                  <p className="text-sm text-on-surface-variant mt-1">
                    Ghi nhận yêu cầu đặt lịch giúp khách hàng gọi trực tiếp đến quầy lễ tân.
                  </p>
                </div>

                {isLoadingOptions && (
                  <p className="text-sm text-on-surface-variant">Đang tải dữ liệu...</p>
                )}

                {optionsError && (
                  <p className="text-sm text-error">{optionsError}</p>
                )}

                {!isLoadingOptions && !optionsError && (
                  <>
                    <section className="space-y-4">
                      <h2 className="text-sm font-semibold uppercase tracking-wide text-on-surface-variant flex items-center gap-2">
                        <span className="material-symbols-outlined">person</span>
                        Khách hàng & Xe
                      </h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <Field label="Khách hàng">
                          <select
                            value={customerId}
                            onChange={(e) => {
                              setCustomerId(e.target.value);
                              setVehicleId("");
                            }}
                            className="w-full h-11 rounded-lg border border-outline-variant bg-surface-container-low px-4 text-sm outline-none focus:border-primary"
                          >
                            <option value="">Chọn khách hàng</option>
                            {customers.map((c) => (
                              <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                          </select>
                        </Field>
                        <Field label="Xe">
                          <select
                            value={vehicleId}
                            onChange={(e) => setVehicleId(e.target.value)}
                            disabled={!customerId}
                            className="w-full h-11 rounded-lg border border-outline-variant bg-surface-container-low px-4 text-sm outline-none focus:border-primary disabled:opacity-50"
                          >
                            <option value="">Chọn xe</option>
                            {customerVehicles.map((v) => (
                              <option key={v.id} value={v.id}>
                                {v.model} — {v.vin}
                              </option>
                            ))}
                          </select>
                        </Field>
                      </div>
                    </section>

                    <section className="space-y-4">
                      <h2 className="text-sm font-semibold uppercase tracking-wide text-on-surface-variant flex items-center gap-2">
                        <span className="material-symbols-outlined">directions_car</span>
                        Dịch vụ & Lịch hẹn
                      </h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <Field label="Loại dịch vụ">
                          <select
                            value={serviceId}
                            onChange={(e) => setServiceId(e.target.value)}
                            className="w-full h-11 rounded-lg border border-outline-variant bg-surface-container-low px-4 text-sm outline-none focus:border-primary"
                          >
                            <option value="">Chọn dịch vụ</option>
                            {services.map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.name} — {formatVND(s.price)}
                              </option>
                            ))}
                          </select>
                        </Field>
                        <Field label="Khung giờ">
                          <select
                            value={scheduleId}
                            onChange={(e) => setScheduleId(e.target.value)}
                            className="w-full h-11 rounded-lg border border-outline-variant bg-surface-container-low px-4 text-sm outline-none focus:border-primary"
                          >
                            <option value="">Chọn khung giờ</option>
                            {schedules.map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.date} · {s.timeFrame}
                              </option>
                            ))}
                          </select>
                        </Field>
                      </div>
                      <Field label="Ghi chú">
                        <textarea
                          rows={4}
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          placeholder="Ghi chú tình trạng xe, yêu cầu đặc biệt của khách..."
                          className="w-full rounded-lg border border-outline-variant bg-surface-container-low px-4 py-3 text-sm outline-none focus:border-primary resize-none"
                        />
                      </Field>
                    </section>
                  </>
                )}

                <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 border-t border-outline-variant pt-6">
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 rounded-lg border border-outline-variant bg-surface-container-lowest px-4 py-2.5 text-sm font-medium hover:bg-surface-container-low transition-colors"
                    onClick={onAppointmentsClick}
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    disabled={!canSubmit}
                    className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-medium text-on-primary hover:bg-primary/90 transition-colors active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? "Đang tạo..." : "Tạo lịch hẹn"}
                    <span className="material-symbols-outlined text-lg">arrow_forward</span>
                  </button>
                </div>
              </div>
            </article>

            <article className="h-fit rounded-xl border border-outline-variant bg-surface-container-lowest">
              <div className="p-5 space-y-3">
                <p className="text-xs font-bold uppercase tracking-wider text-primary">Tóm tắt dịch vụ</p>
                <div className="flex justify-between text-sm">
                  <span>Dịch vụ</span>
                  <span className="font-semibold text-right">{selectedService?.name || "Chưa chọn"}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Khung giờ</span>
                  <span className="font-semibold text-right">
                    {selectedSchedule ? `${selectedSchedule.date} · ${selectedSchedule.timeFrame}` : "Chưa chọn"}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-3 border-t border-primary/20">
                  <span className="text-sm">Phí tạm tính</span>
                  <span className="text-xl font-bold text-primary">
                    {selectedService ? formatVND(selectedService.price) : "—"}
                  </span>
                </div>
                <ul className="text-sm text-on-surface-variant space-y-2 list-disc list-inside">
                  <li>Chọn khách hàng rồi xe của khách đó.</li>
                  <li>Chọn đúng slot còn trống để tránh xung đột.</li>
                  <li>Lịch mới ở trạng thái <b>Đang chờ</b> đến khi xác nhận.</li>
                </ul>
              </div>
            </article>
          </form>
        </div>
      </main>

      {notice && (
        <div
          className="fixed bottom-5 right-5 z-50 rounded-lg bg-inverse-surface px-4 py-3 text-body-sm text-inverse-on-surface shadow-lg"
          role="status"
        >
          {notice}
        </div>
      )}
    </div>
  );
}

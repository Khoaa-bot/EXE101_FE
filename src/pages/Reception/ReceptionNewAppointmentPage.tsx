import StaffShell from "../../components/StaffShell";
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
import { isSlotUpcoming } from "../../utils/schedule";

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

    getReceptionDashboard()
      .then((dashboard) =>
        Promise.all([
          dashboard,
          getVehicles(),
          getAllServices(dashboard.garageId),
          getAvailableSchedules(dashboard.garageId),
        ]),
      )
      .then(([dashboard, vehicleData, serviceData, scheduleData]) => {
        if (cancelled) return;
        const map = new Map<number, string>();
        dashboard.appointments.forEach((a) => {
          if (!map.has(a.customerId)) map.set(a.customerId, a.customerName);
        });
        setDashboardCustomers([...map.entries()].map(([id, name]) => ({ id, name })));
        setVehicles(vehicleData);
        setServices(serviceData);
        // Khung giờ đã bắt đầu không còn đặt được (BE cũng từ chối), nên không đưa vào danh sách chọn.
        setSchedules(scheduleData.filter((schedule) => isSlotUpcoming(schedule.date, schedule.timeFrame)));
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
      <StaffShell
        role="reception"
        active="new"
        handlers={{ dashboard: onDashboardClick, schedule: onScheduleClick, appointments: onAppointmentsClick, customers: onCustomersClick }}
        userName={"Nguyễn Lễ Tân"}
        userDetail={"Lễ tân"}
        onLogout={onLogout}
      >

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
            <article className="lg:col-span-2 rounded-3xl border border-outline-variant/40 bg-surface-container-lowest shadow-[0_10px_26px_-14px_rgba(25,28,29,0.28)]">
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
                          <select aria-label="Khách hàng"
                            value={customerId}
                            onChange={(e) => {
                              setCustomerId(e.target.value);
                              setVehicleId("");
                            }}
                            className="w-full h-11 rounded-2xl border border-outline-variant bg-surface-container-lowest px-4 text-sm outline-none focus:border-primary"
                          >
                            <option value="">Chọn khách hàng</option>
                            {customers.map((c) => (
                              <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                          </select>
                        </Field>
                        <Field label="Xe">
                          <select aria-label="Xe của khách"
                            value={vehicleId}
                            onChange={(e) => setVehicleId(e.target.value)}
                            disabled={!customerId}
                            className="w-full h-11 rounded-2xl border border-outline-variant bg-surface-container-lowest px-4 text-sm outline-none focus:border-primary disabled:opacity-50"
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
                          <select aria-label="Dịch vụ"
                            value={serviceId}
                            onChange={(e) => setServiceId(e.target.value)}
                            className="w-full h-11 rounded-2xl border border-outline-variant bg-surface-container-lowest px-4 text-sm outline-none focus:border-primary"
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
                          <select aria-label="Khung giờ"
                            value={scheduleId}
                            onChange={(e) => setScheduleId(e.target.value)}
                            className="w-full h-11 rounded-2xl border border-outline-variant bg-surface-container-lowest px-4 text-sm outline-none focus:border-primary"
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
                        <textarea aria-label="Ghi chú tình trạng xe, yêu cầu đặc biệt của khách..."
                          rows={4}
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          placeholder="Ghi chú tình trạng xe, yêu cầu đặc biệt của khách..."
                          className="w-full rounded-2xl border border-outline-variant bg-surface-container-lowest px-4 py-3 text-sm outline-none focus:border-primary resize-none"
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
                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-primary to-primary-container px-6 py-3 text-sm font-medium text-on-primary hover:bg-primary/90 transition-colors active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? "Đang tạo..." : "Tạo lịch hẹn"}
                    <span className="material-symbols-outlined text-lg">arrow_forward</span>
                  </button>
                </div>
              </div>
            </article>

            <article className="h-fit rounded-3xl border border-outline-variant/40 bg-surface-container-lowest shadow-[0_10px_26px_-14px_rgba(25,28,29,0.28)]">
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
      </StaffShell>

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

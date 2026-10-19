import StaffShell from "../../components/StaffShell";
import { useEffect, useState } from "react";
import {
  getReceptionDashboard,
  type AppointmentDto,
  type ReceptionDashboard,
} from "../../services/api";

type ReceptionDashboardPageProps = {
  onDashboardClick?: () => void;
  onScheduleClick?: () => void;
  onAppointmentsClick?: () => void;
  onCustomersClick?: () => void;
  onNewAppointmentClick?: () => void;
  onLogout?: () => void;
};

function buildStats(data: ReceptionDashboard) {
  return [
    { label: "Tổng số lịch hẹn", value: String(data.totalAppointments), icon: "calendar_month", tone: "primary" as const },
    { label: "Chờ xác nhận", value: String(data.pendingCount), icon: "schedule", tone: "warning" as const },
    { label: "Đã xác nhận", value: String(data.confirmedCount), icon: "check_circle", tone: "success" as const },
    { label: "Đang xử lý", value: String(data.inProgressCount), icon: "build", tone: "accent" as const },
    { label: "Hoàn thành", value: String(data.completedCount), icon: "task_alt", tone: "success" as const },
    { label: "Đã hủy", value: String(data.cancelledCount), icon: "cancel", tone: "error" as const },
    { label: "Không đến", value: String(data.noShowCount), icon: "person_off", tone: "error" as const },
  ];
}

function inProgressRows(appointments: AppointmentDto[]) {
  return appointments
    .filter((a) => {
      const s = a.status.toLowerCase();
      return s === "in_progress" || s === "confirmed";
    })
    .map((a) => ({
      plate: a.vehicleLicensePlate || a.vehicleVin,
      customer: a.customerName,
      service: a.serviceName,
      progress: a.status.toLowerCase() === "in_progress" ? 50 : 20,
      eta: a.timeFrame,
      id: a.id,
    }));
}

function appointmentRows(appointments: AppointmentDto[]) {
  return appointments.slice(0, 6).map((a) => ({
    time: a.timeFrame.split(" - ")[0] || a.timeFrame,
    name: a.customerName,
    plate: a.vehicleLicensePlate || a.vehicleVin,
    service: a.serviceName,
    status: (a.status.toLowerCase() === "confirmed" ? "confirmed" : "pending") as "confirmed" | "pending",
    id: a.id,
  }));
}

export default function ReceptionDashboardPage({
  onDashboardClick,
  onScheduleClick,
  onAppointmentsClick,
  onCustomersClick,
  onNewAppointmentClick,
  onLogout,
}: ReceptionDashboardPageProps) {
  const [dashboard, setDashboard] = useState<ReceptionDashboard | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setLoadError(null);

    getReceptionDashboard()
      .then((data) => {
        if (!cancelled) setDashboard(data);
      })
      .catch((err) => {
        if (!cancelled) {
          setLoadError(
            err instanceof Error ? err.message : "Không tải được dashboard.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const stats = dashboard ? buildStats(dashboard) : [];
  const inProgress = dashboard ? inProgressRows(dashboard.appointments) : [];
  const appointments = dashboard ? appointmentRows(dashboard.appointments) : [];
  const receptionistName = dashboard?.receptionistName || "Lễ tân";
  const garageName = dashboard?.garageName || "";

  return (
    <div className="min-h-[100dvh] bg-background font-sans text-on-surface">
      <StaffShell
        role="reception"
        active="dashboard"
        handlers={{ dashboard: onDashboardClick, schedule: onScheduleClick, appointments: onAppointmentsClick, customers: onCustomersClick, new: onNewAppointmentClick }}
        userName={receptionistName}
        userDetail={"Lễ tân"}
        onLogout={onLogout}
      >

        <div className="mx-auto max-w-[1440px] p-4 md:p-8">
          <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">Tổng quan</h1>
              <p className="text-on-surface-variant mt-1">
                {dashboard
                  ? `Chào mừng ${receptionistName}, hôm nay có ${dashboard.totalAppointments} lịch hẹn.`
                  : "Đang tải dữ liệu..."}
              </p>
            </div>
            <div className="flex gap-2">
              <div className="inline-flex items-center gap-2 rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm">
                <span className="material-symbols-outlined text-lg text-on-surface-variant">calendar_month</span>
                {new Date().toLocaleDateString("vi-VN")}
              </div>
              {garageName && (
                <div className="inline-flex items-center gap-2 rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm">
                  <span className="material-symbols-outlined text-lg text-on-surface-variant">build</span>
                  {garageName}
                </div>
              )}
            </div>
          </div>

          {isLoading && (
            <p className="text-body-sm text-on-surface-variant">Đang tải dashboard...</p>
          )}

          {loadError && !isLoading && (
            <p className="text-body-sm text-error">{loadError}</p>
          )}

          {!isLoading && !loadError && dashboard && (
            <>
              <div className="grid gap-4 grid-cols-2 md:grid-cols-3 xl:grid-cols-4 mb-6">
                {stats.map((s) => (
                  <article key={s.label} className="rounded-3xl border border-outline-variant/40 bg-surface-container-lowest shadow-[0_10px_26px_-14px_rgba(25,28,29,0.28)] p-5">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm text-on-surface-variant">{s.label}</p>
                      <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary-container/10 text-primary">
                        <span className="material-symbols-outlined">{s.icon}</span>
                      </span>
                    </div>
                    <p className="text-2xl font-bold mt-3">{s.value}</p>
                  </article>
                ))}
              </div>

              <div className="grid gap-4 lg:grid-cols-3">
                <article className="lg:col-span-2 rounded-3xl border border-outline-variant/40 bg-surface-container-lowest shadow-[0_10px_26px_-14px_rgba(25,28,29,0.28)]">
                  <div className="p-5">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg font-semibold">Lịch hẹn đang xử lý</h2>
                      <button onClick={onAppointmentsClick} className="text-sm text-primary hover:underline">Xem tất cả</button>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="text-xs uppercase text-on-surface-variant">
                          <tr className="border-b border-outline-variant">
                            <th className="text-left font-medium py-2">Biển số</th>
                            <th className="text-left font-medium py-2">Khách hàng</th>
                            <th className="text-left font-medium py-2">Dịch vụ</th>
                            <th className="text-left font-medium py-2 min-w-[140px]">Tiến độ</th>
                            <th className="text-left font-medium py-2">Dự kiến</th>
                          </tr>
                        </thead>
                        <tbody>
                          {inProgress.length === 0 && (
                            <tr>
                              <td colSpan={5} className="py-6 text-center text-on-surface-variant">
                                Không có lịch hẹn nào đang xử lý.
                              </td>
                            </tr>
                          )}
                          {inProgress.map((r) => (
                            <tr key={r.id} className="border-b border-outline-variant last:border-0">
                              <td className="py-3 font-medium">{r.plate}</td>
                              <td className="py-3">{r.customer}</td>
                              <td className="py-3">{r.service}</td>
                              <td className="py-3">
                                <div className="flex items-center gap-2">
                                  <div className="h-1.5 flex-1 rounded-full bg-surface-container">
                                    <div className="h-full rounded-full bg-primary" style={{ width: `${r.progress}%` }} />
                                  </div>
                                  <span className="text-xs text-on-surface-variant w-9 text-right">{r.progress}%</span>
                                </div>
                              </td>
                              <td className="py-3">{r.eta}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </article>

                <article className="rounded-3xl border border-outline-variant/40 bg-surface-container-lowest shadow-[0_10px_26px_-14px_rgba(25,28,29,0.28)]">
                  <div className="flex items-center gap-2 border-b border-outline-variant px-5 py-4">
                    <span className="material-symbols-outlined text-primary">calendar_month</span>
                    <h2 className="text-base font-semibold">Lịch hẹn gần nhất</h2>
                  </div>
                  <ul className="space-y-3 p-5">
                    {appointments.length === 0 && (
                      <li className="text-sm text-on-surface-variant">Không có lịch hẹn.</li>
                    )}
                    {appointments.map((a) => (
                      <li key={a.id} className="flex gap-3 border-l-2 border-primary/40 pl-3">
                        <div className="text-sm font-semibold w-12 shrink-0">{a.time}</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold">{a.name}</p>
                          <p className="text-xs text-on-surface-variant">{a.plate}</p>
                          <div className="mt-1 flex items-center gap-2 flex-wrap">
                            <span className="text-xs">{a.service}</span>
                            <span
                              className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-semibold ${
                                a.status === "confirmed"
                                  ? "bg-tertiary-container/10 text-tertiary"
                                  : "bg-error-container text-on-error-container"
                              }`}
                            >
                              {a.status === "confirmed" ? "Đã xác nhận" : "Chờ đến"}
                            </span>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                  <button
                    className="w-full mt-5 rounded-xl bg-gradient-to-br from-primary to-primary-container px-4 py-2.5 text-sm font-medium text-on-primary hover:bg-primary/90 transition-colors"
                    onClick={onNewAppointmentClick}
                  >
                    Đặt lịch hẹn mới
                  </button>
                </article>
              </div>
            </>
          )}
        </div>
      </StaffShell>
    </div>
  );
}

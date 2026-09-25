import { useEffect, useMemo, useState } from "react";
import {
  getReceptionDashboard,
  type AppointmentDto,
  type ReceptionDashboard,
} from "../../services/api";

const navItems = [
  ["dashboard", "Dashboard"],
  ["calendar_today", "Schedule"],
  ["event_note", "Appointments"],
  ["person", "Customers"],
];

type ReceptionSchedulePageProps = {
  onDashboardClick?: () => void;
  onScheduleClick?: () => void;
  onAppointmentsClick?: () => void;
  onCustomersClick?: () => void;
  onNewAppointmentClick?: () => void;
  onLogout?: () => void;
};

const SLOTS = ["09:00 - 11:00", "11:00 - 13:00", "13:00 - 15:00", "15:00 - 17:00"];

const STATUS_TONE: Record<string, string> = {
  pending: "bg-error-container/10 border-error/30 text-on-error-container",
  confirmed: "bg-primary-container/10 border-primary/30 text-primary",
  in_progress: "bg-primary-container/10 border-primary/30 text-primary",
  completed: "bg-tertiary-container/10 border-tertiary/30 text-tertiary",
};

function getWeekDays(): { label: string; iso: string; display: string }[] {
  const today = new Date();
  const dow = today.getDay() === 0 ? 7 : today.getDay(); // 1 (Mon) .. 7 (Sun)
  const monday = new Date(today);
  monday.setDate(today.getDate() - (dow - 1));

  const labels = ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "Chủ Nhật"];
  return labels.map((label, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const iso = d.toISOString().slice(0, 10);
    const display = `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
    return { label, iso, display };
  });
}

export default function ReceptionSchedulePage({
  onDashboardClick,
  onScheduleClick,
  onAppointmentsClick,
  onCustomersClick,
  onNewAppointmentClick,
  onLogout,
}: ReceptionSchedulePageProps) {
  const [notice, setNotice] = useState("");
  const [dashboard, setDashboard] = useState<ReceptionDashboard | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const showNotice = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 3000);
  };

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
            err instanceof Error ? err.message : "Không tải được lịch làm việc.",
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

  const days = useMemo(() => getWeekDays(), []);
  const appointments = dashboard?.appointments ?? [];

  const apptAt = (iso: string, slot: string): AppointmentDto | undefined =>
    appointments.find((a) => a.scheduleDate === iso && a.timeFrame === slot);

  const summary = dashboard
    ? [
        { label: "Tổng lịch hẹn", value: dashboard.totalAppointments, icon: "calendar_month", tone: "bg-primary-container/10 text-primary" },
        { label: "Đã hoàn thành", value: dashboard.completedCount, icon: "check_circle", tone: "bg-tertiary-container/10 text-tertiary" },
        { label: "Đang chờ", value: dashboard.pendingCount, icon: "schedule", tone: "bg-surface-container text-on-surface-variant" },
        { label: "Đã hủy", value: dashboard.cancelledCount, icon: "cancel", tone: "bg-error-container/10 text-on-error-container" },
      ]
    : [];

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
            const isCurrent = label === "Schedule";
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
          <label className="relative hidden w-full max-w-[28rem] md:block">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">search</span>
            <input
              className="w-full rounded-full border border-outline-variant bg-surface-container-low px-4 py-2 pl-10 text-body-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
              placeholder="Tìm kiếm lịch hẹn, khách hàng..."
            />
          </label>
          <div className="ml-auto flex items-center gap-2">
            <button className="rounded-full p-2 text-on-surface-variant hover:bg-surface-container" type="button" aria-label="Thông báo">
              <span className="material-symbols-outlined">notifications</span>
            </button>
            <div className="ml-2 flex items-center gap-2 border-l border-outline-variant pl-3">
              <div className="hidden text-right sm:block">
                <p className="font-label-md text-label-md">
                  {dashboard?.receptionistName ?? "Lễ tân"}
                </p>
                <p className="text-[11px] text-on-surface-variant">
                  {dashboard?.garageName ?? "Lễ tân"}
                </p>
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-fixed font-bold text-on-primary-fixed">
                {(dashboard?.receptionistName ?? "L")[0].toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-[1440px] p-4 md:p-8">
          {notice && (
            <div className="mb-4 rounded-lg bg-primary-container/10 text-primary px-4 py-3 text-sm font-medium">{notice}</div>
          )}

          <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">Lịch làm việc xưởng</h1>
              <p className="text-on-surface-variant mt-1">
                Tuần: {days[0]?.display} - {days[6]?.display}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-on-primary hover:bg-primary/90 transition-colors active:scale-[0.98]"
                onClick={() => {
                  showNotice("Mở biểu mẫu đặt lịch mới");
                  onNewAppointmentClick?.();
                }}
              >
                <span className="material-symbols-outlined text-lg">add</span>
                Đặt lịch mới
              </button>
            </div>
          </div>

          {isLoading && (
            <p className="text-body-sm text-on-surface-variant">Đang tải lịch làm việc...</p>
          )}

          {!isLoading && loadError && (
            <p className="text-body-sm text-error">{loadError}</p>
          )}

          {!isLoading && !loadError && dashboard && (
            <>
              <article className="mb-6 rounded-xl border border-outline-variant bg-surface-container-lowest">
                <div className="p-0 overflow-x-auto">
                  <table className="w-full min-w-[900px] border-collapse">
                    <thead>
                      <tr className="bg-surface-container-low">
                        <th className="text-left text-sm font-semibold p-3 border-b border-outline-variant w-32">Khung Giờ</th>
                        {days.map((d) => (
                          <th key={d.iso} className="text-left text-sm font-semibold p-3 border-b border-outline-variant border-l">
                            <div>{d.label}</div>
                            <div className="text-xs font-normal text-on-surface-variant">{d.display}</div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {SLOTS.map((slot) => (
                        <tr key={slot}>
                          <td className="align-top p-3 border-b border-outline-variant text-sm font-semibold">
                            {slot.split(" - ")[0]}
                            <div className="text-xs font-normal text-on-surface-variant">{slot.split(" - ")[1]}</div>
                          </td>
                          {days.map((d) => {
                            const appt = apptAt(d.iso, slot);
                            const tone =
                              (appt && STATUS_TONE[appt.status.toLowerCase()]) ??
                              "bg-error-container/10 border-error/30 text-on-error-container";
                            return (
                              <td key={d.iso} className="align-top p-2 border-b border-outline-variant border-l h-24">
                                {appt && (
                                  <div className={`rounded-md border-l-4 p-2 text-xs ${tone}`}>
                                    <div className="flex items-center justify-between gap-1">
                                      <span className="font-semibold truncate">{appt.customerName}</span>
                                      <span className="material-symbols-outlined text-sm shrink-0 opacity-70">visibility</span>
                                    </div>
                                    <p className="mt-1 text-[11px] opacity-80">
                                      {appt.vehicleModel} - {appt.serviceName}
                                    </p>
                                  </div>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </article>

              <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
                {summary.map((s) => (
                  <article key={s.label} className="rounded-xl border border-outline-variant bg-surface-container-lowest p-5">
                    <div className="flex items-center gap-3">
                      <span className={`grid h-11 w-11 place-items-center rounded-lg ${s.tone}`}>
                        <span className="material-symbols-outlined">{s.icon}</span>
                      </span>
                      <div>
                        <p className="text-sm text-on-surface-variant">{s.label}</p>
                        <p className="text-2xl font-bold">{s.value}</p>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </>
          )}
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

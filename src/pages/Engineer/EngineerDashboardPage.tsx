import { useEffect, useState } from "react";
import {
  getEngineerDashboard,
  updateEngineerAppointment,
  type AppointmentDto,
} from "../../services/api";
import { statusBadgeClass, statusLabel } from "./engineerStatus";

const navItems = [
  ["dashboard", "Tổng quan"],
  ["calendar_today", "Lịch làm việc"],
  ["event_note", "Lịch hẹn"],
  ["engineering", "Kỹ thuật viên"],
  ["person", "Khách hàng"],
  ["settings", "Cài đặt"],
];

type EngineerDashboardPageProps = {
  onDashboardClick?: () => void;
  onScheduleClick?: () => void;
  onAppointmentsClick?: () => void;
  onTechniciansClick?: () => void;
  onCustomersClick?: () => void;
  onSettingsClick?: () => void;
  onJobDetailClick?: (jobId?: string) => void;
  onLogout?: () => void;
};

export default function EngineerDashboardPage({
  onDashboardClick,
  onScheduleClick,
  onAppointmentsClick,
  onTechniciansClick,
  onCustomersClick,
  onSettingsClick,
  onJobDetailClick,
  onLogout,
}: EngineerDashboardPageProps) {
  const [engineerName, setEngineerName] = useState("");
  const [appointments, setAppointments] = useState<AppointmentDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [acceptingId, setAcceptingId] = useState<number | null>(null);
  const [notice, setNotice] = useState("");

  const showNotice = (msg: string) => {
    setNotice(msg);
    window.setTimeout(() => setNotice(""), 3000);
  };

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setLoadError(null);

    getEngineerDashboard()
      .then((data) => {
        if (cancelled) return;
        setEngineerName(data.engineerName);
        setAppointments(data.appointments);
      })
      .catch((err) => {
        if (cancelled) return;
        setLoadError(
          err instanceof Error ? err.message : "Không tải được danh sách công việc.",
        );
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const acceptJob = (id: number) => {
    setAcceptingId(id);
    updateEngineerAppointment(id, { status: "confirmed" })
      .then((updated) => {
        setAppointments((prev) => prev.map((a) => (a.id === id ? updated : a)));
        showNotice(`Đã tiếp nhận thành công lịch làm việc #${id}`);
      })
      .catch((err) => {
        showNotice(
          err instanceof Error ? err.message : "Không thể tiếp nhận công việc này.",
        );
      })
      .finally(() => setAcceptingId(null));
  };

  const initial = engineerName ? engineerName.charAt(0).toUpperCase() : "?";

  return (
    <div className="min-h-[100dvh] bg-background font-sans text-on-surface">
      {/* Sidebar Navigation */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-outline-variant bg-surface-container-lowest p-lg md:flex">
        <div className="mb-xl">
          <div className="flex items-center gap-2 text-primary">
            <span className="material-symbols-outlined text-3xl">
              electric_car
            </span>
            <span className="font-headline-lg text-headline-lg font-bold">
              Servio
            </span>
          </div>
          <p className="mt-1 text-xs text-on-surface-variant">
            Garage Kỹ thuật viên
          </p>
        </div>
        <nav className="space-y-1">
          {navItems.map(([icon, label]) => {
            const isCurrent = label === "Tổng quan";
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
                  if (label === "Tổng quan") onDashboardClick?.();
                  else if (label === "Lịch làm việc") onScheduleClick?.();
                  else if (label === "Lịch hẹn") onAppointmentsClick?.();
                  else if (label === "Kỹ thuật viên") onTechniciansClick?.();
                  else if (label === "Khách hàng") onCustomersClick?.();
                  else if (label === "Cài đặt") onSettingsClick?.();
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

      {/* Main Content Area */}
      <main className="min-h-[100dvh] md:ml-60">
        {/* Header Bar */}
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-outline-variant bg-surface/95 px-margin-mobile backdrop-blur md:px-margin-desktop">
          <button
            className="rounded-full p-2 text-on-surface-variant md:hidden"
            type="button"
            aria-label="Mở menu"
          >
            <span className="material-symbols-outlined">menu</span>
          </button>
          <label className="relative hidden w-full max-w-md md:block">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">
              search
            </span>
            <input
              className="w-full rounded-full border border-outline-variant bg-surface-container-low px-4 py-2 pl-10 text-body-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
              placeholder="Tìm kiếm phiếu, xe, biển số..."
            />
          </label>
          <div className="ml-auto flex items-center gap-2">
            <button
              className="rounded-full p-2 text-on-surface-variant hover:bg-surface-container"
              type="button"
              aria-label="Thông báo"
            >
              <span className="material-symbols-outlined">notifications</span>
            </button>
            <div className="ml-2 flex items-center gap-2 border-l border-outline-variant pl-3">
              <div className="hidden text-right sm:block">
                <p className="font-label-md text-label-md">
                  {engineerName || "Kỹ thuật viên"}
                </p>
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-fixed font-bold text-on-primary-fixed">
                {initial}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="mx-auto max-w-[1440px] p-margin-mobile md:p-margin-desktop">
          {/* Banner Section */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-outline-variant pb-5">
            <div>
              <h1 className="font-headline-lg text-headline-lg font-bold">
                Lịch làm việc của bạn
              </h1>
              <p className="mt-1 text-body-sm text-on-surface-variant">
                Bạn có {appointments.length} công việc được phân công.
              </p>
            </div>
          </div>

          {isLoading && (
            <p className="mt-6 text-body-sm text-on-surface-variant">
              Đang tải danh sách công việc...
            </p>
          )}

          {!isLoading && loadError && (
            <p className="mt-6 text-body-sm text-error">{loadError}</p>
          )}

          {!isLoading && !loadError && (
            <>
              {/* Metrics Section */}
              <section className="mt-6 grid gap-4 sm:grid-cols-3">
                <article className="rounded-xl border border-outline-variant bg-surface-container-lowest p-5">
                  <p className="text-xs font-semibold uppercase text-outline">
                    ĐƯỢC PHÂN CÔNG
                  </p>
                  <p className="mt-2 font-headline-lg text-3xl font-bold">
                    {appointments.length} xe
                  </p>
                </article>
                <article className="rounded-xl border border-outline-variant bg-surface-container-lowest p-5">
                  <p className="text-xs font-semibold uppercase text-outline">
                    ĐANG THỰC HIỆN
                  </p>
                  <p className="mt-2 font-headline-lg text-3xl font-bold text-primary">
                    {
                      appointments.filter(
                        (a) =>
                          a.status.toLowerCase() === "in_progress" ||
                          a.status.toLowerCase() === "confirmed",
                      ).length
                    }{" "}
                    xe
                  </p>
                </article>
                <article className="rounded-xl border border-outline-variant bg-surface-container-lowest p-5">
                  <p className="text-xs font-semibold uppercase text-outline">
                    ĐÃ HOÀN TẤT
                  </p>
                  <p className="mt-2 font-headline-lg text-3xl font-bold text-tertiary">
                    {
                      appointments.filter(
                        (a) => a.status.toLowerCase() === "completed",
                      ).length
                    }{" "}
                    xe
                  </p>
                </article>
              </section>

              {/* Job Cards List */}
              <section className="mt-8 space-y-4">
                <h2 className="font-headline-md text-lg font-bold">
                  Danh sách phiếu sửa chữa
                </h2>

                {appointments.length === 0 && (
                  <p className="rounded-xl border border-dashed border-outline-variant p-6 text-center text-body-sm text-on-surface-variant">
                    Bạn chưa được phân công công việc nào.
                  </p>
                )}

                {appointments.map((job) => {
                  const status = job.status.toLowerCase();
                  const isPending = status === "pending";

                  return (
                    <article
                      key={job.id}
                      className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-5 shadow-sm transition hover:border-primary/50"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="flex items-start gap-3">
                          <span className="material-symbols-outlined rounded-xl bg-primary-container/15 p-3 text-primary text-2xl">
                            build
                          </span>
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-mono text-xs font-bold text-primary">
                                #{job.id}
                              </span>
                              <span
                                className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusBadgeClass(job.status)}`}
                              >
                                {statusLabel(job.status)}
                              </span>
                            </div>
                            <h3 className="mt-1 font-bold text-base">
                              {job.serviceName}
                            </h3>
                            <p className="mt-1 text-xs text-on-surface-variant">
                              {job.vehicleModel} · {job.scheduleDate} ·{" "}
                              {job.timeFrame}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-outline text-lg">
                            account_circle
                          </span>
                          <span className="text-xs font-semibold">
                            {job.customerName}
                          </span>
                        </div>
                      </div>

                      {/* Actions Row */}
                      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-outline-variant/60 pt-4">
                        <button
                          type="button"
                          disabled={!isPending || acceptingId === job.id}
                          onClick={() => acceptJob(job.id)}
                          className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                            !isPending
                              ? "bg-surface-container-high text-outline cursor-not-allowed"
                              : "bg-primary text-on-primary hover:opacity-90 active:scale-[0.98]"
                          }`}
                        >
                          <span className="material-symbols-outlined text-base">
                            play_arrow
                          </span>
                          {acceptingId === job.id
                            ? "Đang xử lý..."
                            : isPending
                              ? "Nhận việc"
                              : "Đã nhận việc"}
                        </button>

                        <button
                          type="button"
                          onClick={() => onJobDetailClick?.(String(job.id))}
                          className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"
                        >
                          Xem chi tiết công việc
                          <span className="material-symbols-outlined text-base">
                            chevron_right
                          </span>
                        </button>
                      </div>
                    </article>
                  );
                })}
              </section>
            </>
          )}
        </div>
      </main>

      {/* Notice Toast */}
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

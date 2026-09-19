import { useState } from "react";
import { INITIAL_JOBS, type JobItem } from "./mockJobs";

const navItems = [
  ["dashboard", "Tổng quan"],
  ["calendar_today", "Lịch làm việc"],
  ["event_note", "Lịch hẹn"],
  ["engineering", "Kỹ thuật viên"],
  ["person", "Khách hàng"],
  ["settings", "Cài đặt"],
];

type EngineerSchedulePageProps = {
  onDashboardClick?: () => void;
  onScheduleClick?: () => void;
  onAppointmentsClick?: () => void;
  onTechniciansClick?: () => void;
  onCustomersClick?: () => void;
  onSettingsClick?: () => void;
  onJobDetailClick?: (jobId?: string) => void;
  onLogout?: () => void;
};

export default function EngineerSchedulePage({
  onDashboardClick,
  onScheduleClick,
  onAppointmentsClick,
  onTechniciansClick,
  onCustomersClick,
  onSettingsClick,
  onJobDetailClick,
  onLogout,
}: EngineerSchedulePageProps) {
  const [jobs] = useState<JobItem[]>(INITIAL_JOBS);

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
            const isCurrent = label === "Lịch làm việc";
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
          <div className="hidden font-bold text-sm text-on-surface-variant md:block">
            Lịch làm việc theo ca
          </div>
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
                <p className="font-label-md text-label-md">Trần Quốc Toản</p>
                <p className="text-[11px] text-on-surface-variant">
                  KTV Trưởng
                </p>
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-fixed font-bold text-on-primary-fixed">
                T
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="mx-auto max-w-[1440px] p-margin-mobile md:p-margin-desktop">
          <div className="border-b border-outline-variant pb-5">
            <h1 className="font-headline-lg text-headline-lg font-bold">
              Lịch làm việc
            </h1>
            <p className="mt-1 text-body-sm text-on-surface-variant">
              Tổng quan tuần này theo khung giờ và phiếu phân công.
            </p>
          </div>

          <section className="mt-6 overflow-hidden rounded-2xl border border-outline-variant bg-surface-container-lowest p-6 shadow-sm">
            <div className="space-y-3">
              {jobs.map((j) => (
                <div
                  key={j.id}
                  onClick={() => onJobDetailClick?.(j.id)}
                  className="flex cursor-pointer flex-wrap items-center justify-between gap-3 rounded-xl border border-outline-variant p-4 transition hover:border-primary/50 hover:bg-surface-container-low"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-container/15 text-primary">
                      <span className="material-symbols-outlined">
                        calendar_today
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-base truncate">
                        {j.service}
                      </p>
                      <p className="text-xs text-on-surface-variant truncate">
                        {j.date} · Giờ: {j.time} · Xe: {j.vehicle.model} (
                        <span className="font-mono font-bold text-primary">
                          {j.vehicle.plate}
                        </span>
                        )
                      </p>
                    </div>
                  </div>

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      j.status === "in_progress"
                        ? "bg-primary-container/15 text-primary"
                        : j.status === "accepted"
                          ? "bg-tertiary-container/15 text-tertiary"
                          : j.status === "done"
                            ? "bg-tertiary text-on-tertiary"
                            : "bg-surface-container-high text-on-surface-variant"
                    }`}
                  >
                    {j.status === "in_progress"
                      ? "Đang thực hiện"
                      : j.status === "accepted"
                        ? "Đã tiếp nhận"
                        : j.status === "done"
                          ? "Hoàn thành"
                          : "Chờ xử lý"}
                  </span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

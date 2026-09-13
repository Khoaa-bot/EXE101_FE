import { useState } from "react";
import { INITIAL_JOBS, type JobItem } from "./EngineerDashboardPage";

const navItems = [
  ["dashboard", "Tổng quan"],
  ["calendar_today", "Lịch làm việc"],
  ["event_note", "Lịch hẹn"],
  ["engineering", "Kỹ thuật viên"],
  ["person", "Khách hàng"],
  ["settings", "Cài đặt"],
];

type EngineerAppointmentsPageProps = {
  onDashboardClick?: () => void;
  onScheduleClick?: () => void;
  onAppointmentsClick?: () => void;
  onTechniciansClick?: () => void;
  onCustomersClick?: () => void;
  onSettingsClick?: () => void;
  onJobDetailClick?: (jobId?: string) => void;
  onLogout?: () => void;
};

export default function EngineerAppointmentsPage({
  onDashboardClick,
  onScheduleClick,
  onAppointmentsClick,
  onTechniciansClick,
  onCustomersClick,
  onSettingsClick,
  onJobDetailClick,
  onLogout,
}: EngineerAppointmentsPageProps) {
  const [jobs] = useState<JobItem[]>(INITIAL_JOBS);
  const [filterQuery, setFilterQuery] = useState("");

  const visibleJobs = jobs.filter(
    (j) =>
      j.service.toLowerCase().includes(filterQuery.toLowerCase()) ||
      j.vehicle.model.toLowerCase().includes(filterQuery.toLowerCase()) ||
      j.vehicle.plate.toLowerCase().includes(filterQuery.toLowerCase()) ||
      j.customer.name.toLowerCase().includes(filterQuery.toLowerCase()) ||
      j.id.toLowerCase().includes(filterQuery.toLowerCase()),
  );

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
            const isCurrent = label === "Lịch hẹn";
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
              placeholder="Tìm kiếm lịch hẹn, xe, biển số..."
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
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
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-outline-variant pb-5">
            <div>
              <h1 className="font-headline-lg text-headline-lg font-bold">
                Danh sách Lịch hẹn
              </h1>
              <p className="mt-1 text-body-sm text-on-surface-variant">
                Tất cả các phiếu sửa chữa & lịch hẹn đã được phân công cho bạn.
              </p>
            </div>
          </div>

          {/* Appointments List */}
          <section className="mt-6 space-y-3">
            {visibleJobs.map((j) => (
              <article
                key={j.id}
                onClick={() => onJobDetailClick?.(j.id)}
                className="group flex cursor-pointer items-center justify-between rounded-xl border border-outline-variant bg-surface-container-lowest p-4 shadow-sm transition hover:border-primary/50 hover:bg-surface-container-low"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-primary">
                      #{j.id}
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        j.status === "in_progress"
                          ? "bg-primary-container/15 text-primary"
                          : j.status === "accepted"
                            ? "bg-tertiary-container/15 text-tertiary"
                            : "bg-surface-container-high text-on-surface-variant"
                      }`}
                    >
                      {j.status === "in_progress"
                        ? "Đang thực hiện"
                        : j.status === "accepted"
                          ? "Đã tiếp nhận"
                          : "Chờ xử lý"}
                    </span>
                  </div>
                  <h2 className="mt-1 font-semibold text-base truncate">
                    {j.service}
                  </h2>
                  <p className="mt-1 text-xs text-on-surface-variant truncate">
                    {j.vehicle.model} ·{" "}
                    <span className="font-mono font-bold text-primary">
                      {j.vehicle.plate}
                    </span>{" "}
                    · {j.time} ({j.date}) · Khách: {j.customer.name}
                  </p>
                </div>

                <div className="ml-4 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-container-high text-on-surface-variant group-hover:bg-primary group-hover:text-on-primary">
                  <span className="material-symbols-outlined text-lg">
                    chevron_right
                  </span>
                </div>
              </article>
            ))}

            {visibleJobs.length === 0 && (
              <div className="py-12 text-center text-on-surface-variant">
                Không tìm thấy lịch hẹn phù hợp.
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

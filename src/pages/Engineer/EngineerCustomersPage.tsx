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

type EngineerCustomersPageProps = {
  onDashboardClick?: () => void;
  onScheduleClick?: () => void;
  onAppointmentsClick?: () => void;
  onTechniciansClick?: () => void;
  onCustomersClick?: () => void;
  onSettingsClick?: () => void;
  onLogout?: () => void;
};

export default function EngineerCustomersPage({
  onDashboardClick,
  onScheduleClick,
  onAppointmentsClick,
  onTechniciansClick,
  onCustomersClick,
  onSettingsClick,
  onLogout,
}: EngineerCustomersPageProps) {
  const [jobs] = useState<JobItem[]>(INITIAL_JOBS);

  // Filter unique customers based on phone number
  const uniqueCustomers = Array.from(
    new Map(
      jobs.map((j) => [
        j.customer.phone,
        {
          name: j.customer.name,
          phone: j.customer.phone,
          vehicle: `${j.vehicle.model} (${j.vehicle.plate})`,
          lastService: j.service,
        },
      ]),
    ).values(),
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
            const isCurrent = label === "Khách hàng";
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
              placeholder="Tìm kiếm khách hàng, SĐT..."
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
          <div className="border-b border-outline-variant pb-5">
            <h1 className="font-headline-lg text-headline-lg font-bold">
              Danh sách Khách hàng
            </h1>
            <p className="mt-1 text-body-sm text-on-surface-variant">
              Danh sách khách hàng đã và đang được bạn phục vụ dịch vụ bảo dưỡng.
            </p>
          </div>

          {/* Customer Cards Grid */}
          <section className="mt-6 grid gap-4 sm:grid-cols-2">
            {uniqueCustomers.map((c) => {
              const initial = c.name.charAt(0).toUpperCase();

              return (
                <article
                  key={c.phone}
                  className="flex items-center gap-4 rounded-xl border border-outline-variant bg-surface-container-lowest p-5 shadow-sm transition hover:border-primary/50"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-secondary-fixed text-secondary font-bold text-lg">
                    {initial}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="font-bold text-base truncate">{c.name}</h2>
                    <p className="mt-1 flex items-center gap-1.5 text-xs text-on-surface-variant">
                      <span className="material-symbols-outlined text-base text-primary">
                        call
                      </span>
                      {c.phone}
                    </p>
                    <p className="mt-1 text-xs text-outline truncate">
                      Phương tiện: {c.vehicle}
                    </p>
                  </div>
                </article>
              );
            })}
          </section>
        </div>
      </main>
    </div>
  );
}

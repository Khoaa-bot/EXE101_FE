import { useState } from "react";

type TechnicianTeamMember = {
  id: string;
  name: string;
  roleTitle: string;
  status: "ready" | "busy";
  currentTask: string;
  phone: string;
};

const TEAM_MEMBERS: TechnicianTeamMember[] = [
  {
    id: "EMP-1029",
    name: "Trần Quốc Toản",
    roleTitle: "Kỹ thuật viên trưởng",
    status: "busy",
    currentTask: "Bảo dưỡng định kỳ VinFast VF8 (51H-123.45)",
    phone: "090 123 4567",
  },
  {
    id: "EMP-1030",
    name: "Nguyễn Mỹ Linh",
    roleTitle: "Chuyên viên Pin EV",
    status: "busy",
    currentTask: "Cân bằng tải Cell Pin 48V (30E-678.90)",
    phone: "091 888 9999",
  },
  {
    id: "EMP-1031",
    name: "Đặng Hữu Tài",
    roleTitle: "Thợ máy gầm",
    status: "ready",
    currentTask: "Đang chờ phân công ca tiếp theo",
    phone: "093 555 7777",
  },
  {
    id: "EMP-1032",
    name: "Phạm Văn Hùng",
    roleTitle: "Chuyên viên Điện & Phần mềm",
    status: "ready",
    currentTask: "Sẵn sàng hỗ trợ đọc lỗi BMS",
    phone: "097 222 3333",
  },
];

const navItems = [
  ["dashboard", "Tổng quan"],
  ["calendar_today", "Lịch làm việc"],
  ["event_note", "Lịch hẹn"],
  ["engineering", "Kỹ thuật viên"],
  ["person", "Khách hàng"],
  ["settings", "Cài đặt"],
];

type EngineerTechniciansPageProps = {
  onDashboardClick?: () => void;
  onScheduleClick?: () => void;
  onAppointmentsClick?: () => void;
  onTechniciansClick?: () => void;
  onCustomersClick?: () => void;
  onSettingsClick?: () => void;
  onLogout?: () => void;
};

export default function EngineerTechniciansPage({
  onDashboardClick,
  onScheduleClick,
  onAppointmentsClick,
  onTechniciansClick,
  onCustomersClick,
  onSettingsClick,
  onLogout,
}: EngineerTechniciansPageProps) {
  const [members] = useState<TechnicianTeamMember[]>(TEAM_MEMBERS);

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
            const isCurrent = label === "Kỹ thuật viên";
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
            Đội ngũ Kỹ thuật viên đồng nghiệp
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
              Đội ngũ Kỹ thuật viên
            </h1>
            <p className="mt-1 text-body-sm text-on-surface-variant">
              Trạng thái sẵn sàng và các công việc đang xử lý của đồng nghiệp trong ca.
            </p>
          </div>

          <section className="mt-6 grid gap-4 sm:grid-cols-2">
            {members.map((m) => {
              const isReady = m.status === "ready";
              return (
                <article
                  key={m.id}
                  className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-5 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary-fixed font-bold text-on-primary-fixed text-lg">
                        {m.name.charAt(0)}
                      </div>
                      <div>
                        <h2 className="font-bold text-base">{m.name}</h2>
                        <p className="text-xs text-on-surface-variant">
                          {m.roleTitle} · SĐT: {m.phone}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        isReady
                          ? "bg-tertiary-container/15 text-tertiary"
                          : "bg-primary-container/15 text-primary"
                      }`}
                    >
                      {isReady ? "Sẵn sàng" : "Đang làm việc"}
                    </span>
                  </div>

                  <div className="mt-4 rounded-xl border border-outline-variant/60 bg-surface-container-low p-3">
                    <p className="text-xs text-outline font-semibold">
                      Công việc hiện tại:
                    </p>
                    <p className="mt-1 text-xs font-medium text-on-surface">
                      {m.currentTask}
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

const navItems = [
  ["dashboard", "Dashboard"],
  ["calendar_today", "Schedule"],
  ["event_note", "Appointments"],
  ["person", "Customers"],
];

type ReceptionDashboardPageProps = {
  onDashboardClick?: () => void;
  onScheduleClick?: () => void;
  onAppointmentsClick?: () => void;
  onCustomersClick?: () => void;
  onNewAppointmentClick?: () => void;
  onLogout?: () => void;
};

const STATS = [
  { label: "Tổng số xe", value: "25", delta: "+12% so với hôm qua", icon: "directions_car", tone: "primary" as const },
  { label: "Đang sửa chữa", value: "15", delta: "+3 xe mới", icon: "build", tone: "warning" as const },
  { label: "Hoàn thành hôm nay", value: "8", delta: "+2 so với dự kiến", icon: "check_circle", tone: "success" as const },
  { label: "Lịch hẹn hôm nay", value: "12", delta: "+4 lịch mới sáng nay", icon: "calendar_month", tone: "accent" as const },
  { label: "Doanh thu hôm nay", value: "12.450.000đ", delta: "+18% mục tiêu ngày", icon: "payments", tone: "primary" as const },
];

const IN_PROGRESS = [
  { plate: "51H-123.45", customer: "Nguyễn Văn Minh", service: "Bảo dưỡng định kỳ", progress: 60, eta: "16:30" },
  { plate: "30E-678.90", customer: "Trần Hoàng Nam", service: "Thay má phanh", progress: 30, eta: "15:00" },
  { plate: "51A-111.11", customer: "Lê Thanh Tâm", service: "Sửa hệ thống điện", progress: 50, eta: "17:00" },
  { plate: "60K-234.56", customer: "Phạm Quốc Huy", service: "Thay nhớt", progress: 10, eta: "14:00" },
  { plate: "51F-987.65", customer: "Hoàng Anh Tuấn", service: "Kiểm tra chất lượng", progress: 80, eta: "16:00" },
];

const APPOINTMENTS = [
  { time: "09:00", name: "Nguyễn Văn An", plate: "51A-222.22", service: "Bảo dưỡng định kỳ", status: "confirmed" as const },
  { time: "10:30", name: "Trần Thị Mai", plate: "51B-333.33", service: "Thay lốp", status: "confirmed" as const },
  { time: "13:30", name: "Lê Văn Cường", plate: "51C-444.44", service: "Sửa điều hòa", status: "confirmed" as const },
  { time: "15:00", name: "Phạm Minh Đức", plate: "51D-555.55", service: "Kiểm tra phanh", status: "pending" as const },
];

export default function ReceptionDashboardPage({
  onDashboardClick,
  onScheduleClick,
  onAppointmentsClick,
  onCustomersClick,
  onNewAppointmentClick,
  onLogout,
}: ReceptionDashboardPageProps) {
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
            const isCurrent = label === "Dashboard";
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
          <label className="relative hidden w-full max-w-md md:block">
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
          <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">Tổng quan</h1>
              <p className="text-on-surface-variant mt-1">Chào mừng trở lại, hôm nay có 12 lịch hẹn mới.</p>
            </div>
            <div className="flex gap-2">
              <div className="inline-flex items-center gap-2 rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm">
                <span className="material-symbols-outlined text-lg text-on-surface-variant">calendar_month</span>
                15/06/2024
              </div>
              <div className="inline-flex items-center gap-2 rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm">
                <span className="material-symbols-outlined text-lg text-on-surface-variant">build</span>
                Garage ABC
              </div>
            </div>
          </div>

          <div className="grid gap-4 grid-cols-2 md:grid-cols-3 xl:grid-cols-5 mb-6">
            {STATS.map((s) => (
              <article key={s.label} className="rounded-xl border border-outline-variant bg-surface-container-lowest p-5">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm text-on-surface-variant">{s.label}</p>
                  <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary-container/10 text-primary">
                    <span className="material-symbols-outlined">{s.icon}</span>
                  </span>
                </div>
                <p className="text-2xl font-bold mt-3">{s.value}</p>
                <p className="text-xs text-tertiary mt-2 inline-flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">trending_up</span>
                  {s.delta}
                </p>
              </article>
            ))}
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <article className="lg:col-span-2 rounded-xl border border-outline-variant bg-surface-container-lowest">
              <div className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold">Xe đang sửa chữa</h2>
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
                      {IN_PROGRESS.map((r) => (
                        <tr key={r.plate} className="border-b border-outline-variant last:border-0">
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

            <article className="rounded-xl border border-outline-variant bg-surface-container-lowest">
              <div className="flex items-center gap-2 border-b border-outline-variant px-5 py-4">
                <span className="material-symbols-outlined text-primary">calendar_month</span>
                <h2 className="text-base font-semibold">Lịch hẹn hôm nay</h2>
              </div>
              <ul className="space-y-3 p-5">
                {APPOINTMENTS.map((a) => (
                  <li key={a.time} className="flex gap-3 border-l-2 border-primary/40 pl-3">
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
                className="w-full mt-5 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-on-primary hover:bg-primary/90 transition-colors"
                onClick={onNewAppointmentClick}
              >
                Đặt lịch hẹn mới
              </button>
            </article>
          </div>
        </div>
      </main>
    </div>
  );
}

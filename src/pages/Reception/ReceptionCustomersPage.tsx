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

const TONES = [
  "bg-primary-container/10 text-primary",
  "bg-secondary-container text-on-secondary-container",
  "bg-tertiary-container/10 text-tertiary",
  "bg-error-container/10 text-on-error-container",
];

const STATUS_LABEL: Record<string, string> = {
  pending: "Chờ xác nhận",
  confirmed: "Đã xác nhận",
  in_progress: "Đang xử lý",
  completed: "Hoàn thành",
  cancelled: "Đã hủy",
  no_show: "Không đến",
};

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "KH";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("vi-VN");
}

type CustomerRow = {
  customerId: number;
  name: string;
  initials: string;
  tone: string;
  phone: string;
  email: string;
  vehicle: string;
  plate: string;
  lastServiceDate: string;
  lastStatus: string;
};

function buildCustomerRows(appointments: AppointmentDto[]): CustomerRow[] {
  const latestByCustomer = new Map<number, AppointmentDto>();
  appointments.forEach((a) => {
    const existing = latestByCustomer.get(a.customerId);
    if (!existing || new Date(a.scheduleDate) > new Date(existing.scheduleDate)) {
      latestByCustomer.set(a.customerId, a);
    }
  });
  return [...latestByCustomer.values()]
    .sort((a, b) => a.customerName.localeCompare(b.customerName))
    .map((a, index) => ({
      customerId: a.customerId,
      name: a.customerName,
      initials: getInitials(a.customerName),
      tone: TONES[index % TONES.length],
      phone: a.customerPhone ?? "—",
      email: a.customerEmail ?? "—",
      vehicle: a.vehicleModel,
      plate: a.vehicleLicensePlate ?? "—",
      lastServiceDate: formatDate(a.scheduleDate),
      lastStatus: a.status,
    }));
}

function buildRecentActivity(appointments: AppointmentDto[]) {
  return [...appointments]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5)
    .map((a) => ({
      id: a.id,
      title: `${STATUS_LABEL[a.status] ?? a.status} — ${a.serviceName}`,
      desc: `Xe ${a.vehicleLicensePlate ?? a.vehicleVin} (${a.customerName})`,
      time: formatDate(a.createdAt),
    }));
}

type ReceptionCustomersPageProps = {
  onDashboardClick?: () => void;
  onScheduleClick?: () => void;
  onAppointmentsClick?: () => void;
  onCustomersClick?: () => void;
  onLogout?: () => void;
};

export default function ReceptionCustomersPage({
  onDashboardClick,
  onScheduleClick,
  onAppointmentsClick,
  onCustomersClick,
  onLogout,
}: ReceptionCustomersPageProps) {
  const [filter, setFilter] = useState<"all" | "in_progress">("all");
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
            err instanceof Error ? err.message : "Không tải được danh sách khách hàng.",
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

  const appointments = dashboard?.appointments ?? [];
  const customers = useMemo(() => buildCustomerRows(appointments), [appointments]);
  const activity = useMemo(() => buildRecentActivity(appointments), [appointments]);

  const visibleCustomers = useMemo(() => {
    if (filter === "all") return customers;
    return customers.filter((c) => c.lastStatus === "in_progress");
  }, [customers, filter]);

  const uniqueVehicles = useMemo(
    () => new Set(customers.map((c) => c.plate)).size,
    [customers],
  );

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
            const isCurrent = label === "Customers";
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
              placeholder="Tìm kiếm khách hàng hoặc biển số..."
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
          <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">Quản lý Khách hàng</h1>
              <p className="text-on-surface-variant mt-1">Xem danh sách khách hàng và phương tiện đã từng đặt lịch tại garage.</p>
            </div>
          </div>

          {isLoading && (
            <p className="text-body-sm text-on-surface-variant">Đang tải danh sách khách hàng...</p>
          )}

          {!isLoading && loadError && (
            <p className="text-body-sm text-error">{loadError}</p>
          )}

          {!isLoading && !loadError && dashboard && (
            <>
              <div className="grid gap-4 grid-cols-2 lg:grid-cols-4 mb-6">
                <article className="rounded-xl border border-outline-variant bg-surface-container-lowest p-5">
                  <span className="grid h-11 w-11 place-items-center rounded-lg bg-primary-container/10 text-primary">
                    <span className="material-symbols-outlined">group</span>
                  </span>
                  <p className="text-xs uppercase tracking-wide text-on-surface-variant mt-3">Tổng khách hàng</p>
                  <p className="text-2xl font-bold mt-1">{customers.length}</p>
                </article>
                <article className="rounded-xl border border-outline-variant bg-surface-container-lowest p-5">
                  <span className="grid h-11 w-11 place-items-center rounded-lg bg-tertiary-container/10 text-tertiary">
                    <span className="material-symbols-outlined">directions_car</span>
                  </span>
                  <p className="text-xs uppercase tracking-wide text-on-surface-variant mt-3">Xe đã ghi nhận</p>
                  <p className="text-2xl font-bold mt-1">{uniqueVehicles}</p>
                </article>
                <article className="rounded-xl border border-outline-variant bg-surface-container-lowest p-5">
                  <span className="grid h-11 w-11 place-items-center rounded-lg bg-secondary-container text-on-secondary-container">
                    <span className="material-symbols-outlined">build</span>
                  </span>
                  <p className="text-xs uppercase tracking-wide text-on-surface-variant mt-3">Đang xử lý</p>
                  <p className="text-2xl font-bold mt-1">{dashboard.inProgressCount}</p>
                </article>
                <article className="rounded-xl border border-outline-variant bg-surface-container-lowest p-5">
                  <span className="grid h-11 w-11 place-items-center rounded-lg bg-error-container/10 text-on-error-container">
                    <span className="material-symbols-outlined">event_available</span>
                  </span>
                  <p className="text-xs uppercase tracking-wide text-on-surface-variant mt-3">Tổng lịch hẹn</p>
                  <p className="text-2xl font-bold mt-1">{dashboard.totalAppointments}</p>
                </article>
              </div>

              <article className="mb-4 rounded-xl border border-outline-variant bg-surface-container-lowest">
                <div className="p-4 flex flex-wrap items-center gap-3">
                  <div className="inline-flex rounded-lg border border-outline-variant bg-surface-container-low p-1">
                    {(["all", "in_progress"] as const).map((k) => (
                      <button
                        key={k}
                        onClick={() => setFilter(k)}
                        className={`px-3 py-1.5 text-sm rounded-md ${filter === k ? "bg-primary-container/10 text-primary font-medium" : "text-on-surface-variant"}`}
                      >
                        {k === "all" ? "Tất cả" : "Đang sửa"}
                      </button>
                    ))}
                  </div>
                  <p className="ml-auto text-sm text-on-surface-variant">Đang hiển thị {visibleCustomers.length} khách hàng</p>
                </div>
              </article>

              <article className="mb-6 rounded-xl border border-outline-variant bg-surface-container-lowest">
                <div className="p-0 overflow-x-auto">
                  <table className="w-full min-w-[900px] text-sm">
                    <thead>
                      <tr className="text-xs uppercase text-on-surface-variant border-b border-outline-variant">
                        <th className="text-left font-medium p-4">Khách hàng</th>
                        <th className="text-left font-medium p-4">Liên hệ</th>
                        <th className="text-left font-medium p-4">Phương tiện</th>
                        <th className="text-left font-medium p-4">Biển số</th>
                        <th className="text-left font-medium p-4">Lần bảo dưỡng cuối</th>
                        <th className="text-left font-medium p-4">Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visibleCustomers.map((c) => (
                        <tr key={c.customerId} className="border-b border-outline-variant last:border-0">
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-full font-semibold ${c.tone}`}>
                                {c.initials}
                              </div>
                              <div>
                                <p className="font-semibold">{c.name}</p>
                                <p className="text-xs text-on-surface-variant">ID: #{c.customerId}</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <p>{c.phone}</p>
                            <p className="text-xs text-on-surface-variant">{c.email}</p>
                          </td>
                          <td className="p-4">
                            <span className="inline-flex items-center gap-1">
                              <span className="material-symbols-outlined text-on-surface-variant">directions_car</span>
                              {c.vehicle}
                            </span>
                          </td>
                          <td className="p-4">
                            <span className="shrink-0 rounded-full bg-primary-container/10 text-primary px-2 py-1 text-[10px] font-semibold">{c.plate}</span>
                          </td>
                          <td className="p-4">{c.lastServiceDate}</td>
                          <td className="p-4">
                            <span className="shrink-0 rounded-full bg-surface-container-high px-2 py-1 text-[10px] font-semibold">
                              {STATUS_LABEL[c.lastStatus] ?? c.lastStatus}
                            </span>
                          </td>
                        </tr>
                      ))}

                      {visibleCustomers.length === 0 && (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-on-surface-variant">
                            Không có khách hàng nào phù hợp.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </article>

              <div className="grid gap-4 lg:grid-cols-3">
                <article className="lg:col-span-3 rounded-xl border border-outline-variant bg-surface-container-lowest">
                  <div className="p-5">
                    <h2 className="text-lg font-semibold mb-4">Hoạt động gần đây</h2>
                    {activity.length === 0 ? (
                      <p className="text-sm text-on-surface-variant">Chưa có hoạt động nào.</p>
                    ) : (
                      <ul className="space-y-4">
                        {activity.map((a) => (
                          <li key={a.id} className="flex gap-3">
                            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary text-on-primary">
                              <span className="material-symbols-outlined">build</span>
                            </span>
                            <div>
                              <p className="text-sm font-semibold">{a.title}</p>
                              <p className="text-sm text-on-surface-variant">{a.desc}</p>
                              <p className="text-xs text-on-surface-variant mt-1">{a.time}</p>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </article>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

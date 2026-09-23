import { useEffect, useState } from "react";
import {
  getReceptionDashboard,
  type AppointmentDto,
} from "../../services/api";

const navItems = [
  ["dashboard", "Dashboard"],
  ["calendar_today", "Schedule"],
  ["event_note", "Appointments"],
  ["person", "Customers"],
];

export type Appt = {
  id: string;
  bookingId: string;
  time: string;
  date: string;
  slot: string;
  name: string;
  phone: string;
  email: string;
  plate: string;
  vehicle: string;
  service: string;
  note: string;
  status: "pending" | "confirmed" | "done" | "canceled";
};

function mapStatus(status: string): Appt["status"] {
  const s = status.toLowerCase();
  if (s === "completed") return "done";
  if (s === "cancelled" || s === "canceled") return "canceled";
  if (s === "pending") return "pending";
  return "confirmed";
}

function toAppt(a: AppointmentDto): Appt {
  const date = new Date(a.scheduleDate);
  return {
    id: String(a.id),
    bookingId: `#${a.id}`,
    time: a.timeFrame.split(" - ")[0] || a.timeFrame,
    date: date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
    slot: a.timeFrame,
    name: a.customerName,
    phone: a.customerPhone ?? "",
    email: a.customerEmail ?? "",
    plate: a.vehicleLicensePlate || a.vehicleVin,
    vehicle: a.vehicleModel,
    service: a.serviceName,
    note: a.notes ?? "",
    status: mapStatus(a.status),
  };
}

const STATUS_MAP = {
  pending: { label: "Đang chờ", cls: "bg-tertiary-container/10 text-tertiary" },
  confirmed: { label: "Đã xác nhận", cls: "bg-primary-container/10 text-primary" },
  done: { label: "Hoàn thành", cls: "bg-surface-container text-on-surface-variant" },
  canceled: { label: "Đã huỷ", cls: "bg-error-container/10 text-error" },
} as const;

type ReceptionAppointmentsPageProps = {
  onDashboardClick?: () => void;
  onScheduleClick?: () => void;
  onAppointmentsClick?: () => void;
  onCustomersClick?: () => void;
  onNewAppointmentClick?: () => void;
  onAppointmentDetailClick?: (id: string) => void;
  onLogout?: () => void;
};

export default function ReceptionAppointmentsPage({
  onDashboardClick,
  onScheduleClick,
  onAppointmentsClick,
  onCustomersClick,
  onNewAppointmentClick,
  onAppointmentDetailClick,
  onLogout,
}: ReceptionAppointmentsPageProps) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | Appt["status"]>("all");
  const [appointments, setAppointments] = useState<Appt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setLoadError(null);

    getReceptionDashboard()
      .then((data) => {
        if (!cancelled) setAppointments(data.appointments.map(toAppt));
      })
      .catch((err) => {
        if (!cancelled) {
          setLoadError(
            err instanceof Error ? err.message : "Không tải được danh sách lịch hẹn.",
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

  const filtered = appointments.filter((a) => {
    if (filter !== "all" && a.status !== filter) return false;
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      a.name.toLowerCase().includes(q) ||
      a.plate.toLowerCase().includes(q) ||
      a.bookingId.toLowerCase().includes(q) ||
      a.phone.includes(q)
    );
  });

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
            const isCurrent = label === "Appointments";
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
              <h1 className="text-2xl md:text-3xl font-bold">Lịch hẹn</h1>
              <p className="text-on-surface-variant mt-1">Quản lý toàn bộ lịch hẹn tiếp nhận trong garage.</p>
            </div>
            <button
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-on-primary hover:bg-primary/90 transition-colors active:scale-[0.98]"
              onClick={onNewAppointmentClick}
            >
              <span className="material-symbols-outlined text-lg">add</span>
              Tạo lịch hẹn
            </button>
          </div>

          <article className="mb-4 rounded-xl border border-outline-variant bg-surface-container-lowest">
            <div className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="relative flex-1">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">search</span>
                <input
                  placeholder="Tìm khách, biển số, mã booking..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full h-10 rounded-lg border border-outline-variant bg-surface-container-low pl-9 pr-4 text-sm outline-none focus:border-primary"
                />
              </div>
              <div className="inline-flex rounded-lg border border-outline-variant bg-surface-container-low p-1 overflow-x-auto">
                {(["all", "pending", "confirmed", "done"] as const).map((k) => (
                  <button
                    key={k}
                    onClick={() => setFilter(k)}
                    className={
                      "px-3 py-1.5 text-sm rounded-md whitespace-nowrap " +
                      (filter === k ? "bg-primary-container/10 text-primary font-medium" : "text-on-surface-variant")
                    }
                  >
                    {k === "all" ? "Tất cả" : STATUS_MAP[k].label}
                  </button>
                ))}
              </div>
            </div>
          </article>

          <article className="rounded-xl border border-outline-variant bg-surface-container-lowest">
            <div className="divide-y divide-outline-variant">
              {isLoading && (
                <p className="p-8 text-center text-sm text-on-surface-variant">Đang tải lịch hẹn...</p>
              )}
              {loadError && !isLoading && (
                <p className="p-8 text-center text-sm text-error">{loadError}</p>
              )}
              {!isLoading && !loadError && filtered.length === 0 && (
                <p className="p-8 text-center text-sm text-on-surface-variant">Không có lịch hẹn phù hợp.</p>
              )}
              {!isLoading && !loadError && filtered.map((a) => (
                <button
                  key={a.id}
                  onClick={() => onAppointmentDetailClick?.(a.id)}
                  className="flex w-full items-center gap-4 p-4 hover:bg-surface-container-low/50 transition-colors text-left"
                >
                  <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-lg bg-primary-container/10 text-primary">
                    <span className="text-xs">{a.date.split(",")[0]}</span>
                    <span className="text-sm font-bold">{a.time}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold truncate">{a.name}</p>
                      <span className="text-xs text-on-surface-variant">#{a.bookingId}</span>
                    </div>
                    <p className="text-sm text-on-surface-variant truncate">
                      {a.vehicle} · {a.plate} · {a.service}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-semibold ${STATUS_MAP[a.status].cls}`}
                  >
                    {STATUS_MAP[a.status].label}
                  </span>
                  <span className="material-symbols-outlined text-on-surface-variant shrink-0">chevron_right</span>
                </button>
              ))}
            </div>
          </article>
        </div>
      </main>
    </div>
  );
}

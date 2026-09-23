import { useEffect, useMemo, useState } from "react";
import {
  getAdminEmployees,
  getReceptionDashboard,
  type AdminEmployee,
  type AppointmentDto,
  type ReceptionDashboard,
} from "../../services/api";

const navItems = [
  ["dashboard", "Dashboard"],
  ["engineering", "Nhân viên"],
  ["groups", "Khách hàng"],
  ["inventory_2", "Kho linh kiện"],
  ["payments", "Bảng giá"],
  ["storefront", "Thông tin garage"],
];

type AdminDashboardPageProps = {
  onCustomersClick?: () => void;
  onEngineersClick?: () => void;
  onInventoryClick?: () => void;
  onPricingClick?: () => void;
  onGarageClick?: () => void;
  onLogout?: () => void;
};

const formatPrice = (n: number) => `${n.toLocaleString("vi-VN")}đ`;

const STATUS_LABEL: Record<string, string> = {
  pending: "Chờ xác nhận",
  confirmed: "Đã xác nhận",
  in_progress: "Đang xử lý",
  completed: "Hoàn thành",
  cancelled: "Đã hủy",
  no_show: "Không đến",
};

export default function AdminDashboardPage({
  onCustomersClick,
  onEngineersClick,
  onInventoryClick,
  onPricingClick,
  onGarageClick,
  onLogout,
}: AdminDashboardPageProps) {
  const [notice, setNotice] = useState("");
  const [dashboard, setDashboard] = useState<ReceptionDashboard | null>(null);
  const [employees, setEmployees] = useState<AdminEmployee[]>([]);
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
    Promise.all([getReceptionDashboard(), getAdminEmployees()])
      .then(([dash, emp]) => {
        if (cancelled) return;
        setDashboard(dash);
        setEmployees(emp);
      })
      .catch((err) => {
        if (cancelled) return;
        setLoadError(
          err instanceof Error ? err.message : "Không tải được dữ liệu dashboard.",
        );
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const appointments = dashboard?.appointments ?? [];

  const totalRevenue = useMemo(
    () =>
      appointments
        .filter((a) => a.status === "completed")
        .reduce((sum, a) => sum + (a.servicePrice ?? 0), 0),
    [appointments],
  );

  const inProgress = useMemo(
    () => appointments.filter((a) => a.status === "in_progress"),
    [appointments],
  );

  const today = new Date().toISOString().slice(0, 10);
  const todayAppointments = useMemo(
    () => appointments.filter((a) => a.scheduleDate === today),
    [appointments, today],
  );

  const technicians = useMemo(
    () => employees.filter((e) => e.role?.toLowerCase() === "engineer"),
    [employees],
  );

  return (
    <div className="min-h-[100dvh] bg-background font-sans text-on-surface">
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
            Quản trị garage
          </p>
        </div>
        <nav className="space-y-1">
          {navItems.map(([icon, label], index) => (
            <button
              key={label}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left font-body-md text-body-md transition-colors active:scale-[0.98] ${index === 0 ? "bg-primary-container/15 font-semibold text-primary" : "text-on-surface-variant hover:bg-surface-container-low"}`}
              type="button"
              onClick={() => {
                if (label === "Khách hàng") onCustomersClick?.();
                else if (label === "Nhân viên") onEngineersClick?.();
                else if (label === "Kho linh kiện") onInventoryClick?.();
                else if (label === "Bảng giá") onPricingClick?.();
                else if (label === "Thông tin garage") onGarageClick?.();
              }}
            >
              <span className="material-symbols-outlined">{icon}</span>
              {label}
            </button>
          ))}
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
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-outline-variant bg-surface/95 px-margin-mobile backdrop-blur md:px-margin-desktop">
          <button
            className="rounded-full p-2 text-on-surface-variant md:hidden"
            type="button"
            aria-label="Mở menu"
          >
            <span className="material-symbols-outlined">menu</span>
          </button>
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
                  {dashboard?.receptionistName ?? "Admin"}
                </p>
                <p className="text-[11px] text-on-surface-variant">
                  {dashboard?.garageName ?? ""}
                </p>
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-fixed font-bold text-on-primary-fixed">
                A
              </div>
            </div>
          </div>
        </header>
        <div className="mx-auto max-w-[1440px] p-margin-mobile md:p-margin-desktop">
          <section className="mb-6 flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="font-headline-lg text-headline-lg font-bold">
                Tổng quan hệ thống
              </h1>
              <p className="mt-1 font-body-md text-body-md text-on-surface-variant">
                Tình hình hoạt động của {dashboard?.garageName ?? "garage"} hôm nay.
              </p>
            </div>
          </section>

          {isLoading && (
            <p className="text-body-sm text-on-surface-variant">
              Đang tải dữ liệu dashboard...
            </p>
          )}

          {!isLoading && loadError && (
            <p className="text-body-sm text-error">{loadError}</p>
          )}

          {!isLoading && !loadError && dashboard && (
            <>
              <section className="mb-6 grid gap-4 lg:grid-cols-5">
                <RevenueCard total={totalRevenue} />
                <StatCard
                  icon="event_available"
                  label="Tổng lịch hẹn"
                  value={String(dashboard.totalAppointments)}
                  detail="tất cả"
                  tone="primary"
                />
                <StatCard
                  icon="build"
                  label="Đang xử lý"
                  value={String(dashboard.inProgressCount)}
                  detail="đang sửa chữa"
                  tone="warning"
                />
                <StatCard
                  icon="check_circle"
                  label="Hoàn thành"
                  value={String(dashboard.completedCount)}
                  detail="tổng cộng"
                  tone="success"
                />
                <StatCard
                  icon="hourglass_empty"
                  label="Chờ xác nhận"
                  value={String(dashboard.pendingCount)}
                  detail="cần xử lý"
                  tone="accent"
                />
              </section>
              <section className="grid gap-6 xl:grid-cols-3">
                <div className="min-w-0 space-y-6 xl:col-span-2">
                  <RepairsTable repairs={inProgress} showNotice={showNotice} />
                </div>
                <div className="min-w-0 space-y-6">
                  <AppointmentCard appointments={todayAppointments} />
                  <TechnicianCard
                    technicians={technicians}
                    onAddClick={() => onEngineersClick?.()}
                  />
                </div>
              </section>
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

function RevenueCard({ total }: { total: number }) {
  return (
    <article className="rounded-xl border border-outline-variant bg-surface-container-lowest lg:col-span-2">
      <div className="p-5">
        <p className="font-label-md text-label-md text-on-surface-variant">
          DOANH THU (DỊCH VỤ ĐÃ HOÀN THÀNH)
        </p>
        <p className="mt-2 font-display-lg text-display-lg">
          {formatPrice(total)}
        </p>
        <p className="mt-1 text-xs text-on-surface-variant">
          Tổng đơn giá dịch vụ của các lịch hẹn đã hoàn thành
        </p>
      </div>
    </article>
  );
}
function StatCard({
  icon,
  label,
  value,
  detail,
  tone,
}: {
  icon: string;
  label: string;
  value: string;
  detail: string;
  tone: "primary" | "warning" | "success" | "accent";
}) {
  const tones = {
    primary: "bg-primary-container/10 text-primary",
    warning: "bg-error-container text-on-error-container",
    success: "bg-tertiary-container/10 text-tertiary",
    accent: "bg-secondary-container text-on-secondary-container",
  };
  return (
    <article className="rounded-xl border border-outline-variant bg-surface-container-lowest p-5">
      <span
        className={`material-symbols-outlined rounded-lg p-2 ${tones[tone]}`}
      >
        {icon}
      </span>
      <p className="mt-3 text-body-sm text-on-surface-variant">{label}</p>
      <div className="mt-1 flex items-baseline gap-2">
        <p className="font-headline-lg text-headline-lg">{value}</p>
        <span className="text-xs text-on-surface-variant">{detail}</span>
      </div>
    </article>
  );
}
function RepairsTable({
  repairs,
  showNotice,
}: {
  repairs: AppointmentDto[];
  showNotice: (message: string) => void;
}) {
  return (
    <article className="overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest">
      <div className="flex items-center justify-between border-b border-outline-variant px-5 py-4">
        <h2 className="font-headline-md text-headline-md">
          Đang xử lý ({repairs.length})
        </h2>
        <button
          className="font-label-md text-label-md text-primary hover:underline"
          type="button"
          onClick={() => showNotice("Xem chi tiết ở trang Lịch hẹn/Kỹ thuật viên")}
        >
          Xem tất cả
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-body-sm">
          <thead className="bg-surface-container-low text-xs text-on-surface-variant">
            <tr>
              {[
                "Biển số",
                "Khách hàng",
                "Loại dịch vụ",
                "Kỹ thuật viên",
                "Lịch hẹn",
              ].map((label) => (
                <th key={label} className="px-5 py-3 font-semibold">
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {repairs.map((repair) => (
              <tr
                key={repair.id}
                className="border-t border-outline-variant transition-colors hover:bg-surface-container-low"
              >
                <td className="px-5 py-4 font-semibold text-primary">
                  {repair.vehicleLicensePlate ?? "—"}
                </td>
                <td className="px-5 py-4">{repair.customerName}</td>
                <td className="px-5 py-4 text-on-surface-variant">
                  {repair.serviceName}
                </td>
                <td className="px-5 py-4 text-on-surface-variant">
                  {repair.engineerName ?? "Chưa gán"}
                </td>
                <td className="px-5 py-4 text-right">
                  <p className="font-semibold">{repair.timeFrame}</p>
                  <p className="text-xs text-on-surface-variant">
                    {repair.scheduleDate}
                  </p>
                </td>
              </tr>
            ))}
            {repairs.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-5 py-8 text-center text-on-surface-variant"
                >
                  Hiện không có lịch hẹn nào đang xử lý.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </article>
  );
}
function AppointmentCard({ appointments }: { appointments: AppointmentDto[] }) {
  return (
    <article className="rounded-xl border border-outline-variant bg-surface-container-lowest">
      <div className="flex items-center gap-2 border-b border-outline-variant px-5 py-4">
        <span className="material-symbols-outlined text-primary">
          calendar_month
        </span>
        <h2 className="font-headline-md text-base">Lịch hẹn hôm nay</h2>
      </div>
      <div className="space-y-3 p-5">
        {appointments.map((appointment) => (
          <div
            key={appointment.id}
            className="rounded-xl border border-outline-variant p-3 transition-colors hover:border-primary/50"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-label-md text-label-md">
                  {appointment.timeFrame} - {appointment.customerName}
                </p>
                <p className="mt-1 truncate text-xs text-on-surface-variant">
                  {appointment.serviceName}
                </p>
              </div>
              <StatusBadge status={appointment.status} />
            </div>
          </div>
        ))}
        {appointments.length === 0 && (
          <p className="text-body-sm text-on-surface-variant">
            Không có lịch hẹn nào hôm nay.
          </p>
        )}
      </div>
    </article>
  );
}
function TechnicianCard({
  technicians,
  onAddClick,
}: {
  technicians: AdminEmployee[];
  onAddClick: () => void;
}) {
  return (
    <article className="rounded-xl border border-outline-variant bg-surface-container-lowest">
      <div className="flex items-center justify-between border-b border-outline-variant px-5 py-4">
        <h2 className="font-headline-md text-base">Kỹ thuật viên</h2>
      </div>
      <div className="space-y-4 p-5">
        {technicians.map((technician) => (
          <div key={technician.id} className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary-container font-semibold text-on-secondary-container">
              {(technician.fullName ?? technician.username)[0]}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-label-md text-label-md">
                {technician.fullName ?? technician.username}
              </p>
              <p className="truncate text-xs text-on-surface-variant">
                {technician.email}
              </p>
            </div>
          </div>
        ))}
        {technicians.length === 0 && (
          <p className="text-body-sm text-on-surface-variant">
            Chưa có kỹ thuật viên nào.
          </p>
        )}
        <button
          className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg border border-outline-variant py-2.5 font-label-md text-label-md hover:bg-surface-container-low"
          type="button"
          onClick={onAddClick}
        >
          <span className="material-symbols-outlined text-lg">person_add</span>
          Thêm kỹ thuật viên
        </button>
      </div>
    </article>
  );
}
function StatusBadge({ status }: { status: string }) {
  const ready = status === "confirmed" || status === "completed";
  const text = STATUS_LABEL[status] ?? status;
  return (
    <span
      className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-semibold ${ready ? "bg-tertiary-container/10 text-tertiary" : "bg-error-container text-on-error-container"}`}
    >
      {text}
    </span>
  );
}

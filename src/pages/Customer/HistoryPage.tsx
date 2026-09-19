import { useEffect, useState } from "react";
import AppSidebar, { type AppSection } from "../../components/AppSidebar";
import { getAppointmentHistory, type AppointmentDto } from "../../services/api";

type HistoryPageProps = {
  onHomeClick: () => void;
  onNotificationsClick: () => void;
  onProfileClick: () => void;
  onTrackingClick: () => void;
};

const filters = [
  { value: "ALL", label: "Tất cả" },
  { value: "COMPLETED", label: "Hoàn thành" },
  { value: "CANCELLED", label: "Đã huỷ" },
];

function statusLabel(status: string) {
  switch (status) {
    case "COMPLETED":
      return "Hoàn thành";
    case "CANCELLED":
      return "Đã huỷ";
    case "IN_PROGRESS":
      return "Đang xử lý";
    case "CONFIRMED":
      return "Đã xác nhận";
    case "PENDING":
      return "Chờ xác nhận";
    default:
      return status;
  }
}

function statusTone(status: string) {
  if (status === "CANCELLED") return "bg-error-container/30 text-on-error-container";
  if (status === "COMPLETED") return "bg-secondary-container/30 text-on-secondary-container";
  return "bg-primary-container/20 text-primary";
}

function statusIcon(status: string) {
  if (status === "CANCELLED") return "cancel";
  if (status === "COMPLETED") return "task_alt";
  return "build";
}

function formatCurrency(value: number | null | undefined) {
  if (value === null || value === undefined) return "—";
  return `${value.toLocaleString("vi-VN")}đ`;
}

export default function HistoryPage({
  onHomeClick,
  onNotificationsClick,
  onProfileClick,
  onTrackingClick,
}: HistoryPageProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState(filters[0].value);
  const [appointments, setAppointments] = useState<AppointmentDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    getAppointmentHistory()
      .then((data) => {
        if (!cancelled) setAppointments(data);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Không tải được lịch sử dịch vụ.",
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

  const handleNavigate = (section: AppSection) => {
    if (section === "home") onHomeClick();
    if (section === "notifications") onNotificationsClick();
    if (section === "tracking") onTrackingClick();
    if (section === "profile") onProfileClick();
  };

  const visibleRecords =
    activeFilter === "ALL"
      ? appointments
      : appointments.filter((record) => record.status === activeFilter);

  const totalCost = appointments
    .filter((record) => record.status === "COMPLETED")
    .reduce((sum, record) => sum + (record.servicePrice || 0), 0);

  return (
    <div className="min-h-dvh bg-surface font-sans text-on-surface">
      <AppSidebar
        active="history"
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onNavigate={handleNavigate}
      />

      <aside className="fixed left-0 top-0 z-50 hidden h-full w-60 flex-col border-r border-outline-variant bg-surface-container-lowest md:flex">
        <div className="flex items-center gap-sm p-lg">
          <span
            className="material-symbols-outlined text-3xl text-primary"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            electric_car
          </span>
          <span className="font-headline-lg text-headline-lg font-bold tracking-tight text-primary">
            Servio
          </span>
        </div>

        <nav className="mt-md flex-1 space-y-xs px-md">
          <button
            className="flex w-full items-center gap-md rounded-lg p-md text-on-surface-variant transition-colors hover:bg-surface-container"
            type="button"
            onClick={onHomeClick}
          >
            <span className="material-symbols-outlined">home</span>
            <span className="font-label-md text-label-md">Trang chủ</span>
          </button>
          <button
            className="relative flex w-full items-center gap-md rounded-lg bg-secondary-container/20 p-md text-primary transition-colors"
            type="button"
          >
            <span className="absolute left-0 top-[15%] h-[70%] w-1 rounded-r bg-primary" />
            <span
              className="material-symbols-outlined"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              history
            </span>
            <span className="font-label-md text-label-md">Lịch sử</span>
          </button>
          <button
            className="flex w-full items-center gap-md rounded-lg p-md text-on-surface-variant transition-colors hover:bg-surface-container"
            type="button"
            onClick={onTrackingClick}
          >
            <span className="material-symbols-outlined">location_on</span>
            <span className="font-label-md text-label-md">Theo dõi</span>
          </button>
          <button
            className="flex w-full items-center gap-md rounded-lg p-md text-on-surface-variant transition-colors hover:bg-surface-container"
            type="button"
            onClick={onNotificationsClick}
          >
            <span className="material-symbols-outlined">notifications</span>
            <span className="font-label-md text-label-md">Thông báo</span>
            <span className="ml-auto h-2 w-2 rounded-full bg-error" />
          </button>
          <div className="my-md border-t border-outline-variant opacity-50" />
          <button
            className="flex w-full items-center gap-md rounded-lg p-md text-on-surface-variant transition-colors hover:bg-surface-container"
            type="button"
            onClick={onProfileClick}
          >
            <span className="material-symbols-outlined">person</span>
            <span className="font-label-md text-label-md">Cá nhân</span>
          </button>
        </nav>
      </aside>

      <main className="min-h-screen bg-surface md:ml-60">
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-outline-variant bg-surface px-margin-mobile md:px-xl">
          <div className="flex items-center gap-sm">
            <button
              className="-ml-2 rounded-full p-2 text-on-surface-variant transition-colors hover:bg-surface-container md:hidden"
              type="button"
              aria-label="Mở menu"
              onClick={() => setIsSidebarOpen(true)}
            >
              <span className="material-symbols-outlined">menu</span>
            </button>
            <h1 className="font-headline-md text-headline-md text-on-surface">
              Lịch sử dịch vụ
            </h1>
          </div>

          <div className="flex items-center gap-md">
            <button
              className="rounded-full p-2 transition-colors hover:bg-surface-container-high"
              type="button"
              onClick={onNotificationsClick}
            >
              <span className="material-symbols-outlined">notifications</span>
            </button>
          </div>
        </header>

        <div className="mx-auto max-w-6xl space-y-lg p-margin-mobile pb-28 md:p-xl">
          <section className="grid grid-cols-1 gap-lg md:grid-cols-3">
            <div className="flex flex-col gap-xs rounded-xl border border-outline-variant bg-surface-container-lowest p-lg">
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">
                Tổng chi phí đã hoàn thành
              </span>
              <span className="font-display-lg text-display-lg text-primary">
                {formatCurrency(totalCost)}
              </span>
            </div>

            <div className="flex flex-col gap-xs rounded-xl border border-outline-variant bg-surface-container-lowest p-lg">
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">
                Số lần dịch vụ
              </span>
              <span className="font-display-lg text-display-lg text-on-surface">
                {appointments.length.toString().padStart(2, "0")}
              </span>
            </div>

            <div className="flex items-center justify-between rounded-xl bg-primary-container p-lg text-on-primary-container shadow-lg shadow-primary-container/20">
              <div className="flex flex-col gap-xs">
                <span className="font-label-sm text-label-sm uppercase tracking-wider opacity-90">
                  Đang xử lý
                </span>
                <span className="font-headline-md text-headline-md">
                  {appointments.filter((a) => a.status === "IN_PROGRESS").length} lịch hẹn
                </span>
              </div>
              <span className="material-symbols-outlined text-4xl opacity-50">
                build_circle
              </span>
            </div>
          </section>

          <section className="flex flex-col items-center justify-between gap-md rounded-xl border border-outline-variant bg-surface-container-lowest p-md sm:flex-row">
            <div className="flex w-full rounded-lg bg-surface-container-high p-1 sm:w-auto">
              {filters.map((filter) => (
                <button
                  key={filter.value}
                  className={`flex-1 rounded-md px-lg py-2 font-label-md text-label-md transition-all sm:flex-none ${
                    activeFilter === filter.value
                      ? "bg-primary text-on-primary shadow-sm"
                      : "text-on-surface-variant hover:text-primary"
                  }`}
                  type="button"
                  onClick={() => setActiveFilter(filter.value)}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </section>

          {isLoading && (
            <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-xl text-center font-body-md text-body-md text-on-surface-variant">
              Đang tải lịch sử dịch vụ...
            </div>
          )}

          {!isLoading && error && (
            <div className="rounded-xl border border-error/30 bg-error-container/10 p-xl text-center font-body-md text-body-md text-error">
              {error}
            </div>
          )}

          {!isLoading && !error && visibleRecords.length === 0 && (
            <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-xl text-center font-body-md text-body-md text-on-surface-variant">
              Chưa có lịch sử dịch vụ nào.
            </div>
          )}

          {!isLoading && !error && visibleRecords.length > 0 && (
            <section className="overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest">
              <div className="hidden overflow-x-auto lg:block">
                <table className="w-full border-collapse text-left">
                  <thead className="border-b border-outline-variant bg-surface-container-low">
                    <tr>
                      {["DỊCH VỤ", "TRẠNG THÁI", "NGÀY HẸN", "GARAGE", "CHI PHÍ"].map(
                        (heading) => (
                          <th
                            key={heading}
                            className="px-xl py-md font-label-md text-label-md text-on-surface-variant"
                          >
                            {heading}
                          </th>
                        ),
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant">
                    {visibleRecords.map((record) => (
                      <tr
                        key={record.id}
                        className="group transition-colors hover:bg-surface-container-low"
                      >
                        <td className="px-xl py-lg">
                          <div className="flex items-center gap-md">
                            <div
                              className={`flex h-10 w-10 items-center justify-center rounded-lg ${statusTone(record.status)}`}
                            >
                              <span className="material-symbols-outlined">
                                {statusIcon(record.status)}
                              </span>
                            </div>
                            <div>
                              <p className="font-body-lg text-body-lg font-semibold text-on-surface">
                                {record.serviceName}
                              </p>
                              <p className="font-label-sm text-label-sm text-on-surface-variant">
                                {record.vehicleModel} · {record.vehicleVin}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-xl py-lg">
                          <span
                            className={`rounded-full px-sm py-xs font-label-sm text-label-sm ${statusTone(record.status)}`}
                          >
                            {statusLabel(record.status)}
                          </span>
                        </td>
                        <td className="px-xl py-lg">
                          <p className="font-body-md text-body-md text-on-surface">
                            {record.scheduleDate}
                          </p>
                          <p className="font-label-sm text-label-sm text-on-surface-variant">
                            {record.timeFrame}
                          </p>
                        </td>
                        <td className="px-xl py-lg">
                          <div className="flex items-center gap-xs">
                            <span className="material-symbols-outlined text-sm text-on-surface-variant">
                              location_on
                            </span>
                            <span className="font-body-md text-body-md text-on-surface">
                              {record.garageName}
                            </span>
                          </div>
                        </td>
                        <td className="px-xl py-lg">
                          <span className="font-body-lg text-body-lg font-bold text-on-surface">
                            {formatCurrency(record.servicePrice)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="divide-y divide-outline-variant lg:hidden">
                {visibleRecords.map((record) => (
                  <article key={`${record.id}-mobile`} className="p-lg">
                    <div className="mb-md flex items-start gap-md">
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${statusTone(record.status)}`}
                      >
                        <span className="material-symbols-outlined">
                          {statusIcon(record.status)}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-body-lg text-body-lg font-semibold">
                          {record.serviceName}
                        </h3>
                        <p className="font-label-sm text-label-sm text-on-surface-variant">
                          {record.vehicleModel} · {record.vehicleVin}
                        </p>
                      </div>
                      <span
                        className={`rounded-full px-sm py-xs font-label-sm text-label-sm ${statusTone(record.status)}`}
                      >
                        {statusLabel(record.status)}
                      </span>
                    </div>
                    <div className="grid gap-sm font-body-md text-body-md text-on-surface-variant">
                      <p>
                        {record.scheduleDate} - {record.timeFrame}
                      </p>
                      <p>{record.garageName}</p>
                    </div>
                    <div className="mt-md flex items-center justify-between border-t border-outline-variant pt-md">
                      <span className="font-label-md text-label-md text-outline">
                        Chi phí
                      </span>
                      <span className="font-headline-md text-headline-md text-primary">
                        {formatCurrency(record.servicePrice)}
                      </span>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}

          <footer className="flex flex-col gap-md pb-xl font-label-sm text-label-sm text-on-surface-variant sm:flex-row sm:items-center sm:justify-between">
            <p>© 2024 Servio Automotive Management. All rights reserved.</p>
          </footer>
        </div>
      </main>

      <nav className="fixed bottom-0 left-0 z-50 flex h-20 w-full items-center justify-around border-t border-outline-variant bg-surface px-2 md:hidden">
        <button
          className="flex flex-col items-center justify-center text-on-surface-variant"
          type="button"
          onClick={onHomeClick}
        >
          <span className="material-symbols-outlined">home</span>
          <span className="font-label-sm text-label-sm">Trang chủ</span>
        </button>
        <button
          className="flex flex-col items-center justify-center text-on-surface-variant"
          type="button"
          onClick={onTrackingClick}
        >
          <span className="material-symbols-outlined">location_searching</span>
          <span className="font-label-sm text-label-sm">Theo dõi</span>
        </button>
        <button
          className="flex flex-col items-center justify-center rounded-full bg-secondary-container px-4 py-1 text-on-secondary-container"
          type="button"
        >
          <span
            className="material-symbols-outlined"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            history
          </span>
          <span className="font-label-sm text-label-sm">Lịch sử</span>
        </button>
        <button
          className="flex flex-col items-center justify-center text-on-surface-variant"
          type="button"
          onClick={onProfileClick}
        >
          <span className="material-symbols-outlined">person</span>
          <span className="font-label-sm text-label-sm">Cá nhân</span>
        </button>
      </nav>
    </div>
  );
}

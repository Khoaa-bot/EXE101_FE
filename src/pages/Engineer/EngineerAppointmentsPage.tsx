import StaffShell from "../../components/StaffShell";
import { useEffect, useState } from "react";
import { getEngineerDashboard, type AppointmentDto } from "../../services/api";
import { statusBadgeClass, statusLabel } from "./engineerStatus";

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
  const [engineerName, setEngineerName] = useState("");
  const [appointments, setAppointments] = useState<AppointmentDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [filterQuery, setFilterQuery] = useState("");

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
          err instanceof Error ? err.message : "Không tải được danh sách lịch hẹn.",
        );
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const query = filterQuery.toLowerCase();
  const visibleAppointments = appointments.filter(
    (a) =>
      a.serviceName.toLowerCase().includes(query) ||
      a.vehicleModel.toLowerCase().includes(query) ||
      a.customerName.toLowerCase().includes(query) ||
      String(a.id).includes(query),
  );

  return (
    <div className="min-h-[100dvh] bg-background font-sans text-on-surface">
      {/* Sidebar Navigation */}
      <StaffShell
        role="engineer"
        active="appointments"
        handlers={{ dashboard: onDashboardClick, schedule: onScheduleClick, appointments: onAppointmentsClick, technicians: onTechniciansClick, customers: onCustomersClick, settings: onSettingsClick }}
        userName={engineerName || "Kỹ thuật viên"}
        search={{ value: filterQuery, onChange: setFilterQuery, placeholder: "Tìm kiếm lịch hẹn, xe, khách hàng..." }}
        onLogout={onLogout}
      >

        {/* Page Content */}
        <div className="mx-auto max-w-[1440px] p-margin-mobile md:p-margin-desktop">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-outline-variant pb-5">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight">
                Danh sách Lịch hẹn
              </h1>
              <p className="mt-1 text-body-sm text-on-surface-variant">
                Tất cả các phiếu sửa chữa & lịch hẹn đã được phân công cho bạn.
              </p>
            </div>
          </div>

          {isLoading && (
            <p className="mt-6 text-body-sm text-on-surface-variant">
              Đang tải danh sách lịch hẹn...
            </p>
          )}

          {!isLoading && loadError && (
            <p className="mt-6 text-body-sm text-error">{loadError}</p>
          )}

          {/* Appointments List */}
          {!isLoading && !loadError && (
            <section className="mt-6 space-y-3">
              {visibleAppointments.map((a) => (
                <article
                  key={a.id}
                  onClick={() => onJobDetailClick?.(String(a.id))}
                  className="group flex cursor-pointer items-center justify-between rounded-3xl border border-outline-variant/40 bg-surface-container-lowest shadow-[0_10px_26px_-14px_rgba(25,28,29,0.28)] p-4 shadow-sm transition hover:border-primary/50 hover:bg-surface-container-low"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-primary">
                        #{a.id}
                      </span>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusBadgeClass(a.status)}`}
                      >
                        {statusLabel(a.status)}
                      </span>
                    </div>
                    <h2 className="mt-1 font-semibold text-base truncate">
                      {a.serviceName}
                    </h2>
                    <p className="mt-1 text-xs text-on-surface-variant truncate">
                      {a.vehicleModel} · {a.scheduleDate} ({a.timeFrame}) ·
                      Khách: {a.customerName}
                    </p>
                  </div>

                  <div className="ml-4 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-container-high text-on-surface-variant group-hover:bg-primary group-hover:text-on-primary">
                    <span className="material-symbols-outlined text-lg">
                      chevron_right
                    </span>
                  </div>
                </article>
              ))}

              {visibleAppointments.length === 0 && (
                <div className="py-12 text-center text-on-surface-variant">
                  Không tìm thấy lịch hẹn phù hợp.
                </div>
              )}
            </section>
          )}
        </div>
      </StaffShell>
    </div>
  );
}

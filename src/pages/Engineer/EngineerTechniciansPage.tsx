import StaffShell from "../../components/StaffShell";
import { useEffect, useMemo, useState } from "react";
import {
  getEngineerDashboard,
  type AppointmentDto,
} from "../../services/api";
import { isTerminalStatus, statusLabel } from "./engineerStatus";

type EngineerTechniciansPageProps = {
  onDashboardClick?: () => void;
  onScheduleClick?: () => void;
  onAppointmentsClick?: () => void;
  onTechniciansClick?: () => void;
  onCustomersClick?: () => void;
  onSettingsClick?: () => void;
  onLogout?: () => void;
};

type TechnicianRow = {
  engineerId: number;
  name: string;
  activeJob: AppointmentDto | null;
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
  const [engineerName, setEngineerName] = useState("");
  const [appointments, setAppointments] = useState<AppointmentDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

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
          err instanceof Error ? err.message : "Không tải được dữ liệu đội ngũ.",
        );
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);


  // Không có API riêng cho "toàn bộ nhân sự garage" mà role kỹ thuật viên
  // được phép gọi (endpoint /garage-owner/employees chỉ dành cho
  // GARAGE_OWNER/ADMIN) — nên danh sách này suy ra từ những kỹ thuật viên
  // đang xuất hiện trong lịch hẹn của garage, không phải toàn bộ nhân sự.
  const technicians = useMemo<TechnicianRow[]>(() => {
    const byEngineer = new Map<number, TechnicianRow>();
    for (const appt of appointments) {
      if (!appt.engineerId || !appt.engineerName) continue;
      const isActive = !isTerminalStatus(appt.status);
      const existing = byEngineer.get(appt.engineerId);
      if (!existing) {
        byEngineer.set(appt.engineerId, {
          engineerId: appt.engineerId,
          name: appt.engineerName,
          activeJob: isActive ? appt : null,
        });
      } else if (isActive && !existing.activeJob) {
        existing.activeJob = appt;
      }
    }
    return [...byEngineer.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [appointments]);

  return (
    <div className="min-h-[100dvh] bg-background font-sans text-on-surface">
      {/* Sidebar Navigation */}
      <StaffShell
        role="engineer"
        active="technicians"
        handlers={{ dashboard: onDashboardClick, schedule: onScheduleClick, appointments: onAppointmentsClick, technicians: onTechniciansClick, customers: onCustomersClick, settings: onSettingsClick }}
        userName={engineerName || "Kỹ thuật viên"}
        onLogout={onLogout}
      >

        {/* Page Content */}
        <div className="mx-auto max-w-[1440px] p-margin-mobile md:p-margin-desktop">
          <div className="border-b border-outline-variant pb-5">
            <h1 className="text-3xl font-extrabold tracking-tight">
              Đội ngũ Kỹ thuật viên
            </h1>
            <p className="mt-1 text-body-sm text-on-surface-variant">
              Kỹ thuật viên đang có lịch hẹn tại garage của bạn, cùng công việc hiện tại.
            </p>
          </div>

          {isLoading && (
            <p className="mt-6 text-body-sm text-on-surface-variant">
              Đang tải dữ liệu đội ngũ...
            </p>
          )}

          {!isLoading && loadError && (
            <p className="mt-6 text-body-sm text-error">{loadError}</p>
          )}

          {!isLoading && !loadError && (
            <section className="mt-6 grid gap-4 sm:grid-cols-2">
              {technicians.map((tech) => {
                const isReady = !tech.activeJob;
                return (
                  <article
                    key={tech.engineerId}
                    className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-5 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary-fixed font-bold text-on-primary-fixed text-lg">
                          {tech.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h2 className="font-bold text-base">{tech.name}</h2>
                        </div>
                      </div>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          isReady
                            ? "bg-tertiary-container/15 text-tertiary"
                            : "bg-primary-container/15 text-primary"
                        }`}
                      >
                        {isReady ? "Không có việc đang xử lý" : "Đang làm việc"}
                      </span>
                    </div>

                    {tech.activeJob && (
                      <div className="mt-4 rounded-xl border border-outline-variant/60 bg-surface-container-low p-3">
                        <p className="text-xs text-outline font-semibold">
                          Công việc hiện tại ({statusLabel(tech.activeJob.status)}):
                        </p>
                        <p className="mt-1 text-xs font-medium text-on-surface">
                          {tech.activeJob.serviceName} · {tech.activeJob.vehicleModel} (
                          {tech.activeJob.vehicleLicensePlate ?? tech.activeJob.vehicleVin})
                        </p>
                      </div>
                    )}
                  </article>
                );
              })}

              {technicians.length === 0 && (
                <p className="col-span-2 rounded-xl border border-dashed border-outline-variant p-6 text-center text-body-sm text-on-surface-variant">
                  Chưa có kỹ thuật viên nào khác xuất hiện trong lịch hẹn của garage.
                </p>
              )}
            </section>
          )}
        </div>
      </StaffShell>
    </div>
  );
}

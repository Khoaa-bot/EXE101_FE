import StaffShell from "../../components/StaffShell";
import { useState } from "react";
import { INITIAL_JOBS, type JobItem } from "./mockJobs";

type EngineerSchedulePageProps = {
  onDashboardClick?: () => void;
  onScheduleClick?: () => void;
  onAppointmentsClick?: () => void;
  onTechniciansClick?: () => void;
  onCustomersClick?: () => void;
  onSettingsClick?: () => void;
  onJobDetailClick?: (jobId?: string) => void;
  onLogout?: () => void;
};

export default function EngineerSchedulePage({
  onDashboardClick,
  onScheduleClick,
  onAppointmentsClick,
  onTechniciansClick,
  onCustomersClick,
  onSettingsClick,
  onJobDetailClick,
  onLogout,
}: EngineerSchedulePageProps) {
  const [jobs] = useState<JobItem[]>(INITIAL_JOBS);

  return (
    <div className="min-h-[100dvh] bg-background font-sans text-on-surface">
      {/* Sidebar Navigation */}
      <StaffShell
        role="engineer"
        active="schedule"
        handlers={{ dashboard: onDashboardClick, schedule: onScheduleClick, appointments: onAppointmentsClick, technicians: onTechniciansClick, customers: onCustomersClick, settings: onSettingsClick }}
        userName={"Trần Quốc Toản"}
        userDetail={"KTV Trưởng"}
        onLogout={onLogout}
      >

        {/* Page Content */}
        <div className="mx-auto max-w-[1440px] p-margin-mobile md:p-margin-desktop">
          <div className="border-b border-outline-variant pb-5">
            <h1 className="text-3xl font-extrabold tracking-tight">
              Lịch làm việc
            </h1>
            <p className="mt-1 text-body-sm text-on-surface-variant">
              Tổng quan tuần này theo khung giờ và phiếu phân công.
            </p>
          </div>

          <section className="mt-6 overflow-hidden rounded-2xl border border-outline-variant bg-surface-container-lowest p-6 shadow-sm">
            <div className="space-y-3">
              {jobs.map((j) => (
                <div
                  key={j.id}
                  onClick={() => onJobDetailClick?.(j.id)}
                  className="flex cursor-pointer flex-wrap items-center justify-between gap-3 rounded-xl border border-outline-variant p-4 transition hover:border-primary/50 hover:bg-surface-container-low"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-container/15 text-primary">
                      <span className="material-symbols-outlined">
                        calendar_today
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-base truncate">
                        {j.service}
                      </p>
                      <p className="text-xs text-on-surface-variant truncate">
                        {j.date} · Giờ: {j.time} · Xe: {j.vehicle.model} (
                        <span className="font-mono font-bold text-primary">
                          {j.vehicle.plate}
                        </span>
                        )
                      </p>
                    </div>
                  </div>

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      j.status === "in_progress"
                        ? "bg-primary-container/15 text-primary"
                        : j.status === "accepted"
                          ? "bg-tertiary-container/15 text-tertiary"
                          : j.status === "done"
                            ? "bg-tertiary text-on-tertiary"
                            : "bg-surface-container-high text-on-surface-variant"
                    }`}
                  >
                    {j.status === "in_progress"
                      ? "Đang thực hiện"
                      : j.status === "accepted"
                        ? "Đã tiếp nhận"
                        : j.status === "done"
                          ? "Hoàn thành"
                          : "Chờ xử lý"}
                  </span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </StaffShell>
    </div>
  );
}

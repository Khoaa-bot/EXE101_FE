import StaffShell from "../../components/StaffShell";
import { useState } from "react";
import { INITIAL_JOBS, type JobItem } from "./mockJobs";

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
      <StaffShell
        role="engineer"
        active="customers"
        handlers={{ dashboard: onDashboardClick, schedule: onScheduleClick, appointments: onAppointmentsClick, technicians: onTechniciansClick, customers: onCustomersClick, settings: onSettingsClick }}
        userName={"Trần Quốc Toản"}
        userDetail={"KTV Trưởng"}
        onLogout={onLogout}
      >

        {/* Page Content */}
        <div className="mx-auto max-w-[1440px] p-margin-mobile md:p-margin-desktop">
          <div className="border-b border-outline-variant pb-5">
            <h1 className="text-3xl font-extrabold tracking-tight">
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
                  className="flex items-center gap-4 rounded-3xl border border-outline-variant/40 bg-surface-container-lowest shadow-[0_10px_26px_-14px_rgba(25,28,29,0.28)] p-5 shadow-sm transition hover:border-primary/50"
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
      </StaffShell>
    </div>
  );
}

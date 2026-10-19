import StaffShell from "../../components/StaffShell";
import { useEffect, useState } from "react";
import {
  getEngineerDashboard,
  acceptEngineerAppointment,
  type AppointmentDto,
} from "../../services/api";
import { isTerminalStatus, statusBadgeClass, statusLabel } from "./engineerStatus";

function isTodayOrFuture(scheduleDate: string) {
  const date = new Date(scheduleDate);
  if (Number.isNaN(date.getTime())) return true;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);
  return date >= today;
}

type EngineerDashboardPageProps = {
  onDashboardClick?: () => void;
  onScheduleClick?: () => void;
  onAppointmentsClick?: () => void;
  onTechniciansClick?: () => void;
  onCustomersClick?: () => void;
  onSettingsClick?: () => void;
  onJobDetailClick?: (jobId?: string) => void;
  onLogout?: () => void;
};

export default function EngineerDashboardPage({
  onDashboardClick,
  onScheduleClick,
  onAppointmentsClick,
  onTechniciansClick,
  onCustomersClick,
  onSettingsClick,
  onJobDetailClick,
  onLogout,
}: EngineerDashboardPageProps) {
  const [engineerName, setEngineerName] = useState("");
  const [appointments, setAppointments] = useState<AppointmentDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [acceptingId, setAcceptingId] = useState<number | null>(null);
  const [notice, setNotice] = useState("");

  const showNotice = (msg: string) => {
    setNotice(msg);
    window.setTimeout(() => setNotice(""), 3000);
  };

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
          err instanceof Error ? err.message : "Không tải được danh sách công việc.",
        );
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const acceptJob = (id: number) => {
    setAcceptingId(id);
    acceptEngineerAppointment(id)
      .then((updated) => {
        setAppointments((prev) => prev.map((a) => (a.id === id ? updated : a)));
        showNotice(`Đã tiếp nhận thành công lịch làm việc #${id}`);
      })
      .catch((err) => {
        showNotice(
          err instanceof Error ? err.message : "Không thể tiếp nhận công việc này.",
        );
      })
      .finally(() => setAcceptingId(null));
  };


  // Chỉ hiện công việc còn cần xử lý (chưa hoàn thành/hủy) từ hôm nay trở
  // đi — job cũ/đã xong thuộc về Lịch sử, không nên lẫn vào đây.
  const visibleAppointments = appointments.filter(
    (a) => !isTerminalStatus(a.status) && isTodayOrFuture(a.scheduleDate),
  );
  const completedCount = appointments.filter(
    (a) => a.status.toLowerCase() === "completed",
  ).length;

  return (
    <div className="min-h-[100dvh] bg-background font-sans text-on-surface">
      {/* Sidebar Navigation */}
      <StaffShell
        role="engineer"
        active="dashboard"
        handlers={{ dashboard: onDashboardClick, schedule: onScheduleClick, appointments: onAppointmentsClick, technicians: onTechniciansClick, customers: onCustomersClick, settings: onSettingsClick }}
        userName={engineerName || "Kỹ thuật viên"}
        onLogout={onLogout}
      >

        {/* Page Content */}
        <div className="mx-auto max-w-[1440px] p-margin-mobile md:p-margin-desktop">
          {/* Banner Section */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-outline-variant pb-5">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight">
                Lịch làm việc của bạn
              </h1>
              <p className="mt-1 text-body-sm text-on-surface-variant">
                Bạn có {visibleAppointments.length} công việc cần xử lý từ hôm nay.
              </p>
            </div>
          </div>

          {isLoading && (
            <p className="mt-6 text-body-sm text-on-surface-variant">
              Đang tải danh sách công việc...
            </p>
          )}

          {!isLoading && loadError && (
            <p className="mt-6 text-body-sm text-error">{loadError}</p>
          )}

          {!isLoading && !loadError && (
            <>
              {/* Metrics Section */}
              <section className="mt-6 grid gap-4 sm:grid-cols-3">
                <article className="rounded-3xl border border-outline-variant/40 bg-surface-container-lowest shadow-[0_10px_26px_-14px_rgba(25,28,29,0.28)] p-5">
                  <p className="text-xs font-semibold uppercase text-outline">
                    ĐƯỢC PHÂN CÔNG
                  </p>
                  <p className="mt-2 font-headline-lg text-3xl font-bold">
                    {visibleAppointments.length} xe
                  </p>
                </article>
                <article className="rounded-3xl border border-outline-variant/40 bg-surface-container-lowest shadow-[0_10px_26px_-14px_rgba(25,28,29,0.28)] p-5">
                  <p className="text-xs font-semibold uppercase text-outline">
                    ĐANG THỰC HIỆN
                  </p>
                  <p className="mt-2 font-headline-lg text-3xl font-bold text-primary">
                    {
                      visibleAppointments.filter(
                        (a) =>
                          a.status.toLowerCase() === "in_progress" ||
                          a.status.toLowerCase() === "confirmed",
                      ).length
                    }{" "}
                    xe
                  </p>
                </article>
                <article className="rounded-3xl border border-outline-variant/40 bg-surface-container-lowest shadow-[0_10px_26px_-14px_rgba(25,28,29,0.28)] p-5">
                  <p className="text-xs font-semibold uppercase text-outline">
                    ĐÃ HOÀN TẤT
                  </p>
                  <p className="mt-2 font-headline-lg text-3xl font-bold text-tertiary">
                    {completedCount} xe
                  </p>
                </article>
              </section>

              {/* Job Cards List */}
              <section className="mt-8 space-y-4">
                <h2 className="font-headline-md text-lg font-bold">
                  Danh sách phiếu sửa chữa
                </h2>

                {visibleAppointments.length === 0 && (
                  <p className="rounded-xl border border-dashed border-outline-variant p-6 text-center text-body-sm text-on-surface-variant">
                    Không có công việc nào cần xử lý từ hôm nay. Xem lịch sử ở mục
                    "Lịch hẹn".
                  </p>
                )}

                {visibleAppointments.map((job) => {
                  const status = job.status.toLowerCase();
                  const isPending = status === "pending";

                  return (
                    <article
                      key={job.id}
                      className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-5 shadow-sm transition hover:border-primary/50"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="flex items-start gap-3">
                          <span className="material-symbols-outlined rounded-xl bg-primary-container/15 p-3 text-primary text-2xl">
                            build
                          </span>
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-mono text-xs font-bold text-primary">
                                #{job.id}
                              </span>
                              <span
                                className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusBadgeClass(job.status)}`}
                              >
                                {statusLabel(job.status)}
                              </span>
                            </div>
                            <h3 className="mt-1 font-bold text-base">
                              {job.serviceName}
                            </h3>
                            <p className="mt-1 text-xs text-on-surface-variant">
                              {job.vehicleModel} · {job.scheduleDate} ·{" "}
                              {job.timeFrame}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-outline text-lg">
                            account_circle
                          </span>
                          <span className="text-xs font-semibold">
                            {job.customerName}
                          </span>
                        </div>
                      </div>

                      {/* Actions Row */}
                      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-outline-variant/60 pt-4">
                        <button
                          type="button"
                          disabled={!isPending || acceptingId === job.id}
                          onClick={() => acceptJob(job.id)}
                          className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                            !isPending
                              ? "bg-surface-container-high text-outline cursor-not-allowed"
                              : "bg-primary text-on-primary hover:opacity-90 active:scale-[0.98]"
                          }`}
                        >
                          <span className="material-symbols-outlined text-base">
                            play_arrow
                          </span>
                          {acceptingId === job.id
                            ? "Đang xử lý..."
                            : isPending
                              ? "Nhận việc"
                              : "Đã nhận việc"}
                        </button>

                        <button
                          type="button"
                          onClick={() => onJobDetailClick?.(String(job.id))}
                          className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"
                        >
                          Xem chi tiết công việc
                          <span className="material-symbols-outlined text-base">
                            chevron_right
                          </span>
                        </button>
                      </div>
                    </article>
                  );
                })}
              </section>
            </>
          )}
        </div>
      </StaffShell>

      {/* Notice Toast */}
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

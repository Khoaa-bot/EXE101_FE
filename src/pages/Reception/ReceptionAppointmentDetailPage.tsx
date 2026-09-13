import { useState } from "react";
import { APPOINTMENTS_DATA, type Appt } from "./ReceptionAppointmentsPage";

const navItems = [
  ["dashboard", "Dashboard"],
  ["calendar_today", "Schedule"],
  ["event_note", "Appointments"],
  ["person", "Customers"],
];

const statusMap: Record<Appt["status"], { label: string; cls: string }> = {
  pending: { label: "Đang chờ", cls: "bg-tertiary-container/10 text-tertiary" },
  confirmed: { label: "Đã xác nhận", cls: "bg-primary-container/10 text-primary" },
  done: { label: "Hoàn thành", cls: "bg-surface-container text-on-surface-variant" },
  canceled: { label: "Đã hủy", cls: "bg-error-container/10 text-on-error-container" },
};

type ReceptionAppointmentDetailPageProps = {
  appointmentId: string;
  onDashboardClick?: () => void;
  onScheduleClick?: () => void;
  onAppointmentsClick?: () => void;
  onCustomersClick?: () => void;
  onLogout?: () => void;
};

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-on-surface-variant">{label}</span>
      <span className="font-medium text-right">{value}</span>
    </div>
  );
}

export default function ReceptionAppointmentDetailPage({
  appointmentId,
  onDashboardClick,
  onScheduleClick,
  onAppointmentsClick,
  onCustomersClick,
  onLogout,
}: ReceptionAppointmentDetailPageProps) {
  const appt = APPOINTMENTS_DATA.find((a) => a.id === appointmentId);
  const [status, setStatus] = useState<Appt["status"]>(appt?.status ?? "pending");
  const [notice, setNotice] = useState("");

  const showNotice = (msg: string) => {
    setNotice(msg);
    window.setTimeout(() => setNotice(""), 3000);
  };

  const onConfirm = () => {
    setStatus("confirmed");
    showNotice(`Đã xác nhận lịch ${appt?.bookingId}`);
  };

  const onCancel = () => {
    setStatus("canceled");
    showNotice(`Đã hủy lịch ${appt?.bookingId} giúp khách`);
    window.setTimeout(() => onAppointmentsClick?.(), 800);
  };

  const { label: statusLabel, cls: statusCls } = statusMap[status];

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
          {notice && (
            <div className="mb-4 rounded-lg bg-primary-container/10 text-primary px-4 py-3 text-sm font-medium">{notice}</div>
          )}

          <button
            onClick={onAppointmentsClick}
            className="inline-flex items-center gap-2 text-sm text-primary hover:underline mb-4"
          >
            <span className="material-symbols-outlined">arrow_back</span>
            Quay lại Lịch hẹn
          </button>

          {!appt ? (
            <article className="rounded-xl border border-outline-variant bg-surface-container-lowest">
              <div className="p-8">
                <p className="text-on-surface-variant">Không tìm thấy lịch hẹn.</p>
                <button
                  className="mt-4 inline-flex items-center gap-2 rounded-lg border border-outline-variant bg-surface-container-lowest px-4 py-2.5 text-sm font-medium hover:bg-surface-container-low transition-colors"
                  onClick={onAppointmentsClick}
                >
                  Quay lại
                </button>
              </div>
            </article>
          ) : (
            <article className="rounded-xl border border-outline-variant bg-surface-container-lowest">
              <div className="p-6 md:p-8">
                <div className="flex flex-wrap items-start justify-between gap-4 border-b border-outline-variant pb-6">
                  <div>
                    <h1 className="text-2xl md:text-3xl font-bold">Chi tiết Lịch hẹn</h1>
                    <p className="text-sm text-on-surface-variant mt-1">
                      Booking ID: <span className="font-semibold text-on-surface">#{appt.bookingId}</span>
                    </p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-semibold ${statusCls}`}>
                    ● {statusLabel}
                  </span>
                </div>

                <div className="grid gap-6 md:grid-cols-2 mt-6">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-on-surface-variant flex items-center gap-2 mb-3">
                      <span className="material-symbols-outlined">person</span>
                      Thông tin khách hàng
                    </p>
                    <div className="rounded-xl bg-surface-container p-5 space-y-3">
                      <p className="text-lg font-semibold">{appt.name}</p>
                      <p className="text-sm inline-flex items-center gap-2">
                        <span className="material-symbols-outlined text-on-surface-variant">phone</span> {appt.phone}
                      </p>
                      <p className="text-sm inline-flex items-center gap-2">
                        <span className="material-symbols-outlined text-on-surface-variant">mail</span> {appt.email}
                      </p>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-on-surface-variant flex items-center gap-2 mb-3">
                      <span className="material-symbols-outlined">directions_car</span>
                      Chi tiết đặt lịch
                    </p>
                    <div className="rounded-xl bg-surface-container p-5 space-y-3 text-sm">
                      <Row label="Xe" value={appt.vehicle} />
                      <Row label="Biển số" value={<span className="rounded bg-primary-container/10 text-primary px-2 py-0.5 font-semibold">{appt.plate}</span>} />
                      <Row label="Dịch vụ" value={appt.service} />
                      <Row label="Lịch hẹn" value={<div className="text-right"><div>{appt.date}</div><div className="text-primary font-medium">{appt.slot}</div></div>} />
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  <p className="text-xs uppercase tracking-wide text-on-surface-variant mb-3">Ghi chú của khách hàng</p>
                  <div className="rounded-xl bg-surface-container p-5 text-sm italic text-on-surface-variant">
                    {appt.note ? `"${appt.note}"` : "Không có ghi chú."}
                  </div>
                </div>

                <div className="mt-6 rounded-xl bg-surface-container p-4 flex flex-col md:flex-row md:items-center gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    <span className="material-symbols-outlined text-primary shrink-0 mt-0.5">info</span>
                    <p className="text-sm text-on-surface-variant">
                      Xác nhận lịch khi khách đã đồng ý, hoặc hủy giúp khách nếu họ gọi báo bận.
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 shrink-0">
                    <button
                      className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-on-primary hover:bg-primary/90 transition-colors active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={onConfirm}
                      disabled={status !== "pending"}
                    >
                      <span className="material-symbols-outlined text-lg">check_circle</span>
                      Xác nhận lịch hẹn
                    </button>
                    <button
                      className="inline-flex items-center gap-2 rounded-lg bg-error px-4 py-2.5 text-sm font-medium text-on-error hover:bg-error/90 transition-colors active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={onCancel}
                      disabled={status === "done" || status === "canceled"}
                    >
                      <span className="material-symbols-outlined text-lg">cancel</span>
                      Hủy lịch giúp khách
                    </button>
                  </div>
                </div>
              </div>
            </article>
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

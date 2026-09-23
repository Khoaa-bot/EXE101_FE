import { useEffect, useState } from "react";
import {
  getEngineerAppointmentDetail,
  updateEngineerAppointment,
  type AppointmentDto,
} from "../../services/api";
import {
  ENGINEER_STATUS_OPTIONS,
  statusBadgeClass,
  statusLabel,
} from "./engineerStatus";

const navItems = [
  ["dashboard", "Tổng quan"],
  ["calendar_today", "Lịch làm việc"],
  ["event_note", "Lịch hẹn"],
  ["engineering", "Kỹ thuật viên"],
  ["person", "Khách hàng"],
  ["settings", "Cài đặt"],
];

type EngineerJobDetailPageProps = {
  appointmentId?: string;
  onBackClick?: () => void;
  onDashboardClick?: () => void;
  onScheduleClick?: () => void;
  onAppointmentsClick?: () => void;
  onTechniciansClick?: () => void;
  onCustomersClick?: () => void;
  onSettingsClick?: () => void;
  onLogout?: () => void;
};

export default function EngineerJobDetailPage({
  appointmentId,
  onBackClick,
  onDashboardClick,
  onScheduleClick,
  onAppointmentsClick,
  onTechniciansClick,
  onCustomersClick,
  onSettingsClick,
  onLogout,
}: EngineerJobDetailPageProps) {
  const [appointment, setAppointment] = useState<AppointmentDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [status, setStatus] = useState("pending");
  const [notes, setNotes] = useState("");
  const [engineerNotes, setEngineerNotes] = useState("");
  const [partsUsed, setPartsUsed] = useState("");

  const [isSaving, setIsSaving] = useState(false);
  const [notice, setNotice] = useState("");

  const showNotice = (msg: string) => {
    setNotice(msg);
    window.setTimeout(() => setNotice(""), 3000);
  };

  useEffect(() => {
    if (!appointmentId) {
      setIsLoading(false);
      setLoadError("Không xác định được lịch hẹn cần xem.");
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setLoadError(null);

    getEngineerAppointmentDetail(appointmentId)
      .then((data) => {
        if (cancelled) return;
        setAppointment(data);
        setStatus(data.status.toLowerCase());
        setNotes(data.notes ?? "");
        setEngineerNotes(data.engineerNotes ?? "");
        setPartsUsed(data.partsUsed ?? "");
      })
      .catch((err) => {
        if (cancelled) return;
        setLoadError(
          err instanceof Error ? err.message : "Không tải được chi tiết công việc.",
        );
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [appointmentId]);

  const applyUpdate = (payload: {
    status?: string;
    notes?: string;
    engineerNotes?: string;
    partsUsed?: string;
  }) => {
    if (!appointmentId) return;
    setIsSaving(true);
    updateEngineerAppointment(appointmentId, payload)
      .then((updated) => {
        setAppointment(updated);
        setStatus(updated.status.toLowerCase());
        setNotes(updated.notes ?? "");
        setEngineerNotes(updated.engineerNotes ?? "");
        setPartsUsed(updated.partsUsed ?? "");
        showNotice(`Đã cập nhật công việc #${updated.id} thành công!`);
      })
      .catch((err) => {
        showNotice(
          err instanceof Error ? err.message : "Không thể cập nhật công việc này.",
        );
      })
      .finally(() => setIsSaving(false));
  };

  const saveReport = () => {
    if (!notes.trim()) {
      showNotice("Vui lòng nhập ghi chú kỹ thuật!");
      return;
    }
    applyUpdate({ status, notes, engineerNotes, partsUsed });
  };

  const completeJob = () => {
    applyUpdate({ status: "completed", notes, engineerNotes, partsUsed });
  };

  return (
    <div className="min-h-[100dvh] bg-background font-sans text-on-surface">
      {/* Sidebar Navigation */}
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
            Garage Kỹ thuật viên
          </p>
        </div>
        <nav className="space-y-1">
          {navItems.map(([icon, label]) => {
            return (
              <button
                key={label}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left font-body-md text-body-md text-on-surface-variant transition-colors hover:bg-surface-container-low active:scale-[0.98]"
                type="button"
                onClick={() => {
                  if (label === "Tổng quan") onDashboardClick?.();
                  else if (label === "Lịch làm việc") onScheduleClick?.();
                  else if (label === "Lịch hẹn") onAppointmentsClick?.();
                  else if (label === "Kỹ thuật viên") onTechniciansClick?.();
                  else if (label === "Khách hàng") onCustomersClick?.();
                  else if (label === "Cài đặt") onSettingsClick?.();
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

      {/* Main Content Area */}
      <main className="min-h-[100dvh] md:ml-60">
        {/* Header Bar */}
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-outline-variant bg-surface/95 px-margin-mobile backdrop-blur md:px-margin-desktop">
          <button
            className="rounded-full p-2 text-on-surface-variant md:hidden"
            type="button"
            aria-label="Mở menu"
          >
            <span className="material-symbols-outlined">menu</span>
          </button>
          <label className="relative hidden w-full max-w-md md:block">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">
              search
            </span>
            <input
              className="w-full rounded-full border border-outline-variant bg-surface-container-low px-4 py-2 pl-10 text-body-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
              placeholder="Tìm kiếm..."
            />
          </label>
        </header>

        {/* Page Content */}
        <div className="mx-auto max-w-[1440px] p-margin-mobile md:p-margin-desktop">
          {/* Back Link */}
          <button
            type="button"
            onClick={onBackClick || onDashboardClick}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-on-surface-variant hover:text-primary"
          >
            <span className="material-symbols-outlined text-base">
              arrow_back
            </span>
            Quay lại danh sách công việc
          </button>

          {isLoading && (
            <p className="mt-6 text-body-sm text-on-surface-variant">
              Đang tải chi tiết công việc...
            </p>
          )}

          {!isLoading && loadError && (
            <p className="mt-6 text-body-sm text-error">{loadError}</p>
          )}

          {!isLoading && appointment && (
            <>
              {/* Title Banner */}
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-b border-outline-variant pb-5">
                <div>
                  <h1 className="font-headline-lg text-headline-lg font-bold">
                    Chi tiết công việc{" "}
                    <span className="text-primary">#{appointment.id}</span>
                  </h1>
                  <p className="mt-1 text-body-sm text-on-surface-variant">
                    Phiếu sửa chữa được phân công ngày {appointment.scheduleDate}{" "}
                    lúc {appointment.timeFrame}.
                  </p>
                </div>

                <span
                  className={`rounded-full px-3 py-1 text-xs font-bold ${statusBadgeClass(appointment.status)}`}
                >
                  {statusLabel(appointment.status)}
                </span>
              </div>

              {/* Two-Column Grid */}
              <div className="mt-6 grid gap-6 lg:grid-cols-3">
                {/* Left Column (Info) */}
                <div className="space-y-6 lg:col-span-2">
                  {/* Vehicle Info Card */}
                  <article className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-5">
                    <div className="mb-4 flex items-center gap-2 text-primary font-bold">
                      <span className="material-symbols-outlined text-xl">
                        directions_car
                      </span>
                      <h2>Thông tin phương tiện</h2>
                    </div>
                    <div className="space-y-2 text-body-sm">
                      <div className="flex justify-between border-b border-outline-variant/40 pb-1">
                        <span className="text-on-surface-variant">Mẫu xe:</span>
                        <span className="font-bold">
                          {appointment.vehicleModel}
                        </span>
                      </div>
                      <div className="flex justify-between border-b border-outline-variant/40 pb-1">
                        <span className="text-on-surface-variant">
                          Số khung (VIN):
                        </span>
                        <span className="font-mono text-xs bg-surface-container-high px-2 py-0.5 rounded">
                          {appointment.vehicleVin}
                        </span>
                      </div>
                    </div>
                  </article>

                  {/* Customer & Service Request */}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <article className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-5">
                      <div className="mb-3 flex items-center gap-2 text-primary font-bold">
                        <span className="material-symbols-outlined text-xl">
                          account_circle
                        </span>
                        <h2>Thông tin khách hàng</h2>
                      </div>
                      <p className="font-bold text-base">
                        {appointment.customerName}
                      </p>
                    </article>

                    <article className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-5">
                      <div className="mb-3 flex items-center gap-2 text-primary font-bold">
                        <span className="material-symbols-outlined text-xl">
                          build
                        </span>
                        <h2>Yêu cầu dịch vụ</h2>
                      </div>
                      <p className="font-semibold text-body-sm">
                        {appointment.serviceName}
                      </p>
                      {appointment.notes && (
                        <p className="mt-2 text-xs text-on-surface-variant">
                          Ghi chú khách hàng: {appointment.notes}
                        </p>
                      )}
                    </article>
                  </div>
                </div>

                {/* Right Column (Report & Updates Panel) */}
                <aside className="space-y-6">
                  <article className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-5 space-y-4">
                    <div className="flex items-center gap-2 text-primary font-bold border-b border-outline-variant pb-3">
                      <span className="material-symbols-outlined text-xl">
                        edit_note
                      </span>
                      <h2>Báo cáo & Cập nhật</h2>
                    </div>

                    {/* Status Select */}
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-on-surface-variant">
                        Trạng thái công việc
                      </label>
                      <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        className="w-full rounded-lg border border-outline-variant bg-surface-container-low px-3 py-2 text-body-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                      >
                        {ENGINEER_STATUS_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Notes Textarea */}
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-on-surface-variant">
                        Ghi chú chung *
                      </label>
                      <textarea
                        rows={3}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Nhập ghi chú về lịch hẹn..."
                        className="w-full rounded-lg border border-outline-variant bg-surface-container-low px-3 py-2 text-body-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-semibold text-on-surface-variant">
                        Ghi chú kỹ thuật
                      </label>
                      <textarea
                        rows={3}
                        value={engineerNotes}
                        onChange={(e) => setEngineerNotes(e.target.value)}
                        placeholder="Chẩn đoán, tình trạng xe, hướng xử lý..."
                        className="w-full rounded-lg border border-outline-variant bg-surface-container-low px-3 py-2 text-body-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-semibold text-on-surface-variant">
                        Vật tư/linh kiện đã dùng
                      </label>
                      <textarea
                        rows={2}
                        value={partsUsed}
                        onChange={(e) => setPartsUsed(e.target.value)}
                        placeholder="Ví dụ: má phanh trước, dầu động cơ 4L..."
                        className="w-full rounded-lg border border-outline-variant bg-surface-container-low px-3 py-2 text-body-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                      />
                    </div>

                    {/* Buttons */}
                    <div className="space-y-2 pt-2">
                      <button
                        type="button"
                        onClick={saveReport}
                        disabled={isSaving}
                        className="w-full rounded-lg bg-primary py-2.5 font-label-md text-label-md text-on-primary transition hover:opacity-90 active:scale-[0.98] disabled:opacity-60"
                      >
                        {isSaving ? "Đang lưu..." : "Cập nhật & Lưu thông tin"}
                      </button>
                      <button
                        type="button"
                        onClick={completeJob}
                        disabled={isSaving || status === "completed"}
                        className={`w-full rounded-lg border py-2.5 font-label-md text-label-md transition ${
                          status === "completed"
                            ? "border-outline-variant bg-surface-container-high text-outline cursor-not-allowed"
                            : "border-tertiary bg-tertiary-container/10 text-tertiary hover:bg-tertiary/20 active:scale-[0.98]"
                        }`}
                      >
                        {status === "completed"
                          ? "Đã hoàn thành"
                          : "Xác nhận hoàn thành công việc"}
                      </button>
                    </div>
                  </article>
                </aside>
              </div>
            </>
          )}
        </div>
      </main>

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

import StaffShell from "../../components/StaffShell";
import { useEffect, useRef, useState } from "react";
import { useDialogA11y } from "../../hooks/useDialogA11y";
import {
  getAllServices,
  getEngineerAppointmentDetail,
  getEngineerAppointmentSteps,
  startEngineerAppointment,
  completeEngineerAppointment,
  updateEngineerAppointmentStep,
  type AppointmentDto,
  type AppointmentStep,
  type MaintenanceService,
} from "../../services/api";
import AppointmentChat from "../../components/AppointmentChat";
import { CostBreakdown, ExtrasList } from "../../components/AppointmentExtras";
import EngineerExtrasForm from "../../components/EngineerExtrasForm";
import EngineerPartsPanel from "../../components/EngineerPartsPanel";
import { MAX_ODOMETER_KM } from "../../utils/maintenance";
import { isTerminalStatus, statusBadgeClass, statusLabel } from "./engineerStatus";

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
  const [steps, setSteps] = useState<AppointmentStep[]>([]);
  const [services, setServices] = useState<MaintenanceService[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [engineerNotes, setEngineerNotes] = useState("");
  const [partsUsed, setPartsUsed] = useState("");
  const [odometerAtService, setOdometerAtService] = useState("");
  const [startDialogOpen, setStartDialogOpen] = useState(false);
  const [odometerBeforeInput, setOdometerBeforeInput] = useState("");
  const [startError, setStartError] = useState<string | null>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [togglingStepId, setTogglingStepId] = useState<number | null>(null);
  const [notice, setNotice] = useState("");

  const showNotice = (msg: string) => {
    setNotice(msg);
    window.setTimeout(() => setNotice(""), 3000);
  };

  const loadAll = () => {
    if (!appointmentId) {
      setIsLoading(false);
      setLoadError("Không xác định được lịch hẹn cần xem.");
      return;
    }
    setIsLoading(true);
    setLoadError(null);
    Promise.all([
      getEngineerAppointmentDetail(appointmentId),
      getEngineerAppointmentSteps(appointmentId),
      getAllServices().catch(() => [] as MaintenanceService[]),
    ])
      .then(([appt, stepList, serviceList]) => {
        setAppointment(appt);
        setSteps(stepList);
        setServices(serviceList);
      })
      .catch((err) => {
        setLoadError(
          err instanceof Error ? err.message : "Không tải được chi tiết công việc.",
        );
      })
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appointmentId]);

  // Bấm "Bắt đầu xử lý" mở hộp thoại nhập km trước khi sửa (điền sẵn km đang lưu của xe).
  const openStartDialog = () => {
    setOdometerBeforeInput(appointment?.vehicleOdometer != null ? String(appointment.vehicleOdometer) : "");
    setStartError(null);
    setStartDialogOpen(true);
  };

  const startProcessing = () => {
    if (!appointmentId) return;
    const text = odometerBeforeInput.trim();
    if (text === "") {
      setStartError("Vui lòng nhập số km của xe trước khi bắt đầu xử lý.");
      return;
    }
    const odometer = Number(text);
    if (!Number.isInteger(odometer) || odometer < 0 || odometer > MAX_ODOMETER_KM) {
      setStartError(`Số km phải là số nguyên từ 0 đến ${MAX_ODOMETER_KM.toLocaleString("vi-VN")}.`);
      return;
    }
    setStartError(null);
    setIsSaving(true);
    startEngineerAppointment(appointmentId, { odometerBefore: odometer })
      .then((updated) => {
        setAppointment(updated);
        setStartDialogOpen(false);
        showNotice("Đã bắt đầu xử lý công việc.");
      })
      .catch((err) => {
        setStartError(err instanceof Error ? err.message : "Không thể bắt đầu xử lý.");
      })
      .finally(() => setIsSaving(false));
  };

  const toggleStep = (step: AppointmentStep) => {
    if (!appointmentId) return;
    setTogglingStepId(step.id);
    updateEngineerAppointmentStep(appointmentId, step.id, !step.isCompleted)
      .then((updatedStep) => {
        setSteps((prev) =>
          prev.map((s) => (s.id === updatedStep.id ? updatedStep : s)),
        );
      })
      .catch((err) => {
        showNotice(
          err instanceof Error ? err.message : "Không thể cập nhật bước này.",
        );
      })
      .finally(() => setTogglingStepId(null));
  };

  const completeJob = () => {
    if (!appointmentId) return;
    const odometerText = odometerAtService.trim();
    if (odometerText === "") {
      showNotice("Vui lòng nhập số km sau khi sửa trước khi hoàn thành.");
      return;
    }
    const odometer = Number(odometerText);
    if (!Number.isInteger(odometer) || odometer < 0 || odometer > MAX_ODOMETER_KM) {
      showNotice(`Số km phải là số nguyên từ 0 đến ${MAX_ODOMETER_KM.toLocaleString("vi-VN")}.`);
      return;
    }
    if (odometerBefore !== null && odometer < odometerBefore) {
      showNotice(odometerAfterError ?? "Số km sau khi sửa không được nhỏ hơn số km trước khi sửa.");
      return;
    }
    setIsSaving(true);
    completeEngineerAppointment(appointmentId, {
      engineerNotes,
      partsUsed,
      odometerAtService: odometer,
    })
      .then((updated) => {
        setAppointment(updated);
        showNotice(`Đã hoàn thành công việc #${updated.id}!`);
      })
      .catch((err) => {
        showNotice(
          err instanceof Error ? err.message : "Không thể hoàn thành công việc này.",
        );
      })
      .finally(() => setIsSaving(false));
  };

  const refreshAppointment = () => {
    if (!appointmentId) return;
    getEngineerAppointmentDetail(appointmentId)
      .then(setAppointment)
      .catch((err) => {
        showNotice(err instanceof Error ? err.message : "Không làm mới được công việc.");
      });
  };

  const status = appointment?.status.toLowerCase() ?? "";
  const allStepsCompleted = steps.length > 0 && steps.every((s) => s.isCompleted);
  const hasPendingExtras = (appointment?.extras ?? []).some((extra) => extra.status === "proposed");
  // Km ghi nhận lúc bắt đầu xử lý; km sau khi sửa không được nhỏ hơn số này.
  const odometerBefore = appointment?.odometerBefore ?? null;
  const odometerAfterValue = odometerAtService.trim() === "" ? null : Number(odometerAtService);
  const odometerAfterError =
    odometerBefore !== null && odometerAfterValue !== null && odometerAfterValue < odometerBefore
      ? `Số km sau khi sửa (${odometerAfterValue.toLocaleString("vi-VN")}) không được nhỏ hơn số km trước khi sửa (${odometerBefore.toLocaleString("vi-VN")}).`
      : null;
  const canComplete = allStepsCompleted && !hasPendingExtras && !odometerAfterError;

  return (
    <div className="min-h-[100dvh] bg-background font-sans text-on-surface">
      {/* Sidebar Navigation */}
      <StaffShell
        role="engineer"
        active="appointments"
        handlers={{ dashboard: onDashboardClick, schedule: onScheduleClick, appointments: onAppointmentsClick, technicians: onTechniciansClick, customers: onCustomersClick, settings: onSettingsClick }}
        userName={"Kỹ thuật viên"}
        onLogout={onLogout}
      >

        {/* Page Content */}
        <div className="mx-auto max-w-[1440px] p-6 md:p-8">
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
            <p className="mt-6 text-sm text-on-surface-variant">
              Đang tải chi tiết công việc...
            </p>
          )}

          {!isLoading && loadError && (
            <p className="mt-6 text-sm text-error">{loadError}</p>
          )}

          {!isLoading && appointment && (
            <>
              {/* Title Banner */}
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-b border-outline-variant pb-5">
                <div>
                  <h1 className="text-3xl font-extrabold tracking-tight">
                    Chi tiết công việc{" "}
                    <span className="text-primary">#{appointment.id}</span>
                  </h1>
                  <p className="mt-1 text-sm text-on-surface-variant">
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
                  <article className="rounded-3xl border border-outline-variant/40 bg-surface-container-lowest p-[22px] shadow-[0_10px_26px_-14px_rgba(25,28,29,0.28)]">
                    <div className="mb-4 flex items-center gap-2 font-extrabold">
                      <span className="material-symbols-outlined text-xl text-primary">
                        directions_car
                      </span>
                      <h2 className="text-lg">Thông tin phương tiện</h2>
                    </div>
                    <div className="space-y-2 text-sm">
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
                    {(appointment.odometerBefore != null || appointment.odometerAtService != null) && (
                      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 rounded-2xl bg-primary-fixed/60 px-3.5 py-2.5 text-[13px] text-on-primary-fixed-variant">
                        <span aria-hidden="true" className="material-symbols-outlined text-xl">
                          speed
                        </span>
                        {appointment.odometerBefore != null && (
                          <span>
                            Km trước khi sửa: <b>{appointment.odometerBefore.toLocaleString("vi-VN")} km</b>
                          </span>
                        )}
                        {appointment.odometerAtService != null && (
                          <span>
                            Km sau khi sửa: <b>{appointment.odometerAtService.toLocaleString("vi-VN")} km</b>
                          </span>
                        )}
                      </div>
                    )}
                  </article>

                  {/* Customer & Service Request */}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <article className="rounded-3xl border border-outline-variant/40 bg-surface-container-lowest p-[22px] shadow-[0_10px_26px_-14px_rgba(25,28,29,0.28)]">
                      <div className="mb-3 flex items-center gap-2 font-extrabold">
                        <span className="material-symbols-outlined text-xl text-primary">
                          account_circle
                        </span>
                        <h2 className="text-lg">Thông tin khách hàng</h2>
                      </div>
                      <p className="font-bold text-base">
                        {appointment.customerName}
                      </p>
                      {appointment.customerPhone && (
                        <a
                          href={`tel:${appointment.customerPhone}`}
                          className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                        >
                          <span className="material-symbols-outlined text-[18px]">call</span>
                          Gọi khách: {appointment.customerPhone}
                        </a>
                      )}
                    </article>

                    <article className="rounded-3xl border border-outline-variant/40 bg-surface-container-lowest p-[22px] shadow-[0_10px_26px_-14px_rgba(25,28,29,0.28)]">
                      <div className="mb-3 flex items-center gap-2 font-extrabold">
                        <span className="material-symbols-outlined text-xl text-primary">
                          build
                        </span>
                        <h2 className="text-lg">Yêu cầu dịch vụ</h2>
                      </div>
                      <p className="font-semibold text-sm">
                        {appointment.serviceName}
                      </p>
                      {appointment.notes && (
                        <p className="mt-2 text-xs text-on-surface-variant">
                          Ghi chú khách hàng: {appointment.notes}
                        </p>
                      )}
                    </article>
                  </div>

                  {/* Step Checklist — chỉ hiện khi đang xử lý hoặc đã xong */}
                  {steps.length > 0 &&
                    (status === "in_progress" ||
                      status === "completed" ||
                      status === "successful") && (
                      <article className="rounded-3xl border border-outline-variant/40 bg-surface-container-lowest p-[22px] shadow-[0_10px_26px_-14px_rgba(25,28,29,0.28)]">
                        <div className="mb-4 flex items-center gap-2 font-extrabold">
                          <span className="material-symbols-outlined text-xl text-primary">
                            checklist
                          </span>
                          <h2 className="text-lg">
                            Các bước bảo dưỡng ({steps.filter((s) => s.isCompleted).length}/
                            {steps.length})
                          </h2>
                        </div>
                        <ul className="space-y-2">
                          {steps.map((step) => (
                            <li key={step.id}>
                              <label
                                className={`flex items-center gap-3 rounded-2xl border border-outline-variant/60 p-3.5 text-sm ${
                                  status === "in_progress"
                                    ? "cursor-pointer hover:bg-surface-container-low"
                                    : "opacity-70"
                                }`}
                              >
                                <input aria-label={step.stepName}
                                  type="checkbox"
                                  checked={step.isCompleted}
                                  disabled={
                                    status !== "in_progress" ||
                                    togglingStepId === step.id
                                  }
                                  onChange={() => toggleStep(step)}
                                  className="h-4 w-4 rounded accent-primary"
                                />
                                <span
                                  className={
                                    step.isCompleted
                                      ? "line-through text-on-surface-variant"
                                      : ""
                                  }
                                >
                                  {step.stepName}
                                </span>
                              </label>
                            </li>
                          ))}
                        </ul>
                      </article>
                    )}

                  {/* Hạng mục phát sinh — KTV đề xuất, khách duyệt */}
                  {(status === "in_progress" || (appointment.extras ?? []).length > 0) && (
                    <article className="rounded-3xl border border-outline-variant/40 bg-surface-container-lowest p-[22px] shadow-[0_10px_26px_-14px_rgba(25,28,29,0.28)]">
                      <div className="mb-4 flex items-center gap-2 font-extrabold">
                        <span className="material-symbols-outlined text-xl text-primary">add_task</span>
                        <h2 className="text-lg">Hạng mục phát sinh</h2>
                      </div>
                      <ExtrasList extras={appointment.extras ?? []} />
                      {status === "in_progress" && (
                        <div className={(appointment.extras ?? []).length > 0 ? "mt-4" : ""}>
                          <EngineerExtrasForm
                            appointmentId={appointment.id}
                            services={services}
                            onProposed={() => {
                              showNotice("Đã gửi đề xuất, đang chờ khách duyệt.");
                              refreshAppointment();
                            }}
                          />
                        </div>
                      )}
                    </article>
                  )}

                  {/* Phụ tùng lấy từ kho garage */}
                  {(status === "in_progress" || (appointment.parts ?? []).length > 0) && (
                    <article className="rounded-3xl border border-outline-variant/40 bg-surface-container-lowest p-[22px] shadow-[0_10px_26px_-14px_rgba(25,28,29,0.28)]">
                      <div className="mb-4 flex items-center gap-2 font-extrabold">
                        <span className="material-symbols-outlined text-xl text-primary">inventory_2</span>
                        <h2 className="text-lg">Phụ tùng từ kho</h2>
                      </div>
                      <EngineerPartsPanel
                        appointmentId={appointment.id}
                        parts={appointment.parts ?? []}
                        editable={status === "in_progress"}
                        onChanged={refreshAppointment}
                      />
                    </article>
                  )}

                  <article className="rounded-3xl border border-outline-variant/40 bg-surface-container-lowest p-[22px] shadow-[0_10px_26px_-14px_rgba(25,28,29,0.28)]">
                    <div className="mb-4 flex items-center gap-2 font-extrabold">
                      <span className="material-symbols-outlined text-xl text-primary">receipt_long</span>
                      <h2 className="text-lg">Chi phí dự kiến</h2>
                    </div>
                    <CostBreakdown appointment={appointment} />
                  </article>

                  <AppointmentChat
                    key={appointment.id}
                    appointmentId={appointment.id}
                    closed={isTerminalStatus(status)}
                    callPhone={appointment.customerPhone}
                    callLabel="Gọi khách"
                  />
                </div>

                {/* Right Column (Report & Updates Panel) */}
                <aside className="space-y-6">
                  <article className="rounded-3xl border border-outline-variant/40 bg-surface-container-lowest p-[22px] shadow-[0_10px_26px_-14px_rgba(25,28,29,0.28)] space-y-4">
                    <div className="flex items-center gap-2 border-b border-outline-variant/40 pb-3 font-extrabold">
                      <span className="material-symbols-outlined text-xl text-primary">
                        edit_note
                      </span>
                      <h2 className="text-lg">Báo cáo & Cập nhật</h2>
                    </div>

                    {status === "confirmed" && (
                      <>
                        <p className="text-sm text-on-surface-variant">
                          Lịch hẹn đã được tiếp nhận. Bấm bắt đầu để chuyển sang
                          xử lý và mở checklist các bước bảo dưỡng.
                        </p>
                        <button
                          type="button"
                          onClick={openStartDialog}
                          disabled={isSaving}
                          className="w-full min-h-12 rounded-2xl bg-gradient-to-br from-primary to-primary-container shadow-[0_12px_22px_-14px_rgba(0,89,187,0.9)] text-sm font-bold text-on-primary transition hover:opacity-90 active:scale-[0.98] disabled:opacity-60"
                        >
                          {isSaving ? "Đang xử lý..." : "Bắt đầu xử lý"}
                        </button>
                      </>
                    )}

                    {status === "in_progress" && (
                      <>
                        <div>
                          <label htmlFor="pages-engineer-engineerjobdetailpage-field-1" className="mb-1 block text-xs font-semibold text-on-surface-variant">
                            Ghi chú kỹ thuật
                          </label>
                          <textarea id="pages-engineer-engineerjobdetailpage-field-1"
                            rows={3}
                            value={engineerNotes}
                            onChange={(e) => setEngineerNotes(e.target.value)}
                            placeholder="Chẩn đoán, tình trạng xe, hướng xử lý..."
                            className="w-full rounded-[14px] border border-outline-variant bg-surface-container-lowest px-3.5 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                          />
                        </div>

                        <div>
                          <label htmlFor="pages-engineer-engineerjobdetailpage-field-2" className="mb-1 block text-xs font-semibold text-on-surface-variant">
                            Vật tư/linh kiện đã dùng
                          </label>
                          <textarea id="pages-engineer-engineerjobdetailpage-field-2"
                            rows={2}
                            value={partsUsed}
                            onChange={(e) => setPartsUsed(e.target.value)}
                            placeholder="Ví dụ: má phanh trước, dầu động cơ 4L..."
                            className="w-full rounded-[14px] border border-outline-variant bg-surface-container-lowest px-3.5 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                          />
                        </div>

                        <div>
                          <label htmlFor="pages-engineer-engineerjobdetailpage-field-3" className="mb-1 block text-xs font-semibold text-on-surface-variant">
                            Số km sau khi sửa <span className="text-error" aria-hidden="true">*</span>
                          </label>
                          <input id="pages-engineer-engineerjobdetailpage-field-3"
                            type="number"
                            required
                            min={odometerBefore ?? 0}
                            max={MAX_ODOMETER_KM}
                            value={odometerAtService}
                            onChange={(e) => setOdometerAtService(e.target.value)}
                            aria-invalid={Boolean(odometerAfterError)}
                            aria-describedby="odometer-after-hint"
                            placeholder="Ví dụ: 41250 — dùng để tính hạn bảo dưỡng tiếp theo"
                            className={`w-full rounded-[14px] border bg-surface-container-lowest px-3.5 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 ${
                              odometerAfterError ? "border-2 border-error" : "border-outline-variant"
                            }`}
                          />
                          {odometerAfterError ? (
                            <p id="odometer-after-hint" role="alert" className="mt-1 text-xs text-error">
                              {odometerAfterError}
                            </p>
                          ) : (
                            <p id="odometer-after-hint" className="mt-1 text-xs text-on-surface-variant">
                              {odometerBefore !== null
                                ? `Phải từ ${odometerBefore.toLocaleString("vi-VN")} km trở lên. Dùng để cập nhật km của xe và tính hạn bảo dưỡng tiếp theo.`
                                : "Dùng để cập nhật km của xe và tính hạn bảo dưỡng tiếp theo."}
                            </p>
                          )}
                        </div>

                        {!allStepsCompleted && (
                          <p className="text-xs text-on-surface-variant">
                            Cần tích đủ tất cả các bước bảo dưỡng bên trái trước
                            khi có thể hoàn thành công việc.
                          </p>
                        )}

                        {hasPendingExtras && (
                          <p className="text-xs text-error">
                            Còn hạng mục phát sinh đang chờ khách duyệt. Hoàn thành
                            được sau khi khách đồng ý hoặc từ chối.
                          </p>
                        )}

                        <button
                          type="button"
                          onClick={completeJob}
                          disabled={isSaving || !canComplete}
                          className={`min-h-12 w-full rounded-2xl border-[1.5px] text-sm font-bold transition ${
                            canComplete
                              ? "border-[#008730] bg-[#d9f7dd] text-[#00531a] hover:bg-[#c7f0cd] active:scale-[0.98]"
                              : "border-outline-variant bg-surface-container-high text-outline cursor-not-allowed"
                          }`}
                        >
                          {isSaving ? "Đang lưu..." : "Xác nhận hoàn thành công việc"}
                        </button>
                      </>
                    )}

                    {(status === "completed" || status === "successful") && (
                      <p className="text-sm text-tertiary">
                        Công việc đã hoàn thành, không thể chỉnh sửa thêm.
                      </p>
                    )}

                    {(status === "cancelled" || status === "no_show") && (
                      <p className="text-sm text-error">
                        Lịch hẹn đã bị hủy hoặc khách không đến.
                      </p>
                    )}

                    {status === "pending" && (
                      <p className="text-sm text-on-surface-variant">
                        Lịch hẹn đang chờ lễ tân xác nhận.
                      </p>
                    )}
                  </article>
                </aside>
              </div>
            </>
          )}
        </div>
      </StaffShell>

      {startDialogOpen && appointment && (
        <StartDialog
          appointment={appointment}
          value={odometerBeforeInput}
          error={startError}
          busy={isSaving}
          onChange={setOdometerBeforeInput}
          onCancel={() => setStartDialogOpen(false)}
          onConfirm={startProcessing}
        />
      )}

      {/* Notice Toast */}
      {notice && (
        <div
          className="fixed bottom-5 right-5 z-50 rounded-2xl bg-inverse-surface px-4 py-3 text-sm text-inverse-on-surface shadow-[0_18px_40px_-16px_rgba(25,28,29,0.5)]"
          role="status"
        >
          {notice}
        </div>
      )}
    </div>
  );
}

// Hộp thoại nhập km trước khi sửa lúc bắt đầu xử lý. Gắn vào DOM chỉ khi đang mở.
function StartDialog({
  appointment,
  value,
  error,
  busy,
  onChange,
  onCancel,
  onConfirm,
}: {
  appointment: AppointmentDto;
  value: string;
  error: string | null;
  busy: boolean;
  onChange: (value: string) => void;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);
  useDialogA11y(true, dialogRef, onCancel);

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-4">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="start-dialog-title"
        className="max-h-[92dvh] w-full max-w-[35rem] overflow-y-auto rounded-3xl bg-surface-container-lowest p-6 shadow-[0_30px_70px_-20px_rgba(0,0,0,0.55)] sm:p-7"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id="start-dialog-title" className="text-xl font-extrabold tracking-tight">
              Bắt đầu xử lý
            </h2>
            <p className="mt-1 text-[13px] text-on-surface-variant">
              Phiếu việc #{appointment.id} · {appointment.vehicleModel} · {appointment.serviceName}
            </p>
          </div>
          <button
            type="button"
            aria-label="Đóng"
            onClick={onCancel}
            className="flex h-9 w-9 items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container-low"
          >
            <span aria-hidden="true" className="material-symbols-outlined">
              close
            </span>
          </button>
        </div>

        <p className="mt-4 flex flex-wrap items-center gap-3 rounded-2xl bg-surface-container-low px-3.5 py-3 text-[13px]">
          {appointment.vehicleLicensePlate && (
            <span className="rounded-md border border-outline-variant bg-surface-container-lowest px-1.5 py-px text-xs font-bold">
              {appointment.vehicleLicensePlate}
            </span>
          )}
          <span>
            {appointment.vehicleOdometer != null ? (
              <>
                Km đang lưu của xe: <b>{appointment.vehicleOdometer.toLocaleString("vi-VN")} km</b>
              </>
            ) : (
              "Xe chưa có km được lưu"
            )}
          </span>
        </p>

        <div className="mt-4 space-y-1.5">
          <label htmlFor="odometer-before" className="block text-[13px] font-bold">
            Số km trước khi sửa <span aria-hidden="true" className="text-error">*</span>
          </label>
          <div
            className={`flex min-h-[52px] items-center justify-between rounded-[14px] border bg-surface-container-lowest px-4 ${
              error ? "border-2 border-error" : "border-outline-variant"
            }`}
          >
            <input
              id="odometer-before"
              type="number"
              min={0}
              max={MAX_ODOMETER_KM}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder="Ví dụ: 40250"
              aria-invalid={Boolean(error)}
              aria-describedby="odometer-before-hint"
              className="w-3/4 bg-transparent text-xl font-bold outline-none"
            />
            <span className="text-sm font-semibold text-on-surface-variant">km</span>
          </div>
          {error ? (
            <p id="odometer-before-hint" role="alert" className="flex items-center gap-1 text-xs text-error">
              <span aria-hidden="true" className="material-symbols-outlined text-base">
                error
              </span>
              {error}
            </p>
          ) : (
            <p id="odometer-before-hint" className="text-xs leading-snug text-on-surface-variant">
              Xem đồng hồ công-tơ-mét của xe rồi nhập số thực tế. Sau khi sửa xong bạn sẽ nhập số km mới.
            </p>
          )}
        </div>

        <div className="mt-5 flex justify-end gap-2.5">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="min-h-11 rounded-xl border-[1.5px] border-outline-variant bg-surface-container-lowest px-5 text-sm font-bold hover:bg-surface-container-low disabled:opacity-60"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className="flex min-h-11 items-center gap-1.5 rounded-xl bg-primary px-5 text-sm font-bold text-on-primary disabled:opacity-60"
          >
            <span aria-hidden="true" className="material-symbols-outlined text-xl">
              play_arrow
            </span>
            {busy ? "Đang xử lý..." : "Bắt đầu xử lý"}
          </button>
        </div>
      </div>
    </div>
  );
}

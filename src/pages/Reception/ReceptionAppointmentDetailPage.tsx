import StaffShell from "../../components/StaffShell";
import { useEffect, useState } from "react";
import AppointmentChat from "../../components/AppointmentChat";
import { CostBreakdown, ExtrasList } from "../../components/AppointmentExtras";
import NoShowDialog from "../../components/NoShowDialog";
import {
  decideExtraAsReception,
  getReceptionAppointment,
  markInvoicePaidCash,
  updateReceptionAppointmentStatus,
  type AppointmentDto,
  type AppointmentExtra,
} from "../../services/api";
import OdometerSummary from "../../components/OdometerSummary";
import { isSlotUpcoming } from "../../utils/schedule";
import { mapStatus, STATUS_MAP, type Appt } from "./ReceptionAppointmentsPage";

const FINAL_STATUSES: Appt["status"][] = ["done", "handed_over", "canceled", "no_show"];

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
  const [appt, setAppt] = useState<AppointmentDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [status, setStatus] = useState<Appt["status"]>("pending");
  const [notice, setNotice] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [showNoShow, setShowNoShow] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setLoadError(null);

    getReceptionAppointment(appointmentId)
      .then((data) => {
        if (cancelled) return;
        setAppt(data);
        setStatus(mapStatus(data.status));
      })
      .catch((err) => {
        if (cancelled) return;
        setLoadError(
          err instanceof Error ? err.message : "Không tải được lịch hẹn.",
        );
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [appointmentId]);

  const showNotice = (msg: string) => {
    setNotice(msg);
    window.setTimeout(() => setNotice(""), 3000);
  };

  const [busyExtraId, setBusyExtraId] = useState<number | null>(null);
  const [isCollecting, setIsCollecting] = useState(false);

  const decideExtra = async (extra: AppointmentExtra, approve: boolean) => {
    if (busyExtraId !== null) return;
    setBusyExtraId(extra.id);
    try {
      await decideExtraAsReception(appointmentId, extra.id, approve);
      const fresh = await getReceptionAppointment(appointmentId);
      setAppt(fresh);
      setStatus(mapStatus(fresh.status));
      showNotice(approve ? "Đã đồng ý hạng mục thay khách." : "Đã từ chối hạng mục thay khách.");
    } catch (err) {
      showNotice(err instanceof Error ? err.message : "Không xử lý được hạng mục phát sinh.");
    } finally {
      setBusyExtraId(null);
    }
  };

  const collectCash = async () => {
    if (isCollecting) return;
    setIsCollecting(true);
    try {
      const updated = await markInvoicePaidCash(appointmentId);
      setAppt(updated);
      showNotice("Đã ghi nhận thu tiền mặt.");
    } catch (err) {
      showNotice(err instanceof Error ? err.message : "Không ghi nhận được thanh toán.");
    } finally {
      setIsCollecting(false);
    }
  };

  const updateStatus = async (
    next: "confirmed" | "cancelled" | "successful" | "no_show",
    successMsg: string,
  ) => {
    if (isUpdating) return;
    setIsUpdating(true);
    try {
      const updated = await updateReceptionAppointmentStatus(appointmentId, {
        status: next,
      });
      setAppt(updated);
      setStatus(mapStatus(updated.status));
      showNotice(successMsg);
      if (next === "cancelled") {
        window.setTimeout(() => onAppointmentsClick?.(), 800);
      }
    } catch (err) {
      showNotice(
        err instanceof Error ? err.message : "Cập nhật trạng thái không thành công.",
      );
    } finally {
      setIsUpdating(false);
      setShowNoShow(false);
    }
  };

  const onConfirm = () => {
    void updateStatus("confirmed", `Đã xác nhận lịch #${appointmentId}`);
  };

  const onCancel = () => {
    void updateStatus("cancelled", `Đã hủy lịch #${appointmentId} giúp khách`);
  };

  // Chỉ ghi nhận không đến khi lịch đang chờ/đã xác nhận và khung giờ đã bắt đầu (BE cũng kiểm tra).
  const canMarkNoShow =
    appt !== null &&
    (status === "pending" || status === "confirmed") &&
    !isSlotUpcoming(appt.scheduleDate, appt.timeFrame ?? "");

  const { label: statusLabel, cls: statusCls } = STATUS_MAP[status];
  const scheduleDate = appt
    ? new Date(appt.scheduleDate).toLocaleDateString("vi-VN")
    : "";

  return (
    <div className="min-h-[100dvh] bg-background font-sans text-on-surface">
      <StaffShell
        role="reception"
        active="appointments"
        handlers={{ dashboard: onDashboardClick, schedule: onScheduleClick, appointments: onAppointmentsClick, customers: onCustomersClick }}
        userName={"Nguyễn Lễ Tân"}
        userDetail={"Lễ tân"}
        onLogout={onLogout}
      >

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

          {isLoading && (
            <p className="text-sm text-on-surface-variant">Đang tải lịch hẹn...</p>
          )}

          {loadError && !isLoading && (
            <article className="rounded-3xl border border-outline-variant/40 bg-surface-container-lowest shadow-[0_10px_26px_-14px_rgba(25,28,29,0.28)]">
              <div className="p-8">
                <p className="text-error">{loadError}</p>
                <button
                  className="mt-4 inline-flex items-center gap-2 rounded-lg border border-outline-variant bg-surface-container-lowest px-4 py-2.5 text-sm font-medium hover:bg-surface-container-low transition-colors"
                  onClick={onAppointmentsClick}
                >
                  Quay lại
                </button>
              </div>
            </article>
          )}

          {!isLoading && !loadError && !appt ? (
            <article className="rounded-3xl border border-outline-variant/40 bg-surface-container-lowest shadow-[0_10px_26px_-14px_rgba(25,28,29,0.28)]">
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
            !isLoading && !loadError && appt && (
            <article className="rounded-3xl border border-outline-variant/40 bg-surface-container-lowest shadow-[0_10px_26px_-14px_rgba(25,28,29,0.28)]">
              <div className="p-6 md:p-8">
                <div className="flex flex-wrap items-start justify-between gap-4 border-b border-outline-variant pb-6">
                  <div>
                    <h1 className="text-2xl md:text-3xl font-bold">Chi tiết Lịch hẹn</h1>
                    <p className="text-sm text-on-surface-variant mt-1">
                      Booking ID: <span className="font-semibold text-on-surface">#{appt.id}</span>
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
                      <p className="text-lg font-semibold">{appt.customerName}</p>
                      {appt.customerPhone && (
                        <a
                          href={`tel:${appt.customerPhone}`}
                          className="text-sm inline-flex items-center gap-2 text-primary hover:underline"
                        >
                          <span className="material-symbols-outlined text-on-surface-variant">call</span>
                          Gọi khách: {appt.customerPhone}
                        </a>
                      )}
                      {appt.customerEmail && (
                        <p className="text-sm inline-flex items-center gap-2">
                          <span className="material-symbols-outlined text-on-surface-variant">mail</span>
                          {appt.customerEmail}
                        </p>
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-on-surface-variant flex items-center gap-2 mb-3">
                      <span className="material-symbols-outlined">directions_car</span>
                      Chi tiết đặt lịch
                    </p>
                    <div className="rounded-xl bg-surface-container p-5 space-y-3 text-sm">
                      <Row label="Xe" value={appt.vehicleModel} />
                      <Row label="Biển số" value={<span className="rounded bg-primary-container/10 text-primary px-2 py-0.5 font-semibold">{appt.vehicleLicensePlate || "—"}</span>} />
                      <Row label="Số khung (VIN)" value={<span className="font-mono text-xs">{appt.vehicleVin}</span>} />
                      <Row label="Dịch vụ" value={`${appt.serviceName} · ${appt.servicePrice.toLocaleString("vi-VN")}đ`} />
                      <Row label="Garage" value={appt.garageName} />
                      <Row label="Kỹ thuật viên" value={appt.engineerName || "Chưa phân công"} />
                      <Row label="Lịch hẹn" value={<div className="text-right"><div>{scheduleDate}</div><div className="text-primary font-medium">{appt.timeFrame}</div></div>} />
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  <p className="text-xs uppercase tracking-wide text-on-surface-variant mb-3">Ghi chú của khách hàng</p>
                  <div className="rounded-xl bg-surface-container p-5 text-sm italic text-on-surface-variant">
                    {appt.notes ? `"${appt.notes}"` : "Không có ghi chú."}
                  </div>
                </div>

                {(appt.odometerBefore != null || appt.odometerAtService != null) && (
                  <div className="mt-6">
                    <p className="text-xs uppercase tracking-wide text-on-surface-variant mb-3">Số km của xe</p>
                    <OdometerSummary before={appt.odometerBefore} after={appt.odometerAtService} />
                    {appt.vehicleOdometer != null && (
                      <p className="mt-2 text-xs text-on-surface-variant">
                        Km đang lưu của xe: {appt.vehicleOdometer.toLocaleString("vi-VN")} km
                      </p>
                    )}
                  </div>
                )}

                {(appt.engineerNotes || appt.partsUsed) && (
                  <div className="mt-6">
                    <p className="text-xs uppercase tracking-wide text-on-surface-variant mb-3">Ghi chú kỹ thuật viên</p>
                    <div className="rounded-xl bg-surface-container p-5 text-sm text-on-surface-variant space-y-2">
                      {appt.engineerNotes && <p>{appt.engineerNotes}</p>}
                      {appt.partsUsed && <p>Linh kiện: {appt.partsUsed}</p>}
                    </div>
                  </div>
                )}

                {(appt.extras ?? []).length > 0 && (
                  <div className="mt-6">
                    <p className="text-xs uppercase tracking-wide text-on-surface-variant mb-3">
                      Hạng mục phát sinh
                    </p>
                    <ExtrasList
                      extras={appt.extras ?? []}
                      busyId={busyExtraId}
                      onDecide={
                        appt.status.toLowerCase() === "in_progress"
                          ? (extra, approve) => void decideExtra(extra, approve)
                          : undefined
                      }
                    />
                    {appt.status.toLowerCase() === "in_progress" &&
                      (appt.extras ?? []).some((extra) => extra.status === "proposed") && (
                        <p className="mt-2 text-xs text-on-surface-variant">
                          Chỉ duyệt thay khách sau khi đã được khách đồng ý qua điện thoại.
                        </p>
                      )}
                  </div>
                )}

                <div className="mt-6">
                  <p className="text-xs uppercase tracking-wide text-on-surface-variant mb-3">Chi phí</p>
                  <div className="rounded-xl bg-surface-container p-5">
                    <CostBreakdown appointment={appt} />
                  </div>

                  {appt.status.toLowerCase() === "completed" && (
                    <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                      {appt.invoicePaymentStatus !== "paid" && (
                        <button
                          type="button"
                          onClick={() => void collectCash()}
                          disabled={isCollecting}
                          className="inline-flex items-center justify-center gap-2 rounded-lg border border-primary px-4 py-2.5 text-sm font-medium text-primary transition-colors hover:bg-primary-container/10 disabled:opacity-50"
                        >
                          <span className="material-symbols-outlined text-lg">payments</span>
                          {isCollecting ? "Đang ghi nhận..." : "Đã thu tiền mặt"}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => void updateStatus("successful", `Đã bàn giao xe cho lịch #${appointmentId}`)}
                        disabled={isUpdating || appt.invoicePaymentStatus !== "paid"}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-primary to-primary-container px-4 py-2.5 text-sm font-medium text-on-primary transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <span className="material-symbols-outlined text-lg">key</span>
                        Bàn giao xe
                      </button>
                      {appt.invoicePaymentStatus !== "paid" && (
                        <p className="self-center text-xs text-on-surface-variant">
                          Cần thanh toán xong mới bàn giao được xe.
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <div className="mt-6">
                  <AppointmentChat
                    key={appt.id}
                    appointmentId={appt.id}
                    closed={["cancelled", "no_show", "successful", "successed"].includes(appt.status.toLowerCase())}
                    callPhone={appt.customerPhone}
                    callLabel="Gọi khách"
                  />
                </div>

                <div className="mt-6 rounded-xl bg-surface-container p-4 flex flex-col md:flex-row md:items-center gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    <span className="material-symbols-outlined text-primary shrink-0 mt-0.5">info</span>
                    <p className="text-sm text-on-surface-variant">
                      {appt.paymentExpiresAt && appt.invoicePaymentStatus === "unpaid"
                        ? "Khách chưa thanh toán nên chưa thể xác nhận. Lịch tự huỷ nếu quá hạn thanh toán."
                        : "Xác nhận lịch khi khách đã đồng ý, hoặc hủy giúp khách nếu họ gọi báo bận."}
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 shrink-0">
                    <button
                      className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-primary to-primary-container px-4 py-2.5 text-sm font-medium text-on-primary hover:bg-primary/90 transition-colors active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={onConfirm}
                      disabled={
                        isUpdating ||
                        status !== "pending" ||
                        (Boolean(appt.paymentExpiresAt) && appt.invoicePaymentStatus === "unpaid")
                      }
                    >
                      <span className="material-symbols-outlined text-lg">check_circle</span>
                      {isUpdating ? "Đang cập nhật..." : "Xác nhận lịch hẹn"}
                    </button>
                    <button
                      className="inline-flex items-center gap-2 rounded-lg bg-error px-4 py-2.5 text-sm font-medium text-on-error hover:bg-error/90 transition-colors active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={onCancel}
                      disabled={isUpdating || FINAL_STATUSES.includes(status)}
                    >
                      <span className="material-symbols-outlined text-lg">cancel</span>
                      Hủy lịch giúp khách
                    </button>
                    {canMarkNoShow && (
                      <button
                        type="button"
                        className="inline-flex items-center gap-2 rounded-lg bg-[#fff1cc] px-4 py-2.5 text-sm font-medium text-[#6b4200] ring-1 ring-[#c47f00]/40 transition-colors hover:brightness-95 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={() => setShowNoShow(true)}
                        disabled={isUpdating}
                      >
                        <span className="material-symbols-outlined text-lg">person_off</span>
                        Khách không đến
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </article>
            )
          )}
        </div>
      </StaffShell>

      {showNoShow && appt && (
        <NoShowDialog
          appointment={appt}
          isBusy={isUpdating}
          onKeep={() => setShowNoShow(false)}
          onConfirm={() => void updateStatus("no_show", `Đã ghi nhận khách không đến cho lịch #${appointmentId}`)}
        />
      )}

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

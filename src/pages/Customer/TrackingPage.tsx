import { useEffect, useState } from "react";
import AppSidebar, { type AppSection } from "../../components/AppSidebar";
import AppointmentChat from "../../components/AppointmentChat";
import CancelBookingDialog from "../../components/CancelBookingDialog";
import { CostBreakdown, ExtrasList } from "../../components/AppointmentExtras";
import PaymentCountdown from "../../components/PaymentCountdown";
import { formatVnd } from "../../utils/format";
import {
  cancelAppointment,
  decideExtraAsCustomer,
  getActiveAppointments,
  getMyFleet,
  requestInvoicePayment,
  type AppointmentExtra,
  type AppointmentDto,
  type Vehicle,
} from "../../services/api";

type TrackingPageProps = {
  onHomeClick: () => void;
  onHistoryClick: () => void;
  onNotificationsClick: () => void;
  onProfileClick: () => void;
};

const vehicleImage =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuC4k_UBSnuCnHjpDC6k50szf5Z3Oo4yKM2t9kU0_R1EYLEmXpR0OSok5ddQjJKptTrZiaGqjLiqjmrK821UZXKaZU4DAlIFMyHtJNs5xifBwtqU8U8jFBH4JPInp-jTyem1LZ8dPLVQepnt_2x7W53JBaxfQTFx-eVXGWMHwTO3wz9Y1Nl6yI5T51yPVUirOsHzPJG680yTqdfQti0ppIrzpB_7xB-5dt6zBRSRQuha_nUdcNZn84d8nHFNkYWPlwQmzJ108PAm1mVj";

const STEP_ORDER = ["pending", "confirmed", "in_progress", "completed"];

const STEP_META: Record<string, { title: string; icon: string }> = {
  pending: { title: "Chờ xác nhận", icon: "hourglass_empty" },
  confirmed: { title: "Đã xác nhận", icon: "check" },
  in_progress: { title: "Đang sửa chữa", icon: "build" },
  completed: { title: "Hoàn thành", icon: "flag" },
};

const CANCELLABLE_STATUSES = ["pending", "confirmed"];

function statusTitle(rawStatus: string) {
  const status = rawStatus.toLowerCase();
  if (status === "cancelled") return "Đã huỷ lịch hẹn";
  if (status === "no_show") return "Khách không đến";
  return STEP_META[status]?.title ?? rawStatus;
}

function getSteps(rawStatus: string) {
  const currentStatus = rawStatus.toLowerCase();

  if (currentStatus === "cancelled" || currentStatus === "no_show") {
    return [
      {
        key: currentStatus,
        title: currentStatus === "no_show" ? "Khách không đến" : "Đã huỷ lịch hẹn",
        icon: "cancel",
        status: "active" as const,
      },
    ];
  }

  const currentIndex = STEP_ORDER.indexOf(currentStatus);

  return STEP_ORDER.map((key, index) => {
    let status: "done" | "active" | "pending" = "pending";
    if (currentIndex === -1) {
      status = "pending";
    } else if (index < currentIndex) {
      status = "done";
    } else if (index === currentIndex) {
      status = "active";
    }
    return { key, title: STEP_META[key].title, icon: STEP_META[key].icon, status };
  });
}

export default function TrackingPage({
  onHomeClick,
  onHistoryClick,
  onNotificationsClick,
  onProfileClick,
}: TrackingPageProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [appointments, setAppointments] = useState<AppointmentDto[]>([]);
  const [fleet, setFleet] = useState<Vehicle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelTarget, setCancelTarget] = useState<AppointmentDto | null>(null);
  const [cancelMessage, setCancelMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [busyExtraId, setBusyExtraId] = useState<number | null>(null);
  const [isPaying, setIsPaying] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    Promise.all([getActiveAppointments(), getMyFleet()])
      .then(([appointmentData, fleetData]) => {
        if (!cancelled) {
          setAppointments(appointmentData);
          setFleet(fleetData);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Không tải được lịch hẹn đang xử lý.",
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
    if (section === "history") onHistoryClick();
    if (section === "notifications") onNotificationsClick();
    if (section === "profile") onProfileClick();
  };

  const handleCancel = async (target: AppointmentDto) => {
    if (isCancelling) return;
    setIsCancelling(true);
    setCancelMessage(null);
    try {
      await cancelAppointment(target.id);
      setAppointments((current) => current.filter((item) => item.id !== target.id));
      setSelectedId(null);
      const paid = target.amountPaid ?? 0;
      setCancelMessage({
        type: "success",
        text:
          paid > 0
            ? `Đã huỷ lịch. ${formatVnd(paid)} đã được hoàn vào Ví Servio của bạn. Bạn có thể rút tại Cá nhân > Ví Servio.`
            : "Khách hàng đã huỷ lịch thành công.",
      });
    } catch (err) {
      setCancelMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Huỷ lịch không thành công. Vui lòng thử lại.",
      });
    } finally {
      setIsCancelling(false);
      setCancelTarget(null);
    }
  };

  const handleDecideExtra = async (target: AppointmentDto, extra: AppointmentExtra, approve: boolean) => {
    if (busyExtraId !== null) return;
    setBusyExtraId(extra.id);
    setActionError(null);
    try {
      await decideExtraAsCustomer(target.id, extra.id, approve);
      setAppointments(await getActiveAppointments());
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Không gửi được phản hồi. Vui lòng thử lại.");
    } finally {
      setBusyExtraId(null);
    }
  };

  const handlePay = async (target: AppointmentDto) => {
    if (!target.invoiceId || isPaying) return;
    setIsPaying(true);
    setActionError(null);
    try {
      const response = await requestInvoicePayment(target.invoiceId);
      window.location.href = response.paymentUrl;
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Không tạo được link thanh toán.");
      setIsPaying(false);
    }
  };

  const appointment = appointments.find((item) => item.id === selectedId) ?? appointments[0];
  const canCancel = appointment
    ? CANCELLABLE_STATUSES.includes(appointment.status.toLowerCase())
    : false;
  const steps = appointment ? getSteps(appointment.status) : [];
  const vehicle = appointment
    ? fleet.find((v) => v.id === appointment.vehicleId)
    : undefined;

  return (
    <div className="min-h-dvh bg-background font-sans text-on-surface">
      <AppSidebar
        active="tracking"
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onNavigate={handleNavigate}
      />

      <aside className="fixed left-0 top-0 z-[60] hidden h-full w-[240px] flex-col border-r border-outline-variant bg-white py-xl text-on-surface md:flex">
        <div className="mb-xl px-lg">
          <span className="font-headline-lg text-headline-lg font-bold text-primary">
            Servio
          </span>
        </div>
        <nav className="flex flex-1 flex-col gap-sm px-sm">
          <SidebarButton icon="home" label="Trang chủ" onClick={onHomeClick} />
          <SidebarButton icon="history" label="Lịch sử" onClick={onHistoryClick} />
          <button className="flex items-center gap-md rounded-lg bg-primary px-md py-sm text-white transition-colors">
            <span className="material-symbols-outlined">location_on</span>
            <span className="font-label-md text-label-md">Theo dõi</span>
          </button>
          <SidebarButton
            icon="notifications"
            label="Thông báo"
            onClick={onNotificationsClick}
          />
          <SidebarButton icon="person" label="Cá nhân" onClick={onProfileClick} />
        </nav>
      </aside>

      <header className="fixed top-0 z-50 flex h-16 w-full items-center justify-between border-b border-outline-variant bg-surface px-margin-mobile md:hidden">
        <div className="flex items-center gap-sm">
          <button
            className="-ml-2 rounded-full p-2 text-on-surface-variant"
            type="button"
            onClick={() => setIsSidebarOpen(true)}
            aria-label="Mở menu"
          >
            <span className="material-symbols-outlined">menu</span>
          </button>
          <span className="material-symbols-outlined text-primary">electric_car</span>
          <span className="font-headline-lg text-headline-lg font-bold text-primary">
            Servio
          </span>
        </div>
        <button aria-label="Thông báo"
          className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-surface-container"
          type="button"
          onClick={onNotificationsClick}
        >
          <span className="material-symbols-outlined">notifications</span>
        </button>
      </header>

      <main className="min-h-screen pb-24 pt-16 md:ml-[240px] md:pt-0">
        <div className="mx-auto max-w-[1200px] space-y-5 px-margin-mobile py-6 md:px-margin-desktop">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight">Theo dõi xe</h1>
              {appointment && (
                <p className="mt-1 text-[15px] text-on-surface-variant">
                  {appointment.vehicleModel} · Lịch hẹn #{appointment.id}
                </p>
              )}
            </div>
            {appointment && (
              <span className="inline-flex items-center gap-2 rounded-full bg-[#e6defa] px-3.5 py-1.5 text-sm font-bold text-[#3b2a7a]">
                <i aria-hidden="true" className="h-[7px] w-[7px] rounded-full bg-[#6a4fd1]" />
                {statusTitle(appointment.status)}
              </span>
            )}
          </div>

          {isLoading && (
            <div className="rounded-3xl border border-outline-variant/40 bg-surface-container-lowest p-8 text-center text-on-surface-variant">
              Đang tải lịch hẹn đang xử lý...
            </div>
          )}

          {!isLoading && error && (
            <div className="rounded-3xl border border-error/30 bg-error-container/10 p-8 text-center text-error">
              {error}
            </div>
          )}

          {cancelMessage && (
            <div
              role="status"
              className={`rounded-2xl border p-4 text-sm ${
                cancelMessage.type === "success"
                  ? "border-tertiary/30 bg-[#d9f7dd] text-[#00531a]"
                  : "border-error/30 bg-error-container/10 text-error"
              }`}
            >
              {cancelMessage.text}
            </div>
          )}

          {!isLoading && !error && !appointment && (
            <div className="flex flex-col items-center gap-3 rounded-3xl border border-outline-variant/40 bg-surface-container-lowest p-10 text-center">
              <span
                aria-hidden="true"
                className="flex h-[72px] w-[72px] items-center justify-center rounded-3xl bg-surface-container text-outline"
              >
                <span className="material-symbols-outlined text-4xl">location_off</span>
              </span>
              <p className="text-lg font-extrabold">Chưa có xe nào đang được xử lý</p>
              <p className="text-sm text-on-surface-variant">Khi bạn đặt lịch, tiến độ sửa chữa sẽ hiện ở đây.</p>
            </div>
          )}

          {!isLoading && !error && appointments.length > 1 && (
            <div role="group" aria-label="Chọn lịch hẹn" className="flex flex-wrap gap-2">
              {appointments.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  aria-pressed={item.id === appointment?.id}
                  onClick={() => setSelectedId(item.id)}
                  className={`min-h-9 rounded-full border px-3.5 text-[13px] font-semibold ${
                    item.id === appointment?.id
                      ? "border-primary bg-primary-fixed text-on-primary-fixed-variant"
                      : "border-outline-variant bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container-low"
                  }`}
                >
                  #{item.id} · {item.vehicleModel}
                </button>
              ))}
            </div>
          )}

          {!isLoading && !error && appointment && (
            <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-[1fr_26.25rem]">
              <div className="space-y-5">
                <section
                  aria-label="Thông tin xe"
                  className="flex flex-col overflow-hidden rounded-3xl border border-outline-variant/40 bg-surface-container-lowest shadow-[0_10px_26px_-14px_rgba(25,28,29,0.28)] sm:flex-row"
                >
                  <div className="h-44 sm:h-auto sm:w-56">
                    <img
                      className="h-full w-full object-cover"
                      src={vehicle?.imageUrl || vehicleImage}
                      alt={appointment.vehicleModel}
                    />
                  </div>
                  <div className="flex flex-1 flex-col gap-3 p-5">
                    <div>
                      <h2 className="text-xl font-extrabold text-on-primary-fixed-variant">{appointment.vehicleModel}</h2>
                      <p className="mt-1 inline-flex items-center gap-1.5 rounded-lg border border-outline-variant bg-surface-container px-3 py-1 font-mono text-sm font-bold tracking-wider">
                        {appointment.vehicleVin}
                      </p>
                    </div>
                    <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
                      <dt className="text-on-surface-variant">Kỹ thuật viên</dt>
                      <dd className="text-right font-semibold">{appointment.engineerName || "Chưa phân công"}</dd>
                      <dt className="text-on-surface-variant">Ngày hẹn</dt>
                      <dd className="text-right font-semibold">
                        {appointment.scheduleDate} - {appointment.timeFrame}
                      </dd>
                      <dt className="text-on-surface-variant">Garage</dt>
                      <dd className="text-right font-semibold">{appointment.garageName}</dd>
                    </dl>
                    {appointment.notes && (
                      <p className="rounded-xl bg-surface-container-low p-3 text-[13px] text-on-surface-variant">
                        {appointment.notes}
                      </p>
                    )}
                    {canCancel && (
                      <button
                        type="button"
                        onClick={() => setCancelTarget(appointment)}
                        disabled={isCancelling}
                        className="mt-auto flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border-[1.5px] border-error text-sm font-bold text-error transition-colors hover:bg-error-container/10 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <span aria-hidden="true" className="material-symbols-outlined text-[18px]">
                          cancel
                        </span>
                        {isCancelling ? "Đang huỷ..." : "Huỷ lịch hẹn"}
                      </button>
                    )}
                  </div>
                </section>

                <section
                  aria-labelledby="tracking-progress-title"
                  className="rounded-3xl border border-outline-variant/40 bg-surface-container-lowest p-[22px] shadow-[0_10px_26px_-14px_rgba(25,28,29,0.28)]"
                >
                  <h2 id="tracking-progress-title" className="mb-5 text-lg font-extrabold">
                    Tiến độ sửa chữa
                  </h2>
                  <ol>
                    {steps.map((step, index) => (
                      <TimelineStep key={step.key} step={step} isLast={index === steps.length - 1} />
                    ))}
                  </ol>
                </section>

                {(appointment.extras ?? []).length > 0 && (
                  <section className="rounded-3xl border border-outline-variant/40 bg-surface-container-lowest p-[22px] shadow-[0_10px_26px_-14px_rgba(25,28,29,0.28)]">
                    <h2 className="mb-1 flex items-center gap-2.5 text-lg font-extrabold">
                      <span aria-hidden="true" className="material-symbols-outlined text-primary">
                        add_task
                      </span>
                      Phát sinh cần bạn duyệt
                    </h2>
                    <p className="mb-4 text-sm text-on-surface-variant">
                      Kỹ thuật viên phát hiện thêm việc cần làm. Hạng mục chỉ được tính tiền khi bạn đồng ý.
                    </p>
                    <ExtrasList
                      extras={appointment.extras ?? []}
                      busyId={busyExtraId}
                      onDecide={
                        appointment.status.toLowerCase() === "in_progress"
                          ? (extra, approve) => void handleDecideExtra(appointment, extra, approve)
                          : undefined
                      }
                    />
                  </section>
                )}

                <section className="rounded-3xl border border-outline-variant/40 bg-surface-container-lowest p-[22px] shadow-[0_10px_26px_-14px_rgba(25,28,29,0.28)]">
                  <h2 className="mb-3 flex items-center gap-2.5 text-lg font-extrabold">
                    <span aria-hidden="true" className="material-symbols-outlined text-primary">
                      engineering
                    </span>
                    Ghi chú kỹ thuật viên
                  </h2>
                  <p className="text-sm text-on-surface-variant">
                    {appointment.engineerNotes || "Chưa có ghi chú mới từ kỹ thuật viên."}
                  </p>
                  {appointment.partsUsed && (
                    <p className="mt-3 text-sm text-on-surface-variant">
                      <span className="font-semibold text-on-surface">Phụ tùng sử dụng: </span>
                      {appointment.partsUsed}
                    </p>
                  )}
                </section>

                <section className="rounded-3xl border border-outline-variant/40 bg-surface-container-lowest p-[22px] shadow-[0_10px_26px_-14px_rgba(25,28,29,0.28)]">
                  <h2 className="mb-3 flex items-center gap-2.5 text-lg font-extrabold">
                    <span aria-hidden="true" className="material-symbols-outlined text-primary">
                      receipt_long
                    </span>
                    Chi phí dịch vụ
                  </h2>
                  <CostBreakdown appointment={appointment} />

                  {appointment.invoiceId && appointment.invoicePaymentStatus === "unpaid" && (
                    <div className="mt-5 space-y-2">
                      <PaymentCountdown
                        expiresAt={appointment.paymentExpiresAt}
                        onExpired={() => {
                          void getActiveAppointments().then(setAppointments);
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => void handlePay(appointment)}
                        disabled={isPaying}
                        className="min-h-12 w-full rounded-xl bg-gradient-to-br from-primary to-primary-container text-sm font-bold text-on-primary transition hover:opacity-90 disabled:opacity-50"
                      >
                        {isPaying
                          ? "Đang chuyển sang trang thanh toán..."
                          : `Thanh toán online${appointment.amountDue ? ` ${formatVnd(appointment.amountDue)}` : ""}`}
                      </button>
                      {!appointment.paymentExpiresAt && (
                        <p className="text-center text-xs text-on-surface-variant">
                          Hoặc thanh toán tiền mặt tại quầy lễ tân khi nhận xe.
                        </p>
                      )}
                    </div>
                  )}

                  {actionError && <p className="mt-3 text-sm text-error">{actionError}</p>}
                </section>
              </div>

              <div className="xl:sticky xl:top-6">
                <AppointmentChat
                  key={appointment.id}
                  appointmentId={appointment.id}
                  callPhone={appointment.garagePhone}
                  callLabel="Gọi garage"
                />
              </div>
            </div>
          )}
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
        <button className="flex flex-col items-center justify-center rounded-full bg-secondary-container px-4 py-1 text-on-secondary-container">
          <span className="material-symbols-outlined">location_searching</span>
          <span className="font-label-sm text-label-sm">Theo dõi</span>
        </button>
        <button
          className="flex flex-col items-center justify-center text-on-surface-variant"
          type="button"
          onClick={onHistoryClick}
        >
          <span className="material-symbols-outlined">history</span>
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

      {cancelTarget && (
        <CancelBookingDialog
          appointment={cancelTarget}
          isCancelling={isCancelling}
          onKeep={() => setCancelTarget(null)}
          onConfirm={() => void handleCancel(cancelTarget)}
        />
      )}
    </div>
  );
}

function SidebarButton({
  icon,
  label,
  onClick,
}: {
  icon: string;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      className="flex items-center gap-md rounded-lg px-md py-sm text-on-surface-variant transition-colors hover:bg-surface-container"
      type="button"
      onClick={onClick}
    >
      <span className="material-symbols-outlined">{icon}</span>
      <span className="font-label-md text-label-md">{label}</span>
    </button>
  );
}

type StepData = {
  key: string;
  title: string;
  icon: string;
  status: "done" | "active" | "pending";
};

function TimelineStep({ step, isLast }: { step: StepData; isLast: boolean }) {
  const isDone = step.status === "done";
  const isActive = step.status === "active";

  return (
    <li aria-current={isActive ? "step" : undefined} className="relative flex gap-3.5 pb-5 last:pb-0">
      {!isLast && (
        <span
          aria-hidden="true"
          className={`absolute left-[15px] top-8 bottom-0 w-[3px] ${isDone ? "bg-[#008730]" : "bg-surface-container-high"}`}
        />
      )}
      <span
        aria-hidden="true"
        className={`z-[1] flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
          isDone
            ? "bg-[#008730] text-white"
            : isActive
              ? "bg-primary text-on-primary ring-[5px] ring-primary/20"
              : "bg-surface-container-high text-outline"
        }`}
      >
        <span className="material-symbols-outlined text-[18px]">{isDone ? "check" : step.icon}</span>
      </span>
      <div>
        <p
          className={`font-bold ${isActive ? "text-on-primary-fixed-variant" : isDone ? "text-on-surface" : "text-outline"}`}
        >
          {step.title}
        </p>
        <p className="text-[13px] text-on-surface-variant">
          {isActive ? "Hiện tại" : isDone ? "Đã hoàn tất" : "Chưa tới"}
        </p>
      </div>
    </li>
  );
}

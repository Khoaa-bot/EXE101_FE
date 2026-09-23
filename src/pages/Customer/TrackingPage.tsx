import { useEffect, useState } from "react";
import AppSidebar, { type AppSection } from "../../components/AppSidebar";
import {
  getActiveAppointments,
  getMyFleet,
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

function formatCurrency(value: number | null | undefined) {
  if (value === null || value === undefined) return "—";
  return `${value.toLocaleString("vi-VN")}đ`;
}

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

  const appointment = appointments[0];
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
        <button
          className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-surface-container"
          type="button"
          onClick={onNotificationsClick}
        >
          <span className="material-symbols-outlined">notifications</span>
        </button>
      </header>

      <main className="min-h-screen pb-24 pt-16 md:ml-[240px] md:pt-0">
        <div className="mx-auto max-w-[1200px] space-y-lg px-margin-mobile py-lg md:px-margin-desktop">
          <nav className="hidden items-center gap-sm text-on-surface-variant md:flex">
            <span className="font-label-sm text-label-sm">Bảng điều khiển</span>
            <span className="material-symbols-outlined text-[16px]">
              chevron_right
            </span>
            <span className="font-label-sm text-label-sm text-primary">
              Theo dõi phương tiện
            </span>
          </nav>

          {isLoading && (
            <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-xl text-center font-body-md text-body-md text-on-surface-variant">
              Đang tải lịch hẹn đang xử lý...
            </div>
          )}

          {!isLoading && error && (
            <div className="rounded-xl border border-error/30 bg-error-container/10 p-xl text-center font-body-md text-body-md text-error">
              {error}
            </div>
          )}

          {!isLoading && !error && !appointment && (
            <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-xl text-center font-body-md text-body-md text-on-surface-variant">
              Hiện bạn không có lịch hẹn nào đang được xử lý.
            </div>
          )}

          {!isLoading && !error && appointment && (
            <div className="grid grid-cols-1 gap-lg lg:grid-cols-12">
              <section className="flex flex-col overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest md:flex-row lg:col-span-8">
                <div className="relative h-64 md:h-auto md:w-1/2">
                  <img
                    className="h-full w-full object-cover"
                    src={vehicle?.imageUrl || vehicleImage}
                    alt={appointment.vehicleModel}
                  />
                  <div className="absolute left-4 top-4 rounded-full bg-primary px-3 py-1 font-label-md text-label-md text-white shadow-lg">
                    {statusTitle(appointment.status)}
                  </div>
                </div>

                <div className="flex flex-col justify-between p-lg md:w-1/2">
                  <div>
                    <h1 className="mb-xs font-headline-lg text-headline-lg text-primary">
                      {appointment.vehicleModel}
                    </h1>
                    <p className="mb-lg font-body-md text-body-md text-on-surface-variant">
                      ID Dịch vụ: #{appointment.id}
                    </p>
                    <div className="mb-lg inline-flex items-center gap-md rounded-lg border border-outline-variant bg-surface-container px-lg py-sm">
                      <span className="material-symbols-outlined text-on-surface-variant">
                        branding_watermark
                      </span>
                      <span className="font-headline-md text-headline-md font-bold tracking-widest">
                        {appointment.vehicleVin}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-md">
                    <div className="flex items-center justify-between border-b border-outline-variant pb-sm">
                      <span className="font-label-md text-on-surface-variant">
                        Kỹ thuật viên
                      </span>
                      <span className="font-label-md">
                        {appointment.engineerName || "Chưa phân công"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-label-md text-on-surface-variant">
                        Ngày hẹn
                      </span>
                      <span className="font-label-md">
                        {appointment.scheduleDate} - {appointment.timeFrame}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-label-md text-on-surface-variant">
                        Garage
                      </span>
                      <span className="font-label-md">{appointment.garageName}</span>
                    </div>
                  </div>
                </div>
              </section>

              <section className="relative flex flex-col items-center justify-center overflow-hidden rounded-xl bg-primary-container p-xl text-center text-on-primary-container shadow-lg lg:col-span-4">
                <div className="absolute right-0 top-0 -mr-16 -mt-16 h-32 w-32 rounded-full bg-white/10" />
                <span
                  className="material-symbols-outlined mb-md text-[64px]"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  schedule
                </span>
                <h3 className="mb-sm font-label-md text-label-md uppercase tracking-widest opacity-80">
                  Khung giờ hẹn
                </h3>
                <div className="mb-xs font-display-lg text-display-lg">
                  {appointment.timeFrame}
                </div>
                <div className="font-headline-md text-headline-md">
                  {appointment.scheduleDate}
                </div>
                <p className="mt-lg px-md font-body-md text-body-md opacity-90">
                  {appointment.notes || "Xe của bạn đang được đội ngũ kỹ thuật xử lý."}
                </p>
              </section>

              <section className="rounded-xl border border-outline-variant bg-surface-container-lowest p-lg md:p-xl lg:col-span-12">
                <div className="mb-xl flex flex-col justify-between gap-sm sm:flex-row sm:items-center">
                  <h2 className="font-headline-md text-headline-md">
                    Tiến độ sửa chữa
                  </h2>
                </div>

                <div className="hidden w-full items-start px-lg md:flex">
                  {steps.map((step, index) => (
                    <DesktopStep
                      key={step.key}
                      step={step}
                      isLast={index === steps.length - 1}
                    />
                  ))}
                </div>

                <div className="flex flex-col gap-lg md:hidden">
                  {steps.map((step, index) => (
                    <MobileStep
                      key={step.key}
                      step={step}
                      isLast={index === steps.length - 1}
                    />
                  ))}
                </div>
              </section>

              <section className="rounded-xl border border-outline-variant bg-surface-container-lowest p-lg lg:col-span-6">
                <h3 className="mb-lg flex items-center gap-md font-headline-md text-headline-md">
                  <span className="material-symbols-outlined text-primary">
                    engineering
                  </span>
                  Ghi chú kỹ thuật viên
                </h3>
                <p className="font-body-md text-body-md text-on-surface-variant">
                  {appointment.engineerNotes || "Chưa có ghi chú mới từ kỹ thuật viên."}
                </p>
                {appointment.partsUsed && (
                  <p className="mt-md font-body-md text-body-md text-on-surface-variant">
                    <span className="font-semibold text-on-surface">Phụ tùng sử dụng: </span>
                    {appointment.partsUsed}
                  </p>
                )}
              </section>

              <section className="rounded-xl border border-outline-variant bg-surface-container-lowest p-lg lg:col-span-6">
                <h3 className="mb-lg flex items-center gap-md font-headline-md text-headline-md">
                  <span className="material-symbols-outlined text-primary">
                    receipt_long
                  </span>
                  Chi phí dịch vụ
                </h3>
                <div className="space-y-sm">
                  <div className="flex justify-between py-sm font-body-md text-body-md">
                    <span className="text-on-surface-variant">{appointment.serviceName}</span>
                    <span className="font-bold">{formatCurrency(appointment.servicePrice)}</span>
                  </div>
                  <div className="mt-lg flex items-center justify-between border-t border-outline-variant pt-lg">
                    <span className="font-headline-md text-headline-md">Tổng cộng</span>
                    <span className="font-display-lg text-display-lg text-primary">
                      {formatCurrency(appointment.servicePrice)}
                    </span>
                  </div>
                </div>
              </section>
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

function DesktopStep({ step, isLast }: { step: StepData; isLast: boolean }) {
  const isDone = step.status === "done";
  const isActive = step.status === "active";

  return (
    <div className="relative flex flex-1 flex-col items-center">
      <div
        className={`z-10 flex items-center justify-center rounded-full ${
          isActive
            ? "h-12 w-12 -mt-1 bg-primary text-white shadow-[0_0_0_8px_rgba(0,89,187,0.12)]"
            : isDone
              ? "h-10 w-10 bg-tertiary text-white"
              : "h-10 w-10 border border-outline-variant bg-surface-container text-on-surface-variant"
        }`}
      >
        <span
          className="material-symbols-outlined"
          style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}
        >
          {step.icon}
        </span>
      </div>
      {!isLast && (
        <div
          className={`absolute left-1/2 top-5 h-[2px] w-full ${
            isDone ? "bg-tertiary" : "bg-outline-variant"
          }`}
        />
      )}
      <div className="mt-md text-center">
        <p
          className={`font-label-md text-label-md ${
            isActive ? "font-bold text-primary" : isDone ? "text-tertiary" : "text-on-surface-variant"
          }`}
        >
          {step.title}
        </p>
      </div>
    </div>
  );
}

function MobileStep({ step, isLast }: { step: StepData; isLast: boolean }) {
  const isDone = step.status === "done";
  const isActive = step.status === "active";

  return (
    <div className="flex gap-lg">
      <div className="flex flex-col items-center">
        <div
          className={`flex items-center justify-center rounded-full ${
            isActive
              ? "h-10 w-10 bg-primary text-white shadow-[0_0_0_8px_rgba(0,89,187,0.12)]"
              : isDone
                ? "h-8 w-8 bg-tertiary text-white"
                : "h-8 w-8 border border-outline-variant bg-surface-container text-on-surface-variant"
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">{step.icon}</span>
        </div>
        {!isLast && (
          <div
            className={`my-1 w-[2px] flex-1 ${
              isDone ? "bg-tertiary" : "bg-outline-variant"
            }`}
          />
        )}
      </div>
      <div className="pb-md">
        <h4
          className={`${
            isActive
              ? "font-headline-md text-[18px] text-primary"
              : isDone
                ? "font-label-md text-tertiary"
                : "font-label-md text-on-surface-variant"
          }`}
        >
          {step.title}
        </h4>
      </div>
    </div>
  );
}

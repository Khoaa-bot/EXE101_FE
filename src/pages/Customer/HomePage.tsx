import { useEffect, useState } from "react";
import AppSidebar, { type AppSection } from "../../components/AppSidebar";
import { MaintenanceAlert } from "../../components/MaintenancePanel";
import { useUnreadNotificationCount } from "../../hooks/useUnreadNotificationCount";
import {
  getActiveAppointments,
  getFleetMaintenanceStatus,
  getMyFleet,
  getMyNotifications,
  getStoredAuthSession,
  type AppNotification,
  type AppointmentDto,
  type MaintenanceStatus,
  type Vehicle,
} from "../../services/api";
import { sortByUrgency } from "../../utils/maintenance";

type QuickAction = {
  label: string;
  icon: string;
  onClick?: () => void;
};

const carImage =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuCXT-EcsMzdfkWSSGRpWcyki5d3M7wpEASIP51A4WtZRLiE8J7zxrt3ZnVk0P1ssoZAlw2Bw3lJ25_cN3dIlR2IYzxGVdsEuD0jSldo-A_7tYPHx_-5oryhGAmyDBMKO9oyBvXhM1UOs8Cbt_gfapUbSgRti030ygiu_arYPiSLvG--7I64YJuxjF2wRtTThk0RNjRJ15i2fiJ9EtS_b_2ze-RzbvRCd6l_hRTI86rK9CO2wtmDwsx9UaCLfqUJ8xkj9_AlQ-7BkQtG";

function statusLabel(status: string) {
  switch (status.toLowerCase()) {
    case "pending":
      return "Chờ xác nhận";
    case "confirmed":
      return "Đã xác nhận";
    case "in_progress":
      return "Đang sửa chữa";
    case "completed":
      return "Hoàn thành";
    default:
      return status;
  }
}

// Các bước tiến độ hiển thị trên thẻ xe; trạng thái lịch hẹn quy về một bước.
const PROGRESS_STEPS = ["Chờ xác nhận", "Đã xác nhận", "Đang sửa chữa", "Hoàn thành"];

function progressIndex(status: string) {
  switch (status.toLowerCase()) {
    case "confirmed":
      return 1;
    case "in_progress":
      return 2;
    case "completed":
    case "successful":
      return 3;
    default:
      return 0;
  }
}

const QUICK_TONES = [
  "bg-primary-fixed text-on-primary-fixed-variant",
  "bg-[#d9f7dd] text-[#00531a]",
  "bg-[#e6defa] text-[#3b2a7a]",
  "bg-[#ffe4d6] text-[#7a2e00]",
];

function notificationIcon(type: string) {
  switch (type) {
    case "VEHICLE":
      return { icon: "directions_car", tone: "bg-primary-container/20 text-primary" };
    case "APPOINTMENT":
      return { icon: "event", tone: "bg-primary-container/20 text-primary" };
    case "PROMOTION":
      return { icon: "redeem", tone: "bg-tertiary-container/20 text-tertiary" };
    default:
      return { icon: "notifications", tone: "bg-surface-variant text-on-surface-variant" };
  }
}

function timeAgo(isoDate: string) {
  const diffMs = Date.now() - new Date(isoDate).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "Vừa xong";
  if (minutes < 60) return `${minutes} phút trước`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.floor(hours / 24);
  return `${days} ngày trước`;
}

type HomeProps = {
  onBookingClick: () => void;
  onDiagnoseClick: () => void;
  onHistoryClick: () => void;
  onNotificationsClick: () => void;
  onProfileClick: () => void;
  onTrackingClick: () => void;
};

export default function Home({
  onBookingClick,
  onDiagnoseClick,
  onHistoryClick,
  onNotificationsClick,
  onProfileClick,
  onTrackingClick,
}: HomeProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const username = getStoredAuthSession()?.username || "bạn";
  const avatarInitial = username.charAt(0).toUpperCase();
  const unreadNotificationCount = useUnreadNotificationCount();

  const [isLoading, setIsLoading] = useState(true);
  const [activeAppointment, setActiveAppointment] = useState<AppointmentDto | null>(null);
  const [activeVehicle, setActiveVehicle] = useState<Vehicle | null>(null);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [fleet, setFleet] = useState<Vehicle[]>([]);
  const [maintenance, setMaintenance] = useState<MaintenanceStatus[]>([]);

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      getActiveAppointments(),
      getMyFleet(),
      getMyNotifications(),
      // Nhắc bảo dưỡng lỗi thì chỉ ẩn banner, không làm hỏng cả trang chủ.
      getFleetMaintenanceStatus().catch(() => [] as MaintenanceStatus[]),
    ])
      .then(([appointments, myFleet, myNotifications, myMaintenance]) => {
        if (cancelled) return;
        const appointment = appointments[0] ?? null;
        setActiveAppointment(appointment);
        setActiveVehicle(
          appointment ? myFleet.find((v) => v.id === appointment.vehicleId) ?? null : null,
        );
        setNotifications(myNotifications.slice(0, 3));
        setFleet(myFleet);
        setMaintenance(myMaintenance);
      })
      .catch(() => {
        // Trang chủ không chặn hiển thị khi 1 phần dữ liệu lỗi — các mục
        // liên quan sẽ tự hiện trạng thái rỗng.
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const handleClickFeedback = () => {
    if (window.navigator.vibrate) {
      window.navigator.vibrate(10);
    }
  };

  const handleNavigate = (section: AppSection) => {
    if (section === "home") {
      setIsSidebarOpen(false);
    }

    if (section === "history") {
      onHistoryClick();
    }

    if (section === "notifications") {
      onNotificationsClick();
    }

    if (section === "tracking") {
      onTrackingClick();
    }

    if (section === "profile") {
      onProfileClick();
    }
  };

  const maintenanceAlerts = sortByUrgency(
    maintenance.filter((item) => item.stage !== "OK"),
  ).slice(0, 3);

  const vehicleLabel = (vehicleId: number) => {
    const vehicle = fleet.find((v) => v.id === vehicleId);
    if (!vehicle) return "Xe của bạn";
    return vehicle.licensePlate ? `${vehicle.model} · ${vehicle.licensePlate}` : vehicle.model;
  };

  const quickActions: QuickAction[] = [
    { label: "Đặt lịch hẹn", icon: "calendar_add_on", onClick: onBookingClick },
    { label: "Theo dõi xe", icon: "location_on", onClick: onTrackingClick },
    { label: "Lịch sử dịch vụ", icon: "receipt_long", onClick: onHistoryClick },
    { label: "Chẩn đoán AI", icon: "auto_awesome", onClick: onDiagnoseClick },
  ];

  return (
    <div className="min-h-dvh bg-surface font-sans text-on-surface">
      <AppSidebar
        active="home"
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onNavigate={handleNavigate}
      />

      <aside className="fixed left-0 top-0 z-50 hidden h-full w-60 flex-col border-r border-outline-variant bg-surface-container-lowest md:flex">
        <div className="px-lg py-xl">
          <div className="flex items-center gap-sm">
            <span className="material-symbols-outlined text-headline-lg text-primary">
              electric_car
            </span>
            <span className="font-headline-lg text-headline-lg font-bold text-primary">
              Servio
            </span>
          </div>
        </div>

        <nav className="flex-1 space-y-base px-md">
          <button className="flex w-full items-center gap-md rounded-lg bg-primary-container/20 px-md py-sm text-primary transition-all">
            <span className="material-symbols-outlined">home</span>
            <span className="font-label-md text-label-md font-bold">Trang chủ</span>
          </button>
          <button
            className="flex w-full items-center gap-md rounded-lg px-md py-sm text-on-surface-variant transition-all hover:bg-on-surface-variant/10"
            onClick={onHistoryClick}
          >
            <span className="material-symbols-outlined">history</span>
            <span className="font-label-md text-label-md">Lịch sử</span>
          </button>
          <button
            className="flex w-full items-center gap-md rounded-lg px-md py-sm text-on-surface-variant transition-all hover:bg-on-surface-variant/10"
            onClick={onTrackingClick}
          >
            <span className="material-symbols-outlined">location_on</span>
            <span className="font-label-md text-label-md">Theo dõi</span>
          </button>
          <button
            className="flex w-full items-center gap-md rounded-lg px-md py-sm text-on-surface-variant transition-all hover:bg-on-surface-variant/10"
            onClick={onNotificationsClick}
          >
            <span className="material-symbols-outlined">notifications</span>
            <span className="font-label-md text-label-md">Thông báo</span>
            {unreadNotificationCount > 0 && (
              <span className="ml-auto h-2 w-2 rounded-full bg-error" />
            )}
          </button>
          <div className="my-sm border-t border-outline-variant" />
          <button
            className="flex w-full items-center gap-md rounded-lg px-md py-sm text-on-surface-variant transition-all hover:bg-on-surface-variant/10"
            onClick={onProfileClick}
          >
            <span className="material-symbols-outlined">person</span>
            <span className="font-label-md text-label-md">Cá nhân</span>
          </button>
        </nav>

        <div className="border-t border-outline/20 p-lg">
          <div className="flex items-center gap-md">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-fixed font-bold text-on-primary-fixed">
              {avatarInitial}
            </div>
            <div className="overflow-hidden">
              <p className="truncate font-label-md text-label-md text-on-surface">
                {username}
              </p>
              <p className="text-[10px] text-outline">Thành viên Vàng</p>
            </div>
          </div>
        </div>
      </aside>

      <main className="min-h-screen bg-surface md:ml-60">
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-outline-variant bg-surface px-margin-mobile md:px-xl">
          <div className="flex items-center gap-3">
            <button aria-label="Mở menu"
              className="-ml-2 rounded-full p-2 text-on-surface-variant transition-colors active:bg-surface-container md:hidden"
              type="button"
              onClick={() => {
                setIsSidebarOpen(true);
                handleClickFeedback();
              }}
            >
              <span className="material-symbols-outlined text-[28px]">menu</span>
            </button>
            <h1 className="font-headline-md text-headline-md text-on-surface">
              Tổng quan
            </h1>
          </div>

          <div className="flex items-center gap-lg">
            <div className="relative hidden lg:block">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">
                search
              </span>
              <input aria-label="Tìm kiếm dịch vụ..."
                className="w-64 rounded-full border border-outline-variant bg-surface-container-low py-2 pl-10 pr-4 font-body-md text-body-md outline-none transition-all focus:ring-2 focus:ring-primary"
                placeholder="Tìm kiếm dịch vụ..."
                type="text"
              />
            </div>
            <button
              className="relative flex h-10 w-10 items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container-high"
              type="button"
              onClick={onNotificationsClick}
            >
              <span className="material-symbols-outlined">notifications</span>
              {unreadNotificationCount > 0 && (
                <span className="absolute right-2 top-2 h-2 w-2 rounded-full border-2 border-surface bg-error" />
              )}
            </button>
          </div>
        </header>

        <div className="mx-auto max-w-7xl space-y-5 p-margin-mobile pb-28 md:p-xl">
          <section className="flex flex-col justify-between gap-md md:flex-row md:items-end">
            <div>
              <h2 className="text-[34px] font-extrabold leading-tight tracking-tight text-on-surface">
                Xin chào, {username}!
              </h2>
              <p className="mt-1.5 text-base text-on-surface-variant">
                Hôm nay chiếc xe của bạn đang được chăm sóc tốt nhất.
              </p>
            </div>
            <button
              className="flex min-h-[52px] items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-primary to-primary-container px-6 text-[15px] font-bold text-on-primary shadow-[0_14px_24px_-14px_rgba(0,89,187,0.9)] transition-all active:scale-95"
              type="button"
              onClick={onBookingClick}
            >
              <span aria-hidden="true" className="material-symbols-outlined">add</span>
              Tạo lịch mới
            </button>
          </section>

          {maintenanceAlerts.length > 0 && (
            <section aria-label="Nhắc bảo dưỡng" className="space-y-sm">
              <div className="flex items-center justify-between">
                <h3 className="font-headline-md text-headline-md text-on-surface">
                  Nhắc bảo dưỡng
                </h3>
                <button
                  type="button"
                  onClick={onProfileClick}
                  className="min-h-11 px-2 font-label-md text-label-md text-primary hover:underline"
                >
                  Xem tất cả xe
                </button>
              </div>
              {maintenanceAlerts.map((alert) => (
                <MaintenanceAlert
                  key={`${alert.vehicleId}-${alert.serviceId}`}
                  status={alert}
                  vehicleLabel={vehicleLabel(alert.vehicleId)}
                  onBook={onBookingClick}
                />
              ))}
            </section>
          )}

          <div className="grid gap-5 xl:grid-cols-[1fr_22.5rem]">
            <section
              aria-labelledby="home-car-title"
              className="flex flex-col overflow-hidden rounded-3xl border border-outline-variant/40 bg-surface-container-lowest shadow-[0_10px_26px_-14px_rgba(25,28,29,0.28)] md:flex-row"
            >
              <div className="flex flex-1 flex-col gap-4 p-6">
                <div className="flex items-center justify-between gap-3">
                  <h3 id="home-car-title" className="text-lg font-extrabold">
                    {activeAppointment ? "Xe đang được xử lý" : "Xe của bạn"}
                  </h3>
                  {activeAppointment && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#e6defa] px-3 py-1.5 text-xs font-bold text-[#3b2a7a]">
                      <i aria-hidden="true" className="h-[7px] w-[7px] rounded-full bg-[#6a4fd1]" />
                      {statusLabel(activeAppointment.status)}
                    </span>
                  )}
                </div>

                {isLoading && <p className="text-sm text-on-surface-variant">Đang tải...</p>}

                {!isLoading && !activeAppointment && (
                  <div className="space-y-3">
                    <p className="text-sm text-on-surface-variant">Bạn chưa có lịch hẹn nào đang diễn ra.</p>
                    <button
                      type="button"
                      onClick={onBookingClick}
                      className="min-h-11 rounded-xl bg-primary px-5 text-sm font-bold text-on-primary transition-all active:scale-95"
                    >
                      Đặt lịch ngay
                    </button>
                  </div>
                )}

                {!isLoading && activeAppointment && (
                  <>
                    <div>
                      <p className="text-[26px] font-extrabold leading-tight text-on-primary-fixed-variant">
                        {activeAppointment.vehicleModel}
                      </p>
                      {activeVehicle?.licensePlate && (
                        <p className="text-[13px] text-on-surface-variant">Biển số {activeVehicle.licensePlate}</p>
                      )}
                    </div>

                    <ol
                      aria-label={`Tiến độ: ${statusLabel(activeAppointment.status)}`}
                      className="flex pb-1 pt-1.5"
                    >
                      {PROGRESS_STEPS.map((label, index) => {
                        const current = progressIndex(activeAppointment.status);
                        const done = index < current;
                        const isCurrent = index === current;
                        return (
                          <li
                            key={label}
                            aria-current={isCurrent ? "step" : undefined}
                            className={`relative flex flex-1 flex-col items-center gap-1.5 text-center text-xs font-semibold ${
                              done ? "text-[#00531a]" : isCurrent ? "font-extrabold text-on-primary-fixed-variant" : "text-outline"
                            }`}
                          >
                            {index > 0 && (
                              <span
                                aria-hidden="true"
                                className={`absolute left-[-50%] top-3.5 h-[3px] w-full ${
                                  index <= current ? "bg-[#008730]" : "bg-surface-container-high"
                                }`}
                              />
                            )}
                            <b
                              className={`z-[1] flex h-7 w-7 items-center justify-center rounded-full text-[13px] ${
                                done
                                  ? "bg-[#008730] text-white"
                                  : isCurrent
                                    ? "bg-primary text-on-primary ring-4 ring-primary/20"
                                    : "bg-surface-container-high text-outline"
                              }`}
                            >
                              {done ? "✓" : index + 1}
                            </b>
                            {label}
                          </li>
                        );
                      })}
                    </ol>

                    <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 rounded-2xl bg-surface-container-low p-4 text-sm">
                      <dt className="text-on-surface-variant">Dịch vụ</dt>
                      <dd className="text-right font-semibold">{activeAppointment.serviceName}</dd>
                      <dt className="text-on-surface-variant">Lịch hẹn</dt>
                      <dd className="text-right font-semibold">
                        {activeAppointment.scheduleDate} · {activeAppointment.timeFrame}
                      </dd>
                      {activeAppointment.garageName && (
                        <>
                          <dt className="text-on-surface-variant">Garage</dt>
                          <dd className="text-right font-semibold">{activeAppointment.garageName}</dd>
                        </>
                      )}
                      <dt className="text-on-surface-variant">Kỹ thuật viên</dt>
                      <dd className="text-right font-semibold">{activeAppointment.engineerName || "Chưa phân công"}</dd>
                      {activeAppointment.notes && (
                        <>
                          <dt className="text-on-surface-variant">Ghi chú</dt>
                          <dd className="text-right font-semibold">{activeAppointment.notes}</dd>
                        </>
                      )}
                    </dl>

                    <div>
                      <button
                        type="button"
                        onClick={onTrackingClick}
                        className="min-h-11 rounded-xl bg-primary px-5 text-sm font-bold text-on-primary transition-all active:scale-95"
                      >
                        Theo dõi xe
                      </button>
                    </div>
                  </>
                )}
              </div>

              <div className="relative h-48 md:h-auto md:w-[18.75rem]">
                <img
                  className="h-full w-full object-cover"
                  src={activeVehicle?.imageUrl || carImage}
                  alt={activeAppointment?.vehicleModel || "Xe của bạn"}
                />
                <div
                  aria-hidden="true"
                  className="absolute inset-0 hidden bg-gradient-to-r from-surface-container-lowest to-transparent md:block"
                />
              </div>
            </section>

            <aside className="flex flex-col gap-5">
              <div className="flex items-center gap-3.5 rounded-3xl border border-[#f3dc9a] bg-[#fff1cc] p-5">
                <span
                  aria-hidden="true"
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white text-[#6b4200]"
                >
                  <span className="material-symbols-outlined">redeem</span>
                </span>
                <div className="flex-1">
                  <p className="text-[15px] font-bold">Ưu đãi của bạn</p>
                  <p className="text-[13px] text-[#6b4200]">Giảm 20% thay dầu nhớt cho lần tới.</p>
                </div>
              </div>
            </aside>
          </div>

          <section aria-labelledby="home-quick-title">
            <h3 id="home-quick-title" className="mb-3 text-lg font-extrabold">
              Truy cập nhanh
            </h3>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {quickActions.map((action, index) => (
                <button
                  key={action.label}
                  className="flex flex-col items-center gap-2.5 rounded-[20px] border border-outline-variant/40 bg-surface-container-lowest px-3 py-5 text-sm font-bold shadow-[0_10px_26px_-14px_rgba(25,28,29,0.28)] transition-all hover:-translate-y-0.5"
                  type="button"
                  onClick={() => {
                    handleClickFeedback();
                    action.onClick?.();
                  }}
                >
                  <span
                    aria-hidden="true"
                    className={`flex h-12 w-12 items-center justify-center rounded-2xl ${QUICK_TONES[index % QUICK_TONES.length]}`}
                  >
                    <span className="material-symbols-outlined">{action.icon}</span>
                  </span>
                  {action.label}
                </button>
              ))}
            </div>
          </section>

          <section
            aria-labelledby="home-recent-title"
            className="overflow-hidden rounded-3xl border border-outline-variant/40 bg-surface-container-lowest shadow-[0_10px_26px_-14px_rgba(25,28,29,0.28)]"
          >
            <div className="flex items-center justify-between px-6 pb-2 pt-5">
              <h3 id="home-recent-title" className="text-lg font-extrabold">
                Hoạt động gần đây
              </h3>
              <button
                className="min-h-9 text-[13px] font-bold text-on-primary-fixed-variant hover:underline"
                type="button"
                onClick={onHistoryClick}
              >
                Xem lịch sử →
              </button>
            </div>
            <div className="divide-y divide-outline-variant/40">
              {notifications.length === 0 && (
                <p className="px-6 py-5 text-sm text-on-surface-variant">Chưa có hoạt động nào gần đây.</p>
              )}
              {notifications.map((notification) => {
                const { icon, tone } = notificationIcon(notification.type);
                return (
                  <div
                    key={notification.id}
                    className="flex items-center gap-3.5 px-6 py-3.5 transition-colors hover:bg-surface-container-low/60"
                  >
                    <div aria-hidden="true" className={`flex h-10 w-10 items-center justify-center rounded-xl ${tone}`}>
                      <span className="material-symbols-outlined">{icon}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold">{notification.title}</p>
                      <p className="truncate text-xs text-on-surface-variant">{notification.message}</p>
                    </div>
                    <p className="whitespace-nowrap text-xs text-on-surface-variant">{timeAgo(notification.createdAt)}</p>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </main>

      <nav className="fixed bottom-0 left-0 z-50 flex h-20 w-full items-center justify-around border-t border-outline-variant bg-surface px-4 md:hidden">
        <button className="flex flex-col items-center justify-center rounded-full bg-secondary-container px-4 py-1 text-on-secondary-container">
          <span className="material-symbols-outlined">home</span>
          <span className="font-label-sm text-label-sm">Trang chủ</span>
        </button>
        <button
          className="flex flex-col items-center justify-center text-on-surface-variant"
          onClick={onTrackingClick}
        >
          <span className="material-symbols-outlined">location_searching</span>
          <span className="font-label-sm text-label-sm">Theo dõi</span>
        </button>
        <button
          className="flex flex-col items-center justify-center text-on-surface-variant"
          onClick={onBookingClick}
        >
          <span className="material-symbols-outlined">calendar_month</span>
          <span className="font-label-sm text-label-sm">Đặt lịch</span>
        </button>
        <button
          className="flex flex-col items-center justify-center text-on-surface-variant"
          onClick={onProfileClick}
        >
          <span className="material-symbols-outlined">person</span>
          <span className="font-label-sm text-label-sm">Cá nhân</span>
        </button>
      </nav>

      <button aria-label="Đặt lịch mới"
        className="fixed bottom-24 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-on-primary shadow-lg transition-transform active:scale-90 md:hidden"
        type="button"
        onClick={onBookingClick}
      >
        <span className="material-symbols-outlined text-3xl">add</span>
      </button>

    </div>
  );
}

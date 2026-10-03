import { useEffect, useState } from "react";
import AppSidebar, { type AppSection } from "../../components/AppSidebar";
import { useUnreadNotificationCount } from "../../hooks/useUnreadNotificationCount";
import {
  getActiveAppointments,
  getMyFleet,
  getMyNotifications,
  getStoredAuthSession,
  getWalletBalance,
  requestWalletTopUp,
  type AppNotification,
  type AppointmentDto,
  type Vehicle,
} from "../../services/api";

type QuickAction = {
  label: string;
  icon: string;
  onClick?: () => void;
};

const carImage =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuCXT-EcsMzdfkWSSGRpWcyki5d3M7wpEASIP51A4WtZRLiE8J7zxrt3ZnVk0P1ssoZAlw2Bw3lJ25_cN3dIlR2IYzxGVdsEuD0jSldo-A_7tYPHx_-5oryhGAmyDBMKO9oyBvXhM1UOs8Cbt_gfapUbSgRti030ygiu_arYPiSLvG--7I64YJuxjF2wRtTThk0RNjRJ15i2fiJ9EtS_b_2ze-RzbvRCd6l_hRTI86rK9CO2wtmDwsx9UaCLfqUJ8xkj9_AlQ-7BkQtG";

function formatCurrency(value: number | null | undefined) {
  if (value === null || value === undefined) return "0đ";
  return `${value.toLocaleString("vi-VN")}đ`;
}

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
  onHistoryClick: () => void;
  onNotificationsClick: () => void;
  onProfileClick: () => void;
  onTrackingClick: () => void;
};

export default function Home({
  onBookingClick,
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
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isTopUpOpen, setIsTopUpOpen] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState("100000");
  const [isTopUpSubmitting, setIsTopUpSubmitting] = useState(false);
  const [topUpError, setTopUpError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    Promise.all([getActiveAppointments(), getMyFleet(), getWalletBalance(), getMyNotifications()])
      .then(([appointments, fleet, balance, myNotifications]) => {
        if (cancelled) return;
        const appointment = appointments[0] ?? null;
        setActiveAppointment(appointment);
        setActiveVehicle(
          appointment ? fleet.find((v) => v.id === appointment.vehicleId) ?? null : null,
        );
        setWalletBalance(balance);
        setNotifications(myNotifications.slice(0, 3));
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

  const submitTopUp = () => {
    const amount = Number(topUpAmount);
    if (!amount || amount < 10000) {
      setTopUpError("Số tiền nạp tối thiểu là 10.000đ.");
      return;
    }
    setTopUpError(null);
    setIsTopUpSubmitting(true);
    requestWalletTopUp(amount)
      .then((res) => {
        window.location.href = res.paymentUrl;
      })
      .catch((err) => {
        setTopUpError(
          err instanceof Error ? err.message : "Không tạo được link nạp tiền.",
        );
        setIsTopUpSubmitting(false);
      });
  };

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

  const quickActions: QuickAction[] = [
    { label: "Đặt lịch hẹn", icon: "calendar_add_on", onClick: onBookingClick },
    { label: "Theo dõi xe", icon: "location_on", onClick: onTrackingClick },
    { label: "Lịch sử dịch vụ", icon: "receipt_long", onClick: onHistoryClick },
    { label: "Hỗ trợ 24/7", icon: "support_agent" },
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
            <button
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
              <input
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

        <div className="mx-auto max-w-7xl space-y-xl p-margin-mobile pb-28 md:p-xl">
          <section className="flex flex-col justify-between gap-md md:flex-row md:items-end">
            <div>
              <h2 className="font-display-lg text-display-lg text-on-surface">
                Xin chào, {username}!
              </h2>
              <p className="font-body-lg text-body-lg text-on-surface-variant">
                Hôm nay chiếc xe của bạn đang được chăm sóc tốt nhất.
              </p>
            </div>
            <button
              className="flex items-center justify-center gap-sm rounded-lg bg-primary px-lg py-md font-label-md text-label-md text-on-primary transition-all hover:shadow-lg active:scale-95"
              type="button"
              onClick={onBookingClick}
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              Tạo lịch mới
            </button>
          </section>

          <div className="grid grid-cols-12 gap-lg">
            <section className="col-span-12 flex flex-col gap-lg rounded-xl border border-outline-variant bg-surface-container-lowest p-lg transition-shadow hover:shadow-sm lg:col-span-8 md:flex-row">
              <div className="md:w-1/2">
                <div className="mb-md flex items-center justify-between gap-md">
                  <span className="font-headline-md text-headline-md text-on-surface">
                    Xe của bạn
                  </span>
                  {activeAppointment && (
                    <span className="flex items-center gap-xs rounded-lg bg-tertiary-container/10 px-sm py-xs font-label-md text-label-md text-tertiary">
                      <span className="h-2 w-2 animate-pulse rounded-full bg-tertiary" />
                      {statusLabel(activeAppointment.status)}
                    </span>
                  )}
                </div>

                {isLoading && (
                  <p className="font-body-md text-body-md text-on-surface-variant">
                    Đang tải...
                  </p>
                )}

                {!isLoading && !activeAppointment && (
                  <div className="space-y-md">
                    <p className="font-body-md text-body-md text-on-surface-variant">
                      Bạn chưa có lịch hẹn nào đang diễn ra.
                    </p>
                    <button
                      type="button"
                      onClick={onBookingClick}
                      className="rounded-lg bg-primary px-lg py-sm font-label-md text-label-md text-on-primary transition-all hover:shadow-lg active:scale-95"
                    >
                      Đặt lịch ngay
                    </button>
                  </div>
                )}

                {!isLoading && activeAppointment && (
                  <div className="space-y-md">
                    <div>
                      <h3 className="font-headline-lg text-headline-lg text-primary">
                        {activeAppointment.vehicleModel}
                      </h3>
                      {activeVehicle?.licensePlate && (
                        <p className="font-body-md text-body-md text-on-surface-variant">
                          Biển số: {activeVehicle.licensePlate}
                        </p>
                      )}
                    </div>

                    <div className="space-y-sm rounded-lg bg-surface-container-low p-md">
                      <div className="flex justify-between gap-md text-body-md">
                        <span className="text-outline">Dịch vụ:</span>
                        <span className="text-right font-semibold text-on-surface">
                          {activeAppointment.serviceName}
                        </span>
                      </div>
                      <div className="flex justify-between gap-md text-body-md">
                        <span className="text-outline">Lịch hẹn:</span>
                        <span className="text-right font-semibold text-on-surface">
                          {activeAppointment.scheduleDate} · {activeAppointment.timeFrame}
                        </span>
                      </div>
                      {activeAppointment.garageName && (
                        <div className="flex justify-between gap-md text-body-md">
                          <span className="text-outline">Garage:</span>
                          <span className="text-right font-semibold text-on-surface">
                            {activeAppointment.garageName}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="relative h-48 overflow-hidden rounded-xl border border-outline-variant md:h-auto md:w-1/2">
                <img
                  className="h-full w-full object-cover"
                  src={activeVehicle?.imageUrl || carImage}
                  alt={activeAppointment?.vehicleModel || "Xe của bạn"}
                />
              </div>
            </section>

            <aside className="col-span-12 grid grid-cols-1 gap-lg md:grid-cols-2 lg:col-span-4 lg:grid-cols-1">
              <button className="group flex cursor-pointer flex-col justify-between rounded-xl border border-outline-variant bg-secondary-container/20 p-lg text-left transition-colors hover:bg-secondary-container/30">
                <div className="flex items-start justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary-container text-on-secondary-container">
                    <span className="material-symbols-outlined">redeem</span>
                  </div>
                  <span className="material-symbols-outlined text-outline transition-colors group-hover:text-primary">
                    arrow_forward
                  </span>
                </div>
                <div className="mt-xl">
                  <p className="font-headline-md text-headline-md text-on-surface">
                    Ưu đãi của bạn
                  </p>
                  <p className="font-body-md text-body-md text-on-surface-variant">
                    Giảm 20% thay dầu nhớt cho lần tới.
                  </p>
                </div>
              </button>

              <div className="flex flex-col justify-between rounded-xl border border-outline-variant bg-surface-container-lowest p-lg shadow-sm transition-all hover:border-primary">
                <div className="mb-md flex items-center justify-between">
                  <span className="font-label-md text-label-md text-outline">
                    Số dư Servio Pay
                  </span>
                  <span className="material-symbols-outlined text-primary">
                    account_balance_wallet
                  </span>
                </div>
                <div>
                  <p className="font-display-lg text-display-lg text-on-surface">
                    {walletBalance === null ? "..." : formatCurrency(walletBalance)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsTopUpOpen(true)}
                  className="mt-md inline-flex items-center gap-xs self-start rounded-lg bg-primary px-md py-sm font-label-md text-label-md text-on-primary transition hover:opacity-90 active:scale-95"
                >
                  <span className="material-symbols-outlined text-[18px]">add</span>
                  Nạp tiền
                </button>
              </div>
            </aside>
          </div>

          <section>
            <h3 className="mb-lg font-headline-md text-headline-md">
              Truy cập nhanh
            </h3>
            <div className="grid grid-cols-2 gap-lg md:grid-cols-4">
              {quickActions.map((action) => (
                <button
                  key={action.label}
                  className="group space-y-md rounded-xl border border-outline-variant bg-surface-container-lowest p-lg text-center transition-all hover:bg-primary hover:text-on-primary"
                  type="button"
                  onClick={() => {
                    handleClickFeedback();
                    action.onClick?.();
                  }}
                >
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary-container/20 text-primary group-hover:bg-on-primary group-hover:text-primary">
                    <span className="material-symbols-outlined">{action.icon}</span>
                  </div>
                  <p className="font-label-md text-label-md">{action.label}</p>
                </button>
              ))}
            </div>
          </section>

          <div className="grid grid-cols-12 gap-lg pb-xl">
            <section className="col-span-12 overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest shadow-sm lg:col-span-7">
              <div className="flex items-center justify-between border-b border-outline-variant px-lg py-md">
                <h3 className="font-headline-md text-headline-md">Gần đây</h3>
                <button
                  className="font-label-md text-label-md text-primary hover:underline"
                  type="button"
                  onClick={onHistoryClick}
                >
                  Xem tất cả
                </button>
              </div>
              <div className="divide-y divide-outline-variant">
                {notifications.length === 0 && (
                  <p className="p-lg font-body-md text-body-md text-on-surface-variant">
                    Chưa có hoạt động nào gần đây.
                  </p>
                )}
                {notifications.map((notification) => {
                  const { icon, tone } = notificationIcon(notification.type);
                  return (
                    <div
                      key={notification.id}
                      className="flex items-center gap-md p-lg transition-colors hover:bg-surface-container-low"
                    >
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-lg ${tone}`}
                      >
                        <span className="material-symbols-outlined">{icon}</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-body-md text-body-md font-semibold">
                          {notification.title}
                        </p>
                        <p className="truncate font-label-sm text-label-sm text-outline">
                          {notification.message}
                        </p>
                      </div>
                      <p className="whitespace-nowrap font-label-sm text-label-sm text-outline">
                        {timeAgo(notification.createdAt)}
                      </p>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="col-span-12 space-y-lg lg:col-span-5">
              <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-lg shadow-sm">
                <h3 className="mb-lg font-headline-md text-headline-md">
                  Tiến độ dịch vụ
                </h3>
                {!activeAppointment && (
                  <p className="font-body-md text-body-md text-on-surface-variant">
                    Bạn chưa có lịch hẹn nào đang diễn ra.
                  </p>
                )}
                {activeAppointment && (
                  <div className="space-y-sm">
                    <div className="flex justify-between gap-md text-body-md">
                      <span className="text-outline">Trạng thái:</span>
                      <span className="text-right font-semibold text-primary">
                        {statusLabel(activeAppointment.status)}
                      </span>
                    </div>
                    <div className="flex justify-between gap-md text-body-md">
                      <span className="text-outline">Kỹ thuật viên:</span>
                      <span className="text-right font-semibold text-on-surface">
                        {activeAppointment.engineerName || "Chưa phân công"}
                      </span>
                    </div>
                    {activeAppointment.notes && (
                      <div className="flex justify-between gap-md text-body-md">
                        <span className="text-outline">Ghi chú:</span>
                        <span className="text-right font-semibold text-on-surface">
                          {activeAppointment.notes}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </section>
          </div>
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

      <button
        className="fixed bottom-24 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-on-primary shadow-lg transition-transform active:scale-90 md:hidden"
        type="button"
        onClick={onBookingClick}
      >
        <span className="material-symbols-outlined text-3xl">add</span>
      </button>

      {isTopUpOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-[26rem] rounded-2xl border border-outline-variant bg-surface-container-lowest p-lg shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="font-headline-md text-headline-md">
                Nạp tiền vào ví Servio Pay
              </h3>
              <button
                type="button"
                onClick={() => {
                  setIsTopUpOpen(false);
                  setTopUpError(null);
                }}
                className="rounded-full p-2 text-on-surface-variant hover:bg-surface-container"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <p className="mt-1 font-body-sm text-body-sm text-on-surface-variant">
              Bạn sẽ được chuyển sang cổng thanh toán VNPay để hoàn tất giao dịch.
            </p>

            <div className="mt-lg space-y-sm">
              <label className="block font-label-md text-label-md text-on-surface-variant">
                Số tiền (VNĐ)
              </label>
              <input
                type="number"
                min={10000}
                step={10000}
                value={topUpAmount}
                onChange={(e) => setTopUpAmount(e.target.value)}
                className="w-full rounded-lg border border-outline-variant bg-surface px-4 py-3 font-body-md text-body-md outline-none focus:border-primary focus:ring-2 focus:ring-primary"
              />
              <div className="flex flex-wrap gap-2">
                {[50000, 100000, 200000, 500000].map((amount) => (
                  <button
                    key={amount}
                    type="button"
                    onClick={() => setTopUpAmount(String(amount))}
                    className="rounded-lg border border-outline-variant px-3 py-1.5 text-xs font-semibold hover:border-primary hover:text-primary"
                  >
                    {formatCurrency(amount)}
                  </button>
                ))}
              </div>
            </div>

            {topUpError && (
              <p className="mt-3 font-body-sm text-body-sm text-error">{topUpError}</p>
            )}

            <button
              type="button"
              onClick={submitTopUp}
              disabled={isTopUpSubmitting}
              className="mt-lg w-full rounded-lg bg-primary py-3 font-label-md text-label-md text-on-primary transition hover:opacity-90 active:scale-[0.98] disabled:opacity-60"
            >
              {isTopUpSubmitting ? "Đang chuyển đến VNPay..." : "Tiếp tục thanh toán"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

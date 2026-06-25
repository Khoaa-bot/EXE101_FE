import { useState } from "react";
import AppSidebar, { type AppSection } from "../components/AppSidebar";

type QuickAction = {
  label: string;
  icon: string;
  onClick?: () => void;
};

type Activity = {
  title: string;
  subtitle: string;
  time: string;
  icon: string;
  tone: string;
};

const carImage =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuCXT-EcsMzdfkWSSGRpWcyki5d3M7wpEASIP51A4WtZRLiE8J7zxrt3ZnVk0P1ssoZAlw2Bw3lJ25_cN3dIlR2IYzxGVdsEuD0jSldo-A_7tYPHx_-5oryhGAmyDBMKO9oyBvXhM1UOs8Cbt_gfapUbSgRti030ygiu_arYPiSLvG--7I64YJuxjF2wRtTThk0RNjRJ15i2fiJ9EtS_b_2ze-RzbvRCd6l_hRTI86rK9CO2wtmDwsx9UaCLfqUJ8xkj9_AlQ-7BkQtG";

const activities: Activity[] = [
  {
    title: "Thanh toán thành công",
    subtitle: "Dịch vụ thay dầu - 450.000đ",
    time: "Hôm qua",
    icon: "check_circle",
    tone: "bg-tertiary-container/20 text-tertiary",
  },
  {
    title: "Lịch hẹn được xác nhận",
    subtitle: "Bảo dưỡng 20.000km - Trung tâm Cầu Giấy",
    time: "2 ngày trước",
    icon: "event",
    tone: "bg-primary-container/20 text-primary",
  },
  {
    title: "Cảnh báo lốp",
    subtitle: "Áp suất lốp trước trái thấp",
    time: "3 ngày trước",
    icon: "warning",
    tone: "bg-error-container/20 text-error",
  },
];

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
            <span className="ml-auto h-2 w-2 rounded-full bg-error" />
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
              M
            </div>
            <div className="overflow-hidden">
              <p className="truncate font-label-md text-label-md text-on-surface">
                Minh Nguyễn
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
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full border-2 border-surface bg-error" />
            </button>
          </div>
        </header>

        <div className="mx-auto max-w-7xl space-y-xl p-margin-mobile pb-28 md:p-xl">
          <section className="flex flex-col justify-between gap-md md:flex-row md:items-end">
            <div>
              <h2 className="font-display-lg text-display-lg text-on-surface">
                Xin chào, Minh!
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
                  <span className="flex items-center gap-xs rounded-lg bg-tertiary-container/10 px-sm py-xs font-label-md text-label-md text-tertiary">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-tertiary" />
                    Đang sửa chữa
                  </span>
                </div>

                <div className="space-y-md">
                  <div>
                    <h3 className="font-headline-lg text-headline-lg text-primary">
                      Toyota Vios 2023
                    </h3>
                    <p className="font-body-md text-body-md text-on-surface-variant">
                      Biển số: 30A-123.45
                    </p>
                  </div>

                  <div className="space-y-sm rounded-lg bg-surface-container-low p-md">
                    <div className="flex justify-between gap-md text-body-md">
                      <span className="text-outline">Dịch vụ:</span>
                      <span className="text-right font-semibold text-on-surface">
                        Bảo dưỡng định kỳ 20.000km
                      </span>
                    </div>
                    <div className="flex justify-between gap-md text-body-md">
                      <span className="text-outline">Dự kiến xong:</span>
                      <span className="text-right font-semibold text-on-surface">
                        16:30, Hôm nay
                      </span>
                    </div>
                    <div className="mt-md h-2 w-full overflow-hidden rounded-full bg-surface-variant">
                      <div className="h-full w-2/3 rounded-full bg-primary" />
                    </div>
                    <p className="text-right text-[11px] font-medium text-primary">
                      Tiến độ: 65%
                    </p>
                  </div>
                </div>
              </div>

              <div className="relative h-48 overflow-hidden rounded-xl border border-outline-variant md:h-auto md:w-1/2">
                <img
                  className="h-full w-full object-cover"
                  src={carImage}
                  alt="Toyota Vios trong trung tâm dịch vụ"
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
                    1.250.000đ
                  </p>
                  <p className="mt-xs font-label-md text-label-md text-tertiary">
                    +50k điểm tích lũy
                  </p>
                </div>
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
                {activities.map((activity) => (
                  <div
                    key={activity.title}
                    className="flex items-center gap-md p-lg transition-colors hover:bg-surface-container-low"
                  >
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-lg ${activity.tone}`}
                    >
                      <span className="material-symbols-outlined">{activity.icon}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-body-md text-body-md font-semibold">
                        {activity.title}
                      </p>
                      <p className="truncate font-label-sm text-label-sm text-outline">
                        {activity.subtitle}
                      </p>
                    </div>
                    <p className="whitespace-nowrap font-label-sm text-label-sm text-outline">
                      {activity.time}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            <section className="col-span-12 space-y-lg lg:col-span-5">
              <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-lg shadow-sm">
                <h3 className="mb-lg font-headline-md text-headline-md">
                  Tiến độ dịch vụ
                </h3>
                <div className="relative space-y-xl pl-8 before:absolute before:bottom-2 before:left-[11px] before:top-2 before:w-[2px] before:bg-outline-variant before:content-['']">
                  {[
                    ["done", "Tiếp nhận xe", "08:30 - Kỹ thuật viên: Hoàng Nam", "done"],
                    ["done", "Kiểm tra tổng quát", "09:15 - Hoàn tất báo giá", "done"],
                    ["sync", "Đang bảo dưỡng", "10:45 - Thay thế phụ tùng định kỳ", "active"],
                    ["hourglass_empty", "Rửa xe & Vệ sinh", "Dự kiến 15:30", "pending"],
                  ].map(([icon, title, description, status]) => (
                    <div
                      key={title}
                      className={`relative ${status === "pending" ? "opacity-40" : ""}`}
                    >
                      <span
                        className={`absolute -left-[30px] top-0 flex h-6 w-6 items-center justify-center rounded-full ${
                          status === "active"
                            ? "bg-primary text-white ring-4 ring-primary-fixed-dim"
                            : status === "done"
                              ? "bg-tertiary text-on-tertiary"
                              : "bg-surface-variant"
                        }`}
                      >
                        <span
                          className={`material-symbols-outlined text-[14px] ${
                            status === "active" ? "animate-spin" : ""
                          }`}
                        >
                          {icon}
                        </span>
                      </span>
                      <p
                        className={`font-label-md text-label-md ${
                          status === "active"
                            ? "font-bold text-primary"
                            : "text-on-surface"
                        }`}
                      >
                        {title}
                      </p>
                      <p className="font-label-sm text-label-sm text-outline">
                        {description}
                      </p>
                    </div>
                  ))}
                </div>
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
    </div>
  );
}

import { useState } from "react";
import AppSidebar, { type AppSection } from "../components/AppSidebar";

type NotificationsPageProps = {
  onHomeClick: () => void;
  onHistoryClick: () => void;
  onProfileClick: () => void;
  onTrackingClick: () => void;
};

type NotificationItem = {
  id: number;
  title: string;
  body: string;
  time: string;
  icon: string;
  iconClassName: string;
  category: "Đơn hàng" | "Khuyến mãi" | "Hệ thống";
  unread: boolean;
  actions?: Array<{
    label: string;
    variant: "primary" | "secondary";
  }>;
  badge?: string;
};

const filters = ["Tất cả", "Đơn hàng", "Khuyến mãi", "Hệ thống"];

const avatarImage =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBGC_VlrThqEyJOL5jVI5f2HalXhDNv-TIxbEuYeWGHxbvXL2V_wOUNYznNaMqlLfe_yOBCXTCDUmUQQ2RsHfvsnTqiR55kChebPEIJPGJthRtnqSb6IaScTYySzbI6MpwjN4rzUnf4ZlAcgsrbRN6xxTiQoWwfyqzlsx1-WCiJ3NB5pHQDUU4FwWq0kaLkh6NVlnCemAwgrQwnlUp5UFapaX4_GQyFHlc6DVP_bZfFpbH9JWsyxa4C9lnCZ9u-IvqoEz_CMphV7IjU";

const initialNotifications: NotificationItem[] = [
  {
    id: 1,
    title: "Tiến độ bảo dưỡng: Đang thực hiện",
    body: "Xe VinFast VF8 (Biển số: 30H-123.45) đang được kỹ thuật viên kiểm tra hệ thống treo và thay dầu định kỳ.",
    time: "10:45 AM",
    icon: "build",
    iconClassName: "bg-secondary-container text-on-secondary-container",
    category: "Đơn hàng",
    unread: true,
    actions: [
      { label: "Theo dõi trực tiếp", variant: "primary" },
      { label: "Chi tiết", variant: "secondary" },
    ],
  },
  {
    id: 2,
    title: "Xác nhận đặt lịch thành công",
    body: "Yêu cầu bảo dưỡng của bạn vào lúc 09:00 ngày 25/10 tại Servio CN Quận 1 đã được tiếp nhận.",
    time: "Hôm qua, 15:30",
    icon: "calendar_month",
    iconClassName: "bg-surface-container text-outline",
    category: "Đơn hàng",
    unread: false,
  },
  {
    id: 3,
    title: "Ưu đãi độc quyền: Giảm 20% thay lốp",
    body: "Chào mừng tháng 10, Servio tặng bạn mã giảm giá SERVIO20 áp dụng cho dịch vụ thay lốp Michelin. Hạn đến 31/10.",
    time: "2 ngày trước",
    icon: "sell",
    iconClassName: "bg-tertiary-container text-on-tertiary-container",
    category: "Khuyến mãi",
    unread: true,
    badge: "Mã: SERVIO20",
  },
  {
    id: 4,
    title: "Thanh toán hoàn tất",
    body: "Giao dịch #SV10293 trị giá 2.500.000đ đã được xử lý thành công qua thẻ tín dụng.",
    time: "3 ngày trước",
    icon: "check_circle",
    iconClassName: "bg-tertiary-fixed-dim/20 text-tertiary",
    category: "Đơn hàng",
    unread: false,
  },
  {
    id: 5,
    title: "Cảnh báo: Bảo mật tài khoản",
    body: "Có một lượt đăng nhập mới vào tài khoản của bạn từ trình duyệt Chrome trên thiết bị Windows tại Hà Nội.",
    time: "1 tuần trước",
    icon: "warning",
    iconClassName: "bg-error-container text-on-error-container",
    category: "Hệ thống",
    unread: true,
  },
];

export default function NotificationsPage({
  onHomeClick,
  onHistoryClick,
  onProfileClick,
  onTrackingClick,
}: NotificationsPageProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState(filters[0]);
  const [notifications, setNotifications] = useState(initialNotifications);

  const markOneAsRead = (id: number) => {
    setNotifications((items) =>
      items.map((item) => (item.id === id ? { ...item, unread: false } : item)),
    );
  };

  const markAllAsRead = () => {
    setNotifications((items) => items.map((item) => ({ ...item, unread: false })));
  };

  const handleNavigate = (section: AppSection) => {
    if (section === "home") onHomeClick();
    if (section === "history") onHistoryClick();
    if (section === "tracking") onTrackingClick();
    if (section === "profile") onProfileClick();
  };

  const visibleNotifications =
    activeFilter === "Tất cả"
      ? notifications
      : notifications.filter((notification) => notification.category === activeFilter);

  return (
    <div className="min-h-dvh bg-background font-sans text-on-surface">
      <AppSidebar
        active="notifications"
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onNavigate={handleNavigate}
      />

      <header className="fixed top-0 z-50 flex h-16 w-full items-center justify-between border-b border-outline-variant bg-surface px-margin-mobile md:px-margin-desktop">
        <div className="flex items-center gap-2">
          <button
            className="-ml-2 rounded-full p-2 text-on-surface-variant transition-colors hover:bg-surface-container md:hidden"
            type="button"
            aria-label="Mở menu"
            onClick={() => setIsSidebarOpen(true)}
          >
            <span className="material-symbols-outlined">menu</span>
          </button>
          <span className="material-symbols-outlined text-[28px] text-primary">
            electric_car
          </span>
          <h1 className="font-headline-lg text-headline-lg font-bold text-primary">
            Servio
          </h1>
        </div>

        <div className="flex items-center gap-lg">
          <nav className="hidden items-center gap-md md:flex">
            <button
              className="rounded-lg px-3 py-2 font-label-md text-label-md text-on-surface-variant transition-colors hover:bg-surface-container"
              type="button"
              onClick={onHomeClick}
            >
              Trang chủ
            </button>
            <button
              className="rounded-lg px-3 py-2 font-label-md text-label-md text-on-surface-variant transition-colors hover:bg-surface-container"
              type="button"
              onClick={onTrackingClick}
            >
              Theo dõi
            </button>
            <button
              className="rounded-lg px-3 py-2 font-label-md text-label-md text-on-surface-variant transition-colors hover:bg-surface-container"
              type="button"
              onClick={onHistoryClick}
            >
              Lịch sử
            </button>
          </nav>

          <div className="flex items-center gap-sm">
            <button className="flex h-10 w-10 items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-surface-container">
              <span className="material-symbols-outlined">search</span>
            </button>
            <button
              className="h-10 w-10 overflow-hidden rounded-full border border-outline-variant bg-secondary-container"
              type="button"
              onClick={onProfileClick}
            >
              <img
                className="h-full w-full object-cover"
                src={avatarImage}
                alt="Ảnh đại diện"
              />
            </button>
          </div>
        </div>
      </header>

      <div className="flex min-h-screen pt-16">
        <aside className="fixed bottom-0 left-0 top-16 hidden w-64 flex-col overflow-y-auto border-r border-outline-variant bg-surface-container-lowest px-md py-lg md:flex">
          <nav className="space-y-1">
            <button
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 font-label-md text-label-md text-on-surface-variant transition-colors hover:bg-surface-container"
              type="button"
              onClick={onHomeClick}
            >
              <span className="material-symbols-outlined">home</span>
              Trang chủ
            </button>
            <button
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 font-label-md text-label-md text-on-surface-variant transition-colors hover:bg-surface-container"
              type="button"
              onClick={onHistoryClick}
            >
              <span className="material-symbols-outlined">history</span>
              Lịch sử
            </button>
            <button
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 font-label-md text-label-md text-on-surface-variant"
              type="button"
              onClick={onTrackingClick}
            >
              <span className="material-symbols-outlined">location_on</span>
              Theo dõi
            </button>
            <button className="flex w-full items-center gap-3 rounded-lg bg-primary-fixed px-3 py-2.5 font-label-md text-label-md text-on-primary-fixed transition-colors">
              <span
                className="material-symbols-outlined"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                notifications
              </span>
              Thông báo
            </button>
          </nav>

          <nav className="mt-lg space-y-1 border-t border-outline-variant pt-lg">
            <button
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 font-label-md text-label-md text-on-surface-variant transition-colors hover:bg-surface-container"
              type="button"
              onClick={onProfileClick}
            >
              <span className="material-symbols-outlined">person</span>
              Cá nhân
            </button>
          </nav>
        </aside>

        <main className="flex-1 bg-background p-margin-mobile pb-28 md:ml-64 md:p-margin-desktop">
          <div className="mx-auto max-w-4xl">
            <section className="mb-lg flex flex-col justify-between gap-md md:flex-row md:items-end">
              <div>
                <h2 className="font-display-lg text-display-lg text-on-surface">
                  Thông báo
                </h2>
                <p className="mt-1 font-body-md text-body-md text-on-surface-variant">
                  Cập nhật những hoạt động mới nhất về xe và dịch vụ của bạn.
                </p>
              </div>
              <button
                className="flex items-center gap-1 rounded-lg px-3 py-2 font-label-md text-label-md text-primary transition-colors hover:bg-primary-fixed-dim/20"
                type="button"
                onClick={markAllAsRead}
              >
                <span className="material-symbols-outlined text-[18px]">done_all</span>
                Đánh dấu đã đọc tất cả
              </button>
            </section>

            <section className="mb-lg flex items-center gap-2 overflow-x-auto border-b border-outline-variant pb-1">
              {filters.map((filter) => (
                <button
                  key={filter}
                  className={`whitespace-nowrap px-lg py-3 font-label-md text-label-md transition-colors ${
                    activeFilter === filter
                      ? "border-b-2 border-primary text-primary"
                      : "text-on-surface-variant hover:text-primary"
                  }`}
                  type="button"
                  onClick={() => setActiveFilter(filter)}
                >
                  {filter}
                </button>
              ))}
            </section>

            <section className="space-y-sm">
              {visibleNotifications.map((notification) => (
                <NotificationCard
                  key={notification.id}
                  item={notification}
                  onRead={() => markOneAsRead(notification.id)}
                />
              ))}
            </section>

            <div className="mt-xl text-center">
              <button className="rounded-xl border border-outline-variant px-xl py-lg font-label-md text-label-md text-on-surface-variant transition-colors hover:bg-surface-container">
                Xem các thông báo cũ hơn
              </button>
            </div>
          </div>
        </main>
      </div>

      <nav className="fixed bottom-0 left-0 z-50 flex h-20 w-full items-center justify-around border-t border-outline-variant bg-surface px-2 md:hidden">
        <button
          className="flex flex-col items-center justify-center text-on-surface-variant"
          type="button"
          onClick={onHomeClick}
        >
          <span className="material-symbols-outlined">home</span>
          <span className="font-label-sm text-label-sm">Trang chủ</span>
        </button>
        <button
          className="flex flex-col items-center justify-center text-on-surface-variant"
          type="button"
          onClick={onTrackingClick}
        >
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
          className="flex flex-col items-center justify-center rounded-full bg-secondary-container px-4 py-1 text-on-secondary-container"
          type="button"
        >
          <span
            className="material-symbols-outlined"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            notifications
          </span>
          <span className="font-label-sm text-label-sm">Thông báo</span>
        </button>
      </nav>
    </div>
  );
}

function NotificationCard({
  item,
  onRead,
}: {
  item: NotificationItem;
  onRead: () => void;
}) {
  return (
    <article
      className={`group relative flex cursor-pointer gap-lg rounded-xl border border-outline-variant bg-surface-container-lowest p-lg transition-all hover:bg-surface-container ${
        item.unread ? "" : "opacity-80"
      }`}
      onClick={onRead}
    >
      {item.unread && (
        <div className="absolute right-4 top-4 h-2 w-2 rounded-full bg-primary transition-transform group-hover:scale-110" />
      )}

      <div
        className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full ${item.iconClassName}`}
      >
        <span
          className="material-symbols-outlined"
          style={{ fontVariationSettings: item.unread ? "'FILL' 1" : "'FILL' 0" }}
        >
          {item.icon}
        </span>
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-md">
          <h3 className="font-label-md text-label-md font-bold text-on-surface">
            {item.title}
          </h3>
          <span className="shrink-0 font-label-sm text-label-sm text-outline">
            {item.time}
          </span>
        </div>
        <p className="mt-1 font-body-md text-body-md leading-relaxed text-on-surface-variant">
          {item.body}
        </p>

        {item.actions && (
          <div className="mt-md flex flex-wrap items-center gap-md">
            {item.actions.map((action) => (
              <button
                key={action.label}
                className={`rounded-lg px-lg py-1.5 font-label-md text-label-md ${
                  action.variant === "primary"
                    ? "bg-primary text-on-primary hover:opacity-90"
                    : "border border-outline-variant hover:bg-surface-container"
                }`}
                type="button"
                onClick={(event) => event.stopPropagation()}
              >
                {action.label}
              </button>
            ))}
          </div>
        )}

        {item.badge && (
          <div className="mt-md">
            <div className="inline-flex items-center gap-2 rounded-full bg-tertiary/10 px-3 py-1 font-label-sm text-label-sm font-bold uppercase tracking-wide text-tertiary">
              {item.badge}
            </div>
          </div>
        )}
      </div>
    </article>
  );
}

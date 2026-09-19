import { useEffect, useState } from "react";
import AppSidebar, { type AppSection } from "../../components/AppSidebar";
import {
  getMyNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  type AppNotification,
  type NotificationType,
} from "../../services/api";

type NotificationsPageProps = {
  onHomeClick: () => void;
  onHistoryClick: () => void;
  onProfileClick: () => void;
  onTrackingClick: () => void;
};

type UiCategory = "Xe & Hồ sơ" | "Đơn hàng" | "Khuyến mãi" | "Hệ thống";

const filters: Array<"Tất cả" | UiCategory> = [
  "Tất cả",
  "Xe & Hồ sơ",
  "Đơn hàng",
  "Khuyến mãi",
  "Hệ thống",
];

// Ánh xạ loại thông báo từ backend (NotificationType) sang danh mục / icon
// hiển thị ở FE. VEHICLE và PROFILE dùng ngay cho tính năng hiện tại;
// APPOINTMENT/PROMOTION/SYSTEM để dành khi backend phát sinh thêm loại thông báo.
const typeMeta: Record<
  NotificationType,
  { category: UiCategory; icon: string; iconClassName: string }
> = {
  VEHICLE: {
    category: "Xe & Hồ sơ",
    icon: "directions_car",
    iconClassName: "bg-secondary-container text-on-secondary-container",
  },
  PROFILE: {
    category: "Xe & Hồ sơ",
    icon: "person",
    iconClassName: "bg-secondary-container text-on-secondary-container",
  },
  APPOINTMENT: {
    category: "Đơn hàng",
    icon: "build",
    iconClassName: "bg-surface-container text-outline",
  },
  PROMOTION: {
    category: "Khuyến mãi",
    icon: "sell",
    iconClassName: "bg-tertiary-container text-on-tertiary-container",
  },
  SYSTEM: {
    category: "Hệ thống",
    icon: "warning",
    iconClassName: "bg-error-container text-on-error-container",
  },
};

const avatarImage =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBGC_VlrThqEyJOL5jVI5f2HalXhDNv-TIxbEuYeWGHxbvXL2V_wOUNYznNaMqlLfe_yOBCXTCDUmUQQ2RsHfvsnTqiR55kChebPEIJPGJthRtnqSb6IaScTYySzbI6MpwjN4rzUnf4ZlAcgsrbRN6xxTiQoWwfyqzlsx1-WCiJ3NB5pHQDUU4FwWq0kaLkh6NVlnCemAwgrQwnlUp5UFapaX4_GQyFHlc6DVP_bZfFpbH9JWsyxa4C9lnCZ9u-IvqoEz_CMphV7IjU";

function formatRelativeTime(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return "";

  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMinutes < 1) return "Vừa xong";
  if (diffMinutes < 60) return `${diffMinutes} phút trước`;
  if (diffHours < 24) return `${diffHours} giờ trước`;
  if (diffDays === 1) {
    return `Hôm qua, ${date.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}`;
  }
  if (diffDays < 7) return `${diffDays} ngày trước`;

  return date.toLocaleDateString("vi-VN");
}

export default function NotificationsPage({
  onHomeClick,
  onHistoryClick,
  onProfileClick,
  onTrackingClick,
}: NotificationsPageProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<"Tất cả" | UiCategory>(filters[0]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadNotifications = () => {
    setIsLoading(true);
    setLoadError(null);
    getMyNotifications()
      .then((data) => setNotifications(data))
      .catch((error) => {
        setLoadError(
          error instanceof Error ? error.message : "Không thể tải thông báo.",
        );
      })
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const markOneAsRead = (id: number) => {
    const target = notifications.find((item) => item.id === id);
    if (!target || target.isRead) return;

    setNotifications((items) =>
      items.map((item) => (item.id === id ? { ...item, isRead: true } : item)),
    );

    markNotificationAsRead(id).catch(() => {
      // Rollback nếu gọi API thất bại.
      setNotifications((items) =>
        items.map((item) => (item.id === id ? { ...item, isRead: false } : item)),
      );
    });
  };

  const markAllAsRead = () => {
    const hadUnread = notifications.some((item) => !item.isRead);
    if (!hadUnread) return;

    setNotifications((items) => items.map((item) => ({ ...item, isRead: true })));

    markAllNotificationsAsRead().catch(() => {
      loadNotifications();
    });
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
      : notifications.filter((item) => typeMeta[item.type]?.category === activeFilter);

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
                  Cập nhật những hoạt động mới nhất về xe, hồ sơ và dịch vụ của bạn.
                </p>
              </div>
              <button
                className="flex items-center gap-1 rounded-lg px-3 py-2 font-label-md text-label-md text-primary transition-colors hover:bg-primary-fixed-dim/20 disabled:opacity-50"
                type="button"
                onClick={markAllAsRead}
                disabled={isLoading || notifications.every((item) => item.isRead)}
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

            {isLoading && (
              <p className="py-xl text-center font-body-md text-body-md text-on-surface-variant">
                Đang tải thông báo...
              </p>
            )}

            {!isLoading && loadError && (
              <div className="rounded-xl border border-error/30 bg-error-container/40 p-lg text-center">
                <p className="font-body-md text-body-md text-on-error-container">{loadError}</p>
                <button
                  className="mt-md rounded-lg border border-outline-variant px-lg py-2 font-label-md text-label-md text-on-surface-variant transition-colors hover:bg-surface-container"
                  type="button"
                  onClick={loadNotifications}
                >
                  Thử lại
                </button>
              </div>
            )}

            {!isLoading && !loadError && visibleNotifications.length === 0 && (
              <p className="py-xl text-center font-body-md text-body-md text-on-surface-variant">
                Không có thông báo nào.
              </p>
            )}

            {!isLoading && !loadError && visibleNotifications.length > 0 && (
              <section className="space-y-sm">
                {visibleNotifications.map((notification) => (
                  <NotificationCard
                    key={notification.id}
                    item={notification}
                    onRead={() => markOneAsRead(notification.id)}
                  />
                ))}
              </section>
            )}
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
  item: AppNotification;
  onRead: () => void;
}) {
  const meta = typeMeta[item.type] ?? typeMeta.SYSTEM;

  return (
    <article
      className={`group relative flex cursor-pointer gap-lg rounded-xl border border-outline-variant bg-surface-container-lowest p-lg transition-all hover:bg-surface-container ${
        item.isRead ? "opacity-80" : ""
      }`}
      onClick={onRead}
    >
      {!item.isRead && (
        <div className="absolute right-4 top-4 h-2 w-2 rounded-full bg-primary transition-transform group-hover:scale-110" />
      )}

      <div
        className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full ${meta.iconClassName}`}
      >
        <span
          className="material-symbols-outlined"
          style={{ fontVariationSettings: !item.isRead ? "'FILL' 1" : "'FILL' 0" }}
        >
          {meta.icon}
        </span>
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-md">
          <h3 className="font-label-md text-label-md font-bold text-on-surface">
            {item.title}
          </h3>
          <span className="shrink-0 font-label-sm text-label-sm text-outline">
            {formatRelativeTime(item.createdAt)}
          </span>
        </div>
        <p className="mt-1 font-body-md text-body-md leading-relaxed text-on-surface-variant">
          {item.message}
        </p>
      </div>
    </article>
  );
}

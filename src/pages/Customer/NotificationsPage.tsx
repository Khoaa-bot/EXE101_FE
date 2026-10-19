import { useEffect, useState } from "react";
import AppSidebar, { type AppSection } from "../../components/AppSidebar";
import {
  getMyNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  type AppNotification,
  type NotificationType,
} from "../../services/api";
import { MAINTENANCE_TITLE_OVERDUE, MAINTENANCE_TITLE_SOON } from "../../utils/maintenance";

type NotificationsPageProps = {
  onBookingClick: () => void;
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
    iconClassName: "bg-primary-fixed text-on-primary-fixed-variant",
  },
  PROFILE: {
    category: "Xe & Hồ sơ",
    icon: "person",
    iconClassName: "bg-primary-fixed text-on-primary-fixed-variant",
  },
  APPOINTMENT: {
    category: "Đơn hàng",
    icon: "build",
    iconClassName: "bg-[#e6defa] text-[#3b2a7a]",
  },
  PROMOTION: {
    category: "Khuyến mãi",
    icon: "sell",
    iconClassName: "bg-[#fff1cc] text-[#6b4200]",
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
  onBookingClick,
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

  const unreadCount = notifications.filter((item) => !item.isRead).length;
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const notificationGroups: Array<{ label: string; rows: AppNotification[] }> = [];
  for (const label of ["Hôm nay", "Trước đó"]) {
    const rows = visibleNotifications.filter(
      (item) => (new Date(item.createdAt).getTime() >= startOfToday.getTime()) === (label === "Hôm nay"),
    );
    if (rows.length > 0) notificationGroups.push({ label, rows });
  }

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
            <button aria-label="Tìm kiếm" className="flex h-10 w-10 items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-surface-container">
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
          <div className="mx-auto max-w-4xl space-y-5">
            <section className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
              <div>
                <h2 className="text-3xl font-extrabold tracking-tight text-on-surface">Thông báo</h2>
                <p className="mt-1 text-[15px] text-on-surface-variant" aria-live="polite">
                  {unreadCount > 0 ? `${unreadCount} thông báo chưa đọc` : "Bạn đã đọc hết thông báo"}
                </p>
              </div>
              <button
                className="inline-flex min-h-10 items-center gap-1 rounded-xl border-[1.5px] border-outline-variant px-3.5 text-sm font-bold text-on-primary-fixed-variant transition-colors hover:bg-surface-container-low disabled:opacity-50"
                type="button"
                onClick={markAllAsRead}
                disabled={isLoading || notifications.every((item) => item.isRead)}
              >
                <span aria-hidden="true" className="material-symbols-outlined text-xl">
                  done_all
                </span>
                Đánh dấu đã đọc tất cả
              </button>
            </section>

            <div role="group" aria-label="Lọc thông báo" className="flex gap-2 overflow-x-auto pb-1">
              {filters.map((filter) => (
                <button
                  key={filter}
                  aria-pressed={activeFilter === filter}
                  className={`inline-flex min-h-9 items-center gap-1.5 whitespace-nowrap rounded-full border px-3.5 text-[13px] font-semibold ${
                    activeFilter === filter
                      ? "border-primary bg-primary-fixed text-on-primary-fixed-variant"
                      : "border-outline-variant bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container-low"
                  }`}
                  type="button"
                  onClick={() => setActiveFilter(filter)}
                >
                  {filter}
                  {filter === "Tất cả" && unreadCount > 0 && (
                    <b className="inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-error px-1 text-[11px] text-on-error">
                      {unreadCount}
                    </b>
                  )}
                </button>
              ))}
            </div>

            {isLoading && (
              <p className="py-10 text-center text-on-surface-variant">Đang tải thông báo...</p>
            )}

            {!isLoading && loadError && (
              <div className="rounded-3xl border border-error/30 bg-error-container/40 p-6 text-center">
                <p className="text-on-error-container">{loadError}</p>
                <button
                  className="mt-3 min-h-10 rounded-xl border border-outline-variant bg-surface-container-lowest px-5 text-sm font-bold text-on-surface-variant transition-colors hover:bg-surface-container"
                  type="button"
                  onClick={loadNotifications}
                >
                  Thử lại
                </button>
              </div>
            )}

            {!isLoading && !loadError && visibleNotifications.length === 0 && (
              <div className="flex flex-col items-center gap-3 rounded-3xl border border-outline-variant/40 bg-surface-container-lowest p-10 text-center">
                <span aria-hidden="true" className="flex h-[72px] w-[72px] items-center justify-center rounded-3xl bg-surface-container text-outline">
                  <span className="material-symbols-outlined text-4xl">notifications_off</span>
                </span>
                <p className="text-lg font-extrabold">Không có thông báo nào</p>
              </div>
            )}

            {!isLoading && !loadError && visibleNotifications.length > 0 && (
              <section className="overflow-hidden rounded-3xl border border-outline-variant/40 bg-surface-container-lowest shadow-[0_10px_26px_-14px_rgba(25,28,29,0.28)]">
                {notificationGroups.map((group) => (
                  <div key={group.label}>
                    <h3 className="bg-surface-container-low px-6 pb-1 pt-2.5 text-[11px] font-bold uppercase tracking-wider text-outline">
                      {group.label}
                    </h3>
                    <div className="divide-y divide-outline-variant/40">
                      {group.rows.map((notification) => (
                        <NotificationCard
                          key={notification.id}
                          item={notification}
                          onRead={() => markOneAsRead(notification.id)}
                          onBook={onBookingClick}
                        />
                      ))}
                    </div>
                  </div>
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
  onBook,
}: {
  item: AppNotification;
  onRead: () => void;
  onBook: () => void;
}) {
  const overdue = item.type === "VEHICLE" && item.title === MAINTENANCE_TITLE_OVERDUE;
  const isMaintenance = overdue || (item.type === "VEHICLE" && item.title === MAINTENANCE_TITLE_SOON);
  const meta: { icon: string; iconClassName: string } = isMaintenance
    ? {
        icon: overdue ? "warning" : "schedule",
        iconClassName: overdue
          ? "bg-error-container text-on-error-container"
          : "bg-[#ffe9c7] text-[#6b4000]",
      }
    : (typeMeta[item.type] ?? typeMeta.SYSTEM);
  const accent = isMaintenance
    ? overdue
      ? "border-l-4 border-l-error"
      : "border-l-4 border-l-[#b36a00]"
    : "";

  return (
    <article
      onClick={onRead}
      className={`relative flex w-full cursor-pointer items-start gap-3.5 px-6 py-4 text-left transition-colors hover:bg-surface-container-low/70 ${accent} ${
        item.isRead ? "" : "bg-primary-fixed/20"
      }`}
    >
      {!item.isRead && (
        <span
          aria-label="Chưa đọc"
          role="img"
          className="absolute left-2.5 top-[30px] h-2 w-2 rounded-full bg-primary"
        />
      )}

      <span
        aria-hidden="true"
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] ${meta.iconClassName}`}
      >
        <span
          className="material-symbols-outlined"
          style={{ fontVariationSettings: !item.isRead ? "'FILL' 1" : "'FILL' 0" }}
        >
          {meta.icon}
        </span>
      </span>

      <span className="min-w-0 flex-1">
        <span className="flex items-center justify-between gap-3">
          <span className={`text-sm text-on-surface ${item.isRead ? "font-semibold" : "font-extrabold"}`}>
            {item.title}
          </span>
          <span className="shrink-0 text-xs text-on-surface-variant">{formatRelativeTime(item.createdAt)}</span>
        </span>
        <span className="mt-0.5 block text-[13px] leading-relaxed text-on-surface-variant">{item.message}</span>
        {isMaintenance && (
          <span className="mt-2 block">
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onRead();
                onBook();
              }}
              className={`min-h-10 rounded-xl px-5 text-sm font-bold text-white transition-all active:scale-95 ${
                overdue ? "bg-error" : "bg-primary"
              }`}
            >
              Đặt lịch ngay
            </button>
          </span>
        )}
      </span>
    </article>
  );
}

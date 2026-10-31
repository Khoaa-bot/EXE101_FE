import { useEffect, useRef, useState, type ReactNode } from "react";
import AppSidebar, { type AppSection } from "./AppSidebar";
import AiChatBubble from "./AiChatBubble";
import BrandLink from "./BrandLink";
import VideoCallHost from "./VideoCallHost";
import { useUnreadNotificationCount } from "../hooks/useUnreadNotificationCount";
import { getStoredAuthSession } from "../services/api";

export type AppShellProps = {
  active: AppSection;
  title: string;
  children: ReactNode;
  onHomeClick: () => void;
  onHistoryClick: () => void;
  onNotificationsClick: () => void;
  onProfileClick: () => void;
  onTrackingClick: () => void;
  onPremiumClick?: () => void;
  onFindGarageClick?: () => void;
  onBookingClick?: () => void;
  onAddVehicleClick?: () => void;
  // Có hàm này thì hiện bong bóng chat nổi để vào trang chẩn đoán AI; hideAiBubble ẩn nó ở trang không cần.
  onDiagnoseClick?: () => void;
  hideAiBubble?: boolean;
  onLogout?: () => void;
  contentClassName?: string;
};

const navItems: Array<{
  label: string;
  icon: string;
  section: AppSection;
  hasNotification?: boolean;
}> = [
  { label: "Trang chủ", icon: "home", section: "home" },
  { label: "Tìm garage", icon: "storefront", section: "find_garage" },
  { label: "Lịch sử", icon: "history", section: "history" },
  { label: "Theo dõi", icon: "location_on", section: "tracking" },
  {
    label: "Hội viên",
    icon: "workspace_premium",
    section: "premium",
  },
  {
    label: "Thông báo",
    icon: "notifications",
    section: "notifications",
    hasNotification: true,
  },
  { label: "Cá nhân", icon: "person", section: "profile" },
];

export default function AppShell({
  active,
  title,
  children,
  onHomeClick,
  onHistoryClick,
  onNotificationsClick,
  onProfileClick,
  onTrackingClick,
  onPremiumClick,
  onFindGarageClick,
  onBookingClick,
  onAddVehicleClick,
  onDiagnoseClick,
  hideAiBubble = false,
  onLogout,
  contentClassName = "app-shell-content",
}: AppShellProps) {
  const username = getStoredAuthSession()?.username || "Tài khoản";
  const avatarInitial = username.charAt(0).toUpperCase();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState(true);
  const [isHeaderMenuOpen, setIsHeaderMenuOpen] = useState(false);
  const headerMenuRef = useRef<HTMLDivElement>(null);
  const unreadCount = useUnreadNotificationCount();

  // Đóng menu tài khoản khi bấm ra ngoài hoặc nhấn Esc.
  useEffect(() => {
    if (!isHeaderMenuOpen) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!headerMenuRef.current?.contains(event.target as Node)) setIsHeaderMenuOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsHeaderMenuOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [isHeaderMenuOpen]);

  const handleToggleSidebar = () => {
    if (window.matchMedia("(max-width: 767px)").matches) {
      setIsSidebarOpen(true);
    } else {
      setIsDesktopSidebarOpen(!isDesktopSidebarOpen);
    }
  };

  const handleNavigate = (section: AppSection) => {
    if (section === "home") onHomeClick();
    if (section === "find_garage") onFindGarageClick?.();
    if (section === "history") onHistoryClick();
    if (section === "notifications") onNotificationsClick();
    if (section === "tracking") onTrackingClick();
    if (section === "premium") onPremiumClick?.();
    if (section === "profile") onProfileClick();
  };

  return (
    <VideoCallHost>
    <div className="min-h-dvh bg-surface font-sans text-on-surface">
      <AppSidebar
        active={active}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onNavigate={handleNavigate}
        onLogout={onLogout}
      />

      <aside
        className={`fixed left-0 top-0 z-50 h-full flex-col border-r border-outline-variant bg-surface-container-lowest transition-all duration-300 overflow-hidden hidden md:flex ${
          isDesktopSidebarOpen ? "w-60" : "w-0 -translate-x-full border-r-0"
        }`}
      >
        <div className="px-lg py-xl shrink-0">
          <BrandLink className="flex items-center gap-sm">
            <span className="material-symbols-outlined text-headline-lg text-primary">
              electric_car
            </span>
            <span className="font-headline-lg text-headline-lg font-bold text-primary">
              Servio
            </span>
          </BrandLink>
        </div>

        <nav className="flex-1 space-y-base px-md">
          {navItems.map((item) => {
            const isActive = active === item.section;
            return (
              <button
                key={item.section}
                className={`flex min-h-11 w-full items-center gap-md rounded-xl px-md py-sm text-left transition-all ${
                  isActive
                    ? "bg-gradient-to-br from-primary to-primary-container text-on-primary shadow-lg shadow-primary/30"
                    : "text-on-surface-variant hover:bg-primary-fixed/50 hover:text-primary"
                }`}
                aria-current={isActive ? "page" : undefined}
                type="button"
                onClick={() => handleNavigate(item.section)}
              >
                <span
                  className="material-symbols-outlined"
                  style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}
                >
                  {item.icon}
                </span>
                <span
                  className={`font-label-md text-label-md ${
                    isActive ? "font-bold" : ""
                  }`}
                >
                  {item.label}
                </span>
                {item.hasNotification && (
                  <span className="ml-auto h-2 w-2 rounded-full bg-error" />
                )}
              </button>
            );
          })}
        </nav>

        <div className="relative border-t border-outline/20 p-lg">
          <button
            className="flex w-full items-center gap-md rounded-xl p-sm text-left transition-colors hover:bg-surface-container"
            type="button"
            aria-expanded={isAccountMenuOpen}
            onClick={() => setIsAccountMenuOpen((current) => !current)}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-fixed font-bold text-on-primary-fixed">
              {avatarInitial}
            </div>
            <div className="min-w-0 flex-1 overflow-hidden">
              <p className="truncate font-label-md text-label-md text-on-surface">
                {username}
              </p>
              <p className="text-[10px] text-outline">Thành viên Vàng</p>
            </div>
            <span className="material-symbols-outlined text-outline">
              {isAccountMenuOpen ? "expand_more" : "chevron_right"}
            </span>
          </button>

          {isAccountMenuOpen && (
            <div className="absolute bottom-[88px] left-lg right-lg rounded-xl border border-outline-variant bg-surface-container-lowest p-sm shadow-xl">
              <button
                className="flex w-full items-center gap-3 rounded-lg px-md py-sm text-left font-label-md text-label-md text-error transition-colors hover:bg-error-container/20"
                type="button"
                onClick={onLogout}
              >
                <span className="material-symbols-outlined">logout</span>
                Đăng xuất
              </button>
            </div>
          )}
        </div>
      </aside>

      <main
        className={`min-h-screen bg-surface transition-all duration-300 ${
          isDesktopSidebarOpen ? "md:ml-60" : "md:ml-0"
        }`}
      >
        <header className="sticky top-0 z-40 flex h-[68px] items-center justify-between border-b border-outline-variant/60 bg-surface/80 px-margin-mobile backdrop-blur-md md:px-xl">
          <div className="flex items-center gap-3">
            <button
              className="-ml-2 rounded-full p-2 text-on-surface-variant transition-colors active:bg-surface-container md:hidden"
              type="button"
              aria-label="Mở menu"
              onClick={handleToggleSidebar}
            >
              <span aria-hidden="true" className="material-symbols-outlined text-[28px]">
                menu
              </span>
            </button>
            <h1 className="text-xl font-extrabold tracking-tight text-on-surface">{title}</h1>
          </div>

          <div className="flex items-center gap-3">
            <label className="hidden h-11 w-72 items-center gap-2 rounded-full border border-outline-variant bg-surface-container-lowest px-3.5 text-outline focus-within:ring-2 focus-within:ring-primary lg:flex">
              <span aria-hidden="true" className="material-symbols-outlined text-xl">
                search
              </span>
              <input
                aria-label="Tìm kiếm dịch vụ, garage..."
                className="min-w-0 flex-1 bg-transparent text-sm text-on-surface outline-none"
                placeholder="Tìm dịch vụ, garage..."
                type="text"
              />
            </label>
            {onAddVehicleClick && (
              <button
                className="hidden min-h-11 items-center gap-1.5 rounded-2xl border-[1.5px] border-outline-variant bg-surface-container-lowest px-4 text-sm font-bold text-on-primary-fixed-variant transition-all hover:bg-surface-container-low md:inline-flex"
                type="button"
                onClick={onAddVehicleClick}
              >
                <span aria-hidden="true" className="material-symbols-outlined text-xl">
                  add
                </span>
                Thêm xe
              </button>
            )}
            {onBookingClick && (
              <button
                className="hidden min-h-11 items-center gap-1.5 rounded-2xl bg-gradient-to-br from-primary to-primary-container px-4 text-sm font-bold text-on-primary shadow-[0_12px_22px_-14px_rgba(0,89,187,0.9)] transition-all active:scale-95 md:inline-flex"
                type="button"
                onClick={onBookingClick}
              >
                <span aria-hidden="true" className="material-symbols-outlined text-xl">
                  add
                </span>
                Đặt lịch
              </button>
            )}
            <button
              className="relative flex h-11 w-11 items-center justify-center rounded-full border border-outline-variant/60 bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container-high"
              type="button"
              aria-label={unreadCount > 0 ? `Thông báo, ${unreadCount} chưa đọc` : "Thông báo"}
              onClick={onNotificationsClick}
            >
              <span aria-hidden="true" className="material-symbols-outlined">
                notifications
              </span>
              {unreadCount > 0 && (
                <b className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full border-2 border-surface bg-error px-1 text-[11px] text-on-error">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </b>
              )}
            </button>
            <div className="relative" ref={headerMenuRef}>
              <button
                type="button"
                aria-haspopup="menu"
                aria-expanded={isHeaderMenuOpen}
                onClick={() => setIsHeaderMenuOpen((open) => !open)}
                className="flex h-11 items-center gap-2 rounded-full border border-outline-variant/60 bg-surface-container-lowest pl-1 pr-2 hover:bg-surface-container-low"
              >
                <span
                  aria-hidden="true"
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-fixed font-extrabold text-on-primary-fixed-variant"
                >
                  {avatarInitial}
                </span>
                <b className="hidden max-w-[7rem] truncate text-[13px] sm:block">{username}</b>
                <span aria-hidden="true" className="material-symbols-outlined text-outline">
                  expand_more
                </span>
              </button>
              {isHeaderMenuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 top-[3.25rem] z-50 w-56 rounded-[18px] border border-outline-variant/40 bg-surface-container-lowest p-2 shadow-[0_18px_40px_-16px_rgba(25,28,29,0.4)]"
                >
                  <button
                    role="menuitem"
                    type="button"
                    className="flex min-h-11 w-full items-center gap-2.5 rounded-xl px-3 text-left text-sm font-semibold hover:bg-surface-container-low"
                    onClick={() => {
                      setIsHeaderMenuOpen(false);
                      onProfileClick();
                    }}
                  >
                    <span aria-hidden="true" className="material-symbols-outlined text-primary">
                      person
                    </span>
                    Hồ sơ của tôi
                  </button>
                  {onLogout && (
                    <>
                      <div className="mx-1 my-1.5 border-t border-outline-variant/40" />
                      <button
                        role="menuitem"
                        type="button"
                        className="flex min-h-11 w-full items-center gap-2.5 rounded-xl px-3 text-left text-sm font-semibold text-error hover:bg-error-container/20"
                        onClick={() => {
                          setIsHeaderMenuOpen(false);
                          onLogout();
                        }}
                      >
                        <span aria-hidden="true" className="material-symbols-outlined">
                          logout
                        </span>
                        Đăng xuất
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </header>

        <div className={contentClassName}>{children}</div>
      </main>

      {onDiagnoseClick && !hideAiBubble && (
        <AiChatBubble onClick={onDiagnoseClick} showTip={active === "home"} />
      )}
    </div>
    </VideoCallHost>
  );
}

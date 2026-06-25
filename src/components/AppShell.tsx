import { useState, type ReactNode } from "react";
import AppSidebar, { type AppSection } from "./AppSidebar";

export type AppShellProps = {
  active: AppSection;
  title: string;
  children: ReactNode;
  onHomeClick: () => void;
  onHistoryClick: () => void;
  onNotificationsClick: () => void;
  onProfileClick: () => void;
  onTrackingClick: () => void;
  onBookingClick?: () => void;
  onAddVehicleClick?: () => void;
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
  { label: "Lịch sử", icon: "history", section: "history" },
  { label: "Theo dõi", icon: "location_on", section: "tracking" },
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
  onBookingClick,
  onAddVehicleClick,
  onLogout,
  contentClassName = "app-shell-content",
}: AppShellProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);

  const handleNavigate = (section: AppSection) => {
    if (section === "home") onHomeClick();
    if (section === "history") onHistoryClick();
    if (section === "notifications") onNotificationsClick();
    if (section === "tracking") onTrackingClick();
    if (section === "profile") onProfileClick();
  };

  return (
    <div className="min-h-dvh bg-surface font-sans text-on-surface">
      <AppSidebar
        active={active}
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
          {navItems.map((item) => {
            const isActive = active === item.section;
            return (
              <button
                key={item.section}
                className={`flex w-full items-center gap-md rounded-lg px-md py-sm text-left transition-all ${
                  isActive
                    ? "bg-primary-container/20 text-primary"
                    : "text-on-surface-variant hover:bg-on-surface-variant/10"
                }`}
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
              M
            </div>
            <div className="min-w-0 flex-1 overflow-hidden">
              <p className="truncate font-label-md text-label-md text-on-surface">
                Minh Nguyễn
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

      <main className="min-h-screen bg-surface md:ml-60">
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-outline-variant bg-surface px-margin-mobile md:px-xl">
          <div className="flex items-center gap-3">
            <button
              className="-ml-2 rounded-full p-2 text-on-surface-variant transition-colors active:bg-surface-container md:hidden"
              type="button"
              aria-label="Mở menu"
              onClick={() => setIsSidebarOpen(true)}
            >
              <span className="material-symbols-outlined text-[28px]">menu</span>
            </button>
            <h1 className="font-headline-md text-headline-md text-on-surface">
              {title}
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
            {onAddVehicleClick && (
              <button
                className="hidden rounded-full bg-primary px-5 py-2 font-label-md text-label-md text-on-primary transition-all hover:bg-surface-tint md:block"
                type="button"
                onClick={onAddVehicleClick}
              >
                Thêm xe
              </button>
            )}
            {onBookingClick && (
              <button
                className="hidden rounded-full bg-primary px-5 py-2 font-label-md text-label-md text-on-primary transition-all hover:bg-surface-tint md:block"
                type="button"
                onClick={onBookingClick}
              >
                Đặt lịch
              </button>
            )}
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

        <div className={contentClassName}>{children}</div>
      </main>
    </div>
  );
}

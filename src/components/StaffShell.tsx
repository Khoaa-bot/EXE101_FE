import { useEffect, useRef, useState, type ReactNode } from "react";
import { useUnreadNotificationCount } from "../hooks/useUnreadNotificationCount";
import BrandLink from "./BrandLink";

export type StaffRole = "reception" | "engineer";

type NavDef = { key: string; icon: string; label: string };

// Mục điều hướng theo vai trò. Mục nào không có handler (và không phải trang hiện tại) sẽ được ẩn.
const NAV: Record<StaffRole, NavDef[]> = {
  reception: [
    { key: "dashboard", icon: "space_dashboard", label: "Tổng quan" },
    { key: "appointments", icon: "event_note", label: "Lịch hẹn" },
    { key: "schedule", icon: "calendar_month", label: "Lịch làm việc" },
    { key: "customers", icon: "groups", label: "Khách hàng" },
    { key: "new", icon: "add_circle", label: "Tạo lịch mới" },
  ],
  engineer: [
    { key: "dashboard", icon: "space_dashboard", label: "Tổng quan" },
    { key: "appointments", icon: "event_note", label: "Lịch hẹn" },
    { key: "schedule", icon: "calendar_month", label: "Lịch làm việc" },
    { key: "customers", icon: "groups", label: "Khách hàng" },
    { key: "technicians", icon: "engineering", label: "Kỹ thuật viên" },
    { key: "settings", icon: "settings", label: "Cài đặt" },
  ],
};

const ROLE_SUBTITLE: Record<StaffRole, string> = {
  reception: "Lễ tân",
  engineer: "Kỹ thuật viên",
};

export type StaffShellProps = {
  role: StaffRole;
  // Khóa của trang hiện tại trong NAV của vai trò.
  active: string;
  handlers: Partial<Record<string, (() => void) | undefined>>;
  userName: string;
  userDetail?: string;
  search?: { value: string; onChange: (value: string) => void; placeholder: string };
  onLogout?: () => void;
  onNotificationsClick?: () => void;
  children: ReactNode;
};

// Khung dùng chung cho Lễ tân và Kỹ thuật viên: thanh bên rail (rê chuột để mở),
// header kính mờ có tìm kiếm + tài khoản, và thanh điều hướng cuộn ngang trên điện thoại.
export default function StaffShell({
  role,
  active,
  handlers,
  userName,
  userDetail,
  search,
  onLogout,
  onNotificationsClick,
  children,
}: StaffShellProps) {
  const unreadCount = useUnreadNotificationCount();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const items = NAV[role].filter((item) => item.key === active || handlers[item.key]);
  const initial = (userName || "?").trim().charAt(0).toUpperCase();

  useEffect(() => {
    if (!menuOpen) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setMenuOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen]);

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-outline-variant bg-surface-container-lowest p-lg md:flex">
        <div className="mb-xl">
          <BrandLink className="flex items-center gap-2 text-primary">
            <span className="material-symbols-outlined text-3xl">electric_car</span>
            <span className="font-headline-lg text-headline-lg font-bold">Servio</span>
          </BrandLink>
          <p className="mt-1 text-xs text-on-surface-variant">{ROLE_SUBTITLE[role]}</p>
        </div>
        <nav className="space-y-1" aria-label={`Điều hướng ${ROLE_SUBTITLE[role]}`}>
          {items.map((item) => {
            const isCurrent = item.key === active;
            return (
              <button
                key={item.key}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left font-body-md text-body-md transition-colors active:scale-[0.98] ${
                  isCurrent
                    ? "bg-primary-container/15 font-semibold text-primary"
                    : "text-on-surface-variant hover:bg-surface-container-low"
                }`}
                type="button"
                aria-current={isCurrent ? "page" : undefined}
                onClick={() => handlers[item.key]?.()}
              >
                <span className="material-symbols-outlined">{item.icon}</span>
                {item.label}
              </button>
            );
          })}
        </nav>
        {onLogout && (
          <button
            onClick={onLogout}
            className="mt-auto flex items-center gap-3 rounded-lg px-3 py-2.5 text-error transition-colors hover:bg-error-container/10"
            type="button"
          >
            <span className="material-symbols-outlined">logout</span>
            Đăng xuất
          </button>
        )}
      </aside>

      <main className="min-h-[100dvh] md:ml-60">
        <header className="sticky top-0 z-20 flex h-[68px] items-center justify-between gap-3 border-b border-outline-variant/60 bg-surface/80 px-margin-mobile backdrop-blur-md md:px-margin-desktop">
          {search ? (
            <label className="flex h-11 w-full max-w-[26rem] items-center gap-2 rounded-full border border-outline-variant bg-surface-container-lowest px-3.5 text-outline focus-within:ring-2 focus-within:ring-primary">
              <span aria-hidden="true" className="material-symbols-outlined text-xl">
                search
              </span>
              <input
                aria-label={search.placeholder}
                className="min-w-0 flex-1 bg-transparent text-sm text-on-surface outline-none"
                placeholder={search.placeholder}
                value={search.value}
                onChange={(event) => search.onChange(event.target.value)}
              />
            </label>
          ) : (
            <span />
          )}
          <div className="flex items-center gap-3">
            {onNotificationsClick && (
              <button
                type="button"
                onClick={onNotificationsClick}
                aria-label={unreadCount > 0 ? `Thông báo, ${unreadCount} chưa đọc` : "Thông báo"}
                className="relative flex h-11 w-11 items-center justify-center rounded-full border border-outline-variant/60 bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container-high"
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
            )}
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                onClick={() => setMenuOpen((open) => !open)}
                className="flex h-11 items-center gap-2 rounded-full border border-outline-variant/60 bg-surface-container-lowest pl-1 pr-3 hover:bg-surface-container-low"
              >
                <span
                  aria-hidden="true"
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-fixed font-extrabold text-on-primary-fixed-variant"
                >
                  {initial}
                </span>
                <span className="hidden text-left leading-tight sm:block">
                  <b className="block max-w-[10rem] truncate text-[13px]">{userName}</b>
                  {userDetail && (
                    <span className="block max-w-[10rem] truncate text-[11px] text-on-surface-variant">{userDetail}</span>
                  )}
                </span>
                <span aria-hidden="true" className="material-symbols-outlined text-outline">
                  expand_more
                </span>
              </button>
              {menuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 top-[3.25rem] z-50 w-52 rounded-[18px] border border-outline-variant/40 bg-surface-container-lowest p-2 shadow-[0_18px_40px_-16px_rgba(25,28,29,0.4)]"
                >
                  <div className="px-3 py-2 text-xs text-on-surface-variant">
                    {ROLE_SUBTITLE[role]}
                    {userDetail ? ` · ${userDetail}` : ""}
                  </div>
                  {onLogout ? (
                    <button
                      role="menuitem"
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        onLogout();
                      }}
                      className="flex min-h-11 w-full items-center gap-2.5 rounded-xl px-3 text-left text-sm font-semibold text-error hover:bg-error-container/20"
                    >
                      <span aria-hidden="true" className="material-symbols-outlined">
                        logout
                      </span>
                      Đăng xuất
                    </button>
                  ) : null}
                </div>
              )}
            </div>
          </div>
        </header>

        <nav
          aria-label={`Điều hướng ${ROLE_SUBTITLE[role]}`}
          className="flex gap-2 overflow-x-auto border-b border-outline-variant/60 bg-surface px-margin-mobile py-2 md:hidden"
        >
          {items.map((item) => {
            const isCurrent = item.key === active;
            return (
              <button
                key={item.key}
                type="button"
                aria-current={isCurrent ? "page" : undefined}
                onClick={() => handlers[item.key]?.()}
                className={`inline-flex min-h-9 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3.5 text-[13px] font-semibold ${
                  isCurrent
                    ? "border-primary bg-primary-fixed text-on-primary-fixed-variant"
                    : "border-outline-variant bg-surface-container-lowest text-on-surface-variant"
                }`}
              >
                <span aria-hidden="true" className="material-symbols-outlined text-lg">
                  {item.icon}
                </span>
                {item.label}
              </button>
            );
          })}
          {onLogout && (
            <button
              type="button"
              onClick={onLogout}
              className="inline-flex min-h-9 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 text-[13px] font-semibold text-error"
            >
              Đăng xuất
            </button>
          )}
        </nav>

        {children}
      </main>
    </>
  );
}

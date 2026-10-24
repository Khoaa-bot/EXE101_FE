import { useEffect, useRef, useState, type ReactNode } from "react";
import { useDialogA11y } from "../../hooks/useDialogA11y";
import BrandLink from "../../components/BrandLink";

export type AdminTabKey =
  | "dashboard"
  | "engineers"
  | "customers"
  | "appointments"
  | "reviews"
  | "inventory"
  | "pricing"
  | "garage"
  | "wallet";

export interface AdminNavProps {
  onDashboardClick?: () => void;
  onEngineersClick?: () => void;
  onCustomersClick?: () => void;
  onAppointmentsClick?: () => void;
  onReviewsClick?: () => void;
  onInventoryClick?: () => void;
  onPricingClick?: () => void;
  onGarageClick?: () => void;
  onWalletClick?: () => void;
  onLogout?: () => void;
}

export type ShellNavigationItem = {
  key: string;
  icon: string;
  label: string;
  description: string;
  endAdornment?: ReactNode;
};

export interface AdminShellProps extends AdminNavProps {
  activeTab: string;
  title: string;
  description: string;
  headerAction?: ReactNode;
  garageName?: string;
  notice?: { type: "success" | "error"; message: string } | string | null;
  maxWidthClass?: string;
  navigationItems?: ShellNavigationItem[];
  onNavigationItemClick?: (key: string) => void;
  children: ReactNode;
}

const ADMIN_TABS: {
  key: AdminTabKey;
  icon: string;
  label: string;
  description: string;
}[] = [
  {
    key: "dashboard",
    icon: "space_dashboard",
    label: "Tổng quan",
    description: "Tình hình hoạt động của garage hôm nay và các chỉ số vận hành.",
  },
  {
    key: "engineers",
    icon: "engineering",
    label: "Nhân viên",
    description: "Quản lý hồ sơ nhân viên, kỹ thuật viên và nhân viên lễ tân.",
  },
  {
    key: "customers",
    icon: "groups",
    label: "Khách hàng",
    description: "Xem và quản lý danh sách khách hàng và phương tiện đã ghé garage.",
  },
  {
    key: "appointments",
    icon: "history",
    label: "Lịch sử lịch hẹn",
    description: "Toàn bộ lịch hẹn của garage, kể cả đã huỷ và đã bàn giao (chỉ xem).",
  },
  {
    key: "reviews",
    icon: "reviews",
    label: "Đánh giá",
    description: "Xem và phản hồi đánh giá của khách tại garage.",
  },
  {
    key: "inventory",
    icon: "inventory_2",
    label: "Kho linh kiện",
    description: "Kiểm kê, xuất nhập tồn linh kiện và phụ tùng tại garage.",
  },
  {
    key: "pricing",
    icon: "payments",
    label: "Bảng giá",
    description: "Bảng giá dịch vụ bảo dưỡng và sửa chữa do garage cung cấp.",
  },
  {
    key: "garage",
    icon: "storefront",
    label: "Thông tin garage",
    description: "Cập nhật hồ sơ, số điện thoại, địa chỉ và hình ảnh garage.",
  },
  {
    key: "wallet",
    icon: "account_balance_wallet",
    label: "Ví garage",
    description: "Số dư ví, yêu cầu rút tiền về tài khoản ngân hàng và lịch sử giao dịch.",
  },
];

export function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`inline-flex min-h-9 items-center gap-1.5 rounded-full border px-3.5 text-[13px] font-semibold transition-colors ${
        active
          ? "border-primary bg-primary-fixed text-on-primary-fixed-variant"
          : "border-outline-variant bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container-low"
      }`}
    >
      {children}
    </button>
  );
}

export function StatusPill({
  tone = "neutral",
  children,
}: {
  tone?: "success" | "warning" | "error" | "neutral" | "primary";
  children: ReactNode;
}) {
  const toneClasses = {
    success: "bg-[#d9f7dd] text-[#00531a]",
    warning: "bg-[#fff1cc] text-[#6b4200]",
    error: "bg-[#ffe4d6] text-[#7a2e00]",
    neutral: "bg-[#e9eaeb] text-[#3a3f4b]",
    primary: "bg-primary-fixed text-on-primary-fixed-variant",
  }[tone];

  const dotClasses = {
    success: "bg-[#00872d]",
    warning: "bg-[#c47f00]",
    error: "bg-[#ba1a1a]",
    neutral: "bg-outline",
    primary: "bg-primary",
  }[tone];

  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${toneClasses}`}
    >
      <i className={`h-[7px] w-[7px] rounded-full ${dotClasses}`} />
      {children}
    </span>
  );
}

export default function AdminShell({
  activeTab,
  title,
  description,
  headerAction,
  garageName,
  notice,
  maxWidthClass = "max-w-6xl",
  onDashboardClick,
  onEngineersClick,
  onCustomersClick,
  onAppointmentsClick,
  onReviewsClick,
  onInventoryClick,
  onPricingClick,
  onGarageClick,
  onWalletClick,
  onLogout,
  navigationItems,
  onNavigationItemClick,
  children,
}: AdminShellProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const sidebarRef = useRef<HTMLElement>(null);

  useEffect(() => {
    document.body.classList.toggle("overflow-hidden", isSidebarOpen);
    return () => document.body.classList.remove("overflow-hidden");
  }, [isSidebarOpen]);

  useDialogA11y(isSidebarOpen, sidebarRef, () => setIsSidebarOpen(false));

  const handleTabClick = (key: string) => {
    setIsSidebarOpen(false);
    if (onNavigationItemClick) {
      onNavigationItemClick(key);
      return;
    }

    switch (key) {
      case "dashboard":
        onDashboardClick?.();
        break;
      case "engineers":
        onEngineersClick?.();
        break;
      case "customers":
        onCustomersClick?.();
        break;
      case "appointments":
        onAppointmentsClick?.();
        break;
      case "reviews":
        onReviewsClick?.();
        break;
      case "inventory":
        onInventoryClick?.();
        break;
      case "pricing":
        onPricingClick?.();
        break;
      case "garage":
        onGarageClick?.();
        break;
      case "wallet":
        onWalletClick?.();
        break;
    }
  };

  const noticeMessage =
    typeof notice === "string" ? notice : notice?.message ?? null;
  const noticeType =
    typeof notice === "object" && notice?.type ? notice.type : "success";
  const displayedNavigationItems: ShellNavigationItem[] = navigationItems ?? ADMIN_TABS;

  return (
    <div className="min-h-[100dvh] bg-background font-sans text-on-surface">
      {/* Mobile Header */}
      <header className="sticky top-0 z-40 flex h-14 items-center gap-2 border-b border-outline-variant/60 bg-surface/80 px-margin-mobile backdrop-blur-md md:hidden">
        <button
          type="button"
          aria-label="Mở menu"
          aria-expanded={isSidebarOpen}
          onClick={() => setIsSidebarOpen((open) => !open)}
          className="-ml-2 rounded-full p-2 text-on-surface-variant transition-colors active:bg-surface-container"
        >
          <span className="material-symbols-outlined text-[28px]">menu</span>
        </button>
        <BrandLink className="flex items-center gap-2 text-primary">
          <span className="material-symbols-outlined text-2xl">electric_car</span>
          <span className="font-headline-md text-headline-md font-bold">Servio</span>
        </BrandLink>
      </header>
      {/* Desktop Sidebar */}
      <aside
        ref={sidebarRef}
        className={`fixed inset-y-0 left-0 z-[70] flex w-60 flex-col border-r border-outline-variant bg-surface-container-lowest p-lg transition-[transform,visibility] duration-300 ease-in-out md:translate-x-0 md:visible ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full invisible"
        }`}
      >
        <div className="mb-xl">
          <BrandLink className="flex items-center gap-2 text-primary">
            <span className="material-symbols-outlined text-3xl">electric_car</span>
            <span className="font-headline-lg text-headline-lg font-bold">Servio</span>
          </BrandLink>
          <p className="mt-1 text-xs text-on-surface-variant">
            Quản trị garage {garageName ? `· ${garageName}` : ""}
          </p>
        </div>

        <nav className="space-y-1">
          {displayedNavigationItems.map((t) => {
            const isCurrent = activeTab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => handleTabClick(t.key)}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left font-body-md text-body-md transition-colors ${
                  isCurrent
                    ? "bg-primary-container/15 font-semibold text-primary"
                    : "text-on-surface-variant hover:bg-surface-container-low"
                }`}
                type="button"
              >
                <span className="material-symbols-outlined">{t.icon}</span>
                {t.label}
                {t.endAdornment}
              </button>
            );
          })}
        </nav>

        {onLogout && (
          <button
            onClick={onLogout}
            className="mt-auto flex items-center gap-3 rounded-lg px-3 py-2.5 text-error hover:bg-error-container/10 transition-colors"
            type="button"
          >
            <span className="material-symbols-outlined">logout</span>
            Đăng xuất
          </button>
        )}
      </aside>

      {/* Mobile Drawer Backdrop */}
      {isSidebarOpen && (
        <div
          aria-hidden="true"
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 z-[60] bg-black/50 md:hidden"
        />
      )}

      {/* Main Content */}
      <main className="min-h-[100dvh] p-margin-mobile md:ml-60 md:p-margin-desktop">
        <div className={`mx-auto ${maxWidthClass}`}>
          {/* Page Header */}
          <div className="border-b border-outline-variant pb-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-extrabold tracking-tight">{title}</h1>
                <p className="mt-1 text-body-sm text-on-surface-variant">
                  {description}
                </p>
              </div>
              {headerAction && <div>{headerAction}</div>}
            </div>
          </div>

          {/* Children View */}
          <div className="mt-6">{children}</div>
        </div>
      </main>

      {/* Floating Toast Notification */}
      {noticeMessage && (
        <div
          className="fixed bottom-5 right-5 z-50 flex max-w-[24rem] animate-[toast-in_0.2s_ease-out] items-start gap-3 rounded-2xl border bg-surface-container-lowest px-4 py-3 text-body-sm shadow-lg"
          style={{
            borderColor:
              noticeType === "error"
                ? "var(--color-error)"
                : "var(--color-tertiary)",
          }}
          role="status"
        >
          <span
            className={`material-symbols-outlined mt-0.5 text-lg ${
              noticeType === "error" ? "text-error" : "text-tertiary"
            }`}
          >
            {noticeType === "error" ? "error" : "check_circle"}
          </span>
          <p className="text-on-surface">{noticeMessage}</p>
        </div>
      )}
    </div>
  );
}

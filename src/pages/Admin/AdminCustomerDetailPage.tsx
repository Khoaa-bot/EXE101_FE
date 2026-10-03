import { useState } from "react";
import { updateAdminCustomerNoShow } from "../../services/api";
import type { Customer } from "./AdminCustomersPage";

export type { Customer };

const navItems = [
  ["dashboard", "Dashboard"],
  ["engineering", "Nhân viên"],
  ["groups", "Khách hàng"],
  ["inventory_2", "Kho linh kiện"],
  ["payments", "Bảng giá"],
  ["storefront", "Thông tin garage"],
];

type AdminCustomerDetailPageProps = {
  customer: Customer;
  onBack: () => void;
  onDashboardClick?: () => void;
  onEngineersClick?: () => void;
  onCustomersClick?: () => void;
  onInventoryClick?: () => void;
  onPricingClick?: () => void;
  onGarageClick?: () => void;
  onLogout?: () => void;
};

export default function AdminCustomerDetailPage({
  customer,
  onBack,
  onDashboardClick,
  onEngineersClick,
  onCustomersClick,
  onInventoryClick,
  onPricingClick,
  onGarageClick,
  onLogout,
}: AdminCustomerDetailPageProps) {
  const [cust, setCust] = useState(customer);
  const [isUpdatingNoShow, setIsUpdatingNoShow] = useState(false);
  const [notice, setNotice] = useState("");

  const showNotice = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 3000);
  };

  const addNoShow = () => {
    const nextCount = cust.noShow + 1;
    setIsUpdatingNoShow(true);
    updateAdminCustomerNoShow(cust.id, nextCount)
      .then(() => {
        setCust((prev) => ({
          ...prev,
          noShow: nextCount,
          isBanned: prev.isBanned || nextCount > 3,
          state: prev.isBanned || nextCount > 3 ? "repair" : prev.state,
        }));
        showNotice(
          nextCount > 3
            ? "Đã ghi nhận không đến và cấm khách khỏi garage (quá 3 lần)."
            : "Đã ghi nhận thêm 1 lần không đến.",
        );
      })
      .catch((err) => {
        showNotice(
          err instanceof Error ? err.message : "Không thể cập nhật số lần không đến.",
        );
      })
      .finally(() => setIsUpdatingNoShow(false));
  };

  const handleNav = (label: string) => {
    if (label === "Dashboard") onDashboardClick?.();
    else if (label === "Nhân viên") onEngineersClick?.();
    else if (label === "Khách hàng") onCustomersClick?.();
    else if (label === "Kho linh kiện") onInventoryClick?.();
    else if (label === "Bảng giá") onPricingClick?.();
    else if (label === "Thông tin garage") onGarageClick?.();
  };

  return (
    <div className="min-h-[100dvh] bg-background font-sans text-on-surface">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-outline-variant bg-surface-container-lowest p-lg md:flex">
        <div className="mb-xl">
          <div className="flex items-center gap-2 text-primary">
            <span className="material-symbols-outlined text-3xl">electric_car</span>
            <span className="font-headline-lg text-headline-lg font-bold">Servio</span>
          </div>
          <p className="mt-1 text-xs text-on-surface-variant">Quản trị garage</p>
        </div>
        <nav className="space-y-1">
          {navItems.map(([icon, label]) => (
            <button
              key={label}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left font-body-md text-body-md transition-colors active:scale-[0.98] ${label === "Khách hàng" ? "bg-primary-container/15 font-semibold text-primary" : "text-on-surface-variant hover:bg-surface-container-low"}`}
              type="button"
              onClick={() => handleNav(label)}
            >
              <span className="material-symbols-outlined">{icon}</span>
              {label}
            </button>
          ))}
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

      <main className="min-h-[100dvh] md:ml-60">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-outline-variant bg-surface/95 px-margin-mobile backdrop-blur md:px-margin-desktop">
          <button className="rounded-full p-2 text-on-surface-variant md:hidden" type="button" aria-label="Mở menu">
            <span className="material-symbols-outlined">menu</span>
          </button>
          <h2 className="font-headline-md text-headline-md font-bold">Chi tiết khách hàng</h2>
          <div className="ml-auto flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-fixed font-bold text-on-primary-fixed">A</div>
          </div>
        </header>

        <div className="mx-auto max-w-[1440px] p-margin-mobile md:p-margin-desktop">
          <button onClick={onBack} className="inline-flex items-center gap-2 text-sm text-primary hover:underline mb-4">
            <span className="material-symbols-outlined text-base">arrow_back</span>
            Quay lại danh sách khách hàng
          </button>

          <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-primary-fixed text-primary flex items-center justify-center text-2xl font-bold">
                {cust.initials}
              </div>
              <div>
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-2xl md:text-3xl font-bold">{cust.name}</h1>
                  <span
                    className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                      cust.isBanned
                        ? "bg-error-container text-on-error-container"
                        : "bg-tertiary-container/20 text-tertiary"
                    }`}
                  >
                    {cust.isBanned ? "Đã cấm khỏi garage" : "Bình thường"}
                  </span>
                </div>
                <p className="text-sm text-on-surface-variant mt-1">Khách hàng · #{cust.id}</p>
              </div>
            </div>
            <button
              type="button"
              disabled={isUpdatingNoShow || cust.isBanned}
              onClick={addNoShow}
              className="inline-flex items-center gap-2 rounded-lg border border-outline-variant px-4 py-2.5 font-label-md text-label-md text-on-surface-variant hover:border-error hover:text-error disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span className="material-symbols-outlined text-base">person_off</span>
              {isUpdatingNoShow ? "Đang cập nhật..." : "Ghi nhận không đến"}
            </button>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="space-y-6">
              <article className="rounded-xl border border-outline-variant bg-surface-container-lowest p-lg space-y-4">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-on-surface-variant">Thông tin liên hệ</h2>
                <Row icon="mail" label="Email" value={cust.email} />
                <Row icon="phone" label="Số điện thoại" value={cust.phone} />
                <Row icon="calendar_today" label="Ngày đăng ký" value={cust.servicedAt} />
              </article>

              <article className="rounded-xl border border-outline-variant bg-surface-container-lowest p-lg space-y-4">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-on-surface-variant">Phương tiện</h2>
                <Row icon="directions_car" label="Số xe đăng ký" value={cust.vehicle} />
              </article>

              <article className="rounded-xl border border-outline-variant bg-surface-container-lowest p-lg space-y-4">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-on-surface-variant">Lịch sử không đến</h2>
                <Row icon="event_busy" label="Số lần không đến" value={String(cust.noShow)} />
                <p className="text-xs text-on-surface-variant">
                  Khách hàng bị tự động cấm khỏi garage này nếu số lần không đến vượt quá 3.
                </p>
              </article>
            </div>
          </div>
        </div>
      </main>

      {notice && (
        <div
          className="fixed bottom-5 right-5 z-50 rounded-lg bg-inverse-surface px-4 py-3 text-body-sm text-inverse-on-surface shadow-lg"
          role="status"
        >
          {notice}
        </div>
      )}
    </div>
  );
}

function Row({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="material-symbols-outlined text-base text-on-surface-variant mt-0.5">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-xs uppercase text-on-surface-variant font-semibold">{label}</p>
        <p className="text-sm break-words">{value}</p>
      </div>
    </div>
  );
}

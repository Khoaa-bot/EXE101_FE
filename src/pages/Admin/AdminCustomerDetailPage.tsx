import type { Customer } from "./AdminCustomersPage";
import AdminShell, { StatusPill, type AdminNavProps } from "./AdminShell";

export type { Customer };

export interface AdminCustomerDetailPageProps extends AdminNavProps {
  customer: Customer;
  onBack: () => void;
}

export default function AdminCustomerDetailPage({
  customer,
  onBack,
  ...navProps
}: AdminCustomerDetailPageProps) {
  const cust = customer;

  return (
    <AdminShell
      activeTab="customers"
      title="Chi tiết khách hàng"
      description={`Thông tin hồ sơ và phương tiện của ${cust.name}.`}
      headerAction={
        <button
          onClick={onBack}
          type="button"
          className="inline-flex items-center gap-1.5 rounded-xl border border-outline-variant bg-surface-container-lowest px-3.5 py-2 text-xs font-semibold text-on-surface transition-colors hover:bg-surface-container-low"
        >
          <span className="material-symbols-outlined text-base">arrow_back</span>
          Quay lại danh sách
        </button>
      }
      maxWidthClass="max-w-6xl"
      {...navProps}
    >
      {/* Top Banner Card */}
      <section className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-outline-variant/40 bg-surface-container-lowest p-6 shadow-[0_10px_26px_-14px_rgba(25,28,29,0.28)]">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-primary-fixed text-2xl font-bold text-on-primary-fixed-variant">
            {cust.initials}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-xl font-bold text-on-surface md:text-2xl">
                {cust.name}
              </h2>
              {cust.isBanned ? (
                <StatusPill tone="error">Bị chặn khỏi garage</StatusPill>
              ) : (
                <StatusPill tone="success">Hoạt động bình thường</StatusPill>
              )}
            </div>
            <p className="mt-1 text-xs text-on-surface-variant">
              Mã khách hàng: #{cust.id} · Đã đăng ký {cust.vehicle}
            </p>
          </div>
        </div>
      </section>

      {/* Detail Cards Grid */}
      <div className="grid gap-6 md:grid-cols-3">
        <article className="rounded-2xl border border-outline-variant/40 bg-surface-container-lowest p-5 shadow-[0_10px_26px_-14px_rgba(25,28,29,0.28)]">
          <div className="mb-4 flex items-center gap-2.5 border-b border-outline-variant/40 pb-3">
            <span className="material-symbols-outlined text-primary text-xl">contact_mail</span>
            <h3 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
              Thông tin liên hệ
            </h3>
          </div>
          <div className="space-y-4">
            <Row icon="mail" label="Email" value={cust.email || "—"} />
            <Row icon="phone" label="Số điện thoại" value={cust.phone || "—"} />
            <Row icon="calendar_today" label="Ngày tham gia" value={cust.servicedAt || "—"} />
          </div>
        </article>

        <article className="rounded-2xl border border-outline-variant/40 bg-surface-container-lowest p-5 shadow-[0_10px_26px_-14px_rgba(25,28,29,0.28)]">
          <div className="mb-4 flex items-center gap-2.5 border-b border-outline-variant/40 pb-3">
            <span className="material-symbols-outlined text-primary text-xl">electric_car</span>
            <h3 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
              Phương tiện
            </h3>
          </div>
          <div className="space-y-4">
            <Row icon="directions_car" label="Số xe đăng ký" value={cust.vehicle} />
            <Row icon="pin" label="Biển số mặc định" value={cust.plate || "—"} />
          </div>
        </article>

        <article className="rounded-2xl border border-outline-variant/40 bg-surface-container-lowest p-5 shadow-[0_10px_26px_-14px_rgba(25,28,29,0.28)]">
          <div className="mb-4 flex items-center gap-2.5 border-b border-outline-variant/40 pb-3">
            <span className="material-symbols-outlined text-primary text-xl">history</span>
            <h3 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
              Chỉ số lịch hẹn
            </h3>
          </div>
          <div className="space-y-4">
            <Row
              icon="event_busy"
              label="Số lần không đến"
              value={`${cust.noShow} lần`}
              highlight={cust.noShow > 0}
            />
          </div>
        </article>
      </div>
    </AdminShell>
  );
}

function Row({
  icon,
  label,
  value,
  highlight = false,
}: {
  icon: string;
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="material-symbols-outlined mt-0.5 text-base text-on-surface-variant">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-bold uppercase text-on-surface-variant">
          {label}
        </p>
        <p
          className={`text-sm break-words ${
            highlight ? "font-bold text-error" : "font-medium text-on-surface"
          }`}
        >
          {value}
        </p>
      </div>
    </div>
  );
}

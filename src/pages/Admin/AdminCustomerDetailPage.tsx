import { useState } from "react";

export type Customer = {
  id: string;
  name: string;
  initials: string;
  phone: string;
  email: string;
  vehicle: string;
  plate: string;
  servicedAt: string;
  state: "all" | "repair" | "vip";
};

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
  const [editOpen, setEditOpen] = useState(false);
  const [form, setForm] = useState({
    name: cust.name,
    email: cust.email,
    phone: cust.phone,
  });
  const [note, setNote] = useState("");
  const [notice, setNotice] = useState("");

  const showNotice = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 3000);
  };

  const saveEdit = () => {
    setCust({ ...cust, name: form.name, email: form.email, phone: form.phone });
    setEditOpen(false);
    showNotice("Đã cập nhật hồ sơ khách hàng");
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
                      cust.state === "vip"
                        ? "bg-warning text-on-surface"
                        : cust.state === "repair"
                          ? "bg-tertiary-container text-on-tertiary-container"
                          : "bg-surface-container-high text-on-surface-variant"
                    }`}
                  >
                    {cust.state === "vip" ? "VIP" : cust.state === "repair" ? "Đang sửa" : "Bình thường"}
                  </span>
                </div>
                <p className="text-sm text-on-surface-variant mt-1">Khách hàng · #{cust.id}</p>
              </div>
            </div>
            <button
              className="inline-flex items-center gap-2 rounded-lg border border-outline-variant px-4 py-2.5 font-label-md text-label-md text-on-surface-variant hover:border-primary hover:text-primary"
              type="button"
              onClick={() => setEditOpen(true)}
            >
              <span className="material-symbols-outlined text-base">edit</span>
              Sửa hồ sơ
            </button>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="space-y-6">
              <article className="rounded-xl border border-outline-variant bg-surface-container-lowest p-lg space-y-4">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-on-surface-variant">Thông tin liên hệ</h2>
                <Row icon="mail" label="Email" value={cust.email} />
                <Row icon="phone" label="Số điện thoại" value={cust.phone} />
                <Row icon="calendar_today" label="Lần bảo dưỡng cuối" value={cust.servicedAt} />
              </article>

              <article className="rounded-xl border border-outline-variant bg-surface-container-lowest p-lg space-y-4">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-on-surface-variant">Phương tiện</h2>
                <Row icon="directions_car" label="Xe" value={cust.vehicle} />
                <Row icon="pin" label="Biển số" value={cust.plate} />
              </article>
            </div>

            <div className="lg:col-span-2 space-y-6">
              <article className="rounded-xl border border-outline-variant bg-surface-container-lowest">
                <div className="border-b border-outline-variant p-lg">
                  <h3 className="font-headline-md text-headline-md font-bold">Ghi chú nội bộ</h3>
                </div>
                <div className="p-lg space-y-3">
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Nhập nhận xét về khách hàng này..."
                    rows={5}
                    className="w-full rounded-lg border border-outline-variant bg-surface-container-low px-4 py-2.5 text-body-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
                  />
                  <div className="flex justify-end">
                    <button
                      className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 font-label-md text-label-md text-on-primary active:scale-[0.98]"
                      type="button"
                      onClick={() => showNotice("Đã lưu ghi chú")}
                    >
                      <span className="material-symbols-outlined text-base">save</span>
                      Lưu ghi chú
                    </button>
                  </div>
                </div>
              </article>
            </div>
          </div>
        </div>
      </main>

      {editOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-[28rem] rounded-2xl border border-outline-variant bg-surface-container-lowest p-6 shadow-xl">
            <div className="flex items-start justify-between border-b border-outline-variant pb-4">
              <div>
                <h3 className="font-headline-md text-lg font-bold">Chỉnh sửa hồ sơ</h3>
                <p className="text-xs text-outline">Cập nhật tên, email và số điện thoại khách hàng.</p>
              </div>
              <button
                type="button"
                onClick={() => setEditOpen(false)}
                className="rounded-full p-1 text-outline hover:bg-surface-container hover:text-on-surface"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="mt-4 space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-on-surface-variant">Họ và tên</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full rounded-lg border border-outline-variant bg-surface-container-low px-4 py-2.5 text-body-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-on-surface-variant">Email</label>
                <input
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full rounded-lg border border-outline-variant bg-surface-container-low px-4 py-2.5 text-body-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-on-surface-variant">Số điện thoại</label>
                <input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full rounded-lg border border-outline-variant bg-surface-container-low px-4 py-2.5 text-body-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditOpen(false)}
                className="rounded-lg border border-outline-variant px-4 py-2 text-xs font-semibold text-on-surface-variant"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={saveEdit}
                className="rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-on-primary"
              >
                Lưu thay đổi
              </button>
            </div>
          </div>
        </div>
      )}

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

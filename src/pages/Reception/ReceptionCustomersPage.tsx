import { useState } from "react";

const navItems = [
  ["dashboard", "Dashboard"],
  ["calendar_today", "Schedule"],
  ["event_note", "Appointments"],
  ["person", "Customers"],
];

type Customer = {
  initials: string; tone: string; name: string; cid: string;
  phone: string; email: string; vehicle: string; plate: string; last: string;
};

const TONES = [
  "bg-primary-container/10 text-primary",
  "bg-secondary-container text-on-secondary-container",
  "bg-tertiary-container/10 text-tertiary",
  "bg-error-container/10 text-on-error-container",
];

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "KH";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const STATS = [
  { label: "Tổng khách hàng", value: "1,284", delta: "+12%", icon: "group", tone: "bg-primary-container/10 text-primary" },
  { label: "Xe đang đăng ký", value: "1,452", delta: "+5.4%", icon: "directions_car", tone: "bg-tertiary-container/10 text-tertiary" },
  { label: "Khách mới tháng này", value: "86", delta: "", icon: "person_add", tone: "bg-error-container/10 text-on-error-container" },
  { label: "Đánh giá trung bình", value: "4.9 / 5", delta: "98%", icon: "star", tone: "bg-secondary-container text-on-secondary-container" },
];

const INIT_CUSTOMERS: Customer[] = [
  { initials: "NM", tone: "bg-primary-container/10 text-primary", name: "Nguyễn Văn Minh", cid: "CUS-92831", phone: "091 234 5678", email: "minh.nguyen@email.com", vehicle: "Toyota Vios", plate: "51H-123.45", last: "15/06/2024" },
  { initials: "TN", tone: "bg-secondary-container text-on-secondary-container", name: "Trần Hoàng Nam", cid: "CUS-88210", phone: "098 765 4321", email: "nam.tran@email.com", vehicle: "Mazda CX-5", plate: "30E-678.90", last: "03/06/2024" },
  { initials: "LT", tone: "bg-tertiary-container/10 text-tertiary", name: "Lê Thanh Tâm", cid: "CUS-71249", phone: "090 112 2334", email: "tam.le@email.com", vehicle: "VinFast VF8", plate: "51A-111.11", last: "28/05/2024" },
  { initials: "PH", tone: "bg-error-container/10 text-on-error-container", name: "Phạm Quốc Huy", cid: "CUS-60552", phone: "094 556 7788", email: "huy.pham@email.com", vehicle: "Honda CR-V", plate: "60K-234.56", last: "12/05/2024" },
  { initials: "AT", tone: "bg-primary-container/10 text-primary", name: "Hoàng Anh Tuấn", cid: "CUS-44219", phone: "093 223 4455", email: "tuan.hoang@email.com", vehicle: "Toyota Corolla Altis", plate: "51F-987.65", last: "10/05/2024" },
];

const ACTIVITY = [
  { title: "Bảo dưỡng định kỳ hoàn tất", desc: "Xe 51H-123.45 (Nguyễn Văn Minh) đã hoàn thành quy trình bảo dưỡng 10.000km.", time: "2 giờ trước", icon: "build", tone: "bg-primary text-on-primary" },
  { title: "Khách hàng mới đăng ký", desc: "Trần Thị Mai (Xe: VinFast VF9) đã đăng ký thành công trên ứng dụng SERVIO.", time: "5 giờ trước", icon: "person_add", tone: "bg-error text-on-error" },
  { title: "Đánh giá 5 sao mới", desc: "Khách hàng Lê Văn Cường đã để lại phản hồi tốt về dịch vụ sửa chữa điều hoà.", time: "1 ngày trước", icon: "star", tone: "bg-tertiary text-on-tertiary" },
];

type ReceptionCustomersPageProps = {
  onDashboardClick?: () => void;
  onScheduleClick?: () => void;
  onAppointmentsClick?: () => void;
  onCustomersClick?: () => void;
  onLogout?: () => void;
};

export default function ReceptionCustomersPage({
  onDashboardClick,
  onScheduleClick,
  onAppointmentsClick,
  onCustomersClick,
  onLogout,
}: ReceptionCustomersPageProps) {
  const [filter, setFilter] = useState<"all" | "active" | "vip">("all");
  const [customers, setCustomers] = useState<Customer[]>(INIT_CUSTOMERS);
  const [open, setOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const [form, setForm] = useState({ name: "", phone: "", email: "", vehicle: "", plate: "" });

  const resetForm = () => setForm({ name: "", phone: "", email: "", vehicle: "", plate: "" });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim() || !form.plate.trim()) {
      setNotice("Vui lòng nhập đầy đủ Tên, SĐT và Biển số");
      return;
    }
    const now = new Date();
    const dd = String(now.getDate()).padStart(2, "0");
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const newCustomer: Customer = {
      initials: getInitials(form.name),
      tone: TONES[customers.length % TONES.length],
      name: form.name.trim(),
      cid: `CUS-${Math.floor(10000 + Math.random() * 90000)}`,
      phone: form.phone.trim(),
      email: form.email.trim(),
      vehicle: form.vehicle.trim() || "—",
      plate: form.plate.trim().toUpperCase(),
      last: `${dd}/${mm}/${now.getFullYear()}`,
    };
    setCustomers((prev) => [newCustomer, ...prev]);
    setNotice("Đăng ký khách hàng mới thành công");
    resetForm();
    setOpen(false);
  };

  return (
    <div className="min-h-[100dvh] bg-background font-sans text-on-surface">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-outline-variant bg-surface-container-lowest p-lg md:flex">
        <div className="mb-xl">
          <div className="flex items-center gap-2 text-primary">
            <span className="material-symbols-outlined text-3xl">electric_car</span>
            <span className="font-headline-lg text-headline-lg font-bold">Servio</span>
          </div>
          <p className="mt-1 text-xs text-on-surface-variant">Garage Lễ tân</p>
        </div>
        <nav className="space-y-1">
          {navItems.map(([icon, label]) => {
            const isCurrent = label === "Customers";
            return (
              <button
                key={label}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left font-body-md text-body-md transition-colors active:scale-[0.98] ${
                  isCurrent
                    ? "bg-primary-container/15 font-semibold text-primary"
                    : "text-on-surface-variant hover:bg-surface-container-low"
                }`}
                type="button"
                onClick={() => {
                  if (label === "Dashboard") onDashboardClick?.();
                  else if (label === "Schedule") onScheduleClick?.();
                  else if (label === "Appointments") onAppointmentsClick?.();
                  else if (label === "Customers") onCustomersClick?.();
                }}
              >
                <span className="material-symbols-outlined">{icon}</span>
                {label}
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

      <main className="min-h-[100dvh] md:ml-60">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-outline-variant bg-surface/95 px-4 backdrop-blur md:px-8">
          <button className="rounded-full p-2 text-on-surface-variant md:hidden" type="button" aria-label="Mở menu">
            <span className="material-symbols-outlined">menu</span>
          </button>
          <label className="relative hidden w-full max-w-md md:block">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">search</span>
            <input
              className="w-full rounded-full border border-outline-variant bg-surface-container-low px-4 py-2 pl-10 text-body-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
              placeholder="Tìm kiếm khách hàng hoặc biển số..."
            />
          </label>
          <div className="ml-auto flex items-center gap-2">
            <button className="rounded-full p-2 text-on-surface-variant hover:bg-surface-container" type="button" aria-label="Thông báo">
              <span className="material-symbols-outlined">notifications</span>
            </button>
            <div className="ml-2 flex items-center gap-2 border-l border-outline-variant pl-3">
              <div className="hidden text-right sm:block">
                <p className="font-label-md text-label-md">Nguyễn Lễ Tân</p>
                <p className="text-[11px] text-on-surface-variant">Lễ tân</p>
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-fixed font-bold text-on-primary-fixed">L</div>
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-[1440px] p-4 md:p-8">
          {notice && (
            <div className="mb-4 rounded-lg bg-primary-container/10 text-primary px-4 py-3 text-sm font-medium">{notice}</div>
          )}

          <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">Quản lý Khách hàng</h1>
              <p className="text-on-surface-variant mt-1">Xem và quản lý danh sách khách hàng và phương tiện tại hệ thống.</p>
            </div>
            <div className="flex gap-2">
              <button
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-on-primary hover:bg-primary/90 transition-colors active:scale-[0.98]"
                onClick={() => setOpen(true)}
              >
                <span className="material-symbols-outlined text-lg">person_add</span>
                Thêm khách hàng
              </button>
              <button className="inline-flex items-center gap-2 rounded-lg border border-outline-variant bg-surface-container-lowest px-4 py-2.5 text-sm font-medium hover:bg-surface-container-low transition-colors active:scale-[0.98]">
                <span className="material-symbols-outlined text-lg">download</span>
                Xuất báo cáo
              </button>
            </div>
          </div>

          <div className="grid gap-4 grid-cols-2 lg:grid-cols-4 mb-6">
            {STATS.map((s) => (
              <article key={s.label} className="rounded-xl border border-outline-variant bg-surface-container-lowest p-5">
                <div className="flex items-start justify-between gap-2">
                  <span className={`grid h-11 w-11 place-items-center rounded-lg ${s.tone}`}>
                    <span className="material-symbols-outlined">{s.icon}</span>
                  </span>
                  {s.delta && (
                    <span className="text-xs text-tertiary font-medium inline-flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">trending_up</span>{s.delta}
                    </span>
                  )}
                </div>
                <p className="text-xs uppercase tracking-wide text-on-surface-variant mt-3">{s.label}</p>
                <p className="text-2xl font-bold mt-1">{s.value}</p>
              </article>
            ))}
          </div>

          <article className="mb-4 rounded-xl border border-outline-variant bg-surface-container-lowest">
            <div className="p-4 flex flex-wrap items-center gap-3">
              <div className="inline-flex rounded-lg border border-outline-variant bg-surface-container-low p-1">
                {(["all", "active", "vip"] as const).map((k) => (
                  <button
                    key={k}
                    onClick={() => setFilter(k)}
                    className={`px-3 py-1.5 text-sm rounded-md ${filter === k ? "bg-primary-container/10 text-primary font-medium" : "text-on-surface-variant"}`}
                  >
                    {k === "all" ? "Tất cả" : k === "active" ? "Đang sửa" : "VIP"}
                  </button>
                ))}
              </div>
              <button className="inline-flex items-center gap-2 rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-1.5 text-sm font-medium hover:bg-surface-container-low transition-colors">
                <span className="material-symbols-outlined text-lg">filter_list</span>
                Lọc thêm
              </button>
              <p className="ml-auto text-sm text-on-surface-variant">Đang hiển thị {customers.length} khách hàng</p>
            </div>
          </article>

          <article className="mb-6 rounded-xl border border-outline-variant bg-surface-container-lowest">
            <div className="p-0 overflow-x-auto">
              <table className="w-full min-w-[900px] text-sm">
                <thead>
                  <tr className="text-xs uppercase text-on-surface-variant border-b border-outline-variant">
                    <th className="text-left font-medium p-4">Khách hàng</th>
                    <th className="text-left font-medium p-4">Liên hệ</th>
                    <th className="text-left font-medium p-4">Phương tiện</th>
                    <th className="text-left font-medium p-4">Biển số</th>
                    <th className="text-left font-medium p-4">Lần bảo dưỡng cuối</th>
                    <th className="text-right font-medium p-4">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((c) => (
                    <tr key={c.cid} className="border-b border-outline-variant last:border-0">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-full font-semibold ${c.tone}`}>
                            {c.initials}
                          </div>
                          <div>
                            <p className="font-semibold">{c.name}</p>
                            <p className="text-xs text-on-surface-variant">ID: #{c.cid}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <p>{c.phone}</p>
                        <p className="text-xs text-on-surface-variant">{c.email}</p>
                      </td>
                      <td className="p-4">
                        <span className="inline-flex items-center gap-1">
                          <span className="material-symbols-outlined text-on-surface-variant">directions_car</span>
                          {c.vehicle}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="shrink-0 rounded-full bg-primary-container/10 text-primary px-2 py-1 text-[10px] font-semibold">{c.plate}</span>
                      </td>
                      <td className="p-4">{c.last}</td>
                      <td className="p-4 text-right">
                        <div className="inline-flex items-center gap-2">
                          <button className="rounded-full p-2 text-on-surface-variant hover:bg-surface-container" type="button" aria-label="Nhắn tin">
                            <span className="material-symbols-outlined">chat</span>
                          </button>
                          <button className="inline-flex items-center gap-1 rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-1.5 text-sm font-medium hover:bg-surface-container-low transition-colors">
                            Chi tiết
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>

          <div className="grid gap-4 lg:grid-cols-3">
            <article className="lg:col-span-2 rounded-xl border border-outline-variant bg-surface-container-lowest">
              <div className="p-5">
                <h2 className="text-lg font-semibold mb-4">Hoạt động gần đây</h2>
                <ul className="space-y-4">
                  {ACTIVITY.map((a) => (
                    <li key={a.title} className="flex gap-3">
                      <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${a.tone}`}>
                        <span className="material-symbols-outlined">{a.icon}</span>
                      </span>
                      <div>
                        <p className="text-sm font-semibold">{a.title}</p>
                        <p className="text-sm text-on-surface-variant">{a.desc}</p>
                        <p className="text-xs text-on-surface-variant mt-1">{a.time}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </article>
            <article className="rounded-xl border border-outline-variant bg-surface-container-lowest">
              <div className="p-5 text-center">
                <h2 className="text-lg font-semibold">Tình trạng hệ thống</h2>
                <div className="relative mx-auto my-6 h-32 w-32">
                  <div className="absolute inset-0 rounded-full border-8 border-tertiary/20" />
                  <div className="absolute inset-0 grid place-items-center text-2xl font-bold text-tertiary">99%</div>
                </div>
                <p className="text-sm text-on-surface-variant">Mọi hệ thống đang hoạt động ổn định. Không có cảnh báo lỗi mới.</p>
                <button className="mt-2 text-sm text-primary hover:underline">Xem chi tiết →</button>
              </div>
            </article>
          </div>
        </div>
      </main>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50" onClick={() => { setOpen(false); resetForm(); }} />
          <div className="relative bg-surface-container-lowest rounded-xl shadow-lg w-full max-w-[520px] mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Đăng ký Khách hàng mới</h2>
              <button
                className="rounded-full p-2 text-on-surface-variant hover:bg-surface-container"
                onClick={() => { setOpen(false); resetForm(); }}
                type="button"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <p className="text-sm text-on-surface-variant mb-4">Nhập thông tin khách hàng và phương tiện để thêm vào danh sách.</p>
            <form onSubmit={handleSubmit} className="grid gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Tên khách hàng</label>
                <input
                  id="cust-name"
                  placeholder="Họ và tên"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  autoFocus
                  className="w-full h-11 rounded-lg border border-outline-variant bg-surface-container-low px-4 text-sm outline-none focus:border-primary"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Số điện thoại</label>
                  <input
                    id="cust-phone"
                    type="tel"
                    placeholder="09x xxx xxxx"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full h-11 rounded-lg border border-outline-variant bg-surface-container-low px-4 text-sm outline-none focus:border-primary"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Email</label>
                  <input
                    id="cust-email"
                    type="email"
                    placeholder="email@domain.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full h-11 rounded-lg border border-outline-variant bg-surface-container-low px-4 text-sm outline-none focus:border-primary"
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Loại phương tiện</label>
                  <input
                    id="cust-vehicle"
                    placeholder="Toyota Vios, Mazda CX-5..."
                    value={form.vehicle}
                    onChange={(e) => setForm({ ...form, vehicle: e.target.value })}
                    className="w-full h-11 rounded-lg border border-outline-variant bg-surface-container-low px-4 text-sm outline-none focus:border-primary"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Biển số xe</label>
                  <input
                    id="cust-plate"
                    placeholder="51H-123.45"
                    value={form.plate}
                    onChange={(e) => setForm({ ...form, plate: e.target.value })}
                    className="w-full h-11 rounded-lg border border-outline-variant bg-surface-container-low px-4 text-sm outline-none focus:border-primary"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-2">
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-lg border border-outline-variant bg-surface-container-lowest px-4 py-2.5 text-sm font-medium hover:bg-surface-container-low transition-colors"
                  onClick={() => { setOpen(false); resetForm(); }}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-on-primary hover:bg-primary/90 transition-colors active:scale-[0.98]"
                >
                  <span className="material-symbols-outlined text-lg">person_add</span>
                  Đăng ký
                </button>
              </div>
            </form>
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

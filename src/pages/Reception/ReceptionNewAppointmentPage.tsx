import { useState, useMemo } from "react";

const navItems = [
  ["dashboard", "Dashboard"],
  ["calendar_today", "Schedule"],
  ["event_note", "Appointments"],
  ["person", "Customers"],
];

type ServiceId = "level1" | "level2" | "level3";
type GarageId = "q1" | "q2" | "q3";

const SERVICE_TYPES: { id: ServiceId; label: string }[] = [
  { id: "level1", label: "Kiểm tra tổng quát" },
  { id: "level2", label: "Bảo dưỡng định kỳ" },
  { id: "level3", label: "Sửa chữa chuyên sâu" },
];

const GARAGES: { id: GarageId; name: string }[] = [
  { id: "q1", name: "Garage Quận 1" },
  { id: "q2", name: "Garage Quận 2" },
  { id: "q3", name: "Garage Quận 3" },
];

const PRICING: Record<GarageId, Record<ServiceId, number>> = {
  q1: { level1: 500000, level2: 1200000, level3: 2500000 },
  q2: { level1: 450000, level2: 1100000, level3: 2300000 },
  q3: { level1: 480000, level2: 1150000, level3: 2400000 },
};

function formatVND(amount: number) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);
}

type ReceptionNewAppointmentPageProps = {
  onDashboardClick?: () => void;
  onScheduleClick?: () => void;
  onAppointmentsClick?: () => void;
  onCustomersClick?: () => void;
  onLogout?: () => void;
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium">{label}</label>
      {children}
    </div>
  );
}

export default function ReceptionNewAppointmentPage({
  onDashboardClick,
  onScheduleClick,
  onAppointmentsClick,
  onCustomersClick,
  onLogout,
}: ReceptionNewAppointmentPageProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [plate, setPlate] = useState("");
  const [vehicle, setVehicle] = useState("VinFast VF8");
  const [garage, setGarage] = useState<GarageId>("q1");
  const [service, setService] = useState<ServiceId>("level1");
  const [notice, setNotice] = useState("");

  const price = PRICING[garage][service];
  const selectedService = useMemo(() => SERVICE_TYPES.find((s) => s.id === service)!, [service]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || !plate.trim()) {
      setNotice("Vui lòng nhập tên khách, số điện thoại và biển số xe.");
      return;
    }
    setNotice(`Đã tạo lịch hẹn cho ${name} (${plate}).`);
    window.setTimeout(() => onAppointmentsClick?.(), 1000);
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
            const isCurrent = label === "Appointments";
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
          <div className="ml-auto flex items-center gap-2">
            <button className="rounded-full p-2 text-on-surface-variant hover:bg-surface-container" type="button" aria-label="Thông báo">
              <span className="material-symbols-outlined">notifications</span>
            </button>
            <div className="ml-2 flex items-center gap-2 border-l border-outline-variant pl-3">
              <div className="hidden text-right sm:block">
                <p className="font-label-md text-label-md">Nguyễn Lễ Tân</p>
                <p className="text-[11px] text-on-surface-variant">Lễ tân</p>
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-fixed font-bold text-on-primary-fixed">
                L
              </div>
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-[1440px] p-4 md:p-8">
          {notice && (
            <div className="mb-4 rounded-lg bg-primary-container/10 text-primary px-4 py-3 text-sm font-medium">{notice}</div>
          )}

          <button
            onClick={onAppointmentsClick}
            className="inline-flex items-center gap-2 text-sm text-primary hover:underline mb-4"
          >
            <span className="material-symbols-outlined">arrow_back</span>
            Quay lại danh sách lịch hẹn
          </button>

          <form onSubmit={onSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <article className="lg:col-span-2 rounded-xl border border-outline-variant bg-surface-container-lowest">
              <div className="p-6 md:p-8 space-y-8">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold">Tạo lịch hẹn mới</h1>
                  <p className="text-sm text-on-surface-variant mt-1">
                    Ghi nhận yêu cầu đặt lịch giúp khách hàng gọi trực tiếp đến quầy lễ tân.
                  </p>
                </div>

                <section className="space-y-4">
                  <h2 className="text-sm font-semibold uppercase tracking-wide text-on-surface-variant flex items-center gap-2">
                    <span className="material-symbols-outlined">person</span>
                    Thông tin khách hàng
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <Field label="Họ và tên">
                      <input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="VD: Nguyễn Văn An"
                        className="w-full h-11 rounded-lg border border-outline-variant bg-surface-container-low px-4 text-sm outline-none focus:border-primary"
                      />
                    </Field>
                    <Field label="Số điện thoại">
                      <div className="relative">
                        <span className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">phone</span>
                        <input
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="+84 90 123 4567"
                          className="w-full h-11 rounded-lg border border-outline-variant bg-surface-container-low pl-9 pr-4 text-sm outline-none focus:border-primary"
                        />
                      </div>
                    </Field>
                    <Field label="Email">
                      <div className="relative">
                        <span className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">mail</span>
                        <input
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          type="email"
                          placeholder="khach@email.com"
                          className="w-full h-11 rounded-lg border border-outline-variant bg-surface-container-low pl-9 pr-4 text-sm outline-none focus:border-primary"
                        />
                      </div>
                    </Field>
                    <Field label="Biển số xe">
                      <input
                        value={plate}
                        onChange={(e) => setPlate(e.target.value)}
                        placeholder="VD: 30F-123.45"
                        className="w-full h-11 rounded-lg border border-outline-variant bg-surface-container-low px-4 text-sm outline-none focus:border-primary"
                      />
                    </Field>
                  </div>
                </section>

                <section className="space-y-4">
                  <h2 className="text-sm font-semibold uppercase tracking-wide text-on-surface-variant flex items-center gap-2">
                    <span className="material-symbols-outlined">directions_car</span>
                    Xe & Dịch vụ
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <Field label="Chọn xe">
                      <select
                        value={vehicle}
                        onChange={(e) => setVehicle(e.target.value)}
                        className="w-full h-11 rounded-lg border border-outline-variant bg-surface-container-low px-4 text-sm outline-none focus:border-primary"
                      >
                        <option>VinFast VF8</option>
                        <option>VinFast VF e34</option>
                        <option>Tesla Model Y</option>
                        <option>Hyundai Kona EV</option>
                        <option>Toyota Corolla Cross</option>
                      </select>
                    </Field>
                    <Field label="Loại dịch vụ">
                      <select
                        value={service}
                        onChange={(e) => setService(e.target.value as ServiceId)}
                        className="w-full h-11 rounded-lg border border-outline-variant bg-surface-container-low px-4 text-sm outline-none focus:border-primary"
                      >
                        {SERVICE_TYPES.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.label} — {formatVND(PRICING[garage][s.id])}
                          </option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Chọn Garage">
                      <select
                        value={garage}
                        onChange={(e) => setGarage(e.target.value as GarageId)}
                        className="w-full h-11 rounded-lg border border-outline-variant bg-surface-container-low px-4 text-sm outline-none focus:border-primary"
                      >
                        {GARAGES.map((g) => (
                          <option key={g.id} value={g.id}>{g.name}</option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Ngày hẹn">
                      <input
                        type="date"
                        defaultValue="2026-07-16"
                        className="w-full h-11 rounded-lg border border-outline-variant bg-surface-container-low px-4 text-sm outline-none focus:border-primary"
                      />
                    </Field>
                    <Field label="Khung giờ">
                      <select className="w-full h-11 rounded-lg border border-outline-variant bg-surface-container-low px-4 text-sm outline-none focus:border-primary">
                        <option>08:00 - 09:30 (Slot A)</option>
                        <option>09:30 - 11:00 (Slot B)</option>
                        <option>14:00 - 15:30 (Slot C)</option>
                        <option>15:30 - 17:00 (Slot D)</option>
                      </select>
                    </Field>
                  </div>
                  <Field label="Ghi chú">
                    <textarea
                      rows={4}
                      placeholder="Ghi chú tình trạng xe, yêu cầu đặc biệt của khách..."
                      className="w-full rounded-lg border border-outline-variant bg-surface-container-low px-4 py-3 text-sm outline-none focus:border-primary resize-none"
                    />
                  </Field>
                </section>

                <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 border-t border-outline-variant pt-6">
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 rounded-lg border border-outline-variant bg-surface-container-lowest px-4 py-2.5 text-sm font-medium hover:bg-surface-container-low transition-colors"
                    onClick={onAppointmentsClick}
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-medium text-on-primary hover:bg-primary/90 transition-colors active:scale-[0.98]"
                  >
                    Tạo lịch hẹn
                    <span className="material-symbols-outlined text-lg">arrow_forward</span>
                  </button>
                </div>
              </div>
            </article>

            <article className="h-fit rounded-xl border border-outline-variant bg-surface-container-lowest">
              <div className="p-5 space-y-3">
                <p className="text-xs font-bold uppercase tracking-wider text-primary">Tóm tắt dịch vụ</p>
                <div className="flex justify-between text-sm">
                  <span>Dịch vụ</span>
                  <span className="font-semibold text-right">{selectedService.label}</span>
                </div>
                <div className="flex justify-between items-center pt-3 border-t border-primary/20">
                  <span className="text-sm">Phí tạm tính</span>
                  <span className="text-xl font-bold text-primary">{formatVND(price)}</span>
                </div>
                <ul className="text-sm text-on-surface-variant space-y-2 list-disc list-inside">
                  <li>Xác thực số điện thoại khách trước khi tạo lịch.</li>
                  <li>Kiểm tra biển số trùng với xe đã đăng ký nếu có.</li>
                  <li>Chọn đúng slot còn trống trong ngày để tránh xung đột.</li>
                  <li>Lịch mới sẽ ở trạng thái <b>Đang chờ</b> đến khi xác nhận.</li>
                </ul>
              </div>
            </article>
          </form>
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

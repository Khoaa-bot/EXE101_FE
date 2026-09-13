import { useState } from "react";

const navItems = [
  ["dashboard", "Dashboard"],
  ["calendar_today", "Schedule"],
  ["event_note", "Appointments"],
  ["person", "Customers"],
];

type ReceptionSchedulePageProps = {
  onDashboardClick?: () => void;
  onScheduleClick?: () => void;
  onAppointmentsClick?: () => void;
  onCustomersClick?: () => void;
  onNewAppointmentClick?: () => void;
  onLogout?: () => void;
};

const DAYS = [
  { label: "Thứ 2", date: "15/06" },
  { label: "Thứ 3", date: "16/06" },
  { label: "Thứ 4", date: "17/06" },
  { label: "Thứ 5", date: "18/06" },
  { label: "Thứ 6", date: "19/06" },
  { label: "Thứ 7", date: "20/06" },
  { label: "Chủ Nhật", date: "21/06" },
];

const SLOTS = ["09:00 - 11:00", "11:00 - 13:00", "13:00 - 15:00", "15:00 - 17:00", "17:00 - 19:00"];

type Ev = { day: number; slot: number; name: string; detail: string; tone: "blue" | "green" | "orange" };

const EVENTS: Ev[] = [
  { day: 0, slot: 0, name: "Nguyễn Văn A", detail: "Toyota Vios - Bảo dưỡng", tone: "blue" },
  { day: 2, slot: 0, name: "Trần Thị B", detail: "Mazda 3 - Sửa chữa", tone: "green" },
  { day: 4, slot: 0, name: "Lê Văn C", detail: "Honda CR-V - Kiểm tra", tone: "blue" },
  { day: 1, slot: 1, name: "Phạm Quốc H", detail: "Kia Morning - Thay nhớt", tone: "orange" },
  { day: 3, slot: 1, name: "Đặng Thị K", detail: "Ford Ranger - Lốp", tone: "blue" },
  { day: 5, slot: 1, name: "Trần Hoàng N", detail: "Hyundai Accent - Bảo dưỡng", tone: "blue" },
  { day: 0, slot: 2, name: "Hoàng Minh T", detail: "VinFast VF8 - Điện", tone: "green" },
  { day: 3, slot: 2, name: "Bùi Thanh L", detail: "Lexus RX350 - Thay dầu", tone: "blue" },
  { day: 1, slot: 3, name: "Lương Anh D", detail: "Toyota Cross - Phanh", tone: "blue" },
  { day: 4, slot: 3, name: "Vũ Minh H", detail: "Suzuki Swift - Động cơ", tone: "orange" },
  { day: 2, slot: 4, name: "Phan Văn P", detail: "Mitsubishi Xpander", tone: "blue" },
];

const TONE: Record<Ev["tone"], string> = {
  blue: "bg-primary-container/10 border-primary/30 text-primary",
  green: "bg-tertiary-container/10 border-tertiary/30 text-tertiary",
  orange: "bg-error-container/10 border-error/30 text-on-error-container",
};

const SUMMARY = [
  { label: "Tổng lịch hẹn", value: "42", delta: "+5%", icon: "calendar_month", tone: "bg-primary-container/10 text-primary" },
  { label: "Đã hoàn thành", value: "28", delta: "+12%", icon: "check_circle", tone: "bg-tertiary-container/10 text-tertiary" },
  { label: "Đang chờ", value: "14", delta: "", icon: "schedule", tone: "bg-surface-container text-on-surface-variant" },
  { label: "Đã hủy", value: "02", delta: "", icon: "cancel", tone: "bg-error-container/10 text-on-error-container" },
];

export default function ReceptionSchedulePage({
  onDashboardClick,
  onScheduleClick,
  onAppointmentsClick,
  onCustomersClick,
  onNewAppointmentClick,
  onLogout,
}: ReceptionSchedulePageProps) {
  const [notice, setNotice] = useState("");
  const showNotice = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 3000);
  };

  const evAt = (d: number, s: number) => EVENTS.find((e) => e.day === d && e.slot === s);

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
            const isCurrent = label === "Schedule";
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
              placeholder="Tìm kiếm lịch hẹn, khách hàng..."
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

          <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">Lịch làm việc xưởng</h1>
              <p className="text-on-surface-variant mt-1">Tuần: 15/06 - 21/06/2024</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="inline-flex rounded-lg border border-outline-variant bg-surface-container-low p-1">
                <button className="px-3 py-1.5 text-sm rounded-md bg-primary-container/10 text-primary font-medium">Tuần này</button>
                <button className="px-3 py-1.5 text-sm rounded-md text-on-surface-variant">Tuần tới</button>
              </div>
              <button
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-on-primary hover:bg-primary/90 transition-colors active:scale-[0.98]"
                onClick={() => {
                  showNotice("Mở biểu mẫu đặt lịch mới");
                  onNewAppointmentClick?.();
                }}
              >
                <span className="material-symbols-outlined text-lg">add</span>
                Đặt lịch mới
              </button>
            </div>
          </div>

          <article className="mb-6 rounded-xl border border-outline-variant bg-surface-container-lowest">
            <div className="p-0 overflow-x-auto">
              <table className="w-full min-w-[900px] border-collapse">
                <thead>
                  <tr className="bg-surface-container-low">
                    <th className="text-left text-sm font-semibold p-3 border-b border-outline-variant w-32">Khung Giờ</th>
                    {DAYS.map((d) => (
                      <th key={d.date} className="text-left text-sm font-semibold p-3 border-b border-outline-variant border-l">
                        <div>{d.label}</div>
                        <div className="text-xs font-normal text-on-surface-variant">{d.date}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {SLOTS.map((slot, si) => (
                    <tr key={slot}>
                      <td className="align-top p-3 border-b border-outline-variant text-sm font-semibold">
                        {slot.split(" - ")[0]}
                        <div className="text-xs font-normal text-on-surface-variant">{slot.split(" - ")[1]}</div>
                      </td>
                      {DAYS.map((_, di) => {
                        const e = evAt(di, si);
                        return (
                          <td key={di} className="align-top p-2 border-b border-outline-variant border-l h-24">
                            {e && (
                              <div className={`rounded-md border-l-4 p-2 text-xs ${TONE[e.tone]}`}>
                                <div className="flex items-center justify-between gap-1">
                                  <span className="font-semibold truncate">{e.name}</span>
                                  <span className="material-symbols-outlined text-sm shrink-0 opacity-70">visibility</span>
                                </div>
                                <p className="mt-1 text-[11px] opacity-80">{e.detail}</p>
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>

          <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
            {SUMMARY.map((s) => (
              <article key={s.label} className="rounded-xl border border-outline-variant bg-surface-container-lowest p-5">
                <div className="flex items-center gap-3">
                  <span className={`grid h-11 w-11 place-items-center rounded-lg ${s.tone}`}>
                    <span className="material-symbols-outlined">{s.icon}</span>
                  </span>
                  <div>
                    <p className="text-sm text-on-surface-variant">{s.label}</p>
                    <p className="text-2xl font-bold">
                      {s.value} {s.delta && <span className="text-xs text-tertiary font-medium">{s.delta}</span>}
                    </p>
                  </div>
                </div>
              </article>
            ))}
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

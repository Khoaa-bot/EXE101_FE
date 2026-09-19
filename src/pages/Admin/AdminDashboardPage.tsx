import { useState } from "react";

const revenueBars = [40, 55, 45, 60, 50, 70, 62, 78, 68, 85, 76, 96];
const repairs = [
  {
    plate: "51A-123.45",
    customer: "Nguyễn Văn A",
    service: "Bảo trì pin định kỳ",
    progress: 60,
    eta: "14:30",
    when: "Hôm nay",
  },
  {
    plate: "30H-888.88",
    customer: "Trần Thị B",
    service: "Kiểm tra hệ thống phanh",
    progress: 85,
    eta: "12:00",
    when: "Hôm nay",
  },
  {
    plate: "43B-567.89",
    customer: "Lê Văn C",
    service: "Thay sạc Onboard",
    progress: 30,
    eta: "10:00",
    when: "Sáng mai",
  },
  {
    plate: "29A-444.21",
    customer: "Phạm Minh D",
    service: "Phần mềm điều khiển",
    progress: 15,
    eta: "16:45",
    when: "Hôm nay",
  },
];
const appointments = [
  {
    time: "09:00",
    name: "Hoàng Nam",
    service: "Thay thế Cell Pin",
    status: "confirmed",
  },
  {
    time: "11:30",
    name: "Minh Tuấn",
    service: "Kiểm tra động cơ điện",
    status: "pending",
  },
  {
    time: "14:00",
    name: "Lan Anh",
    service: "Bảo dưỡng gầm xe",
    status: "confirmed",
  },
];
const technicians = [
  { name: "Trần Quốc Toản", role: "Kỹ thuật viên trưởng", status: "ready" },
  { name: "Nguyễn Mỹ Linh", role: "Chuyên viên pin", status: "busy" },
  { name: "Đặng Hữu Tài", role: "Thợ máy", status: "ready" },
];
const navItems = [
  ["dashboard", "Dashboard"],
  ["engineering", "Nhân viên"],
  ["groups", "Khách hàng"],
  ["inventory_2", "Kho linh kiện"],
  ["payments", "Bảng giá"],
];

type AdminDashboardPageProps = {
  onCustomersClick?: () => void;
  onEngineersClick?: () => void;
  onInventoryClick?: () => void;
  onPricingClick?: () => void;
};

export default function AdminDashboardPage({
  onCustomersClick,
  onEngineersClick,
  onInventoryClick,
  onPricingClick,
}: AdminDashboardPageProps) {
  const [notice, setNotice] = useState("");
  const showNotice = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 3000);
  };
  return (
    <div className="min-h-[100dvh] bg-background font-sans text-on-surface">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-outline-variant bg-surface-container-lowest p-lg md:flex">
        <div className="mb-xl">
          <div className="flex items-center gap-2 text-primary">
            <span className="material-symbols-outlined text-3xl">
              electric_car
            </span>
            <span className="font-headline-lg text-headline-lg font-bold">
              Servio
            </span>
          </div>
          <p className="mt-1 text-xs text-on-surface-variant">
            Quản trị garage
          </p>
        </div>
        <nav className="space-y-1">
          {navItems.map(([icon, label], index) => (
            <button
              key={label}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left font-body-md text-body-md transition-colors active:scale-[0.98] ${index === 0 ? "bg-primary-container/15 font-semibold text-primary" : "text-on-surface-variant hover:bg-surface-container-low"}`}
              type="button"
              onClick={() => {
                if (label === "Khách hàng") onCustomersClick?.();
                else if (label === "Nhân viên") onEngineersClick?.();
                else if (label === "Kho linh kiện") onInventoryClick?.();
                else if (label === "Bảng giá") onPricingClick?.();
              }}
            >
              <span className="material-symbols-outlined">{icon}</span>
              {label}
            </button>
          ))}
        </nav>
        <button
          className="mt-auto flex items-center gap-3 rounded-lg px-3 py-2.5 text-on-surface-variant hover:bg-surface-container-low"
          type="button"
        >
          <span className="material-symbols-outlined">settings</span>Cài đặt
        </button>
      </aside>
      <main className="min-h-[100dvh] md:ml-60">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-outline-variant bg-surface/95 px-margin-mobile backdrop-blur md:px-margin-desktop">
          <button
            className="rounded-full p-2 text-on-surface-variant md:hidden"
            type="button"
            aria-label="Mở menu"
          >
            <span className="material-symbols-outlined">menu</span>
          </button>
          <label className="relative hidden w-full max-w-sm md:block">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">
              search
            </span>
            <input
              className="w-full rounded-full border border-outline-variant bg-surface-container-low px-4 py-2 pl-10 text-body-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
              placeholder="Tìm kiếm xe, khách hàng..."
            />
          </label>
          <div className="ml-auto flex items-center gap-2">
            <button
              className="rounded-full p-2 text-on-surface-variant hover:bg-surface-container"
              type="button"
              aria-label="Thông báo"
            >
              <span className="material-symbols-outlined">notifications</span>
            </button>
            <div className="ml-2 flex items-center gap-2 border-l border-outline-variant pl-3">
              <div className="hidden text-right sm:block">
                <p className="font-label-md text-label-md">Admin</p>
                <p className="text-[11px] text-on-surface-variant">
                  Garage ABC
                </p>
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-fixed font-bold text-on-primary-fixed">
                A
              </div>
            </div>
          </div>
        </header>
        <div className="mx-auto max-w-[1440px] p-margin-mobile md:p-margin-desktop">
          <section className="mb-6 flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="font-headline-lg text-headline-lg font-bold">
                Tổng quan hệ thống
              </h1>
              <p className="mt-1 font-body-md text-body-md text-on-surface-variant">
                Chào buổi sáng, Admin. Đây là tình hình hoạt động của Servio hôm
                nay.
              </p>
            </div>
            <button
              className="inline-flex items-center gap-2 rounded-lg border border-outline-variant bg-surface-container-lowest px-4 py-2.5 font-label-md text-label-md hover:bg-surface-container-low active:scale-[0.98]"
              type="button"
              onClick={() => showNotice("Đang xuất báo cáo...")}
            >
              <span className="material-symbols-outlined text-lg">
                file_download
              </span>
              Xuất báo cáo
            </button>
          </section>
          <section className="mb-6 grid gap-4 lg:grid-cols-5">
            <RevenueCard />
            <StatCard
              icon="directions_car"
              label="Tổng số xe"
              value="25"
              detail="+12%"
              tone="primary"
            />
            <StatCard
              icon="build"
              label="Đang sửa chữa"
              value="15"
              detail="đang xử lý"
              tone="warning"
            />
            <StatCard
              icon="check_circle"
              label="Hoàn thành"
              value="08"
              detail="hôm nay"
              tone="success"
            />
            <StatCard
              icon="event_available"
              label="Lịch hẹn"
              value="12"
              detail="đã xác nhận"
              tone="accent"
            />
          </section>
          <section className="grid gap-6 xl:grid-cols-3">
            <div className="min-w-0 space-y-6 xl:col-span-2">
              <RepairsTable showNotice={showNotice} />
              <GoalCard showNotice={showNotice} />
            </div>
            <div className="min-w-0 space-y-6">
              <AppointmentCard />
              <TechnicianCard showNotice={showNotice} />
            </div>
          </section>
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

function RevenueCard() {
  return (
    <article className="rounded-xl border border-outline-variant bg-surface-container-lowest lg:col-span-2">
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-label-md text-label-md text-on-surface-variant">
              DOANH THU THÁNG NÀY
            </p>
            <p className="mt-2 font-display-lg text-display-lg">12.450.000đ</p>
            <p className="mt-1 text-xs text-on-surface-variant">
              So với tháng trước (10.550.000đ)
            </p>
          </div>
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-tertiary-container/10 px-2 py-1 text-xs font-semibold text-tertiary">
            <span className="material-symbols-outlined text-sm">
              trending_up
            </span>
            +18%
          </span>
        </div>
        <div
          className="mt-5 flex h-20 items-end gap-1.5"
          aria-label="Biểu đồ doanh thu tháng"
        >
          {revenueBars.map((height, index) => (
            <span
              key={height}
              className={`flex-1 rounded-t-sm ${index === revenueBars.length - 1 ? "bg-primary" : "bg-primary/25"}`}
              style={{ height: `${height}%` }}
            />
          ))}
        </div>
      </div>
    </article>
  );
}
function StatCard({
  icon,
  label,
  value,
  detail,
  tone,
}: {
  icon: string;
  label: string;
  value: string;
  detail: string;
  tone: "primary" | "warning" | "success" | "accent";
}) {
  const tones = {
    primary: "bg-primary-container/10 text-primary",
    warning: "bg-error-container text-on-error-container",
    success: "bg-tertiary-container/10 text-tertiary",
    accent: "bg-secondary-container text-on-secondary-container",
  };
  return (
    <article className="rounded-xl border border-outline-variant bg-surface-container-lowest p-5">
      <span
        className={`material-symbols-outlined rounded-lg p-2 ${tones[tone]}`}
      >
        {icon}
      </span>
      <p className="mt-3 text-body-sm text-on-surface-variant">{label}</p>
      <div className="mt-1 flex items-baseline gap-2">
        <p className="font-headline-lg text-headline-lg">{value}</p>
        <span className="text-xs text-on-surface-variant">{detail}</span>
      </div>
    </article>
  );
}
function RepairsTable({
  showNotice,
}: {
  showNotice: (message: string) => void;
}) {
  return (
    <article className="overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest">
      <div className="flex items-center justify-between border-b border-outline-variant px-5 py-4">
        <h2 className="font-headline-md text-headline-md">
          Tiến độ sửa chữa hiện tại
        </h2>
        <button
          className="font-label-md text-label-md text-primary hover:underline"
          type="button"
          onClick={() => showNotice("Đang mở danh sách tiến độ sửa chữa")}
        >
          Xem tất cả
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-body-sm">
          <thead className="bg-surface-container-low text-xs text-on-surface-variant">
            <tr>
              {[
                "Biển số",
                "Khách hàng",
                "Loại dịch vụ",
                "Tiến độ",
                "Dự kiến xong",
              ].map((label) => (
                <th key={label} className="px-5 py-3 font-semibold">
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {repairs.map((repair) => (
              <tr
                key={repair.plate}
                className="border-t border-outline-variant transition-colors hover:bg-surface-container-low"
              >
                <td className="px-5 py-4 font-semibold text-primary">
                  {repair.plate}
                </td>
                <td className="px-5 py-4">{repair.customer}</td>
                <td className="px-5 py-4 text-on-surface-variant">
                  {repair.service}
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-2">
                    <span className="h-1.5 min-w-20 flex-1 overflow-hidden rounded-full bg-surface-container">
                      <span
                        className="block h-full rounded-full bg-primary"
                        style={{ width: `${repair.progress}%` }}
                      />
                    </span>
                    <span className="w-9 text-right text-xs font-medium">
                      {repair.progress}%
                    </span>
                  </div>
                </td>
                <td className="px-5 py-4 text-right">
                  <p className="font-semibold">{repair.eta}</p>
                  <p className="text-xs text-on-surface-variant">
                    {repair.when}
                  </p>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </article>
  );
}
function GoalCard({ showNotice }: { showNotice: (message: string) => void }) {
  return (
    <article className="flex flex-wrap items-center justify-between gap-5 overflow-hidden rounded-2xl bg-blue-600 p-6 text-white shadow-lg">
      <div className="flex-1 min-w-200 max-w-xl">
        <span className="inline-block rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white">
          Mục tiêu garage
        </span>
        <h2 className="mt-3 text-xl md:text-2xl font-bold leading-tight">
          Đạt 100 dịch vụ hoàn thành trong tháng 10
        </h2>
        <p className="mt-2 text-sm md:text-base text-blue-100">
          Chúng ta hiện đã đạt 78%. Hãy duy trì chất lượng và tiến độ phục vụ
          khách hàng tuyệt vời!
        </p>
      </div>
      <button
        className="shrink-0 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-blue-600 shadow-sm transition hover:bg-blue-50 active:scale-[0.98]"
        type="button"
        onClick={() => showNotice("Đã cập nhật tiến độ mục tiêu")}
      >
        Cập nhật tiến độ
      </button>
    </article>
  );
}
function AppointmentCard() {
  return (
    <article className="rounded-xl border border-outline-variant bg-surface-container-lowest">
      <div className="flex items-center gap-2 border-b border-outline-variant px-5 py-4">
        <span className="material-symbols-outlined text-primary">
          calendar_month
        </span>
        <h2 className="font-headline-md text-base">Lịch hẹn hôm nay</h2>
      </div>
      <div className="space-y-3 p-5">
        {appointments.map((appointment) => (
          <div
            key={appointment.time}
            className="rounded-xl border border-outline-variant p-3 transition-colors hover:border-primary/50"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-label-md text-label-md">
                  {appointment.time} - {appointment.name}
                </p>
                <p className="mt-1 truncate text-xs text-on-surface-variant">
                  {appointment.service}
                </p>
              </div>
              <StatusBadge status={appointment.status} />
            </div>
          </div>
        ))}
      </div>
    </article>
  );
}
function TechnicianCard({
  showNotice,
}: {
  showNotice: (message: string) => void;
}) {
  return (
    <article className="rounded-xl border border-outline-variant bg-surface-container-lowest">
      <div className="flex items-center justify-between border-b border-outline-variant px-5 py-4">
        <h2 className="font-headline-md text-base">Trạng thái kỹ thuật viên</h2>
        <button
          className="text-outline hover:text-on-surface"
          type="button"
          aria-label="Tùy chọn"
        >
          <span className="material-symbols-outlined">more_vert</span>
        </button>
      </div>
      <div className="space-y-4 p-5">
        {technicians.map((technician) => (
          <div key={technician.name} className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary-container font-semibold text-on-secondary-container">
              {technician.name[0]}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-label-md text-label-md">
                {technician.name}
              </p>
              <p className="truncate text-xs text-on-surface-variant">
                {technician.role}
              </p>
            </div>
            <StatusBadge status={technician.status} />
          </div>
        ))}
        <button
          className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg border border-outline-variant py-2.5 font-label-md text-label-md hover:bg-surface-container-low"
          type="button"
          onClick={() => showNotice("Mở biểu mẫu thêm kỹ thuật viên")}
        >
          <span className="material-symbols-outlined text-lg">person_add</span>
          Thêm kỹ thuật viên
        </button>
      </div>
    </article>
  );
}
function StatusBadge({ status }: { status: string }) {
  const ready = status === "confirmed" || status === "ready";
  const text =
    status === "confirmed"
      ? "Đã xác nhận"
      : status === "pending"
        ? "Chờ xác nhận"
        : status === "ready"
          ? "Sẵn sàng"
          : "Đang bận";
  return (
    <span
      className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-semibold ${ready ? "bg-tertiary-container/10 text-tertiary" : "bg-error-container text-on-error-container"}`}
    >
      {text}
    </span>
  );
}

import { useState } from "react";

export type JobStatus = "pending" | "accepted" | "in_progress" | "done";

export type JobItem = {
  id: string;
  service: string;
  time: string;
  date: string;
  vehicle: {
    model: string;
    plate: string;
    color: string;
    vin: string;
    image: string;
  };
  customer: {
    name: string;
    phone: string;
  };
  status: JobStatus;
  icon: "wrench" | "alert" | "battery";
  assignee: string;
};

export const INITIAL_JOBS: JobItem[] = [
  {
    id: "JOB-101",
    service: "Bảo dưỡng định kỳ & Kiểm tra pin 10.000km",
    time: "09:00 AM",
    date: "15/11/2023",
    vehicle: {
      model: "VinFast VF8",
      plate: "51H-123.45",
      color: "Trắng Ngọc Trai",
      vin: "VF8EV2023-99812",
      image: "https://images.unsplash.com/photo-1563720223185-11003d516935?w=500&auto=format&fit=crop&q=60",
    },
    customer: {
      name: "Nguyễn Văn Minh",
      phone: "091 234 5678",
    },
    status: "in_progress",
    icon: "battery",
    assignee: "Trần Quốc Toản",
  },
  {
    id: "JOB-102",
    service: "Thay bộ má phanh đĩa cao cấp",
    time: "11:30 AM",
    date: "15/11/2023",
    vehicle: {
      model: "Mazda CX-5",
      plate: "30E-678.90",
      color: "Đỏ Crystal",
      vin: "MZCX52022-77123",
      image: "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=500&auto=format&fit=crop&q=60",
    },
    customer: {
      name: "Trần Hoàng Nam",
      phone: "098 765 4321",
    },
    status: "accepted",
    icon: "wrench",
    assignee: "Trần Quốc Toản",
  },
  {
    id: "JOB-103",
    service: "Kiểm tra & Sửa chữa hệ thống điều hòa",
    time: "02:00 PM",
    date: "15/11/2023",
    vehicle: {
      model: "VinFast VF9",
      plate: "51A-111.11",
      color: "Đen Nham Thạch",
      vin: "VF9EV2023-11002",
      image: "https://images.unsplash.com/photo-1617788138017-80ad40651399?w=500&auto=format&fit=crop&q=60",
    },
    customer: {
      name: "Lê Thanh Tâm",
      phone: "090 112 2334",
    },
    status: "pending",
    icon: "alert",
    assignee: "Trần Quốc Toản",
  },
];

export const TECHNICIANS_LIST = [
  "Trần Quốc Toản",
  "Nguyễn Mỹ Linh",
  "Đặng Hữu Tài",
  "Phạm Văn Hùng",
];

const navItems = [
  ["dashboard", "Tổng quan"],
  ["calendar_today", "Lịch làm việc"],
  ["event_note", "Lịch hẹn"],
  ["engineering", "Kỹ thuật viên"],
  ["person", "Khách hàng"],
  ["settings", "Cài đặt"],
];

type EngineerDashboardPageProps = {
  onDashboardClick?: () => void;
  onScheduleClick?: () => void;
  onAppointmentsClick?: () => void;
  onTechniciansClick?: () => void;
  onCustomersClick?: () => void;
  onSettingsClick?: () => void;
  onJobDetailClick?: (jobId?: string) => void;
  onLogout?: () => void;
};

export default function EngineerDashboardPage({
  onDashboardClick,
  onScheduleClick,
  onAppointmentsClick,
  onTechniciansClick,
  onCustomersClick,
  onSettingsClick,
  onJobDetailClick,
  onLogout,
}: EngineerDashboardPageProps) {
  const [jobs, setJobs] = useState<JobItem[]>(INITIAL_JOBS);
  const [transferJob, setTransferJob] = useState<JobItem | null>(null);
  const [transferTo, setTransferTo] = useState<string>("");
  const [notice, setNotice] = useState("");

  const showNotice = (msg: string) => {
    setNotice(msg);
    window.setTimeout(() => setNotice(""), 3000);
  };

  const acceptJob = (id: string) => {
    setJobs((prev) =>
      prev.map((j) => (j.id === id ? { ...j, status: "accepted" } : j)),
    );
    showNotice(`Đã tiếp nhận thành công lịch làm việc ${id}`);
  };

  const confirmTransfer = () => {
    if (!transferJob || !transferTo) {
      showNotice("Vui lòng chọn kỹ thuật viên để chuyển!");
      return;
    }
    setJobs((prev) =>
      prev.map((j) =>
        j.id === transferJob.id ? { ...j, assignee: transferTo } : j,
      ),
    );
    showNotice(`Đã chuyển công việc ${transferJob.id} cho ${transferTo}`);
    setTransferJob(null);
    setTransferTo("");
  };

  return (
    <div className="min-h-[100dvh] bg-background font-sans text-on-surface">
      {/* Sidebar Navigation */}
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
            Garage Kỹ thuật viên
          </p>
        </div>
        <nav className="space-y-1">
          {navItems.map(([icon, label]) => {
            const isCurrent = label === "Tổng quan";
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
                  if (label === "Tổng quan") onDashboardClick?.();
                  else if (label === "Lịch làm việc") onScheduleClick?.();
                  else if (label === "Lịch hẹn") onAppointmentsClick?.();
                  else if (label === "Kỹ thuật viên") onTechniciansClick?.();
                  else if (label === "Khách hàng") onCustomersClick?.();
                  else if (label === "Cài đặt") onSettingsClick?.();
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

      {/* Main Content Area */}
      <main className="min-h-[100dvh] md:ml-60">
        {/* Header Bar */}
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-outline-variant bg-surface/95 px-margin-mobile backdrop-blur md:px-margin-desktop">
          <button
            className="rounded-full p-2 text-on-surface-variant md:hidden"
            type="button"
            aria-label="Mở menu"
          >
            <span className="material-symbols-outlined">menu</span>
          </button>
          <label className="relative hidden w-full max-w-md md:block">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">
              search
            </span>
            <input
              className="w-full rounded-full border border-outline-variant bg-surface-container-low px-4 py-2 pl-10 text-body-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
              placeholder="Tìm kiếm phiếu, xe, biển số..."
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
                <p className="font-label-md text-label-md">Trần Quốc Toản</p>
                <p className="text-[11px] text-on-surface-variant">
                  KTV Trưởng
                </p>
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-fixed font-bold text-on-primary-fixed">
                T
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="mx-auto max-w-[1440px] p-margin-mobile md:p-margin-desktop">
          {/* Banner Section */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-outline-variant pb-5">
            <div>
              <h1 className="font-headline-lg text-headline-lg font-bold">
                Lịch làm việc hôm nay
              </h1>
              <p className="mt-1 text-body-sm text-on-surface-variant">
                Thứ Tư, 15 Tháng 11, 2023 · Bạn có {jobs.length} công việc được
                phân công.
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                showNotice("Đã cập nhật tiến độ công việc mới nhất!")
              }
              className="inline-flex items-center gap-2 rounded-lg border border-outline-variant bg-surface-container-lowest px-4 py-2 text-xs font-semibold text-on-surface hover:bg-surface-container-low"
            >
              <span className="material-symbols-outlined text-base">
                refresh
              </span>
              Cập nhật tiến độ
            </button>
          </div>

          {/* Metrics Section */}
          <section className="mt-6 grid gap-4 sm:grid-cols-3">
            <article className="rounded-xl border border-outline-variant bg-surface-container-lowest p-5">
              <p className="text-xs font-semibold uppercase text-outline">
                ĐƯỢC PHÂN CÔNG
              </p>
              <p className="mt-2 font-headline-lg text-3xl font-bold">
                {jobs.length} xe
              </p>
            </article>
            <article className="rounded-xl border border-outline-variant bg-surface-container-lowest p-5">
              <p className="text-xs font-semibold uppercase text-outline">
                ĐANG THỰC HIỆN
              </p>
              <p className="mt-2 font-headline-lg text-3xl font-bold text-primary">
                {
                  jobs.filter(
                    (j) => j.status === "in_progress" || j.status === "accepted",
                  ).length
                }{" "}
                xe
              </p>
            </article>
            <article className="rounded-xl border border-outline-variant bg-surface-container-lowest p-5">
              <p className="text-xs font-semibold uppercase text-outline">
                HOÀN TẤT HÔM NAY
              </p>
              <p className="mt-2 font-headline-lg text-3xl font-bold text-tertiary">
                {jobs.filter((j) => j.status === "done").length} xe
              </p>
            </article>
          </section>

          {/* Job Cards List */}
          <section className="mt-8 space-y-4">
            <h2 className="font-headline-md text-lg font-bold">
              Danh sách phiếu sửa chữa
            </h2>

            {jobs.map((job) => {
              const isAccepted = job.status !== "pending";
              const isDone = job.status === "done";

              return (
                <article
                  key={job.id}
                  className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-5 shadow-sm transition hover:border-primary/50"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <span className="material-symbols-outlined rounded-xl bg-primary-container/15 p-3 text-primary text-2xl">
                        {job.icon === "battery"
                          ? "battery_charging_full"
                          : job.icon === "alert"
                            ? "warning"
                            : "build"}
                      </span>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs font-bold text-primary">
                            #{job.id}
                          </span>
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                              job.status === "in_progress"
                                ? "bg-primary-container/15 text-primary"
                                : job.status === "accepted"
                                  ? "bg-tertiary-container/15 text-tertiary"
                                  : job.status === "done"
                                    ? "bg-tertiary text-on-tertiary"
                                    : "bg-surface-container-high text-on-surface-variant"
                            }`}
                          >
                            {job.status === "in_progress"
                              ? "Đang thực hiện"
                              : job.status === "accepted"
                                ? "Đã tiếp nhận"
                                : job.status === "done"
                                  ? "Hoàn thành"
                                  : "Chờ xử lý"}
                          </span>
                        </div>
                        <h3 className="mt-1 font-bold text-base">
                          {job.service}
                        </h3>
                        <p className="mt-1 text-xs text-on-surface-variant">
                          {job.vehicle.model} ·{" "}
                          <span className="font-bold text-primary font-mono">
                            {job.vehicle.plate}
                          </span>{" "}
                          · Giờ hẹn: {job.time}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-outline text-lg">
                        account_circle
                      </span>
                      <span className="text-xs font-semibold">
                        {job.customer.name} ({job.customer.phone})
                      </span>
                    </div>
                  </div>

                  {/* Actions Row */}
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-outline-variant/60 pt-4">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={isAccepted}
                        onClick={() => acceptJob(job.id)}
                        className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                          isAccepted
                            ? "bg-surface-container-high text-outline cursor-not-allowed"
                            : "bg-primary text-on-primary hover:opacity-90 active:scale-[0.98]"
                        }`}
                      >
                        <span className="material-symbols-outlined text-base">
                          play_arrow
                        </span>
                        {isAccepted ? "Đã nhận việc" : "Nhận việc"}
                      </button>

                      <button
                        type="button"
                        disabled={isDone}
                        onClick={() => setTransferJob(job)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-outline-variant px-3 py-1.5 text-xs font-semibold text-on-surface-variant hover:bg-surface-container-low"
                      >
                        <span className="material-symbols-outlined text-base">
                          person_add
                        </span>
                        Chuyển KTV
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => onJobDetailClick?.(job.id)}
                      className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"
                    >
                      Xem chi tiết công việc
                      <span className="material-symbols-outlined text-base">
                        chevron_right
                      </span>
                    </button>
                  </div>
                </article>
              );
            })}
          </section>
        </div>
      </main>

      {/* Transfer Job Modal */}
      {transferJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl border border-outline-variant bg-surface-container-lowest p-6 shadow-xl">
            <h3 className="font-headline-md text-lg font-bold">
              Chuyển giao công việc #{transferJob.id}
            </h3>
            <p className="mt-1 text-xs text-on-surface-variant">
              Chọn kỹ thuật viên sẽ tiếp nhận phiếu sửa chữa này.
            </p>

            <div className="mt-4 space-y-2">
              <label className="block text-xs font-semibold text-on-surface-variant">
                Kỹ thuật viên tiếp nhận
              </label>
              <select
                value={transferTo}
                onChange={(e) => setTransferTo(e.target.value)}
                className="w-full rounded-lg border border-outline-variant bg-surface-container-low px-3 py-2 text-body-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              >
                <option value="">-- Chọn kỹ thuật viên --</option>
                {TECHNICIANS_LIST.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setTransferJob(null)}
                className="rounded-lg border border-outline-variant px-4 py-2 text-xs font-semibold hover:bg-surface-container-low"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={confirmTransfer}
                className="rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-on-primary hover:opacity-90"
              >
                Xác nhận chuyển
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notice Toast */}
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

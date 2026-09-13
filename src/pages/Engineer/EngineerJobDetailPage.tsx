import { useState } from "react";
import { INITIAL_JOBS, type JobItem, type JobStatus } from "./EngineerDashboardPage";

type ChecklistItem = {
  id: string;
  label: string;
  required: boolean;
  done: boolean;
};

const INITIAL_CHECKLIST: ChecklistItem[] = [
  {
    id: "chk-1",
    label: "Kiểm tra tổng quan điện áp và nhiệt độ các Cell Pin EV",
    required: true,
    done: true,
  },
  {
    id: "chk-2",
    label: "Đo mức dung dịch làm mát khối Pin & bổ sung nếu thiếu",
    required: true,
    done: false,
  },
  {
    id: "chk-3",
    label: "Kiểm tra độ mòn má phanh đĩa trước & sau",
    required: false,
    done: false,
  },
  {
    id: "chk-4",
    label: "Quét chẩn đoán mã lỗi ECU / BMS bằng thiết bị chuyên dụng",
    required: true,
    done: false,
  },
];

const navItems = [
  ["dashboard", "Tổng quan"],
  ["calendar_today", "Lịch làm việc"],
  ["event_note", "Lịch hẹn"],
  ["engineering", "Kỹ thuật viên"],
  ["person", "Khách hàng"],
  ["settings", "Cài đặt"],
];

type EngineerJobDetailPageProps = {
  jobId?: string;
  onBackClick?: () => void;
  onDashboardClick?: () => void;
  onScheduleClick?: () => void;
  onAppointmentsClick?: () => void;
  onTechniciansClick?: () => void;
  onCustomersClick?: () => void;
  onSettingsClick?: () => void;
  onLogout?: () => void;
};

export default function EngineerJobDetailPage({
  jobId = "JOB-101",
  onBackClick,
  onDashboardClick,
  onScheduleClick,
  onAppointmentsClick,
  onTechniciansClick,
  onCustomersClick,
  onSettingsClick,
  onLogout,
}: EngineerJobDetailPageProps) {
  const targetJob: JobItem =
    INITIAL_JOBS.find((j) => j.id === jobId) || INITIAL_JOBS[0];

  const [jobStatus, setJobStatus] = useState<JobStatus>(targetJob.status);
  const [notes, setNotes] = useState<string>(
    "Đã tiến hành chẩn đoán sơ bộ. Pin hoạt động bình thường ở mức 94% dung lượng. Đang tiến hành làm sạch cụm má phanh đĩa.",
  );
  const [checklist, setChecklist] = useState<ChecklistItem[]>(INITIAL_CHECKLIST);
  const [images, setImages] = useState<string[]>([
    "https://images.unsplash.com/photo-1517524008697-84bbe3c3fd98?w=500&auto=format&fit=crop&q=60",
    "https://images.unsplash.com/photo-1486006920555-c77dce18193b?w=500&auto=format&fit=crop&q=60",
  ]);
  const [notice, setNotice] = useState("");

  const showNotice = (msg: string) => {
    setNotice(msg);
    window.setTimeout(() => setNotice(""), 3000);
  };

  const toggleChecklist = (id: string) => {
    setChecklist((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, done: !item.done } : item,
      ),
    );
  };

  const handleFileUpload = (files: FileList | null) => {
    if (!files) return;
    const remaining = 5 - images.length;
    const selected = Array.from(files).slice(0, remaining);

    selected.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          setImages((prev) => [...prev, e.target!.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });

    if (files.length > remaining) {
      showNotice("Chỉ được tải lên tối đa 5 ảnh!");
    } else {
      showNotice("Đã tải ảnh tình trạng xe lên thành công.");
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    showNotice("Đã xóa ảnh.");
  };

  const saveReport = () => {
    const requiredMissing = checklist.some((c) => c.required && !c.done);
    if (requiredMissing) {
      showNotice("Vui lòng hoàn thành các mục kiểm tra bắt buộc trước khi lưu!");
      return;
    }
    if (!notes.trim()) {
      showNotice("Vui lòng nhập ghi chú kỹ thuật!");
      return;
    }
    showNotice(`Đã cập nhật báo cáo thành công cho phiếu #${targetJob.id}!`);
  };

  const completeJob = () => {
    setJobStatus("done");
    showNotice(`Đã hoàn thành công việc #${targetJob.id}!`);
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
            return (
              <button
                key={label}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left font-body-md text-body-md text-on-surface-variant transition-colors hover:bg-surface-container-low active:scale-[0.98]"
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
              placeholder="Tìm kiếm..."
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
          {/* Back Link */}
          <button
            type="button"
            onClick={onBackClick || onDashboardClick}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-on-surface-variant hover:text-primary"
          >
            <span className="material-symbols-outlined text-base">
              arrow_back
            </span>
            Quay lại danh sách công việc
          </button>

          {/* Title Banner */}
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-b border-outline-variant pb-5">
            <div>
              <h1 className="font-headline-lg text-headline-lg font-bold">
                Chi tiết công việc{" "}
                <span className="text-primary">#{targetJob.id}</span>
              </h1>
              <p className="mt-1 text-body-sm text-on-surface-variant">
                Phiếu sửa chữa được phân công ngày {targetJob.date} lúc{" "}
                {targetJob.time}.
              </p>
            </div>

            <span
              className={`rounded-full px-3 py-1 text-xs font-bold ${
                jobStatus === "in_progress"
                  ? "bg-primary-container/15 text-primary"
                  : jobStatus === "accepted"
                    ? "bg-tertiary-container/15 text-tertiary"
                    : jobStatus === "done"
                      ? "bg-tertiary text-on-tertiary"
                      : "bg-surface-container-high text-on-surface-variant"
              }`}
            >
              {jobStatus === "in_progress"
                ? "Đang thực hiện"
                : jobStatus === "accepted"
                  ? "Đã tiếp nhận"
                  : jobStatus === "done"
                    ? "Hoàn thành"
                    : "Chờ xử lý"}
            </span>
          </div>

          {/* Two-Column Grid */}
          <div className="mt-6 grid gap-6 lg:grid-cols-3">
            {/* Left Column (Info & Checklist) */}
            <div className="space-y-6 lg:col-span-2">
              {/* Vehicle Info Card */}
              <article className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-5">
                <div className="mb-4 flex items-center gap-2 text-primary font-bold">
                  <span className="material-symbols-outlined text-xl">
                    directions_car
                  </span>
                  <h2>Thông tin phương tiện</h2>
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="overflow-hidden rounded-xl bg-surface-container-high">
                    <img
                      src={targetJob.vehicle.image}
                      alt={targetJob.vehicle.model}
                      className="h-32 w-full object-cover"
                    />
                  </div>
                  <div className="sm:col-span-2 space-y-2 text-body-sm">
                    <div className="flex justify-between border-b border-outline-variant/40 pb-1">
                      <span className="text-on-surface-variant">Mẫu xe:</span>
                      <span className="font-bold">{targetJob.vehicle.model}</span>
                    </div>
                    <div className="flex justify-between border-b border-outline-variant/40 pb-1">
                      <span className="text-on-surface-variant">Biển số:</span>
                      <span className="font-bold text-primary font-mono">
                        {targetJob.vehicle.plate}
                      </span>
                    </div>
                    <div className="flex justify-between border-b border-outline-variant/40 pb-1">
                      <span className="text-on-surface-variant">Màu xe:</span>
                      <span>{targetJob.vehicle.color}</span>
                    </div>
                    <div className="flex justify-between border-b border-outline-variant/40 pb-1">
                      <span className="text-on-surface-variant">Số khung (VIN):</span>
                      <span className="font-mono text-xs bg-surface-container-high px-2 py-0.5 rounded">
                        {targetJob.vehicle.vin}
                      </span>
                    </div>
                  </div>
                </div>
              </article>

              {/* Customer & Service Request */}
              <div className="grid gap-4 sm:grid-cols-2">
                <article className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-5">
                  <div className="mb-3 flex items-center gap-2 text-primary font-bold">
                    <span className="material-symbols-outlined text-xl">
                      account_circle
                    </span>
                    <h2>Thông tin khách hàng</h2>
                  </div>
                  <p className="font-bold text-base">{targetJob.customer.name}</p>
                  <p className="mt-1 flex items-center gap-1 text-xs text-on-surface-variant">
                    <span className="material-symbols-outlined text-sm text-primary">
                      call
                    </span>
                    {targetJob.customer.phone}
                  </p>
                </article>

                <article className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-5">
                  <div className="mb-3 flex items-center gap-2 text-primary font-bold">
                    <span className="material-symbols-outlined text-xl">
                      build
                    </span>
                    <h2>Yêu cầu dịch vụ</h2>
                  </div>
                  <p className="font-semibold text-body-sm">
                    {targetJob.service}
                  </p>
                </article>
              </div>

              {/* Checklist Card */}
              <article className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-5">
                <div className="mb-4 flex items-center justify-between border-b border-outline-variant pb-3">
                  <div className="flex items-center gap-2 text-primary font-bold">
                    <span className="material-symbols-outlined text-xl">
                      fact_check
                    </span>
                    <h2>Danh sách công việc (Checklist)</h2>
                  </div>
                  <span className="text-xs text-outline font-semibold">
                    {checklist.filter((c) => c.done).length} / {checklist.length}{" "}
                    mục hoàn thành
                  </span>
                </div>

                <div className="space-y-2">
                  {checklist.map((item) => (
                    <label
                      key={item.id}
                      onClick={() => toggleChecklist(item.id)}
                      className={`flex cursor-pointer items-center justify-between rounded-xl border p-3 text-body-sm transition ${
                        item.done
                          ? "border-tertiary/40 bg-tertiary-container/10"
                          : "border-outline-variant bg-surface-container-low hover:border-primary/40"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={item.done}
                          onChange={() => {}}
                          className="h-4 w-4 rounded border-outline text-primary focus:ring-primary"
                        />
                        <span
                          className={
                            item.done
                              ? "line-through text-on-surface-variant"
                              : "font-medium"
                          }
                        >
                          {item.label}
                        </span>
                      </div>

                      <div>
                        {item.required && !item.done && (
                          <span className="rounded-md bg-error-container px-2 py-0.5 text-[10px] font-bold text-on-error-container">
                            Bắt buộc
                          </span>
                        )}
                        {item.done && (
                          <span className="rounded-md bg-tertiary-container/20 px-2 py-0.5 text-[10px] font-bold text-tertiary">
                            Hoàn thành
                          </span>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              </article>
            </div>

            {/* Right Column (Report & Updates Panel) */}
            <aside className="space-y-6">
              <article className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-5 space-y-4">
                <div className="flex items-center gap-2 text-primary font-bold border-b border-outline-variant pb-3">
                  <span className="material-symbols-outlined text-xl">
                    edit_note
                  </span>
                  <h2>Báo cáo & Cập nhật</h2>
                </div>

                {/* Status Select */}
                <div>
                  <label className="mb-1 block text-xs font-semibold text-on-surface-variant">
                    Trạng thái công việc
                  </label>
                  <select
                    value={jobStatus}
                    onChange={(e) => setJobStatus(e.target.value as JobStatus)}
                    className="w-full rounded-lg border border-outline-variant bg-surface-container-low px-3 py-2 text-body-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  >
                    <option value="pending">Chờ xử lý</option>
                    <option value="accepted">Đã tiếp nhận</option>
                    <option value="in_progress">Đang thực hiện</option>
                    <option value="done">Hoàn thành</option>
                  </select>
                </div>

                {/* Notes Textarea */}
                <div>
                  <label className="mb-1 block text-xs font-semibold text-on-surface-variant">
                    Ghi chú kỹ thuật *
                  </label>
                  <textarea
                    rows={4}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Nhập chi tiết tình trạng xe, vật tư linh kiện đã dùng..."
                    className="w-full rounded-lg border border-outline-variant bg-surface-container-low px-3 py-2 text-body-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                </div>

                {/* Photo Upload Section */}
                <div>
                  <div className="mb-1.5 flex items-center justify-between text-xs font-semibold text-on-surface-variant">
                    <span>Hình ảnh tình trạng xe</span>
                    <span>{images.length}/5 ảnh</span>
                  </div>
                  <label
                    className={`flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-outline-variant p-4 text-center cursor-pointer transition hover:border-primary/50 ${
                      images.length >= 5 ? "opacity-50 pointer-events-none" : ""
                    }`}
                  >
                    <span className="material-symbols-outlined text-2xl text-primary">
                      photo_camera
                    </span>
                    <span className="text-xs font-medium">
                      Nhấp để tải ảnh lên hoặc kéo thả
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={(e) => handleFileUpload(e.target.files)}
                    />
                  </label>

                  {images.length > 0 && (
                    <div className="mt-3 grid grid-cols-3 gap-2">
                      {images.map((url, idx) => (
                        <div
                          key={idx}
                          className="group relative aspect-square overflow-hidden rounded-lg bg-surface-container-high"
                        >
                          <img
                            src={url}
                            alt="Vehicle condition"
                            className="h-full w-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(idx)}
                            className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/70 text-white opacity-0 transition group-hover:opacity-100"
                          >
                            <span className="material-symbols-outlined text-sm">
                              close
                            </span>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Buttons */}
                <div className="space-y-2 pt-2">
                  <button
                    type="button"
                    onClick={saveReport}
                    className="w-full rounded-lg bg-primary py-2.5 font-label-md text-label-md text-on-primary transition hover:opacity-90 active:scale-[0.98]"
                  >
                    Cập nhật & Lưu thông tin
                  </button>
                  <button
                    type="button"
                    onClick={completeJob}
                    disabled={jobStatus === "done"}
                    className={`w-full rounded-lg border py-2.5 font-label-md text-label-md transition ${
                      jobStatus === "done"
                        ? "border-outline-variant bg-surface-container-high text-outline cursor-not-allowed"
                        : "border-tertiary bg-tertiary-container/10 text-tertiary hover:bg-tertiary/20 active:scale-[0.98]"
                    }`}
                  >
                    {jobStatus === "done"
                      ? "Đã hoàn thành"
                      : "Xác nhận hoàn thành công việc"}
                  </button>
                </div>
              </article>
            </aside>
          </div>
        </div>
      </main>

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

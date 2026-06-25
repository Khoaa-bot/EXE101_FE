import { useState } from "react";
import AppSidebar, { type AppSection } from "../components/AppSidebar";

type TrackingPageProps = {
  onHomeClick: () => void;
  onHistoryClick: () => void;
  onNotificationsClick: () => void;
  onProfileClick: () => void;
};

const vehicleImage =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuC4k_UBSnuCnHjpDC6k50szf5Z3Oo4yKM2t9kU0_R1EYLEmXpR0OSok5ddQjJKptTrZiaGqjLiqjmrK821UZXKaZU4DAlIFMyHtJNs5xifBwtqU8U8jFBH4JPInp-jTyem1LZ8dPLVQepnt_2x7W53JBaxfQTFx-eVXGWMHwTO3wz9Y1Nl6yI5T51yPVUirOsHzPJG680yTqdfQti0ppIrzpB_7xB-5dt6zBRSRQuha_nUdcNZn84d8nHFNkYWPlwQmzJ108PAm1mVj";

const steps = [
  {
    title: "Tiếp nhận xe",
    time: "09:35 - 10/10",
    icon: "check",
    status: "done",
  },
  {
    title: "Kiểm tra lỗi",
    time: "10:15 - 10/10",
    icon: "check",
    status: "done",
  },
  {
    title: "Đang sửa chữa",
    time: "Bắt đầu lúc 10:30",
    icon: "build",
    status: "active",
  },
  {
    title: "Kiểm tra chất lượng",
    time: "Dự kiến 15:45",
    icon: "fact_check",
    status: "pending",
  },
  {
    title: "Hoàn thành",
    time: "Dự kiến 16:30",
    icon: "flag",
    status: "pending",
  },
];

const workLogs = [
  {
    title: "Hoàn tất kiểm tra tổng quát",
    subtitle: "Kỹ thuật viên: Trần Bình Trọng",
    time: "10:10",
  },
  {
    title: "Đã nhận linh kiện: Bố thắng Brembo",
    subtitle: "Kho vận: Lê Lợi",
    time: "10:25",
  },
  {
    title: "Bắt đầu tháo lắp hệ thống phanh",
    subtitle: "Đang xử lý...",
    time: "Vừa xong",
    active: true,
  },
];

export default function TrackingPage({
  onHomeClick,
  onHistoryClick,
  onNotificationsClick,
  onProfileClick,
}: TrackingPageProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleNavigate = (section: AppSection) => {
    if (section === "home") onHomeClick();
    if (section === "history") onHistoryClick();
    if (section === "notifications") onNotificationsClick();
    if (section === "profile") onProfileClick();
  };

  return (
    <div className="min-h-dvh bg-background font-sans text-on-surface">
      <AppSidebar
        active="tracking"
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onNavigate={handleNavigate}
      />

      <aside className="fixed left-0 top-0 z-[60] hidden h-full w-[240px] flex-col border-r border-outline-variant bg-white py-xl text-on-surface md:flex">
        <div className="mb-xl px-lg">
          <span className="font-headline-lg text-headline-lg font-bold text-primary">
            Servio
          </span>
        </div>
        <nav className="flex flex-1 flex-col gap-sm px-sm">
          <SidebarButton icon="home" label="Trang chủ" onClick={onHomeClick} />
          <SidebarButton icon="history" label="Lịch sử" onClick={onHistoryClick} />
          <button className="flex items-center gap-md rounded-lg bg-primary px-md py-sm text-white transition-colors">
            <span className="material-symbols-outlined">location_on</span>
            <span className="font-label-md text-label-md">Theo dõi</span>
          </button>
          <SidebarButton
            icon="notifications"
            label="Thông báo"
            onClick={onNotificationsClick}
          />
          <SidebarButton icon="person" label="Cá nhân" onClick={onProfileClick} />
        </nav>
        <div className="mt-auto border-t border-outline-variant px-lg pt-lg">
          <div className="flex items-center gap-md">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-container font-bold text-on-primary-container">
              AD
            </div>
            <div>
              <p className="font-label-md text-label-md text-on-surface">An Dương</p>
              <p className="text-[10px] uppercase tracking-wider text-on-surface-variant opacity-70">
                Premium Member
              </p>
            </div>
          </div>
        </div>
      </aside>

      <header className="fixed top-0 z-50 flex h-16 w-full items-center justify-between border-b border-outline-variant bg-surface px-margin-mobile md:hidden">
        <div className="flex items-center gap-sm">
          <button
            className="-ml-2 rounded-full p-2 text-on-surface-variant"
            type="button"
            onClick={() => setIsSidebarOpen(true)}
            aria-label="Mở menu"
          >
            <span className="material-symbols-outlined">menu</span>
          </button>
          <span className="material-symbols-outlined text-primary">electric_car</span>
          <span className="font-headline-lg text-headline-lg font-bold text-primary">
            Servio
          </span>
        </div>
        <button
          className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-surface-container"
          type="button"
          onClick={onNotificationsClick}
        >
          <span className="material-symbols-outlined">notifications</span>
        </button>
      </header>

      <main className="min-h-screen pb-24 pt-16 md:ml-[240px] md:pt-0">
        <div className="mx-auto max-w-[1200px] space-y-lg px-margin-mobile py-lg md:px-margin-desktop">
          <nav className="hidden items-center gap-sm text-on-surface-variant md:flex">
            <span className="font-label-sm text-label-sm">Bảng điều khiển</span>
            <span className="material-symbols-outlined text-[16px]">
              chevron_right
            </span>
            <span className="font-label-sm text-label-sm text-primary">
              Theo dõi phương tiện
            </span>
          </nav>

          <div className="grid grid-cols-1 gap-lg lg:grid-cols-12">
            <section className="flex flex-col overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest md:flex-row lg:col-span-8">
              <div className="relative h-64 md:h-auto md:w-1/2">
                <img
                  className="h-full w-full object-cover"
                  src={vehicleImage}
                  alt="VinFast VF8 Plus trong trung tâm dịch vụ"
                />
                <div className="absolute left-4 top-4 rounded-full bg-primary px-3 py-1 font-label-md text-label-md text-white shadow-lg">
                  Đang xử lý
                </div>
              </div>

              <div className="flex flex-col justify-between p-lg md:w-1/2">
                <div>
                  <h1 className="mb-xs font-headline-lg text-headline-lg text-primary">
                    VinFast VF8 Plus
                  </h1>
                  <p className="mb-lg font-body-md text-body-md text-on-surface-variant">
                    ID Dịch vụ: #SRV-99210
                  </p>
                  <div className="mb-lg inline-flex items-center gap-md rounded-lg border border-outline-variant bg-surface-container px-lg py-sm">
                    <span className="material-symbols-outlined text-on-surface-variant">
                      branding_watermark
                    </span>
                    <span className="font-headline-md text-headline-md font-bold tracking-widest">
                      30L - 888.88
                    </span>
                  </div>
                </div>

                <div className="space-y-md">
                  <div className="flex items-center justify-between border-b border-outline-variant pb-sm">
                    <span className="font-label-md text-on-surface-variant">
                      Cố vấn dịch vụ
                    </span>
                    <span className="font-label-md">Nguyễn Văn A</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-label-md text-on-surface-variant">
                      Ngày tiếp nhận
                    </span>
                    <span className="font-label-md">10/10/2023 - 09:30</span>
                  </div>
                </div>
              </div>
            </section>

            <section className="relative flex flex-col items-center justify-center overflow-hidden rounded-xl bg-primary-container p-xl text-center text-on-primary-container shadow-lg lg:col-span-4">
              <div className="absolute right-0 top-0 -mr-16 -mt-16 h-32 w-32 rounded-full bg-white/10" />
              <span
                className="material-symbols-outlined mb-md text-[64px]"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                schedule
              </span>
              <h3 className="mb-sm font-label-md text-label-md uppercase tracking-widest opacity-80">
                Thời gian hoàn thành dự kiến
              </h3>
              <div className="mb-xs font-display-lg text-display-lg">16:30</div>
              <div className="font-headline-md text-headline-md">
                Hôm nay, 10/10
              </div>
              <p className="mt-lg px-md font-body-md text-body-md opacity-90">
                Xe của bạn đang được kỹ thuật viên giàu kinh nghiệm nhất xử lý.
              </p>
            </section>

            <section className="rounded-xl border border-outline-variant bg-surface-container-lowest p-lg md:p-xl lg:col-span-12">
              <div className="mb-xl flex flex-col justify-between gap-sm sm:flex-row sm:items-center">
                <h2 className="font-headline-md text-headline-md">
                  Tiến độ sửa chữa
                </h2>
                <span className="flex items-center gap-xs font-label-md text-tertiary">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-tertiary" />
                  Cập nhật 2 phút trước
                </span>
              </div>

              <div className="hidden w-full items-start px-lg md:flex">
                {steps.map((step, index) => (
                  <DesktopStep
                    key={step.title}
                    step={step}
                    isLast={index === steps.length - 1}
                  />
                ))}
              </div>

              <div className="flex flex-col gap-lg md:hidden">
                {steps.map((step, index) => (
                  <MobileStep
                    key={step.title}
                    step={step}
                    isLast={index === steps.length - 1}
                  />
                ))}
              </div>
            </section>

            <section className="rounded-xl border border-outline-variant bg-surface-container-lowest p-lg lg:col-span-6">
              <h3 className="mb-lg flex items-center gap-md font-headline-md text-headline-md">
                <span className="material-symbols-outlined text-primary">history</span>
                Nhật ký công việc
              </h3>
              <div className="space-y-md">
                {workLogs.map((log) => (
                  <div
                    key={log.title}
                    className={`flex items-start justify-between rounded-lg p-md transition-colors hover:bg-surface-container ${
                      log.active ? "border-l-4 border-primary" : ""
                    }`}
                  >
                    <div>
                      <p
                        className={`font-label-md text-label-md ${
                          log.active ? "text-primary" : ""
                        }`}
                      >
                        {log.title}
                      </p>
                      <p className="font-label-sm text-label-sm text-on-surface-variant">
                        {log.subtitle}
                      </p>
                    </div>
                    <span
                      className={`font-label-sm text-label-sm ${
                        log.active ? "text-primary" : "text-on-surface-variant"
                      }`}
                    >
                      {log.time}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-xl border border-outline-variant bg-surface-container-lowest p-lg lg:col-span-6">
              <h3 className="mb-lg flex items-center gap-md font-headline-md text-headline-md">
                <span className="material-symbols-outlined text-primary">
                  receipt_long
                </span>
                Chi phí dự tính
              </h3>
              <div className="space-y-sm">
                <CostRow label="Thay bố thắng trước (VF8)" value="1.250.000đ" />
                <CostRow label="Công thay thế & Cân chỉnh" value="450.000đ" />
                <CostRow label="Dịch vụ rửa xe cao cấp" value="Miễn phí" free />
                <div className="mt-lg flex items-center justify-between border-t border-outline-variant pt-lg">
                  <span className="font-headline-md text-headline-md">Tổng cộng</span>
                  <span className="font-display-lg text-display-lg text-primary">
                    1.700.000đ
                  </span>
                </div>
                <button className="mt-lg flex w-full items-center justify-center gap-md rounded-lg bg-surface-container-highest py-md font-label-md text-on-surface transition-colors hover:bg-outline-variant">
                  <span className="material-symbols-outlined">download</span>
                  Tải báo giá chi tiết (.PDF)
                </button>
              </div>
            </section>
          </div>
        </div>
      </main>

      <nav className="fixed bottom-0 left-0 z-50 flex h-20 w-full items-center justify-around border-t border-outline-variant bg-surface px-2 md:hidden">
        <button
          className="flex flex-col items-center justify-center text-on-surface-variant"
          type="button"
          onClick={onHomeClick}
        >
          <span className="material-symbols-outlined">home</span>
          <span className="font-label-sm text-label-sm">Trang chủ</span>
        </button>
        <button className="flex flex-col items-center justify-center rounded-full bg-secondary-container px-4 py-1 text-on-secondary-container">
          <span className="material-symbols-outlined">location_searching</span>
          <span className="font-label-sm text-label-sm">Theo dõi</span>
        </button>
        <button
          className="flex flex-col items-center justify-center text-on-surface-variant"
          type="button"
          onClick={onHistoryClick}
        >
          <span className="material-symbols-outlined">history</span>
          <span className="font-label-sm text-label-sm">Lịch sử</span>
        </button>
        <button
          className="flex flex-col items-center justify-center text-on-surface-variant"
          type="button"
          onClick={onProfileClick}
        >
          <span className="material-symbols-outlined">person</span>
          <span className="font-label-sm text-label-sm">Cá nhân</span>
        </button>
      </nav>

      <button className="group fixed bottom-24 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white shadow-2xl transition-all hover:scale-110 active:scale-95 md:bottom-12 md:right-12">
        <span className="material-symbols-outlined transition-transform group-hover:rotate-12">
          support_agent
        </span>
        <span className="absolute right-full mr-4 whitespace-nowrap rounded bg-inverse-surface px-3 py-1 font-label-sm text-label-sm text-white opacity-0 transition-opacity group-hover:opacity-100">
          Hỗ trợ trực tuyến
        </span>
      </button>
    </div>
  );
}

function SidebarButton({
  icon,
  label,
  onClick,
}: {
  icon: string;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      className="flex items-center gap-md rounded-lg px-md py-sm text-on-surface-variant transition-colors hover:bg-surface-container"
      type="button"
      onClick={onClick}
    >
      <span className="material-symbols-outlined">{icon}</span>
      <span className="font-label-md text-label-md">{label}</span>
    </button>
  );
}

function DesktopStep({
  step,
  isLast,
}: {
  step: (typeof steps)[number];
  isLast: boolean;
}) {
  const isDone = step.status === "done";
  const isActive = step.status === "active";

  return (
    <div className="relative flex flex-1 flex-col items-center">
      <div
        className={`z-10 flex items-center justify-center rounded-full ${
          isActive
            ? "h-12 w-12 -mt-1 bg-primary text-white shadow-[0_0_0_8px_rgba(0,89,187,0.12)]"
            : isDone
              ? "h-10 w-10 bg-tertiary text-white"
              : "h-10 w-10 border border-outline-variant bg-surface-container text-on-surface-variant"
        }`}
      >
        <span
          className="material-symbols-outlined"
          style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}
        >
          {step.icon}
        </span>
      </div>
      {!isLast && (
        <div
          className={`absolute left-1/2 top-5 h-[2px] w-full ${
            isDone ? "bg-tertiary" : "bg-outline-variant"
          }`}
        />
      )}
      <div className="mt-md text-center">
        <p
          className={`font-label-md text-label-md ${
            isActive ? "font-bold text-primary" : isDone ? "text-tertiary" : "text-on-surface-variant"
          }`}
        >
          {step.title}
        </p>
        <p className="text-[10px] text-on-surface-variant">{step.time}</p>
      </div>
    </div>
  );
}

function MobileStep({
  step,
  isLast,
}: {
  step: (typeof steps)[number];
  isLast: boolean;
}) {
  const isDone = step.status === "done";
  const isActive = step.status === "active";

  return (
    <div className="flex gap-lg">
      <div className="flex flex-col items-center">
        <div
          className={`flex items-center justify-center rounded-full ${
            isActive
              ? "h-10 w-10 bg-primary text-white shadow-[0_0_0_8px_rgba(0,89,187,0.12)]"
              : isDone
                ? "h-8 w-8 bg-tertiary text-white"
                : "h-8 w-8 border border-outline-variant bg-surface-container text-on-surface-variant"
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">{step.icon}</span>
        </div>
        {!isLast && (
          <div
            className={`my-1 w-[2px] flex-1 ${
              isDone ? "bg-tertiary" : "bg-outline-variant"
            }`}
          />
        )}
      </div>
      <div className="pb-md">
        <h4
          className={`${
            isActive
              ? "font-headline-md text-[18px] text-primary"
              : isDone
                ? "font-label-md text-tertiary"
                : "font-label-md text-on-surface-variant"
          }`}
        >
          {step.title}
        </h4>
        <p className="font-label-sm text-label-sm text-on-surface-variant">
          {step.time}
        </p>
        {isActive && (
          <div className="mt-sm rounded-lg bg-surface-container p-md">
            <p className="font-body-md text-body-md text-on-surface-variant">
              Thay thế bố thắng và kiểm tra hệ thống phanh điện tử.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function CostRow({
  label,
  value,
  free = false,
}: {
  label: string;
  value: string;
  free?: boolean;
}) {
  return (
    <div className="flex justify-between py-sm font-body-md text-body-md">
      <span className="text-on-surface-variant">{label}</span>
      <span className={`font-bold ${free ? "text-tertiary" : ""}`}>{value}</span>
    </div>
  );
}

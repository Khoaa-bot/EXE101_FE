import { useState } from "react";
import AppSidebar, { type AppSection } from "../components/AppSidebar";

type BookingPageProps = {
  onHomeClick: () => void;
  onHistoryClick: () => void;
  onNotificationsClick: () => void;
  onProfileClick: () => void;
  onTrackingClick: () => void;
};

export default function BookingPage({
  onHomeClick,
  onHistoryClick,
  onNotificationsClick,
  onProfileClick,
  onTrackingClick,
}: BookingPageProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleNavigate = (section: AppSection) => {
    if (section === "home") onHomeClick();
    if (section === "history") onHistoryClick();
    if (section === "notifications") onNotificationsClick();
    if (section === "tracking") onTrackingClick();
    if (section === "profile") onProfileClick();
  };

  return (
    <div className="flex min-h-dvh flex-col bg-background text-on-surface font-sans">
      <AppSidebar
        active="home"
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onNavigate={handleNavigate}
      />

      <header className="fixed top-0 z-50 flex h-16 w-full items-center justify-between border-b border-outline-variant bg-surface px-margin-mobile">
        <div className="flex items-center gap-sm">
          <button
            className="p-2 text-on-surface-variant transition-colors duration-200 hover:bg-surface-container-low active:opacity-70"
            type="button"
            aria-label="Menu"
            onClick={() => setIsSidebarOpen(true)}
          >
            <span className="material-symbols-outlined">menu</span>
          </button>
          <h1 className="ml-1 font-headline-lg-mobile text-headline-lg-mobile font-bold text-primary">
            Đặt lịch dịch vụ
          </h1>
        </div>

        <button
          className="p-2 text-on-surface-variant transition-colors duration-200 hover:bg-surface-container-low active:opacity-70"
          type="button"
          aria-label="Trợ giúp"
        >
          <span className="material-symbols-outlined">help_outline</span>
        </button>
      </header>

      <main className="mx-auto w-full max-w-[512px] flex-grow px-margin-mobile pb-40 pt-20">
        <section className="mb-lg">
          <div className="mb-sm flex items-end justify-between">
            <div className="flex items-center gap-sm">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary font-bold text-label-md text-on-primary">
                1
              </div>
              <span className="font-label-md text-primary">Thông tin chính</span>
            </div>
            <div className="flex items-center gap-sm">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-container-highest font-bold text-label-md text-on-surface-variant">
                2
              </div>
              <span className="font-label-md text-on-surface-variant">
                Xác nhận
              </span>
            </div>
          </div>
          <div className="h-1 w-full overflow-hidden rounded-full bg-surface-container-highest">
            <div className="h-full w-1/2 rounded-full bg-primary transition-all duration-500 ease-out" />
          </div>
        </section>

        <section className="space-y-lg">
          <FormSelect
            label="Chọn Garage"
            value="Servio Central - Quận 1"
            icon="expand_more"
          />
          <FormSelect
            label="Loại dịch vụ"
            value="Bảo dưỡng định kỳ"
            icon="build"
          />

          <div className="grid grid-cols-2 gap-md">
            <FormSelect label="Ngày hẹn" value="06/20/2026" icon="calendar_today" />
            <FormSelect
              label="Giờ hẹn"
              value="08:00 - 09:00"
              icon="schedule"
            />
          </div>

          <section>
            <label className="mb-sm ml-1 block font-label-md text-on-surface-variant">
              Ghi chú thêm (Tình trạng xe, yêu cầu đặc biệt)
            </label>
            <textarea
              className="h-32 w-full rounded-xl border border-outline-variant bg-surface-container-lowest p-md font-body-md text-on-surface placeholder:text-outline focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              placeholder="Ví dụ: Xe có tiếng kêu lạ ở phía sau khi phanh..."
            />
          </section>

          <section>
            <div className="flex items-center justify-between rounded-xl border border-dashed border-outline bg-surface-container-low p-md">
              <div className="flex items-center gap-md">
                <div className="flex h-10 w-10 items-center justify-center rounded-full border border-outline-variant bg-white">
                  <span className="material-symbols-outlined text-primary">
                    directions_car
                  </span>
                </div>
                <div>
                  <p className="font-label-sm text-label-sm text-on-surface-variant">
                    Xe đang chọn
                  </p>
                  <p className="font-body-md text-body-md font-bold">
                    VinFast VF8 • 51H-123.45
                  </p>
                </div>
              </div>
              <button
                className="font-label-md text-label-md text-primary underline"
                type="button"
              >
                Thay đổi
              </button>
            </div>
          </section>
        </section>

        <section className="mt-lg">
          <div className="rounded-xl border border-secondary-container/30 bg-secondary-container/10 p-md">
            <h4 className="mb-md font-label-md uppercase tracking-wider text-primary">
              Tóm tắt dịch vụ
            </h4>
            <div className="mb-sm flex items-center justify-between">
              <div className="flex items-center gap-sm">
                <span className="material-symbols-outlined text-primary">
                  directions_car
                </span>
                <span className="font-body-md text-on-surface">Dịch vụ chính</span>
              </div>
              <span className="font-label-md font-bold text-on-surface">
                Bảo dưỡng định kỳ
              </span>
            </div>
            <div className="my-md flex items-center justify-between border-t border-outline-variant pt-md">
              <span className="font-body-md text-on-surface-variant">
                Phí kiểm tra tạm tính
              </span>
              <span className="font-headline-md font-bold text-primary">
                250.000đ
              </span>
            </div>
            <p className="text-label-sm italic text-on-surface-variant">
              * Phí cuối cùng sẽ được báo chính xác sau khi kỹ thuật viên kiểm
              tra thực tế tình trạng xe.
            </p>
          </div>
        </section>
      </main>

      <footer className="fixed bottom-0 z-50 flex w-full flex-col gap-sm border-t border-outline-variant bg-surface-container-lowest px-margin-mobile py-md shadow-[0_-4px_16px_rgba(0,0,0,0.05)]">
        <button className="flex w-full items-center justify-center gap-sm rounded-xl bg-primary py-4 font-body-lg text-body-lg font-bold text-on-primary shadow-md transition-transform duration-150 active:scale-95">
          <span>Xác nhận đặt lịch</span>
          <span className="material-symbols-outlined">arrow_forward</span>
        </button>
      </footer>

      <div className="pointer-events-none fixed right-0 top-0 -z-10 h-1/3 w-full bg-gradient-to-b from-primary/5 to-transparent" />
    </div>
  );
}

function FormSelect({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: string;
}) {
  return (
    <section>
      <label className="mb-sm ml-1 block font-label-md text-on-surface-variant">
        {label}
      </label>
      <button
        className="flex w-full items-center justify-between rounded-xl border border-outline-variant bg-surface-container-lowest p-md text-left transition-colors active:bg-surface-container-low"
        type="button"
      >
        <span className="font-body-md text-on-surface">{value}</span>
        <span className="material-symbols-outlined text-outline">{icon}</span>
      </button>
    </section>
  );
}

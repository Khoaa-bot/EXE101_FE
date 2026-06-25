import { useState } from "react";
import AppSidebar, { type AppSection } from "../components/AppSidebar";

type BookingPageProps = {
  onHomeClick: () => void;
  onHistoryClick: () => void;
  onNotificationsClick: () => void;
  onProfileClick: () => void;
  onTrackingClick: () => void;
};

const garageImage =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuCsGSI4JjM9x3QPl7Bms7s1o8sTvJs_rkpjaqqlh5ApkhV_4ijq2JZGikR9PoI-M9pTxm59Nwk258n8G_kWkMcMqToFxVK6dq5IPy63YQAed7BIT6jwyx94BY1TSNVmMlQsSCvExq7H4-EUWjsSFZfcudAh5Rfwr0wiFL8diBAAZz0IqivtDqLJnp2IPW_s6LFSrW7V_eoP3q-QW3PevB0Ivh0uLM1-f576wwF8y7sL26dAWGvaoLGHfqiqffTzJb-7UUnbHfFTHcBp";

const avatarImage =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuAoOtpd2mA6tCtPpc_xOKGgqUmp2z_Z-EfI2YOhRqwHtUTN9nhgCwDcip3VZDzsTcF9QqXS2OQOH4-0RXuePu4pK54_EjXHC3NKbjQTW7MQHtAFhC9x9A7N6FQkOxRGnLtLZ0A9seeVNnU1RnN2EAhFyDypvbKu8f_5qkTQZk1QVBYmjjAkVsdqd7FGvJt73-0TUO0k_DolFun55eyGrmB9A3JFcNmwDvtJJ31qXNF4gLLh1oT8xPVEKvvuRROeA6KOJhlFiAy8b3_u";

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
    <div className="min-h-dvh bg-background font-sans text-on-background">
      <AppSidebar
        active="home"
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onNavigate={handleNavigate}
      />

      <header className="fixed top-0 z-50 flex h-16 w-full items-center justify-between border-b border-outline-variant bg-surface px-margin-mobile md:px-margin-desktop">
        <div className="flex items-center gap-2">
          <button
            className="-ml-2 rounded-full p-2 text-on-surface-variant transition-colors hover:bg-surface-container md:hidden"
            type="button"
            aria-label="Mở menu"
            onClick={() => setIsSidebarOpen(true)}
          >
            <span className="material-symbols-outlined">menu</span>
          </button>
          <span className="material-symbols-outlined text-[32px] text-primary">
            electric_car
          </span>
          <h1 className="font-headline-lg text-headline-lg font-bold text-primary">
            Servio
          </h1>
        </div>

        <nav className="hidden items-center gap-8 md:flex">
          <button
            className="font-label-md text-label-md text-on-surface-variant transition-colors hover:text-primary"
            type="button"
            onClick={onHomeClick}
          >
            Trang chủ
          </button>
          <button
            className="font-label-md text-label-md text-on-surface-variant transition-colors hover:text-primary"
            type="button"
            onClick={onHistoryClick}
          >
            Lịch sử
          </button>
          <button
            className="font-label-md text-label-md text-on-surface-variant transition-colors hover:text-primary"
            type="button"
            onClick={onTrackingClick}
          >
            Theo dõi
          </button>
          <button
            className="font-label-md text-label-md text-on-surface-variant transition-colors hover:text-primary"
            type="button"
            onClick={onNotificationsClick}
          >
            Thông báo
          </button>
          <button
            className="font-label-md text-label-md text-on-surface-variant transition-colors hover:text-primary"
            type="button"
            onClick={onProfileClick}
          >
            Cá nhân
          </button>
        </nav>

        <div className="flex items-center gap-4">
          <button
            className="rounded-full p-2 transition-colors hover:bg-surface-container"
            type="button"
            onClick={onNotificationsClick}
          >
            <span className="material-symbols-outlined text-on-surface-variant">
              notifications
            </span>
          </button>
          <button
            className="h-10 w-10 overflow-hidden rounded-full border border-outline-variant"
            type="button"
            onClick={onProfileClick}
          >
            <img
              className="h-full w-full object-cover"
              src={avatarImage}
              alt="Ảnh đại diện người dùng"
            />
          </button>
        </div>
      </header>

      <main className="mx-auto min-h-screen max-w-[1440px] px-margin-mobile pb-32 pt-24 md:px-margin-desktop">
        <div className="flex flex-col items-start gap-lg lg:flex-row">
          <section className="w-full flex-1 space-y-lg">
            <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-lg shadow-sm md:p-xl">
              <div className="mb-xl">
                <h2 className="mb-2 font-headline-lg text-headline-lg text-on-surface">
                  Đặt lịch dịch vụ
                </h2>
                <p className="font-body-md text-body-md text-on-surface-variant">
                  Vui lòng điền thông tin chi tiết để chúng tôi sắp xếp kỹ thuật
                  viên tốt nhất cho xe của bạn.
                </p>
              </div>

              <form className="space-y-lg">
                <div className="mb-xl flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary font-label-md text-label-md text-on-primary">
                      1
                    </span>
                    <span className="font-label-md text-label-md text-primary">
                      Thông tin chính
                    </span>
                  </div>
                  <div className="h-px flex-1 bg-outline-variant" />
                  <div className="flex items-center gap-2 opacity-40">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-container-highest font-label-md text-label-md text-on-surface">
                      2
                    </span>
                    <span className="font-label-md text-label-md text-on-surface">
                      Xác nhận
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-lg md:grid-cols-2">
                  <SelectField
                    label="Chọn Garage"
                    icon="expand_more"
                    options={[
                      "Servio Central - Quận 1",
                      "Servio Premium - Quận 7",
                      "Servio Express - Thủ Đức",
                    ]}
                  />
                  <SelectField
                    label="Loại dịch vụ"
                    icon="build"
                    options={[
                      "Bảo dưỡng định kỳ",
                      "Kiểm tra động cơ",
                      "Thay dầu & Lọc gió",
                      "Sửa chữa hệ thống phanh",
                    ]}
                  />
                  <div className="space-y-sm">
                    <label className="px-1 font-label-md text-label-md text-on-surface-variant">
                      Ngày hẹn
                    </label>
                    <div className="relative">
                      <input
                        className="w-full rounded-lg border border-outline-variant bg-surface-container-low px-4 py-3 font-body-md text-body-md outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary"
                        type="date"
                        min="2026-06-26"
                      />
                      <span className="material-symbols-outlined pointer-events-none absolute right-3 top-3 text-on-surface-variant">
                        calendar_today
                      </span>
                    </div>
                  </div>
                  <SelectField
                    label="Giờ hẹn"
                    icon="schedule"
                    options={[
                      "08:00 - 09:00",
                      "09:00 - 10:00",
                      "10:00 - 11:00",
                      "14:00 - 15:00",
                      "15:00 - 16:00",
                    ]}
                  />
                </div>

                <div className="space-y-sm pt-4">
                  <label className="px-1 font-label-md text-label-md text-on-surface-variant">
                    Ghi chú thêm (Tình trạng xe, yêu cầu đặc biệt)
                  </label>
                  <textarea
                    className="w-full resize-none rounded-lg border border-outline-variant bg-surface-container-low px-4 py-3 font-body-md text-body-md outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary"
                    placeholder="Ví dụ: Xe có tiếng kêu lạ ở phía sau khi phanh..."
                    rows={4}
                  />
                </div>

                <div className="flex justify-end pt-8">
                  <button
                    className="flex items-center gap-3 rounded-lg bg-primary px-xl py-4 font-headline-md text-headline-md text-on-primary shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] hover:bg-surface-tint active:scale-95"
                    type="button"
                  >
                    Xác nhận đặt lịch
                    <span className="material-symbols-outlined">arrow_forward</span>
                  </button>
                </div>
              </form>
            </div>
          </section>

          <aside className="w-full space-y-lg lg:sticky lg:top-24 lg:w-[400px]">
            <section className="overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest shadow-sm">
              <div className="relative h-48 overflow-hidden">
                <img
                  className="h-full w-full object-cover"
                  src={garageImage}
                  alt="Garage Servio hiện đại"
                />
                <div className="absolute right-4 top-4 flex items-center gap-1 rounded-full bg-tertiary px-3 py-1 font-label-sm text-label-sm text-on-tertiary">
                  <span className="material-symbols-outlined text-[14px]">star</span>
                  4.9 (1.2k review)
                </div>
              </div>
              <div className="p-lg">
                <h3 className="mb-1 font-headline-md text-headline-md text-on-surface">
                  Servio Central - Quận 1
                </h3>
                <p className="mb-4 flex items-center gap-2 font-body-md text-body-md text-on-surface-variant">
                  <span className="material-symbols-outlined text-[18px] text-primary">
                    location_on
                  </span>
                  123 Lê Lợi, Phường Bến Thành, Q.1
                </p>
                <div className="grid grid-cols-2 gap-sm">
                  <div className="rounded-lg border border-outline-variant/30 bg-surface-container p-3">
                    <span className="mb-1 block font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">
                      Mở cửa
                    </span>
                    <span className="block font-body-md text-body-md font-semibold text-on-surface">
                      08:00 - 18:00
                    </span>
                  </div>
                  <div className="rounded-lg border border-outline-variant/30 bg-surface-container p-3">
                    <span className="mb-1 block font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">
                      Thiết bị
                    </span>
                    <span className="block font-body-md text-body-md font-semibold text-on-surface">
                      Chuẩn 5 Sao
                    </span>
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-xl border border-primary/20 bg-primary-container/10 p-lg">
              <h4 className="mb-4 font-label-md text-label-md uppercase tracking-widest text-primary">
                Tóm tắt dịch vụ
              </h4>
              <ul className="space-y-4">
                <li className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">
                      directions_car
                    </span>
                    <span className="font-body-md text-on-surface">
                      Dịch vụ chính
                    </span>
                  </div>
                  <span className="text-right font-label-md text-label-md text-on-surface">
                    Bảo dưỡng định kỳ
                  </span>
                </li>
                <li className="flex items-center justify-between border-t border-primary/10 pt-4">
                  <span className="font-body-md text-on-surface-variant">
                    Phí kiểm tra tạm tính
                  </span>
                  <span className="font-headline-md text-headline-md text-primary">
                    250.000đ
                  </span>
                </li>
              </ul>
              <p className="mt-4 text-[11px] leading-tight text-on-surface-variant italic">
                * Phí cuối cùng sẽ được báo chính xác sau khi kỹ thuật viên kiểm
                tra thực tế tình trạng xe.
              </p>
            </section>

            <section className="flex items-center gap-4 rounded-xl bg-surface-container-high p-md">
              <div className="flex h-12 w-12 items-center justify-center rounded-full border border-outline-variant bg-surface-container-lowest text-primary">
                <span className="material-symbols-outlined">support_agent</span>
              </div>
              <div>
                <p className="font-label-md text-label-md text-on-surface">
                  Cần hỗ trợ ngay?
                </p>
                <p className="font-body-md text-body-md font-bold text-primary">
                  1900 6789
                </p>
              </div>
            </section>
          </aside>
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
        <button
          className="flex flex-col items-center justify-center text-on-surface-variant"
          type="button"
          onClick={onTrackingClick}
        >
          <span className="material-symbols-outlined">location_searching</span>
          <span className="font-label-sm text-label-sm">Theo dõi</span>
        </button>
        <button
          className="flex flex-col items-center justify-center rounded-full bg-secondary-container px-4 py-1 text-on-secondary-container"
          type="button"
        >
          <span className="material-symbols-outlined">calendar_month</span>
          <span className="font-label-sm text-label-sm">Đặt lịch</span>
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
    </div>
  );
}

function SelectField({
  label,
  icon,
  options,
}: {
  label: string;
  icon: string;
  options: string[];
}) {
  return (
    <div className="space-y-sm">
      <label className="px-1 font-label-md text-label-md text-on-surface-variant">
        {label}
      </label>
      <div className="relative">
        <select className="w-full appearance-none rounded-lg border border-outline-variant bg-surface-container-low px-4 py-3 font-body-md text-body-md outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary">
          {options.map((option) => (
            <option key={option}>{option}</option>
          ))}
        </select>
        <span className="material-symbols-outlined pointer-events-none absolute right-3 top-3 text-on-surface-variant">
          {icon}
        </span>
      </div>
    </div>
  );
}

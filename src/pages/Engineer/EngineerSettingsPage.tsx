import { useState } from "react";

const navItems = [
  ["dashboard", "Tổng quan"],
  ["calendar_today", "Lịch làm việc"],
  ["event_note", "Lịch hẹn"],
  ["engineering", "Kỹ thuật viên"],
  ["person", "Khách hàng"],
  ["settings", "Cài đặt"],
];

type EngineerSettingsPageProps = {
  onDashboardClick?: () => void;
  onScheduleClick?: () => void;
  onAppointmentsClick?: () => void;
  onTechniciansClick?: () => void;
  onCustomersClick?: () => void;
  onSettingsClick?: () => void;
  onLogout?: () => void;
};

export default function EngineerSettingsPage({
  onDashboardClick,
  onScheduleClick,
  onAppointmentsClick,
  onTechniciansClick,
  onCustomersClick,
  onSettingsClick,
  onLogout,
}: EngineerSettingsPageProps) {
  const [profile, setProfile] = useState({
    name: "Trần Quốc Toản",
    email: "toan.tran@servio.vn",
    phone: "090 123 4567",
  });

  const [reminderNotif, setReminderNotif] = useState(true);
  const [dailySummaryNotif, setDailySummaryNotif] = useState(false);
  const [notice, setNotice] = useState("");

  const showNotice = (msg: string) => {
    setNotice(msg);
    window.setTimeout(() => setNotice(""), 3000);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    showNotice("Đã cập nhật thông tin cá nhân thành công!");
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
            const isCurrent = label === "Cài đặt";
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
          <div className="hidden font-bold text-sm text-on-surface-variant md:block">
            Cài đặt tài khoản kỹ thuật viên
          </div>
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
                <p className="font-label-md text-label-md">{profile.name}</p>
                <p className="text-[11px] text-on-surface-variant">
                  KTV Trưởng
                </p>
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-fixed font-bold text-on-primary-fixed">
                {profile.name.charAt(0)}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="mx-auto max-w-3xl p-margin-mobile md:p-margin-desktop">
          <div className="border-b border-outline-variant pb-5">
            <h1 className="font-headline-lg text-headline-lg font-bold">
              Cài đặt tài khoản
            </h1>
            <p className="mt-1 text-body-sm text-on-surface-variant">
              Quản lý thông tin cá nhân và tùy chọn hiển thị thông báo.
            </p>
          </div>

          <div className="mt-6 space-y-6">
            {/* Personal Info Card */}
            <article className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-6 shadow-sm">
              <div className="mb-4 flex items-center gap-2 text-primary font-bold">
                <span className="material-symbols-outlined text-xl">
                  badge
                </span>
                <h2 className="font-headline-md text-lg">Thông tin cá nhân</h2>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-on-surface-variant">
                    Họ và tên *
                  </label>
                  <input
                    type="text"
                    required
                    value={profile.name}
                    onChange={(e) =>
                      setProfile({ ...profile, name: e.target.value })
                    }
                    className="w-full rounded-lg border border-outline-variant bg-surface-container-low px-3 py-2 text-body-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-on-surface-variant">
                    Email liên hệ *
                  </label>
                  <input
                    type="email"
                    required
                    value={profile.email}
                    onChange={(e) =>
                      setProfile({ ...profile, email: e.target.value })
                    }
                    className="w-full rounded-lg border border-outline-variant bg-surface-container-low px-3 py-2 text-body-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-on-surface-variant">
                    Số điện thoại
                  </label>
                  <input
                    type="text"
                    value={profile.phone}
                    onChange={(e) =>
                      setProfile({ ...profile, phone: e.target.value })
                    }
                    className="w-full rounded-lg border border-outline-variant bg-surface-container-low px-3 py-2 text-body-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="rounded-lg bg-primary px-4 py-2 font-label-md text-xs font-semibold text-on-primary transition hover:opacity-90 active:scale-[0.98]"
                  >
                    Lưu thay đổi
                  </button>
                </div>
              </form>
            </article>

            {/* Notifications Preferences Card */}
            <article className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-6 shadow-sm">
              <div className="mb-4 flex items-center gap-2 text-primary font-bold">
                <span className="material-symbols-outlined text-xl">
                  notifications_active
                </span>
                <h2 className="font-headline-md text-lg">Cài đặt thông báo</h2>
              </div>

              <div className="space-y-4 text-body-sm">
                <div className="flex items-center justify-between border-b border-outline-variant/60 pb-3">
                  <div>
                    <p className="font-bold">Nhắc lịch làm việc</p>
                    <p className="text-xs text-on-surface-variant">
                      Nhận thông báo nhắc ca làm việc trước 30 phút
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setReminderNotif(!reminderNotif);
                      showNotice(
                        `Đã ${!reminderNotif ? "bật" : "tắt"} nhắc lịch làm việc.`,
                      );
                    }}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                      reminderNotif ? "bg-primary" : "bg-surface-container-high"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        reminderNotif ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div>
                    <p className="font-bold">Email tổng kết cuối ngày</p>
                    <p className="text-xs text-on-surface-variant">
                      Tự động gửi báo cáo tổng kết các ca làm việc vào lúc 18:00
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setDailySummaryNotif(!dailySummaryNotif);
                      showNotice(
                        `Đã ${!dailySummaryNotif ? "bật" : "tắt"} email tổng kết cuối ngày.`,
                      );
                    }}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                      dailySummaryNotif
                        ? "bg-primary"
                        : "bg-surface-container-high"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        dailySummaryNotif ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
              </div>
            </article>
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

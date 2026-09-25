import { useEffect, useState } from "react";
import { getMyProfile, updateMyProfile, type UserProfile } from "../../services/api";

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
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [fullNameInput, setFullNameInput] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [notice, setNotice] = useState("");

  const showNotice = (msg: string) => {
    setNotice(msg);
    window.setTimeout(() => setNotice(""), 3000);
  };

  useEffect(() => {
    setIsLoading(true);
    setLoadError(null);
    getMyProfile()
      .then((data) => {
        setProfile(data);
        setFullNameInput(data.fullName || data.username);
      })
      .catch((err) => {
        setLoadError(
          err instanceof Error ? err.message : "Không tải được thông tin cá nhân.",
        );
      })
      .finally(() => setIsLoading(false));
  }, []);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullNameInput.trim()) return;
    setIsSaving(true);
    updateMyProfile({ fullName: fullNameInput.trim() })
      .then((updated) => {
        setProfile(updated);
        setFullNameInput(updated.fullName || updated.username);
        showNotice("Đã cập nhật thông tin cá nhân thành công!");
      })
      .catch((err) => {
        showNotice(
          err instanceof Error ? err.message : "Không thể cập nhật thông tin.",
        );
      })
      .finally(() => setIsSaving(false));
  };

  const displayName = profile?.fullName || profile?.username || "Kỹ thuật viên";

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
                <p className="font-label-md text-label-md">{displayName}</p>
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-fixed font-bold text-on-primary-fixed">
                {displayName.charAt(0).toUpperCase()}
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
              Quản lý thông tin cá nhân của bạn.
            </p>
          </div>

          {isLoading && (
            <p className="mt-6 text-body-sm text-on-surface-variant">
              Đang tải thông tin cá nhân...
            </p>
          )}

          {!isLoading && loadError && (
            <p className="mt-6 text-body-sm text-error">{loadError}</p>
          )}

          {!isLoading && !loadError && profile && (
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
                      value={fullNameInput}
                      onChange={(e) => setFullNameInput(e.target.value)}
                      className="w-full rounded-lg border border-outline-variant bg-surface-container-low px-3 py-2 text-body-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-on-surface-variant">
                      Email liên hệ
                    </label>
                    <input
                      type="email"
                      readOnly
                      value={profile.email}
                      className="w-full cursor-not-allowed rounded-lg border border-outline-variant bg-surface-container-high px-3 py-2 text-body-sm text-on-surface-variant"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-on-surface-variant">
                      Số điện thoại
                    </label>
                    <input
                      type="text"
                      readOnly
                      value={profile.phone ?? "—"}
                      className="w-full cursor-not-allowed rounded-lg border border-outline-variant bg-surface-container-high px-3 py-2 text-body-sm text-on-surface-variant"
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="rounded-lg bg-primary px-4 py-2 font-label-md text-xs font-semibold text-on-primary transition hover:opacity-90 active:scale-[0.98] disabled:opacity-60"
                    >
                      {isSaving ? "Đang lưu..." : "Lưu thay đổi"}
                    </button>
                  </div>
                </form>
              </article>
            </div>
          )}
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

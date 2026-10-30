import StaffShell from "../../components/StaffShell";
import { useEffect, useState } from "react";
import { getMyProfile, updateMyProfile, type UserProfile } from "../../services/api";

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
      <StaffShell
        role="engineer"
        active="settings"
        handlers={{ dashboard: onDashboardClick, schedule: onScheduleClick, appointments: onAppointmentsClick, technicians: onTechniciansClick, customers: onCustomersClick, settings: onSettingsClick }}
        userName={displayName}
        onLogout={onLogout}
      >

        {/* Page Content */}
        <div className="mx-auto max-w-3xl p-6 md:p-8">
          <div className="border-b border-outline-variant pb-5">
            <h1 className="text-3xl font-extrabold tracking-tight">
              Cài đặt tài khoản
            </h1>
            <p className="mt-1 text-sm text-on-surface-variant">
              Quản lý thông tin cá nhân của bạn.
            </p>
          </div>

          {isLoading && (
            <p className="mt-6 text-sm text-on-surface-variant">
              Đang tải thông tin cá nhân...
            </p>
          )}

          {!isLoading && loadError && (
            <p className="mt-6 text-sm text-error">{loadError}</p>
          )}

          {!isLoading && !loadError && profile && (
            <div className="mt-6 space-y-6">
              {/* Personal Info Card */}
              <article className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-6 shadow-sm">
                <div className="mb-4 flex items-center gap-2 text-primary font-bold">
                  <span className="material-symbols-outlined text-xl">
                    badge
                  </span>
                  <h2 className="text-lg font-extrabold">Thông tin cá nhân</h2>
                </div>

                <form onSubmit={handleSaveProfile} className="space-y-4">
                  <div>
                    <label htmlFor="pages-engineer-engineersettingspage-field-1" className="mb-1 block text-xs font-semibold text-on-surface-variant">
                      Họ và tên *
                    </label>
                    <input id="pages-engineer-engineersettingspage-field-1"
                      type="text"
                      required
                      value={fullNameInput}
                      onChange={(e) => setFullNameInput(e.target.value)}
                      className="w-full rounded-[14px] border border-outline-variant bg-surface-container-lowest px-3.5 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                    />
                  </div>

                  <div>
                    <label htmlFor="pages-engineer-engineersettingspage-field-2" className="mb-1 block text-xs font-semibold text-on-surface-variant">
                      Email liên hệ
                    </label>
                    <input id="pages-engineer-engineersettingspage-field-2"
                      type="email"
                      readOnly
                      value={profile.email}
                      className="w-full cursor-not-allowed rounded-xl border border-outline-variant bg-surface-container-high px-3 py-2 text-sm text-on-surface-variant"
                    />
                  </div>

                  <div>
                    <label htmlFor="pages-engineer-engineersettingspage-field-3" className="mb-1 block text-xs font-semibold text-on-surface-variant">
                      Số điện thoại
                    </label>
                    <input id="pages-engineer-engineersettingspage-field-3"
                      type="text"
                      readOnly
                      value={profile.phone ?? "—"}
                      className="w-full cursor-not-allowed rounded-xl border border-outline-variant bg-surface-container-high px-3 py-2 text-sm text-on-surface-variant"
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="rounded-xl bg-gradient-to-br from-primary to-primary-container px-4 py-2 text-xs font-bold text-on-primary transition hover:opacity-90 active:scale-[0.98] disabled:opacity-60"
                    >
                      {isSaving ? "Đang lưu..." : "Lưu thay đổi"}
                    </button>
                  </div>
                </form>
              </article>
            </div>
          )}
        </div>
      </StaffShell>

      {/* Notice Toast */}
      {notice && (
        <div
          className="fixed bottom-5 right-5 z-50 rounded-2xl bg-inverse-surface px-4 py-3 text-sm text-inverse-on-surface shadow-[0_18px_40px_-16px_rgba(25,28,29,0.5)]"
          role="status"
        >
          {notice}
        </div>
      )}
    </div>
  );
}

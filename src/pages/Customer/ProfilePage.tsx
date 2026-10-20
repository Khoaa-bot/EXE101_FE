import { useEffect, useState } from "react";
import AppSidebar, { type AppSection } from "../../components/AppSidebar";
import { MaintenanceBadge, MaintenancePanel } from "../../components/MaintenancePanel";
import {
  deleteVehicle,
  getAppointmentHistory,
  getFleetMaintenanceStatus,
  getMyFleet,
  getMyProfile,
  updateMyProfile,
  updateVehicle,
  uploadMyAvatar,
  uploadVehicleImage,
  type AppointmentDto,
  type MaintenanceStatus,
  type UserProfile,
  type Vehicle,
} from "../../services/api";
import { MAX_ODOMETER_KM, worstStage } from "../../utils/maintenance";

type ProfilePageProps = {
  onAddVehicleClick: () => void;
  onBookingClick: () => void;
  onDiagnoseClick: (vehicleId: number) => void;
  onHomeClick: () => void;
  onHistoryClick: () => void;
  onTrackingClick: () => void;
  onNotificationsClick: () => void;
};

const avatarImage =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBl6W8I5H3BfDFb22UjJQatw0FPp5xydKMsK-jUyjMA-FwrvcPV3RNKiFv1p8QBVLeYlaGIDEo5W6KFS_72jfZTewB9MVEh78wMhnMxtyJec2e6FaXvgzKuPm7PnswzNmLkKmZwbTd37kI2gyxZHxCosroonYa_A1v-0pLA-2lsgZGhyXQw8JfWYSAkBFE2bsY3dZMR-HJj5UE5yEQSIu-3oUPaLXtUAT4ZeOntJFVoLrrat_P30uF6EeSdGKM0NUpakECPHcMF0KNY";
const topAvatarImage =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuCq7cLuR28NLZYDSnck17DV8qG7n3tF_B7rNhoMNrib2fG2p2rKRCqQYZolZj5T2Mu_JuQSmU4WRs9bblBGdV9L4c_OqWhDx7CfjFRVzLVNyQjpHWWpw4vOzgRu24QbzH2ov76-r9IDfTMPPple7SoRbOyo3BLH7CtQy2B19gdNrdt5a2PZv4TBd3pfx5X1aIl2oxTGPoXWl_NgbEq2GQE70wjGMu6RjUSZyqHWLk5q1AZ8SFMKbVq-sAYt2JvqT0SF4ak8qMboFVil";

export default function ProfilePage({
  onAddVehicleClick,
  onBookingClick,
  onDiagnoseClick,
  onHomeClick,
  onHistoryClick,
  onTrackingClick,
  onNotificationsClick,
}: ProfilePageProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isLoadingVehicles, setIsLoadingVehicles] = useState(true);
  const [vehiclesError, setVehiclesError] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [uploadingImageId, setUploadingImageId] = useState<number | null>(null);
  const [maintenance, setMaintenance] = useState<MaintenanceStatus[]>([]);

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [profileError, setProfileError] = useState("");
  const [fullNameInput, setFullNameInput] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [recentActivity, setRecentActivity] = useState<AppointmentDto[]>([]);

  const handleNavigate = (section: AppSection) => {
    if (section === "home") onHomeClick();
    if (section === "history") onHistoryClick();
    if (section === "tracking") onTrackingClick();
    if (section === "notifications") onNotificationsClick();
  };

  const loadVehicles = () => {
    setIsLoadingVehicles(true);
    setVehiclesError("");
    getMyFleet()
      .then(setVehicles)
      .catch((requestError) => {
        setVehiclesError(
          requestError instanceof Error
            ? requestError.message
            : "Không tải được danh sách xe.",
        );
      })
      .finally(() => setIsLoadingVehicles(false));
  };

  const loadMaintenance = () => {
    getFleetMaintenanceStatus()
      .then(setMaintenance)
      .catch(() => {
        // Nhắc bảo dưỡng chỉ là thông tin bổ sung — lỗi thì bỏ qua, danh sách xe vẫn dùng được.
      });
  };

  const stageByVehicle = vehicles.map((vehicle) =>
    worstStage(maintenance.filter((item) => item.vehicleId === vehicle.id)),
  );
  const overdueCount = stageByVehicle.filter((stage) => stage === "OVERDUE").length;
  const soonCount = stageByVehicle.filter((stage) => stage === "SOON").length;

  const loadProfile = () => {
    setIsLoadingProfile(true);
    setProfileError("");
    getMyProfile()
      .then((loadedProfile) => {
        setProfile(loadedProfile);
        setFullNameInput(loadedProfile.fullName || loadedProfile.username);
      })
      .catch((requestError) => {
        setProfileError(
          requestError instanceof Error
            ? requestError.message
            : "Không tải được thông tin cá nhân.",
        );
      })
      .finally(() => setIsLoadingProfile(false));
  };

  useEffect(() => {
    loadVehicles();
    loadMaintenance();
    loadProfile();
    getAppointmentHistory()
      .then((history) => setRecentActivity(history.slice(0, 4)))
      .catch(() => {
        // Widget này không quan trọng bằng thông tin hồ sơ/xe — bỏ qua lỗi,
        // để trống là đủ, không chặn phần còn lại của trang.
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSaveProfile = async () => {
    if (!fullNameInput.trim()) {
      setProfileError("Vui lòng nhập tên người dùng.");
      return;
    }
    setIsSavingProfile(true);
    setProfileError("");
    setProfileSaved(false);
    try {
      const updated = await updateMyProfile({ fullName: fullNameInput.trim() });
      setProfile(updated);
      setFullNameInput(updated.fullName || updated.username);
      setProfileSaved(true);
    } catch (requestError) {
      setProfileError(
        requestError instanceof Error
          ? requestError.message
          : "Cập nhật thông tin không thành công.",
      );
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setIsUploadingAvatar(true);
    setProfileError("");
    try {
      const updated = await uploadMyAvatar(file);
      setProfile(updated);
    } catch (requestError) {
      setProfileError(
        requestError instanceof Error
          ? requestError.message
          : "Tải ảnh đại diện không thành công.",
      );
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleDeleteVehicle = async (vehicleId: number) => {
    if (!window.confirm("Xoá phương tiện này khỏi hồ sơ của bạn?")) return;

    setDeletingId(vehicleId);
    try {
      await deleteVehicle(vehicleId);
      setVehicles((current) => current.filter((vehicle) => vehicle.id !== vehicleId));
    } catch (requestError) {
      setVehiclesError(
        requestError instanceof Error
          ? requestError.message
          : "Xoá phương tiện không thành công.",
      );
    } finally {
      setDeletingId(null);
    }
  };

  const handleSaveEdit = async (
    vehicleId: number,
    payload: {
      year: number | undefined;
      licensePlate: string;
      color: string;
      odometer: number | undefined;
    },
  ) => {
    setIsSavingEdit(true);
    setVehiclesError("");
    try {
      const updated = await updateVehicle(vehicleId, payload);
      setVehicles((current) =>
        current.map((vehicle) => (vehicle.id === vehicleId ? updated : vehicle)),
      );
      setEditingId(null);
    } catch (requestError) {
      setVehiclesError(
        requestError instanceof Error
          ? requestError.message
          : "Cập nhật phương tiện không thành công.",
      );
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleQuickOdometer = async (vehicleId: number, odometer: number) => {
    setVehiclesError("");
    try {
      const updated = await updateVehicle(vehicleId, { odometer });
      setVehicles((current) =>
        current.map((vehicle) => (vehicle.id === vehicleId ? updated : vehicle)),
      );
      loadMaintenance();
      return null;
    } catch (requestError) {
      return requestError instanceof Error
        ? requestError.message
        : "Cập nhật số km không thành công.";
    }
  };

  const handleUploadImage = async (vehicleId: number, file: File) => {
    setUploadingImageId(vehicleId);
    setVehiclesError("");
    try {
      const updated = await uploadVehicleImage(vehicleId, file);
      setVehicles((current) =>
        current.map((vehicle) => (vehicle.id === vehicleId ? updated : vehicle)),
      );
    } catch (requestError) {
      setVehiclesError(
        requestError instanceof Error
          ? requestError.message
          : "Tải ảnh xe không thành công.",
      );
    } finally {
      setUploadingImageId(null);
    }
  };

  return (
    <div className="min-h-dvh overflow-x-hidden bg-background font-sans text-on-surface">
      <AppSidebar
        active="profile"
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onNavigate={handleNavigate}
      />

      <aside className="fixed left-0 top-0 z-40 hidden h-screen w-[240px] flex-col gap-md border-r border-outline-variant bg-white px-md py-xl md:flex">
        <div className="mb-4 flex items-center gap-3 px-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white">
            <span
              className="material-symbols-outlined"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              electric_car
            </span>
          </div>
          <div>
            <h1 className="font-headline-lg text-headline-lg font-bold leading-none tracking-tight text-primary">
              Servio
            </h1>
            <p className="mt-1 text-[10px] uppercase tracking-widest text-secondary">
              EV Maintenance
            </p>
          </div>
        </div>

        <nav className="flex flex-col gap-1">
          <SideNavItem icon="home" label="Trang chủ" onClick={onHomeClick} />
          <SideNavItem icon="history" label="Lịch sử" onClick={onHistoryClick} />
          <SideNavItem
            icon="electric_car"
            label="Theo dõi"
            onClick={onTrackingClick}
          />
          <SideNavItem
            icon="notifications"
            label="Thông báo"
            onClick={onNotificationsClick}
          />
          <button className="flex items-center gap-3 rounded-full bg-primary-container px-4 py-3 font-bold text-on-primary-container transition-all">
            <span
              className="material-symbols-outlined"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              person
            </span>
            <span className="font-body-md text-body-md">Cá nhân</span>
          </button>
        </nav>
      </aside>

      <header className="fixed top-0 z-50 flex h-16 items-center justify-between border-b border-outline-variant bg-surface px-margin-mobile md:left-[240px] md:right-0 md:px-xl">
        <div className="flex flex-1 items-center gap-3 md:max-w-[560px]">
          <button
            className="-ml-2 rounded-full p-2 text-on-surface-variant md:hidden"
            type="button"
            aria-label="Mở menu"
            onClick={() => setIsSidebarOpen(true)}
          >
            <span className="material-symbols-outlined">menu</span>
          </button>
          <div className="relative hidden w-full rounded-full transition-all focus-within:ring-2 focus-within:ring-primary md:block">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline">
              search
            </span>
            <input aria-label="Tìm kiếm dịch vụ, trạm sạc..."
              className="w-full rounded-full border-none bg-surface-container-low py-2 pl-12 pr-4 font-body-md text-body-md transition-colors focus:bg-white focus:outline-none"
              placeholder="Tìm kiếm dịch vụ, trạm sạc..."
              type="text"
            />
          </div>
          <h1 className="font-headline-lg text-headline-lg font-bold text-primary md:hidden">
            Cá nhân
          </h1>
        </div>

        <div className="flex items-center gap-4">
          <button aria-label="Trợ giúp" className="rounded-full p-2 transition-colors hover:bg-surface-container-high">
            <span className="material-symbols-outlined text-on-surface-variant">
              help
            </span>
          </button>
          <button aria-label="Ứng dụng" className="hidden rounded-full p-2 transition-colors hover:bg-surface-container-high md:block">
            <span className="material-symbols-outlined text-on-surface-variant">
              apps
            </span>
          </button>
          <button
            className="hidden rounded-full bg-primary px-5 py-2 font-label-md text-label-md text-white transition-all hover:opacity-90 active:scale-95 md:block"
            type="button"
            onClick={onAddVehicleClick}
          >
            Thêm xe
          </button>
          <button
            className="h-8 w-8 overflow-hidden rounded-full border border-outline-variant"
            type="button"
          >
            <img
              className="h-full w-full object-cover"
              src={profile?.avatarUrl || topAvatarImage}
              alt="Ảnh đại diện"
            />
          </button>
        </div>
      </header>

      <main className="min-h-screen pt-16 md:ml-[240px]">
        <div className="mx-auto max-w-7xl space-y-5 p-margin-mobile pb-28 md:p-xl">
          <section
            aria-label="Hồ sơ của bạn"
            className="flex flex-col gap-5 rounded-3xl bg-gradient-to-br from-primary to-primary-container p-6 text-on-primary sm:flex-row sm:items-center"
          >
            <div className="relative h-[84px] w-[84px] shrink-0">
              <img
                className="h-full w-full rounded-full border-4 border-white/80 object-cover"
                src={profile?.avatarUrl || avatarImage}
                alt="Ảnh đại diện người dùng"
              />
              <label
                className={`absolute -bottom-0.5 -right-0.5 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border-2 border-white bg-on-primary-fixed-variant text-white transition-transform hover:scale-110 ${
                  isUploadingAvatar ? "pointer-events-none opacity-60" : ""
                }`}
              >
                <span aria-hidden="true" className="material-symbols-outlined text-base">
                  {isUploadingAvatar ? "hourglass_empty" : "photo_camera"}
                </span>
                <input
                  aria-label="Tải ảnh đại diện"
                  className="sr-only"
                  type="file"
                  accept="image/*"
                  disabled={isUploadingAvatar}
                  onChange={handleAvatarChange}
                />
              </label>
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="truncate text-2xl font-extrabold">
                {profile?.fullName || profile?.username || "Hồ sơ của bạn"}
              </h2>
              <p className="truncate text-sm opacity-85">
                {profile?.username ? `${profile.username} · ` : ""}
                {profile?.email || ""}
              </p>
              {isUploadingAvatar && <p className="mt-1 text-xs opacity-85">Đang tải ảnh lên...</p>}
            </div>
            <div className="flex gap-7 text-center">
              <div>
                <b className="text-2xl">{vehicles.length}</b>
                <p className="text-xs opacity-85">Xe</p>
              </div>
              <div>
                <b className="text-2xl">{recentActivity.length}</b>
                <p className="text-xs opacity-85">Hoạt động gần đây</p>
              </div>
            </div>
          </section>

          <div className="grid items-start gap-5 xl:grid-cols-[22rem_1fr]">
            <section
              aria-labelledby="profile-info-title"
              className="rounded-3xl border border-outline-variant/40 bg-surface-container-lowest p-6 shadow-[0_10px_26px_-14px_rgba(25,28,29,0.28)]"
            >
              <h3 id="profile-info-title" className="mb-4 text-lg font-extrabold">
                Thông tin cá nhân
              </h3>
              <div className="space-y-4">
                <label className="block">
                  <span className="mb-1.5 block text-xs font-bold text-on-surface-variant">Tên người dùng</span>
                  <input
                    className="min-h-12 w-full rounded-2xl border border-outline-variant bg-surface-container-lowest px-4 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/30"
                    type="text"
                    value={fullNameInput}
                    disabled={isLoadingProfile}
                    onChange={(event) => {
                      setFullNameInput(event.target.value);
                      setProfileSaved(false);
                    }}
                  />
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-xs font-bold text-on-surface-variant">Địa chỉ Email</span>
                  <input
                    className="min-h-12 w-full cursor-not-allowed rounded-2xl border border-outline-variant bg-surface-container-low px-4 text-sm text-on-surface-variant"
                    readOnly
                    type="email"
                    value={profile?.email || ""}
                  />
                </label>

                {profileError && (
                  <p className="rounded-2xl bg-error-container px-4 py-3 text-sm text-on-error-container" role="alert">
                    {profileError}
                  </p>
                )}
                {profileSaved && !profileError && (
                  <p role="status" className="rounded-2xl bg-[#d9f7dd] px-4 py-3 text-sm text-[#00531a]">
                    Đã lưu thay đổi.
                  </p>
                )}

                <button
                  type="button"
                  onClick={handleSaveProfile}
                  disabled={isSavingProfile || isLoadingProfile}
                  className="flex min-h-12 w-full items-center justify-center gap-1.5 rounded-2xl bg-gradient-to-br from-primary to-primary-container text-sm font-bold text-on-primary shadow-[0_12px_22px_-14px_rgba(0,89,187,0.9)] transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  <span aria-hidden="true" className="material-symbols-outlined text-xl">
                    check
                  </span>
                  {isSavingProfile ? "Đang lưu..." : "Lưu thay đổi"}
                </button>
              </div>
            </section>

            <section
              aria-labelledby="profile-vehicles-title"
              className="rounded-3xl border border-outline-variant/40 bg-surface-container-lowest p-6 shadow-[0_10px_26px_-14px_rgba(25,28,29,0.28)]"
            >
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 id="profile-vehicles-title" className="text-lg font-extrabold">
                    Xe của tôi
                  </h3>
                  <p className="text-[13px] text-on-surface-variant">Danh sách các xe đang quản lý</p>
                  {(overdueCount > 0 || soonCount > 0) && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {overdueCount > 0 && (
                        <span className="flex items-center gap-1 rounded-full bg-error-container px-3 py-1 text-xs font-bold text-on-error-container">
                          <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
                            warning
                          </span>
                          {overdueCount} xe quá hạn
                        </span>
                      )}
                      {soonCount > 0 && (
                        <span className="flex items-center gap-1 rounded-full bg-[#ffe9c7] px-3 py-1 text-xs font-bold text-[#6b4000]">
                          <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
                            schedule
                          </span>
                          {soonCount} xe sắp đến hạn
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <button
                  className="inline-flex min-h-10 items-center justify-center gap-1 rounded-xl border-[1.5px] border-outline-variant px-3.5 text-sm font-bold text-on-primary-fixed-variant transition-all hover:bg-surface-container-low active:scale-95"
                  type="button"
                  onClick={onAddVehicleClick}
                >
                  <span aria-hidden="true" className="material-symbols-outlined text-xl">
                    add
                  </span>
                  Thêm xe
                </button>
              </div>

              {isLoadingVehicles && <p className="text-sm text-on-surface-variant">Đang tải danh sách xe...</p>}
              {!isLoadingVehicles && vehiclesError && (
                <p className="rounded-2xl bg-error-container px-4 py-3 text-sm text-on-error-container" role="alert">
                  {vehiclesError}
                </p>
              )}
              {!isLoadingVehicles && !vehiclesError && vehicles.length === 0 && (
                <p className="rounded-2xl bg-surface-container-low p-4 text-sm text-on-surface-variant">
                  Bạn chưa có xe nào. Bấm “Thêm xe” để bắt đầu.
                </p>
              )}

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {vehicles.map((vehicle) => (
                  <VehicleCard
                    key={vehicle.id}
                    vehicle={vehicle}
                    isDeleting={deletingId === vehicle.id}
                    onDelete={() => handleDeleteVehicle(vehicle.id)}
                    isEditing={editingId === vehicle.id}
                    isSavingEdit={isSavingEdit}
                    onStartEdit={() => setEditingId(vehicle.id)}
                    onCancelEdit={() => setEditingId(null)}
                    onSaveEdit={(payload) => handleSaveEdit(vehicle.id, payload)}
                    isUploadingImage={uploadingImageId === vehicle.id}
                    onUploadImage={(file) => handleUploadImage(vehicle.id, file)}
                    maintenance={maintenance.filter((item) => item.vehicleId === vehicle.id)}
                    onBook={onBookingClick}
                    onDiagnose={() => onDiagnoseClick(vehicle.id)}
                    onUpdateOdometer={(odometer) => handleQuickOdometer(vehicle.id, odometer)}
                  />
                ))}
              </div>
            </section>
          </div>

          <section
            aria-labelledby="profile-activity-title"
            className="overflow-hidden rounded-3xl border border-outline-variant/40 bg-surface-container-lowest shadow-[0_10px_26px_-14px_rgba(25,28,29,0.28)]"
          >
            <h3 id="profile-activity-title" className="px-6 pb-2 pt-5 text-lg font-extrabold">
              Hoạt động gần đây
            </h3>
            {recentActivity.length === 0 ? (
              <p className="px-6 pb-5 text-sm text-on-surface-variant">Chưa có lịch sử dịch vụ nào.</p>
            ) : (
              <div className="divide-y divide-outline-variant/40">
                {recentActivity.map((record) => (
                  <ActivityItem
                    key={record.id}
                    icon="build"
                    title={`${record.serviceName} - ${record.vehicleModel}`}
                    subtitle={`${record.garageName} - ${record.scheduleDate}`}
                    value={activityStatusLabel(record.status)}
                    valueClassName={activityStatusClassName(record.status)}
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      </main>

      <nav className="fixed bottom-0 left-0 z-50 flex h-20 w-full items-center justify-around border-t border-outline-variant bg-surface px-2 md:hidden">
        <BottomNavButton icon="home" label="Trang chủ" onClick={onHomeClick} />
        <BottomNavButton
          icon="location_searching"
          label="Theo dõi"
          onClick={onTrackingClick}
        />
        <BottomNavButton
          icon="history"
          label="Lịch sử"
          onClick={onHistoryClick}
        />
        <button className="flex flex-col items-center justify-center rounded-full bg-secondary-container px-4 py-1 text-on-secondary-container">
          <span
            className="material-symbols-outlined"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            person
          </span>
          <span className="font-label-sm text-label-sm">Cá nhân</span>
        </button>
      </nav>
    </div>
  );
}

function activityStatusLabel(status: string): string {
  switch (status.toLowerCase()) {
    case "completed":
      return "Hoàn thành";
    case "cancelled":
      return "Đã huỷ";
    case "no_show":
      return "Không đến";
    case "in_progress":
      return "Đang xử lý";
    case "confirmed":
      return "Đã xác nhận";
    case "pending":
      return "Chờ xác nhận";
    default:
      return status;
  }
}

function activityStatusClassName(status: string): string {
  const s = status.toLowerCase();
  if (s === "completed") return "bg-[#d9f7dd] text-[#00531a]";
  if (s === "cancelled") return "bg-[#e9eaeb] text-[#3a3f4b]";
  if (s === "no_show") return "bg-error-container text-on-error-container";
  return "bg-primary-fixed text-on-primary-fixed-variant";
}

function SideNavItem({
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
      className="flex items-center gap-3 rounded-full px-4 py-3 text-secondary transition-all hover:bg-surface-container-high"
      type="button"
      onClick={onClick}
    >
      <span className="material-symbols-outlined">{icon}</span>
      <span className="font-body-md text-body-md">{label}</span>
    </button>
  );
}

function VehicleCard({
  vehicle,
  isDeleting,
  onDelete,
  isEditing,
  isSavingEdit,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  isUploadingImage,
  onUploadImage,
  maintenance,
  onBook,
  onDiagnose,
  onUpdateOdometer,
}: {
  vehicle: Vehicle;
  isDeleting: boolean;
  onDelete: () => void;
  isEditing: boolean;
  isSavingEdit: boolean;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSaveEdit: (payload: {
    year: number | undefined;
    licensePlate: string;
    color: string;
    odometer: number | undefined;
  }) => void;
  isUploadingImage: boolean;
  onUploadImage: (file: File) => void;
  maintenance: MaintenanceStatus[];
  onBook: () => void;
  onDiagnose: () => void;
  // Trả về thông báo lỗi, hoặc null nếu lưu thành công.
  onUpdateOdometer: (odometer: number) => Promise<string | null>;
}) {
  const MIN_VEHICLE_YEAR = 2010;
  const currentYear = new Date().getFullYear();
  const LICENSE_PLATE_PATTERN = /^\d{2}[A-Z]{1,2}-\d{3}\.?\d{2}$/;
  const [editYear, setEditYear] = useState(
    vehicle.year != null ? String(vehicle.year) : "",
  );
  const [editLicensePlate, setEditLicensePlate] = useState(vehicle.licensePlate ?? "");
  const [plateError, setPlateError] = useState("");
  const [editColor, setEditColor] = useState(vehicle.color ?? "");
  const [editOdometer, setEditOdometer] = useState(
    vehicle.odometer != null ? String(vehicle.odometer) : "",
  );

  const [isKmOpen, setIsKmOpen] = useState(false);
  const [kmInput, setKmInput] = useState("");
  const [kmError, setKmError] = useState("");
  const [isSavingKm, setIsSavingKm] = useState(false);

  const handleSubmitKm = async (event: React.FormEvent) => {
    event.preventDefault();
    const odometer = Number(kmInput);
    if (kmInput.trim() === "" || !Number.isInteger(odometer) || odometer < 0 || odometer > MAX_ODOMETER_KM) {
      setKmError(`Số km phải là số nguyên từ 0 đến ${MAX_ODOMETER_KM.toLocaleString("vi-VN")}.`);
      return;
    }
    setIsSavingKm(true);
    setKmError("");
    const error = await onUpdateOdometer(odometer);
    setIsSavingKm(false);
    if (error) {
      setKmError(error);
    } else {
      setIsKmOpen(false);
    }
  };

  const handleImageInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) onUploadImage(file);
    event.target.value = "";
  };

  if (isEditing) {
    return (
      <article className="rounded-3xl border border-primary bg-surface-container-low p-4">
        <h4 className="mb-1 font-headline-md text-headline-md text-on-surface">
          {vehicle.model}
        </h4>
        <span className="mb-1 inline-block rounded bg-secondary-container px-2 py-0.5 font-label-md text-label-md uppercase text-on-secondary-container">
          {vehicle.licensePlate || "Chưa có biển số"}
        </span>
        <span className="mb-4 block font-label-sm text-label-sm text-secondary">
          VIN: {vehicle.vin}
        </span>

        <div className="mt-4 space-y-3">
          <label className="block">
            <span className="mb-1 block font-label-sm text-label-sm text-secondary">
              Biển số xe
            </span>
            <input
              className="w-full rounded-lg border border-outline-variant bg-white px-3 py-2 font-body-md text-body-md uppercase outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
              type="text"
              value={editLicensePlate}
              onChange={(event) => {
                setEditLicensePlate(event.target.value.toUpperCase());
                setPlateError("");
              }}
              placeholder="VD: 30A-123.45"
            />
            {plateError && (
              <span className="mt-1 block font-label-sm text-label-sm text-error">
                {plateError}
              </span>
            )}
          </label>
          <label className="block">
            <span className="mb-1 block font-label-sm text-label-sm text-secondary">
              Năm sản xuất
            </span>
            <input
              className="w-full rounded-lg border border-outline-variant bg-white px-3 py-2 font-body-md text-body-md outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
              type="number"
              min={MIN_VEHICLE_YEAR}
              max={currentYear}
              value={editYear}
              onChange={(event) => setEditYear(event.target.value)}
              placeholder={`VD: ${currentYear}`}
            />
          </label>
          <label className="block">
            <span className="mb-1 block font-label-sm text-label-sm text-secondary">
              Màu sắc
            </span>
            <input
              className="w-full rounded-lg border border-outline-variant bg-white px-3 py-2 font-body-md text-body-md outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
              type="text"
              value={editColor}
              onChange={(event) => setEditColor(event.target.value)}
              placeholder="VD: Trắng (White Pearl)"
            />
          </label>
          <label className="block">
            <span className="mb-1 block font-label-sm text-label-sm text-secondary">
              Số km đã đi (odometer)
            </span>
            <input
              className="w-full rounded-lg border border-outline-variant bg-white px-3 py-2 font-body-md text-body-md outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
              type="number"
              value={editOdometer}
              onChange={(event) => setEditOdometer(event.target.value)}
              placeholder="VD: 12000"
            />
          </label>
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancelEdit}
            disabled={isSavingEdit}
            className="rounded-lg border border-outline px-4 py-2 font-label-md text-label-md text-on-surface-variant transition-colors hover:bg-surface-container disabled:cursor-not-allowed disabled:opacity-60"
          >
            Huỷ
          </button>
          <button
            type="button"
            onClick={() => {
              const normalizedPlate = editLicensePlate.trim().toUpperCase();
              if (!LICENSE_PLATE_PATTERN.test(normalizedPlate)) {
                setPlateError("Biển số xe không đúng định dạng (VD: 30A-123.45).");
                return;
              }
              onSaveEdit({
                year: editYear ? Number(editYear) : undefined,
                licensePlate: normalizedPlate,
                color: editColor,
                odometer: editOdometer ? Number(editOdometer) : undefined,
              });
            }}
            disabled={isSavingEdit}
            className="rounded-lg bg-primary px-4 py-2 font-label-md text-label-md text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSavingEdit ? "Đang lưu..." : "Lưu"}
          </button>
        </div>
      </article>
    );
  }

  return (
    <article className="group rounded-3xl border border-outline-variant/50 p-4 transition-all hover:border-primary hover:bg-surface-container-low/60">
      <div className="relative mb-4 flex aspect-video items-center justify-center overflow-hidden rounded-2xl bg-primary-fixed">
        {vehicle.imageUrl ? (
          <img
            src={vehicle.imageUrl}
            alt={vehicle.model}
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="material-symbols-outlined text-5xl text-primary opacity-40">
            electric_car
          </span>
        )}
        <label
          className={`absolute bottom-2 right-2 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-white text-on-surface-variant shadow-md transition-colors hover:bg-primary hover:text-white ${
            isUploadingImage ? "pointer-events-none opacity-60" : ""
          }`}
          aria-label="Tải ảnh xe"
        >
          <span className="material-symbols-outlined text-[18px]">
            {isUploadingImage ? "hourglass_empty" : "photo_camera"}
          </span>
          <input
            className="sr-only"
            type="file"
            accept="image/*"
            disabled={isUploadingImage}
            onChange={handleImageInputChange}
          />
        </label>
      </div>
      <div className="flex items-start justify-between">
        <div>
          <h4 className="font-headline-md text-headline-md text-on-surface">
            {vehicle.model}
          </h4>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-block rounded-md border border-outline-variant bg-surface-container-lowest px-1.5 font-mono text-xs font-bold uppercase">
              {vehicle.licensePlate || "Chưa có biển số"}
            </span>
            {maintenance.length > 0 && <MaintenanceBadge stage={worstStage(maintenance)} />}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Sửa xe"
            onClick={onStartEdit}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-surface text-on-surface-variant transition-colors hover:bg-primary hover:text-white"
          >
            <span className="material-symbols-outlined text-[20px]">edit</span>
          </button>
          <button
            type="button"
            aria-label="Xoá xe"
            disabled={isDeleting}
            onClick={onDelete}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-surface text-on-surface-variant transition-colors hover:bg-error hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            <span className="material-symbols-outlined text-[20px]">
              {isDeleting ? "hourglass_empty" : "delete"}
            </span>
          </button>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-4 font-label-sm text-label-sm text-secondary">
        <span className="flex items-center gap-1">
          <span className="material-symbols-outlined text-sm">event</span>
          {vehicle.year ?? "--"}
        </span>
        <span className="flex items-center gap-1">
          <span className="material-symbols-outlined text-sm">palette</span>
          {vehicle.color || "--"}
        </span>
        <span className="flex items-center gap-1">
          <span className="material-symbols-outlined text-sm">distance</span>
          {vehicle.odometer != null ? `${vehicle.odometer.toLocaleString("vi-VN")} km` : "--"}
        </span>
        <span className="flex w-full items-center gap-1 text-outline">
          <span className="material-symbols-outlined text-sm">pin</span>
          VIN: {vehicle.vin}
        </span>
      </div>

      <div className="mt-4 space-y-3">
        <MaintenancePanel items={maintenance} />

        {isKmOpen ? (
          <form onSubmit={handleSubmitKm} className="space-y-2">
            <div className="flex items-end gap-2">
              <label className="flex-1">
                <span className="mb-1 block font-label-sm text-label-sm text-secondary">
                  Số km hiện tại
                </span>
                <input
                  className="min-h-11 w-full rounded-lg border border-primary bg-white px-3 font-body-md text-body-md outline-none focus:ring-2 focus:ring-primary/20"
                  type="number"
                  min={0}
                  max={MAX_ODOMETER_KM}
                  value={kmInput}
                  onChange={(event) => setKmInput(event.target.value)}
                  autoFocus
                />
              </label>
              <button
                type="submit"
                disabled={isSavingKm}
                className="min-h-11 rounded-lg bg-primary px-4 font-label-md text-label-md text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSavingKm ? "Đang lưu..." : "Lưu"}
              </button>
              <button
                type="button"
                disabled={isSavingKm}
                onClick={() => setIsKmOpen(false)}
                className="min-h-11 rounded-lg border border-outline-variant px-3 font-label-md text-label-md text-on-surface-variant transition-colors hover:bg-surface-container"
              >
                Huỷ
              </button>
            </div>
            {kmError && (
              <p className="font-label-sm text-label-sm text-error">{kmError}</p>
            )}
          </form>
        ) : (
          <div className="flex gap-2">
            {worstStage(maintenance) !== "OK" && (
              <button
                type="button"
                onClick={onBook}
                className={`min-h-11 flex-1 rounded-lg px-4 font-label-md text-label-md text-white transition-all hover:shadow-lg active:scale-95 ${
                  worstStage(maintenance) === "OVERDUE" ? "bg-error" : "bg-primary"
                }`}
              >
                Đặt lịch ngay
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                setKmInput(vehicle.odometer != null ? String(vehicle.odometer) : "");
                setKmError("");
                setIsKmOpen(true);
              }}
              className="min-h-11 flex-1 rounded-lg border border-outline-variant bg-white px-4 font-label-md text-label-md text-primary transition-colors hover:bg-surface-container-low"
            >
              Cập nhật số km
            </button>
          </div>
        )}

        <button
          type="button"
          onClick={onDiagnose}
          className="flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-primary bg-primary-fixed/40 px-4 font-label-md text-label-md text-primary transition-colors hover:bg-primary-fixed"
        >
          <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
            auto_awesome
          </span>
          Chẩn đoán AI cho xe này
        </button>
      </div>
    </article>
  );
}

function ActivityItem({
  icon,
  title,
  subtitle,
  value,
  valueClassName,
}: {
  icon: string;
  title: string;
  subtitle: string;
  value: string;
  valueClassName: string;
}) {
  return (
    <div className="flex flex-col gap-2 px-6 py-3.5 transition-colors hover:bg-surface-container-low/60 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3.5">
        <div
          aria-hidden="true"
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-fixed text-on-primary-fixed-variant"
        >
          <span className="material-symbols-outlined">{icon}</span>
        </div>
        <div>
          <p className="text-sm font-bold text-on-surface">{title}</p>
          <p className="text-xs text-on-surface-variant">{subtitle}</p>
        </div>
      </div>
      <span className={`inline-flex w-fit items-center rounded-full px-2.5 py-1 text-xs font-bold ${valueClassName}`}>
        {value}
      </span>
    </div>
  );
}

function BottomNavButton({
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
      className="flex flex-col items-center justify-center text-on-surface-variant"
      type="button"
      onClick={onClick}
    >
      <span className="material-symbols-outlined">{icon}</span>
      <span className="font-label-sm text-label-sm">{label}</span>
    </button>
  );
}

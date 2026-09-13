import { useEffect, useState } from "react";
import AppSidebar, { type AppSection } from "../../components/AppSidebar";
import { deleteVehicle, getMyFleet, updateVehicle, type Vehicle } from "../../services/api";

type ProfilePageProps = {
  onAddVehicleClick: () => void;
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

  useEffect(() => {
    loadVehicles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    payload: { color: string; odometer: number | undefined },
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

        <div className="mt-auto rounded-2xl border border-outline-variant bg-surface-container-low p-4">
          <p className="mb-2 font-label-sm text-label-sm text-on-surface-variant">
            Battery Status
          </p>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-outline-variant">
            <div className="h-full w-[82%] bg-primary" />
          </div>
          <p className="mt-2 font-label-sm text-label-sm font-bold text-primary">
            82% - VF8
          </p>
        </div>
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
            <input
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
          <button className="rounded-full p-2 transition-colors hover:bg-surface-container-high">
            <span className="material-symbols-outlined text-on-surface-variant">
              help
            </span>
          </button>
          <button className="hidden rounded-full p-2 transition-colors hover:bg-surface-container-high md:block">
            <span className="material-symbols-outlined text-on-surface-variant">
              apps
            </span>
          </button>
          <button
            className="hidden rounded-full bg-primary px-5 py-2 font-label-md text-label-md text-white transition-all hover:opacity-90 active:scale-95 md:block"
            type="button"
            onClick={onAddVehicleClick}
          >
            Add Vehicle
          </button>
          <button
            className="h-8 w-8 overflow-hidden rounded-full border border-outline-variant"
            type="button"
          >
            <img
              className="h-full w-full object-cover"
              src={topAvatarImage}
              alt="Ảnh đại diện"
            />
          </button>
        </div>
      </header>

      <main className="min-h-screen pt-16 md:ml-[240px]">
        <div className="mx-auto max-w-7xl p-margin-mobile md:p-xl">
          <section className="mb-10">
            <h2 className="mb-1 font-headline-lg text-headline-lg font-bold text-primary md:text-[24px] md:leading-8">
              Thông tin cá nhân
            </h2>
            <p className="font-body-md text-body-md text-secondary">
              Quản lý hồ sơ và danh sách phương tiện điện tử của bạn.
            </p>
          </section>

          <div className="grid grid-cols-12 gap-lg">
            <section className="col-span-12 lg:col-span-5">
              <div className="h-full rounded-xl border border-outline-variant bg-white p-lg shadow-sm md:p-8">
                <div className="mb-8 flex flex-col items-center">
                  <div className="group relative">
                    <div className="h-32 w-32 overflow-hidden rounded-full border-4 border-surface-container-high shadow-lg">
                      <img
                        className="h-full w-full object-cover"
                        src={avatarImage}
                        alt="Ảnh đại diện người dùng"
                      />
                    </div>
                    <button
                      className="absolute bottom-1 right-1 rounded-full bg-primary p-2 text-white shadow-md transition-transform hover:scale-110 active:scale-90"
                      type="button"
                    >
                      <span className="material-symbols-outlined text-[20px]">
                        photo_camera
                      </span>
                    </button>
                  </div>
                  <button className="mt-4 font-label-md text-label-md text-primary hover:underline">
                    Thay đổi ảnh đại diện
                  </button>
                </div>

                <div className="space-y-6">
                  <label className="block">
                    <span className="mb-2 block font-label-md text-label-md text-secondary">
                      Tên người dùng
                    </span>
                    <div className="relative">
                      <input
                        className="w-full rounded-lg border border-outline-variant px-4 py-3 font-body-lg text-body-lg transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                        type="text"
                        defaultValue="Nguyễn Minh Đức"
                      />
                      <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-outline">
                        edit
                      </span>
                    </div>
                  </label>

                  <label className="block">
                    <span className="mb-2 block font-label-md text-label-md text-secondary">
                      Địa chỉ Email
                    </span>
                    <input
                      className="w-full cursor-not-allowed rounded-lg border border-outline-variant bg-surface-container-low px-4 py-3 font-body-md text-body-md text-on-surface-variant"
                      readOnly
                      type="email"
                      value="duc.nguyen@servio.vn"
                    />
                  </label>

                  <div className="pt-4">
                    <button className="w-full rounded-lg bg-primary py-3 font-headline-md text-headline-md text-white transition-all hover:shadow-lg hover:shadow-primary/20 active:scale-[0.98]">
                      Lưu thay đổi
                    </button>
                  </div>
                </div>
              </div>
            </section>

            <section className="col-span-12 space-y-lg lg:col-span-7">
              <div className="rounded-xl border border-outline-variant bg-white p-lg shadow-sm md:p-8">
                <div className="mb-8 flex flex-col gap-md sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="font-headline-lg text-headline-lg text-on-surface">
                      Xe của tôi
                    </h3>
                    <p className="font-body-md text-body-md text-secondary">
                      Danh sách các xe VinFast đang quản lý
                    </p>
                  </div>
                  <button
                    className="flex items-center justify-center gap-2 rounded-lg bg-primary-container px-4 py-2 font-label-md text-label-md text-on-primary-container transition-all hover:brightness-110 active:scale-95"
                    type="button"
                    onClick={onAddVehicleClick}
                  >
                    <span className="material-symbols-outlined">add</span>
                    Thêm phương tiện mới
                  </button>
                </div>

                {isLoadingVehicles && (
                  <p className="text-sm text-on-surface-variant">Đang tải danh sách xe...</p>
                )}
                {!isLoadingVehicles && vehiclesError && (
                  <p className="rounded-lg bg-error-container px-4 py-3 text-sm text-on-error-container">
                    {vehiclesError}
                  </p>
                )}
                {!isLoadingVehicles && !vehiclesError && vehicles.length === 0 && (
                  <p className="text-sm text-on-surface-variant">
                    Bạn chưa có xe nào. Bấm "Thêm phương tiện mới" để bắt đầu.
                  </p>
                )}

                <div className="grid grid-cols-1 gap-md md:grid-cols-2">
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
                    />
                  ))}
                </div>
              </div>

              <section className="relative overflow-hidden rounded-xl bg-primary p-lg text-white shadow-lg shadow-primary/20 md:p-8">
                <div className="relative z-10">
                  <h3 className="mb-2 font-headline-lg text-headline-lg font-bold">
                    Hạng thành viên: Gold
                  </h3>
                  <p className="mb-6 max-w-[512px] font-body-md text-body-md opacity-90">
                    Bạn còn 1,200 điểm để lên hạng Platinum. Tận hưởng ưu đãi miễn
                    phí cứu hộ 24/7 và giảm giá 10% phí bảo dưỡng.
                  </p>
                  <button className="rounded-full bg-white px-6 py-2 font-label-md text-label-md text-primary transition-all hover:bg-opacity-90">
                    Xem đặc quyền
                  </button>
                </div>
                <div className="absolute right-0 top-0 hidden h-full w-1/3 rotate-12 items-center justify-center opacity-20 md:flex">
                  <span
                    className="material-symbols-outlined text-[180px]"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    workspace_premium
                  </span>
                </div>
              </section>
            </section>
          </div>

          <section className="mt-lg rounded-xl border border-outline-variant bg-white p-lg shadow-sm md:p-8">
            <h3 className="mb-6 font-headline-md text-headline-md text-on-surface">
              Hoạt động gần đây
            </h3>
            <div className="space-y-4">
              <ActivityItem
                icon="build"
                title="Bảo dưỡng định kỳ - VF8"
                subtitle="Trạm VinFast Ocean Park - 12/10/2023"
                value="Hoàn thành"
                valueClassName="text-tertiary"
              />
              <ActivityItem
                icon="ev_station"
                title="Sạc pin nhanh (80%)"
                subtitle="Trạm Times City - 09/10/2023"
                value="320,000 VND"
                valueClassName="text-secondary"
                secondary
              />
            </div>
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
}: {
  vehicle: Vehicle;
  isDeleting: boolean;
  onDelete: () => void;
  isEditing: boolean;
  isSavingEdit: boolean;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSaveEdit: (payload: { color: string; odometer: number | undefined }) => void;
}) {
  const [editColor, setEditColor] = useState(vehicle.color ?? "");
  const [editOdometer, setEditOdometer] = useState(
    vehicle.odometer != null ? String(vehicle.odometer) : "",
  );

  if (isEditing) {
    return (
      <article className="rounded-xl border border-primary bg-surface-container-low p-4">
        <h4 className="mb-1 font-headline-md text-headline-md text-on-surface">
          {vehicle.model}
        </h4>
        <span className="mb-4 inline-block rounded bg-secondary-container px-2 py-0.5 font-label-md text-label-md uppercase text-on-secondary-container">
          {vehicle.vin}
        </span>

        <div className="mt-4 space-y-3">
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
            onClick={() =>
              onSaveEdit({
                color: editColor,
                odometer: editOdometer ? Number(editOdometer) : undefined,
              })
            }
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
    <article className="group rounded-xl border border-outline-variant p-4 transition-all hover:border-primary hover:bg-surface-container-low">
      <div className="mb-4 flex aspect-video items-center justify-center overflow-hidden rounded-lg bg-surface-variant">
        <span className="material-symbols-outlined text-5xl text-primary opacity-40">
          electric_car
        </span>
      </div>
      <div className="flex items-start justify-between">
        <div>
          <h4 className="font-headline-md text-headline-md text-on-surface">
            {vehicle.model}
          </h4>
          <span className="rounded bg-secondary-container px-2 py-0.5 font-label-md text-label-md uppercase text-on-secondary-container">
            {vehicle.vin}
          </span>
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
          <span className="material-symbols-outlined text-sm">palette</span>
          {vehicle.color || "--"}
        </span>
        <span className="flex items-center gap-1">
          <span className="material-symbols-outlined text-sm">distance</span>
          {vehicle.odometer != null ? `${vehicle.odometer.toLocaleString("vi-VN")} km` : "--"}
        </span>
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
  secondary = false,
}: {
  icon: string;
  title: string;
  subtitle: string;
  value: string;
  valueClassName: string;
  secondary?: boolean;
}) {
  return (
    <div className="flex flex-col gap-md rounded-lg bg-surface p-4 transition-colors hover:bg-surface-container-low sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-4">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-full ${
            secondary
              ? "bg-secondary-fixed text-on-secondary-fixed-variant"
              : "bg-tertiary-fixed text-on-tertiary-fixed-variant"
          }`}
        >
          <span className="material-symbols-outlined">{icon}</span>
        </div>
        <div>
          <p className="font-headline-md text-headline-md text-on-surface">
            {title}
          </p>
          <p className="font-label-sm text-label-sm text-secondary">{subtitle}</p>
        </div>
      </div>
      <span className={`font-label-md text-label-md ${valueClassName}`}>
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

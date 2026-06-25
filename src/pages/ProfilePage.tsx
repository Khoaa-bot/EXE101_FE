import { useState } from "react";
import AppSidebar, { type AppSection } from "../components/AppSidebar";

type ProfilePageProps = {
  onAddVehicleClick: () => void;
  onHomeClick: () => void;
  onHistoryClick: () => void;
  onTrackingClick: () => void;
  onNotificationsClick: () => void;
};

const avatarImage =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuD_JVhVI7R8HdFOhNFcdNFPqFa4yBsBSG_evyvu0Bqyd3JpY-C9Nz2TdBeQ1kzhKLockOp3CoSoHUboq5e1lrQO50htHrBepT0G0SVY_9SFshrrfrzrODm0juIA18akQf4nPZjfw1OujIzn9gdWduw1QlgRbMYCb_zPs10o-rX7qAIdEmIs9zk6e-2il4LxMa1otVwlvKozHEJTMoRBvBi938eKsnvVGAOmGpyp1q6adPp0nmgmJEadFUB1xIZWf80kf8-NbDDVqRLF";
const vf8Image =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuAPpt4Ftw8O_KxC91o0dKA_GzKuvgKxqKHWK0vP1hOKw5DrN9J-Pmrthox1YNVbjc08r20UvAhFEcBM9mTl1ilGUv2nG8XKWaH2kSdpIj4_1apRO06ZyfxGEDnqTx4zlgyHVKb4UbgzQfqZAgSeO3X03xM0Yg8oTeXWPpUohWLP8iy_sZRZlPCZb9qua41YIM1Nq8fVzBEGPgfLF7KDrFKFj7hbY5dU7MLDf4kcdUdaEAtuT7FbnDvWvLmANiPOqtcGfgnrL7Gb97WN";
const vfe34Image =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuCSLG_ipMfSS9SUwW4RVC_dY8tEZKFsT9rnfRYsVQeVcBwdHkrv1ZyGQzAyxT6yZlQe7R5C7vf1Ots099K8qqe-pJymdSP2lglCS2hb7dILEtvQnhScTgQLkk85rVAJwZWGcveuV8sHvjoElNtya5kTbRB0wl6BB85WztRqRecGtVjJNEjmGLPV_8_0Z7qqC_0xmoKT0KhcE8u88msbMq5CYTqFlYnYUsh0bETFZfixydjNffTj4Sm2Ik1nS2P8a0iI67Bf0BAptPDJ";

export default function ProfilePage({
  onAddVehicleClick,
  onHomeClick,
  onHistoryClick,
  onTrackingClick,
  onNotificationsClick,
}: ProfilePageProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleNavigate = (section: AppSection) => {
    if (section === "home") onHomeClick();
    if (section === "history") onHistoryClick();
    if (section === "tracking") onTrackingClick();
    if (section === "notifications") onNotificationsClick();
  };

  return (
    <div className="min-h-dvh bg-background pb-24 text-on-background font-sans">
      <AppSidebar
        active="profile"
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onNavigate={handleNavigate}
      />

      <header className="fixed top-0 z-40 flex h-16 w-full items-center border-b border-outline-variant bg-surface px-margin-mobile">
        <button
          className="-ml-2 rounded-full p-2 transition-transform active:scale-95"
          type="button"
          aria-label="Mở menu"
          onClick={() => setIsSidebarOpen(true)}
        >
          <span className="material-symbols-outlined text-on-surface-variant">
            menu
          </span>
        </button>
        <h1 className="ml-4 font-headline-lg-mobile text-headline-lg-mobile font-bold text-primary">
          Cá nhân
        </h1>
        <span className="material-symbols-outlined ml-auto text-on-surface-variant">
          notifications
        </span>
      </header>

      <main className="mx-auto w-full max-w-[448px] px-margin-mobile pb-8 pt-16">
        <section className="mb-lg mt-lg">
          <div className="relative overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest p-md shadow-sm">
            <div className="relative z-10 flex flex-col items-center gap-md">
              <div className="relative">
                <div className="h-24 w-24 overflow-hidden rounded-full border-4 border-white bg-surface-container-high shadow-md">
                  <img
                    className="h-full w-full object-cover"
                    src={avatarImage}
                    alt="Ảnh đại diện người dùng"
                  />
                </div>
                <button
                  className="absolute bottom-1 right-1 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white shadow-lg transition-transform active:scale-90"
                  type="button"
                  aria-label="Chỉnh sửa ảnh đại diện"
                >
                  <span className="material-symbols-outlined text-[18px]">edit</span>
                </button>
              </div>

              <div className="w-full space-y-md">
                <div className="space-y-md">
                  <label className="space-y-1">
                    <span className="px-1 font-label-sm text-label-sm text-on-surface-variant">
                      Tên người dùng
                    </span>
                    <input
                      className="w-full rounded-lg border border-outline-variant bg-surface px-4 py-2.5 font-body-md text-body-md transition-all focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      type="text"
                      defaultValue="Nguyễn Văn Minh"
                    />
                  </label>
                  <label className="space-y-1">
                    <span className="px-1 font-label-sm text-label-sm text-on-surface-variant">
                      Địa chỉ Email
                    </span>
                    <input
                      className="w-full cursor-not-allowed rounded-lg border border-outline-variant bg-surface-container-low px-4 py-2.5 font-body-md text-body-md text-on-surface-variant"
                      readOnly
                      type="email"
                      value="minh.nguyen@servio.vn"
                    />
                  </label>
                </div>
                <div className="flex justify-center">
                  <button
                    className="w-full rounded-lg bg-primary px-8 py-3 font-label-md text-label-md text-white shadow-sm transition-all active:scale-95"
                    type="button"
                  >
                    Lưu thay đổi
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="space-y-lg">
          <section className="space-y-lg">
            <div className="group relative overflow-hidden rounded-xl border border-outline-variant bg-gradient-to-br from-[#FFD700]/20 to-white p-md">
              <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-[#FFD700]/10 blur-3xl transition-transform duration-700 group-hover:scale-125" />
              <div className="relative mb-md flex items-start justify-between gap-md">
                <div>
                  <p className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">
                    Hạng thành viên
                  </p>
                  <h2 className="flex items-center gap-2 font-display-lg text-display-lg font-extrabold text-on-surface">
                    GOLD
                    <span
                      className="material-symbols-outlined text-[#DAA520]"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      workspace_premium
                    </span>
                  </h2>
                </div>
                <div className="shrink-0 rounded-lg border border-outline-variant bg-white/80 p-2">
                  <span className="font-label-md text-label-md text-on-surface">
                    2,450 pts
                  </span>
                </div>
              </div>
              <div className="mb-md space-y-2">
                <div className="flex justify-between font-label-sm text-label-sm">
                  <span>Tiến trình tới Platinum</span>
                  <span>75%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-surface-container-high">
                  <div className="h-full w-[75%] rounded-full bg-gradient-to-r from-primary to-[#FFD700]" />
                </div>
              </div>
              <button className="flex w-full items-center justify-center gap-2 rounded-lg border border-outline-variant bg-white py-3 font-label-md text-label-md text-on-surface transition-colors hover:bg-surface-container-low">
                Xem đặc quyền
                <span className="material-symbols-outlined text-[18px]">
                  arrow_forward
                </span>
              </button>
            </div>

            <div className="overflow-hidden rounded-xl border border-outline-variant bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-outline-variant bg-surface-container-lowest px-md py-md">
                <h3 className="font-headline-md text-headline-md text-on-surface">
                  Hoạt động gần đây
                </h3>
                <button className="font-label-md text-label-md text-primary">
                  Tất cả
                </button>
              </div>
              <div className="divide-y divide-outline-variant">
                <ActivityItem
                  icon="build"
                  title="Bảo dưỡng định kỳ"
                  subtitle="Garage ABC • 15/06/2024"
                />
                <ActivityItem
                  icon="bolt"
                  title="Sạc nhanh 60kW"
                  subtitle="Trạm sạc Vincom Q1 • 12/06/2024"
                  accent="tertiary"
                />
              </div>
            </div>
          </section>

          <section className="space-y-md">
            <div className="flex items-center justify-between gap-md px-1">
              <h3 className="font-headline-lg text-headline-lg text-on-surface">
                Xe của tôi
              </h3>
              <button
                className="flex shrink-0 items-center gap-1 font-label-md text-label-md text-primary transition-transform active:scale-95"
                type="button"
                onClick={onAddVehicleClick}
              >
                <span className="material-symbols-outlined">add_circle</span>
                Thêm xe
              </button>
            </div>

            <div className="space-y-md">
              <VehicleCard
                image={vf8Image}
                plate="51H-123.45"
                name="VinFast VF8"
                battery="82%"
                odometer="12,450 km"
              />
              <VehicleCard
                image={vfe34Image}
                plate="30E-678.90"
                name="VinFast VF e34"
                battery="15%"
                odometer="5,120 km"
                lowBattery
              />
              <button
                className="flex min-h-36 flex-col items-center justify-center gap-sm rounded-xl border-2 border-dashed border-outline-variant p-lg transition-colors hover:border-primary"
                type="button"
                onClick={onAddVehicleClick}
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-container-high transition-colors">
                  <span className="material-symbols-outlined text-[28px] text-on-surface-variant">
                    add
                  </span>
                </div>
                <p className="font-headline-md text-headline-md text-on-surface-variant">
                  Thêm phương tiện mới
                </p>
              </button>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

function ActivityItem({
  icon,
  title,
  subtitle,
  accent = "secondary",
}: {
  icon: string;
  title: string;
  subtitle: string;
  accent?: "secondary" | "tertiary";
}) {
  return (
    <div className="flex gap-md px-md py-md transition-colors hover:bg-surface-container-low">
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
          accent === "tertiary"
            ? "bg-tertiary-container text-on-tertiary-container"
            : "bg-secondary-container text-on-secondary-container"
        }`}
      >
        <span className="material-symbols-outlined">{icon}</span>
      </div>
      <div>
        <p className="font-label-md text-label-md text-on-surface">
          {title}
        </p>
        <p className="font-label-sm text-label-sm text-on-surface-variant">
          {subtitle}
        </p>
      </div>
    </div>
  );
}

function VehicleCard({
  image,
  plate,
  name,
  battery,
  odometer,
  lowBattery = false,
}: {
  image: string;
  plate: string;
  name: string;
  battery: string;
  odometer: string;
  lowBattery?: boolean;
}) {
  return (
    <article className="group rounded-xl border border-outline-variant bg-white p-md shadow-sm transition-shadow hover:shadow-md">
      <div className="relative mb-md h-36 overflow-hidden rounded-lg bg-surface-container-low">
        <img
          className="h-full w-full object-contain p-4 transition-transform duration-500 group-hover:scale-105"
          src={image}
          alt={name}
        />
        <div className="absolute right-2 top-2 rounded-full bg-primary/10 px-3 py-1 font-label-md text-label-md text-primary backdrop-blur-sm">
          {plate}
        </div>
      </div>
      <div className="space-y-md">
        <h4 className="font-headline-md text-headline-md text-on-surface">
          {name}
        </h4>
        <div className="grid grid-cols-2 gap-sm">
          <VehicleStat
            icon={lowBattery ? "battery_charging_20" : "battery_charging_80"}
            label="Pin"
            value={battery}
            danger={lowBattery}
          />
          <VehicleStat icon="speed" label="ODO" value={odometer} />
        </div>
      </div>
    </article>
  );
}

function VehicleStat({
  icon,
  label,
  value,
  danger = false,
}: {
  icon: string;
  label: string;
  value: string;
  danger?: boolean;
}) {
  return (
    <div className="rounded-lg bg-surface-container-low p-3">
      <div className="mb-1 flex items-center gap-2 text-on-surface-variant">
        <span className="material-symbols-outlined text-[18px]">{icon}</span>
        <span className="font-label-sm text-label-sm">{label}</span>
      </div>
      <p
        className={`font-headline-md text-headline-md ${
          danger ? "text-error" : "text-on-surface"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

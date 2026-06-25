import { useEffect, useState } from "react";
import AppSidebar, { type AppSection } from "../components/AppSidebar";

type QuickAction = {
  label: string;
  icon: string;
};

type Activity = {
  title: string;
  subtitle: string;
  price: string;
  icon: string;
};

const quickActions: QuickAction[] = [
  { label: "Đặt lịch", icon: "calendar_add_on" },
  { label: "Theo dõi", icon: "location_searching" },
  { label: "Lịch sử", icon: "history" },
  { label: "Ưu đãi", icon: "sell" },
];

const activities: Activity[] = [
  {
    title: "Thay dầu định kỳ",
    subtitle: "Toyota Vios • 3 tháng trước",
    price: "850.000đ",
    icon: "oil_barrel",
  },
  {
    title: "Cân bằng động bánh xe",
    subtitle: "Toyota Vios • 5 tháng trước",
    price: "400.000đ",
    icon: "tire_repair",
  },
];

const bannerImage =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBIuCxquuHszjB0l-lYyQreg5NQpbtWLlpiRewL-CixtHkBDcVAEgEcPCkmdXU-wjSRAQMcUNGrK1zu7tHIZP-YXr5BZcIsSyWQ-rkryKNKnXNqOO_E5dzNFG573qyR4LjZvhCLjLbvNOcYvqNflrndtEPJTu9t6TSuKZQPGTe-7Jlkpsg8Jfi_f8k8UJvUtSSgPLhdiNvU9BZl4yTHxRE0KUa2gtBklHB4tiqdO7GMeSZfy8v-TFRpe3HVhOk901GBMtHyiyTP7_aD";

type HomeProps = {
  onBookingClick: () => void;
  onHistoryClick: () => void;
  onNotificationsClick: () => void;
  onProfileClick: () => void;
  onTrackingClick: () => void;
};

export default function Home({
  onBookingClick,
  onHistoryClick,
  onNotificationsClick,
  onProfileClick,
  onTrackingClick,
}: HomeProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  const handleClickFeedback = () => {
    if (window.navigator.vibrate) {
      window.navigator.vibrate(10);
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleNavigate = (section: AppSection) => {
    if (section === "history") {
      onHistoryClick();
    }

    if (section === "notifications") {
      onNotificationsClick();
    }

    if (section === "tracking") {
      onTrackingClick();
    }

    if (section === "profile") {
      onProfileClick();
    }
  };

  return (
    <div className="min-h-dvh bg-background text-on-surface font-sans">
      <AppSidebar
        active="home"
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onNavigate={handleNavigate}
      />

      {/* Top AppBar */}
      <header
        className={`fixed top-0 z-50 flex h-16 w-full items-center justify-between bg-surface px-margin-mobile transition-shadow ${
          isScrolled
            ? "shadow-md"
            : "border-b border-outline-variant dark:border-outline"
        }`}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              toggleSidebar();
              handleClickFeedback();
            }}
            className="-ml-2 rounded-full p-2 text-on-surface-variant transition-colors active:bg-surface-container"
          >
            <span className="material-symbols-outlined text-[28px]">menu</span>
          </button>

          <span className="material-symbols-outlined text-[28px] text-primary">
            electric_car
          </span>

          <span className="font-headline-lg-mobile text-headline-lg-mobile font-bold text-primary">
            Servio
          </span>
        </div>

        <button
          onClick={handleClickFeedback}
          className="text-on-surface-variant transition-colors duration-200 active:opacity-70"
        >
          <span className="material-symbols-outlined text-[28px]">
            account_circle
          </span>
        </button>
      </header>

      <main className="mx-auto w-full max-w-[448px] px-margin-mobile pb-24 pt-20">
        {/* Greeting */}
        <section className="mb-lg">
          <h1 className="font-display-lg text-display-lg text-on-surface">
            Xin chào, Minh!
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Chào mừng trở lại. Hôm nay xe của bạn thế nào?
          </p>
        </section>

        {/* Current Vehicle Status */}
        <section className="mb-lg">
          <div className="relative overflow-hidden rounded-xl border border-[#EFEFEF] bg-surface-container-lowest p-md shadow-sm">
            <div className="absolute right-0 top-0 h-32 w-32 opacity-10">
              <span
                className="material-symbols-outlined text-[120px]"
                style={{ transform: "rotate(-15deg)" }}
              >
                car_repair
              </span>
            </div>

            <div className="mb-md flex items-start justify-between">
              <div>
                <span className="mb-2 inline-flex items-center rounded-full bg-tertiary-fixed px-2.5 py-0.5 text-xs font-medium text-on-tertiary-fixed-variant">
                  <span className="mr-1.5 h-2 w-2 animate-pulse rounded-full bg-tertiary" />
                  Đang sửa chữa
                </span>

                <h2 className="font-headline-md text-headline-md">
                  Toyota Vios
                </h2>

                <p className="font-label-md text-label-md text-outline">
                  30A-123.45 • Bạc Metallic
                </p>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-container text-on-primary-container">
                <span className="material-symbols-outlined">build</span>
              </div>
            </div>

            {/* Timeline */}
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="flex h-4 w-4 items-center justify-center rounded-full bg-primary">
                    <span className="material-symbols-outlined text-[10px] text-white">
                      check
                    </span>
                  </div>
                  <div className="my-1 h-full w-0.5 bg-primary opacity-30" />
                </div>

                <div className="pb-2">
                  <p className="font-label-md text-label-md text-primary">
                    Tiếp nhận xe
                  </p>
                  <p className="font-label-sm text-label-sm text-outline">
                    08:30 - 12/10/2023
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="flex h-4 w-4 items-center justify-center rounded-full border-2 border-primary bg-white">
                    <div className="h-2 w-2 rounded-full bg-primary" />
                  </div>
                  <div className="my-1 h-full w-0.5 border-l border-dashed bg-outline-variant" />
                </div>

                <div className="pb-2">
                  <p className="font-label-md text-label-md text-on-surface">
                    Kiểm tra &amp; Báo giá
                  </p>
                  <p className="font-label-sm text-label-sm text-outline">
                    Đang thực hiện...
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={handleClickFeedback}
              className="mt-4 w-full rounded-lg bg-primary py-3 font-label-md text-label-md text-on-primary transition-transform active:scale-95"
            >
              Xem chi tiết tiến độ
            </button>
          </div>
        </section>

        {/* Quick Access */}
        <section className="mb-lg">
          <h3 className="mb-md font-label-md text-label-md uppercase tracking-wider text-on-surface-variant">
            Truy cập nhanh
          </h3>

          <div className="grid grid-cols-4 gap-4">
            {quickActions.map((action) => (
              <button
                key={action.label}
                onClick={() => {
                  handleClickFeedback();

                  if (action.label === "Lịch sử") {
                    onHistoryClick();
                  }

                  if (action.label === "Đặt lịch") {
                    onBookingClick();
                  }

                  if (action.label === "Theo dõi") {
                    onTrackingClick();
                  }
                }}
                className="group flex flex-col items-center gap-2"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-outline-variant/30 bg-surface-container transition-all group-active:scale-90">
                  <span className="material-symbols-outlined text-[28px] text-primary">
                    {action.icon}
                  </span>
                </div>

                <span className="font-label-sm text-label-sm">
                  {action.label}
                </span>
              </button>
            ))}
          </div>
        </section>

        {/* Promotion Banner */}
        <section className="mb-lg">
          <div className="group relative h-32 cursor-pointer overflow-hidden rounded-xl shadow-sm">
            <div className="absolute inset-0 z-10 bg-gradient-to-r from-primary to-secondary opacity-90" />

            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${bannerImage})` }}
            />

            <div className="relative z-20 flex h-full flex-col justify-center p-md">
              <h4 className="font-headline-md text-headline-md text-white">
                Giảm 20% bảo dưỡng
              </h4>

              <p className="font-body-md text-body-md text-primary-fixed">
                Dành cho hội viên hạng Vàng
              </p>
            </div>
          </div>
        </section>

        {/* Recent Activity */}
        <section className="mb-12">
          <div className="mb-md flex items-center justify-between">
            <h3 className="font-label-md text-label-md uppercase tracking-wider text-on-surface-variant">
              Hoạt động gần đây
            </h3>

            <button className="font-label-md text-label-md text-primary">
              Xem tất cả
            </button>
          </div>

          <div className="space-y-3">
            {activities.map((activity) => (
              <div
                key={activity.title}
                className="flex items-center rounded-xl border border-[#EFEFEF] bg-white p-md transition-colors hover:bg-surface-container-low"
              >
                <div className="mr-md flex h-10 w-10 items-center justify-center rounded-full bg-secondary-container/30">
                  <span className="material-symbols-outlined text-secondary">
                    {activity.icon}
                  </span>
                </div>

                <div className="flex-1">
                  <p className="font-label-md text-label-md text-on-surface">
                    {activity.title}
                  </p>
                  <p className="font-label-sm text-label-sm text-outline">
                    {activity.subtitle}
                  </p>
                </div>

                <div className="text-right">
                  <p className="font-label-md text-label-md text-on-surface">
                    {activity.price}
                  </p>
                  <span className="rounded bg-tertiary-container/10 px-1.5 py-0.5 text-[10px] text-tertiary">
                    Hoàn tất
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* FAB */}
      <button
        onClick={() => {
          handleClickFeedback();
          onBookingClick();
        }}
        className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full border-2 border-white bg-primary-container text-on-primary-container shadow-lg transition-transform active:scale-90"
      >
        <span className="material-symbols-outlined text-[32px]">add</span>
      </button>
    </div>
  );
}

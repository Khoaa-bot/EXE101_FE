import { useState } from "react";
import AppSidebar, { type AppSection } from "../components/AppSidebar";

type HistoryPageProps = {
  onHomeClick: () => void;
  onNotificationsClick: () => void;
  onProfileClick: () => void;
  onTrackingClick: () => void;
};

type ServiceItem = {
  title: string;
  date: string;
  garage: string;
  price: string;
  icon: string;
  muted?: boolean;
};

const serviceItems: ServiceItem[] = [
  {
    title: "Thay nhớt động cơ",
    date: "12/10/2023",
    garage: "VinFast Service Center - Mỹ Đình",
    price: "1.250.000đ",
    icon: "oil_barrel",
  },
  {
    title: "Thay má phanh trước",
    date: "05/08/2023",
    garage: "Gara Ô tô Hà Thành - Cầu Giấy",
    price: "2.800.000đ",
    icon: "settings_input_component",
  },
  {
    title: "Bảo dưỡng 10.000km",
    date: "20/05/2023",
    garage: "VinFast Service Center - Mỹ Đình",
    price: "3.150.000đ",
    icon: "build",
    muted: true,
  },
];

const filters = ["Tất cả", "Bảo dưỡng", "Sửa chữa", "Phụ kiện"];

export default function HistoryPage({
  onHomeClick,
  onNotificationsClick,
  onProfileClick,
  onTrackingClick,
}: HistoryPageProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState(filters[0]);

  const toggleSidebar = () => {
    setIsSidebarOpen((current) => !current);
  };

  const handleNavigate = (section: AppSection) => {
    if (section === "home") onHomeClick();
    if (section === "notifications") onNotificationsClick();
    if (section === "tracking") onTrackingClick();
    if (section === "profile") onProfileClick();
  };

  return (
    <div className="min-h-dvh bg-background text-on-surface font-sans">
      <AppSidebar
        active="history"
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onNavigate={handleNavigate}
      />

      <header className="fixed top-0 z-50 flex h-16 w-full items-center justify-between border-b border-outline-variant bg-surface px-margin-mobile">
        <div className="flex items-center gap-sm">
          <button
            className="rounded-full p-2 text-on-surface-variant transition-colors hover:bg-surface-container-low"
            type="button"
            onClick={toggleSidebar}
            aria-label="Mở menu"
          >
            <span className="material-symbols-outlined">menu</span>
          </button>
          <div className="ml-xs flex items-center gap-xs">
            <span className="material-symbols-outlined text-primary">
              electric_car
            </span>
            <h1 className="font-headline-lg-mobile text-headline-lg-mobile font-bold text-primary">
              Servio
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-md">
          <button
            className="rounded-full p-2 text-on-surface-variant transition-colors hover:bg-surface-container-low"
            type="button"
            aria-label="Tìm kiếm"
          >
            <span className="material-symbols-outlined">search</span>
          </button>
          <span className="material-symbols-outlined text-primary">
            account_circle
          </span>
        </div>
      </header>

      <main className="mx-auto mt-16 w-full max-w-[448px] px-margin-mobile pb-lg">
        <section className="py-lg">
          <h2 className="mb-sm font-headline-lg text-headline-lg text-on-surface">
            Lịch sử dịch vụ
          </h2>
          <div className="flex items-center gap-sm rounded-xl border border-outline-variant/30 bg-surface-container-low p-md">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary-container">
              <span className="material-symbols-outlined text-on-primary-container">
                directions_car
              </span>
            </div>
            <div>
              <p className="font-label-md text-label-md text-on-surface-variant">
                Xe của bạn
              </p>
              <p className="font-headline-md text-headline-md text-primary">
                VinFast VF8 • 30A-123.45
              </p>
            </div>
          </div>
        </section>

        <section className="mb-lg flex gap-sm overflow-x-auto pb-xs [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {filters.map((filter) => (
            <button
              key={filter}
              className={`whitespace-nowrap rounded-full px-lg py-sm font-label-md transition-transform duration-150 active:scale-95 ${
                filter === activeFilter
                  ? "bg-primary text-on-primary"
                  : "bg-surface-container-high text-on-surface-variant"
              }`}
              type="button"
              onClick={() => setActiveFilter(filter)}
            >
              {filter}
            </button>
          ))}
        </section>

        <section className="space-y-md">
          {serviceItems.map((item) => (
            <article
              key={`${item.title}-${item.date}`}
              className={`flex flex-col gap-md rounded-xl border border-outline-variant bg-surface p-md transition-colors duration-200 hover:bg-surface-container-low ${
                item.muted ? "opacity-80" : ""
              }`}
            >
              <div className="flex items-start justify-between gap-sm">
                <div className="flex gap-sm">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary-container/20">
                    <span className="material-symbols-outlined text-secondary">
                      {item.icon}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-headline-md text-headline-md">
                      {item.title}
                    </h3>
                    <div className="flex items-center gap-xs text-on-surface-variant">
                      <span className="material-symbols-outlined text-[16px]">
                        event
                      </span>
                      <span className="font-label-sm text-label-sm">
                        {item.date}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-xs rounded-full bg-tertiary-container/10 px-sm py-[2px] font-label-md text-tertiary">
                  <span className="h-2 w-2 rounded-full bg-tertiary" />
                  Hoàn thành
                </div>
              </div>

              <div className="space-y-sm">
                <div className="flex items-center gap-sm text-on-surface-variant">
                  <span className="material-symbols-outlined text-[18px]">
                    garage
                  </span>
                  <span className="font-body-md text-body-md">
                    {item.garage}
                  </span>
                </div>

                <div className="mt-sm flex items-end justify-between border-t border-outline-variant pt-sm">
                  <div>
                    <p className="font-label-sm text-label-sm text-on-surface-variant">
                      Tổng chi phí
                    </p>
                    <p className="font-headline-md text-headline-md text-primary">
                      {item.price}
                    </p>
                  </div>
                  <button
                    className="flex items-center gap-xs font-label-md text-primary"
                    type="button"
                  >
                    Chi tiết
                    <span className="material-symbols-outlined text-[18px]">
                      chevron_right
                    </span>
                  </button>
                </div>
              </div>
            </article>
          ))}
        </section>

        <section className="mt-xl grid grid-cols-2 gap-md">
          <div className="relative col-span-2 overflow-hidden rounded-2xl border border-primary/20 bg-primary-container/10 p-lg">
            <div className="relative z-10">
              <h4 className="mb-xs font-headline-md text-headline-md text-primary">
                Tổng chi 2023
              </h4>
              <p className="font-display-lg text-display-lg text-primary">
                7.200.000đ
              </p>
              <p className="mt-sm font-body-md text-body-md text-on-surface-variant">
                Bạn đã tiết kiệm được{" "}
                <span className="font-bold text-tertiary">15%</span> so với năm
                ngoái nhờ bảo dưỡng định kỳ.
              </p>
            </div>
            <span className="material-symbols-outlined absolute -bottom-4 -right-4 select-none text-[120px] text-primary/5">
              insights
            </span>
          </div>
        </section>
      </main>
    </div>
  );
}

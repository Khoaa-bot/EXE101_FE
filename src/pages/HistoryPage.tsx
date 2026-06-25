import { useState } from "react";
import AppSidebar, { type AppSection } from "../components/AppSidebar";

type HistoryPageProps = {
  onHomeClick: () => void;
  onNotificationsClick: () => void;
  onProfileClick: () => void;
  onTrackingClick: () => void;
};

type ServiceRecord = {
  title: string;
  subtitle: string;
  type: "Bảo dưỡng" | "Sửa chữa";
  date: string;
  time: string;
  garage: string;
  price: string;
  icon: string;
  tone: string;
};

const filters = ["Tất cả", "Bảo dưỡng", "Sửa chữa"];

const serviceRecords: ServiceRecord[] = [
  {
    title: "Thay nhớt động cơ",
    subtitle: "Định kỳ 10,000km",
    type: "Bảo dưỡng",
    date: "15 Thg 05, 2024",
    time: "09:30 AM",
    garage: "Servio Auto Quận 7",
    price: "1,450,000đ",
    icon: "oil_barrel",
    tone: "bg-primary-container/10 text-primary",
  },
  {
    title: "Thay má phanh trước",
    subtitle: "Hỏng hóc phát sinh",
    type: "Sửa chữa",
    date: "02 Thg 04, 2024",
    time: "02:15 PM",
    garage: "Garage Hữu Tâm",
    price: "2,800,000đ",
    icon: "settings_suggest",
    tone: "bg-error-container/20 text-error",
  },
  {
    title: "Kiểm tra tổng quát 40k",
    subtitle: "Bảo dưỡng mốc lớn",
    type: "Bảo dưỡng",
    date: "20 Thg 01, 2024",
    time: "08:00 AM",
    garage: "Servio Auto Bình Thạnh",
    price: "5,200,000đ",
    icon: "car_repair",
    tone: "bg-tertiary-container/10 text-tertiary",
  },
];

export default function HistoryPage({
  onHomeClick,
  onNotificationsClick,
  onProfileClick,
  onTrackingClick,
}: HistoryPageProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState(filters[0]);

  const handleNavigate = (section: AppSection) => {
    if (section === "home") onHomeClick();
    if (section === "notifications") onNotificationsClick();
    if (section === "tracking") onTrackingClick();
    if (section === "profile") onProfileClick();
  };

  const visibleRecords =
    activeFilter === "Tất cả"
      ? serviceRecords
      : serviceRecords.filter((record) => record.type === activeFilter);

  return (
    <div className="min-h-dvh bg-surface font-sans text-on-surface">
      <AppSidebar
        active="history"
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onNavigate={handleNavigate}
      />

      <aside className="fixed left-0 top-0 z-50 hidden h-full w-60 flex-col border-r border-outline-variant bg-surface-container-lowest md:flex">
        <div className="flex items-center gap-sm p-lg">
          <span
            className="material-symbols-outlined text-3xl text-primary"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            electric_car
          </span>
          <span className="font-headline-lg text-headline-lg font-bold tracking-tight text-primary">
            Servio
          </span>
        </div>

        <nav className="mt-md flex-1 space-y-xs px-md">
          <button
            className="flex w-full items-center gap-md rounded-lg p-md text-on-surface-variant transition-colors hover:bg-surface-container"
            type="button"
            onClick={onHomeClick}
          >
            <span className="material-symbols-outlined">home</span>
            <span className="font-label-md text-label-md">Trang chủ</span>
          </button>
          <button
            className="relative flex w-full items-center gap-md rounded-lg bg-secondary-container/20 p-md text-primary transition-colors"
            type="button"
          >
            <span className="absolute left-0 top-[15%] h-[70%] w-1 rounded-r bg-primary" />
            <span
              className="material-symbols-outlined"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              history
            </span>
            <span className="font-label-md text-label-md">Lịch sử</span>
          </button>
          <button
            className="flex w-full items-center gap-md rounded-lg p-md text-on-surface-variant transition-colors hover:bg-surface-container"
            type="button"
            onClick={onTrackingClick}
          >
            <span className="material-symbols-outlined">location_on</span>
            <span className="font-label-md text-label-md">Theo dõi</span>
          </button>
          <button
            className="flex w-full items-center gap-md rounded-lg p-md text-on-surface-variant transition-colors hover:bg-surface-container"
            type="button"
            onClick={onNotificationsClick}
          >
            <span className="material-symbols-outlined">notifications</span>
            <span className="font-label-md text-label-md">Thông báo</span>
            <span className="ml-auto h-2 w-2 rounded-full bg-error" />
          </button>
          <div className="my-md border-t border-outline-variant opacity-50" />
          <button
            className="flex w-full items-center gap-md rounded-lg p-md text-on-surface-variant transition-colors hover:bg-surface-container"
            type="button"
            onClick={onProfileClick}
          >
            <span className="material-symbols-outlined">person</span>
            <span className="font-label-md text-label-md">Cá nhân</span>
          </button>
        </nav>
      </aside>

      <main className="min-h-screen bg-surface md:ml-60">
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-outline-variant bg-surface px-margin-mobile md:px-xl">
          <div className="flex items-center gap-sm">
            <button
              className="-ml-2 rounded-full p-2 text-on-surface-variant transition-colors hover:bg-surface-container md:hidden"
              type="button"
              aria-label="Mở menu"
              onClick={() => setIsSidebarOpen(true)}
            >
              <span className="material-symbols-outlined">menu</span>
            </button>
            <h1 className="font-headline-md text-headline-md text-on-surface">
              Lịch sử dịch vụ
            </h1>
          </div>

          <div className="flex items-center gap-md">
            <div className="relative hidden lg:block">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-xl text-on-surface-variant">
                search
              </span>
              <input
                className="w-64 rounded-lg border border-outline-variant bg-surface-container-low py-2 pl-10 pr-4 font-body-md text-body-md outline-none transition-all focus:ring-2 focus:ring-primary"
                placeholder="Tìm kiếm dịch vụ..."
                type="text"
              />
            </div>
            <button
              className="rounded-full p-2 transition-colors hover:bg-surface-container-high"
              type="button"
              onClick={onNotificationsClick}
            >
              <span className="material-symbols-outlined">notifications</span>
            </button>
          </div>
        </header>

        <div className="mx-auto max-w-6xl space-y-lg p-margin-mobile pb-28 md:p-xl">
          <section className="grid grid-cols-1 gap-lg md:grid-cols-3">
            <div className="flex flex-col gap-xs rounded-xl border border-outline-variant bg-surface-container-lowest p-lg">
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">
                Tổng chi phí (năm)
              </span>
              <span className="font-display-lg text-display-lg text-primary">
                12,450,000đ
              </span>
              <span className="flex items-center gap-1 font-label-md text-label-md text-tertiary">
                <span className="material-symbols-outlined text-sm">trending_up</span>
                +5% so với năm ngoái
              </span>
            </div>

            <div className="flex flex-col gap-xs rounded-xl border border-outline-variant bg-surface-container-lowest p-lg">
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">
                Số lần dịch vụ
              </span>
              <span className="font-display-lg text-display-lg text-on-surface">08</span>
              <span className="font-label-md text-label-md text-on-surface-variant">
                Lần cuối: 12 ngày trước
              </span>
            </div>

            <div className="flex items-center justify-between rounded-xl bg-primary-container p-lg text-on-primary-container shadow-lg shadow-primary-container/20">
              <div className="flex flex-col gap-xs">
                <span className="font-label-sm text-label-sm uppercase tracking-wider opacity-90">
                  Dịch vụ kế tiếp
                </span>
                <span className="font-headline-md text-headline-md">
                  Bảo dưỡng 50,000km
                </span>
                <span className="font-label-md text-label-md opacity-90">
                  Còn 1,200 km nữa
                </span>
              </div>
              <span className="material-symbols-outlined text-4xl opacity-50">
                build_circle
              </span>
            </div>
          </section>

          <section className="flex flex-col items-center justify-between gap-md rounded-xl border border-outline-variant bg-surface-container-lowest p-md sm:flex-row">
            <div className="flex w-full rounded-lg bg-surface-container-high p-1 sm:w-auto">
              {filters.map((filter) => (
                <button
                  key={filter}
                  className={`flex-1 rounded-md px-lg py-2 font-label-md text-label-md transition-all sm:flex-none ${
                    activeFilter === filter
                      ? "bg-primary text-on-primary shadow-sm"
                      : "text-on-surface-variant hover:text-primary"
                  }`}
                  type="button"
                  onClick={() => setActiveFilter(filter)}
                >
                  {filter}
                </button>
              ))}
            </div>
            <div className="flex w-full items-center gap-sm sm:w-auto">
              <button
                className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-outline-variant px-md py-2 font-label-md text-label-md transition-all hover:bg-surface-container sm:flex-none"
                type="button"
              >
                <span className="material-symbols-outlined text-xl">filter_list</span>
                <span>Bộ lọc</span>
              </button>
              <button
                className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-outline-variant px-md py-2 font-label-md text-label-md transition-all hover:bg-surface-container sm:flex-none"
                type="button"
              >
                <span className="material-symbols-outlined text-xl">file_download</span>
                <span>Xuất báo cáo</span>
              </button>
            </div>
          </section>

          <section className="overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest">
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full border-collapse text-left">
                <thead className="border-b border-outline-variant bg-surface-container-low">
                  <tr>
                    {["DỊCH VỤ", "LOẠI", "NGÀY THỰC HIỆN", "GARAGE", "CHI PHÍ", ""].map(
                      (heading) => (
                        <th
                          key={heading}
                          className="px-xl py-md font-label-md text-label-md text-on-surface-variant"
                        >
                          {heading}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant">
                  {visibleRecords.map((record) => (
                    <tr
                      key={`${record.title}-${record.date}`}
                      className="group cursor-pointer transition-colors hover:bg-surface-container-low"
                    >
                      <td className="px-xl py-lg">
                        <div className="flex items-center gap-md">
                          <div
                            className={`flex h-10 w-10 items-center justify-center rounded-lg ${record.tone}`}
                          >
                            <span className="material-symbols-outlined">
                              {record.icon}
                            </span>
                          </div>
                          <div>
                            <p className="font-body-lg text-body-lg font-semibold text-on-surface">
                              {record.title}
                            </p>
                            <p className="font-label-sm text-label-sm text-on-surface-variant">
                              {record.subtitle}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-xl py-lg">
                        <span
                          className={`rounded-full px-sm py-xs font-label-sm text-label-sm ${
                            record.type === "Bảo dưỡng"
                              ? "bg-secondary-container/30 text-on-secondary-container"
                              : "bg-error-container/30 text-on-error-container"
                          }`}
                        >
                          {record.type}
                        </span>
                      </td>
                      <td className="px-xl py-lg">
                        <p className="font-body-md text-body-md text-on-surface">
                          {record.date}
                        </p>
                        <p className="font-label-sm text-label-sm text-on-surface-variant">
                          {record.time}
                        </p>
                      </td>
                      <td className="px-xl py-lg">
                        <div className="flex items-center gap-xs">
                          <span className="material-symbols-outlined text-sm text-on-surface-variant">
                            location_on
                          </span>
                          <span className="font-body-md text-body-md text-on-surface">
                            {record.garage}
                          </span>
                        </div>
                      </td>
                      <td className="px-xl py-lg">
                        <span className="font-body-lg text-body-lg font-bold text-on-surface">
                          {record.price}
                        </span>
                      </td>
                      <td className="px-xl py-lg text-right">
                        <button
                          className="rounded-full p-2 text-on-surface-variant opacity-0 transition-all hover:bg-surface-container-high group-hover:opacity-100"
                          type="button"
                        >
                          <span className="material-symbols-outlined">
                            chevron_right
                          </span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="divide-y divide-outline-variant lg:hidden">
              {visibleRecords.map((record) => (
                <article
                  key={`${record.title}-${record.date}-mobile`}
                  className="p-lg"
                >
                  <div className="mb-md flex items-start gap-md">
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${record.tone}`}
                    >
                      <span className="material-symbols-outlined">{record.icon}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-body-lg text-body-lg font-semibold">
                        {record.title}
                      </h3>
                      <p className="font-label-sm text-label-sm text-on-surface-variant">
                        {record.subtitle}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-sm py-xs font-label-sm text-label-sm ${
                        record.type === "Bảo dưỡng"
                          ? "bg-secondary-container/30 text-on-secondary-container"
                          : "bg-error-container/30 text-on-error-container"
                      }`}
                    >
                      {record.type}
                    </span>
                  </div>
                  <div className="grid gap-sm font-body-md text-body-md text-on-surface-variant">
                    <p>{record.date} - {record.time}</p>
                    <p>{record.garage}</p>
                  </div>
                  <div className="mt-md flex items-center justify-between border-t border-outline-variant pt-md">
                    <span className="font-label-md text-label-md text-outline">
                      Chi phí
                    </span>
                    <span className="font-headline-md text-headline-md text-primary">
                      {record.price}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="relative flex items-center justify-between overflow-hidden rounded-xl bg-inverse-surface p-xl text-inverse-on-surface">
            <div className="relative z-10 min-w-0 max-w-[512px]">
              <h2 className="mb-sm font-headline-lg text-headline-lg">
                Tiết kiệm 20% cho lần bảo dưỡng tới
              </h2>
              <p className="mb-lg font-body-md text-body-md opacity-80">
                Đăng ký gói Servio Care Plus để nhận ưu đãi chi phí nhân công và
                linh kiện chính hãng trọn đời.
              </p>
              <button
                className="rounded-lg bg-primary px-xl py-md font-label-md text-label-md text-on-primary shadow-lg transition-all hover:bg-primary-container active:scale-95"
                type="button"
              >
                Tìm hiểu thêm
              </button>
            </div>
            <div className="pointer-events-none absolute right-[-5%] top-1/2 hidden w-[40%] -translate-y-1/2 opacity-20 lg:block">
              <span
                className="material-symbols-outlined text-[240px]"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                shield_with_heart
              </span>
            </div>
          </section>

          <footer className="flex flex-col gap-md pb-xl font-label-sm text-label-sm text-on-surface-variant sm:flex-row sm:items-center sm:justify-between">
            <p>© 2024 Servio Automotive Management. All rights reserved.</p>
            <div className="flex gap-lg">
              <a className="transition-colors hover:text-primary" href="#">
                Điều khoản dịch vụ
              </a>
              <a className="transition-colors hover:text-primary" href="#">
                Chính sách bảo mật
              </a>
            </div>
          </footer>
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
          <span
            className="material-symbols-outlined"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            history
          </span>
          <span className="font-label-sm text-label-sm">Lịch sử</span>
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

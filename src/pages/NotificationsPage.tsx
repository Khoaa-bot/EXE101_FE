import { useState } from "react";
import AppSidebar, { type AppSection } from "../components/AppSidebar";

type NotificationsPageProps = {
  onHomeClick: () => void;
  onHistoryClick: () => void;
  onProfileClick: () => void;
  onTrackingClick: () => void;
};

type NotificationItem = {
  id: number;
  title: string;
  body: string;
  time: string;
  icon: string;
  iconClassName: string;
  unread: boolean;
};

const initialNotifications: NotificationItem[] = [
  {
    id: 1,
    title: "Tiến độ bảo dưỡng",
    body: "Xe VinFast VF8 của bạn đã hoàn thành bước kiểm tra tổng quát và đang tiến hành thay dầu định kỳ.",
    time: "2 phút trước",
    icon: "build",
    iconClassName: "bg-primary-container text-on-primary-container",
    unread: true,
  },
  {
    id: 2,
    title: "Xác nhận lịch hẹn",
    body: "Lịch hẹn dịch vụ vào lúc 09:00 ngày mai tại Servio Quận 7 đã được xác nhận thành công.",
    time: "1 giờ trước",
    icon: "event_available",
    iconClassName: "bg-tertiary-container text-on-tertiary-container",
    unread: false,
  },
  {
    id: 3,
    title: "Ưu đãi độc quyền",
    body: "Giảm ngay 20% cho gói chăm sóc nội thất toàn diện. Chỉ dành riêng cho khách hàng thân thiết!",
    time: "4 giờ trước",
    icon: "sell",
    iconClassName: "bg-secondary-container text-on-secondary-container",
    unread: true,
  },
  {
    id: 4,
    title: "Hoàn tất thanh toán",
    body: "Hóa đơn #SV10293 đã được thanh toán thành công qua thẻ tín dụng. Cảm ơn quý khách!",
    time: "Hôm qua",
    icon: "check_circle",
    iconClassName: "bg-surface-container-high text-primary",
    unread: false,
  },
  {
    id: 5,
    title: "Bảo mật tài khoản",
    body: "Chúng tôi nhận thấy một thiết bị mới vừa đăng nhập vào tài khoản của bạn tại TP.HCM.",
    time: "Hôm qua",
    icon: "security",
    iconClassName: "bg-error-container text-on-error-container",
    unread: true,
  },
];

const filters = ["Tất cả", "Đơn hàng", "Khuyến mãi"];
const promoImage =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuDpf3amQd1cw3r6OHT77zG36yOMwWFlqCYu9WaD8zD9WRXnmYbpgqdyzzkqmKX1yvA8UQQUiPit2jre0QAjZ1YjREhOUNM7PsXLG3i4IIXuNsNY8RtJBXv_BkSSXu_OYi7kTTzpK44wve_iNKIHnsqZIn-KsQJQ0SdG-X_-Q-PYAoJ2CvJge-iuKR2Y5a2oov7C1GVcYQjWDeze_pdREYR1-SeE_egkpCQN3G6FcsVgN9-3eXHTqYgHAsk2hSCN_2tNX2q4BaAbimHt";

export default function NotificationsPage({
  onHomeClick,
  onHistoryClick,
  onProfileClick,
  onTrackingClick,
}: NotificationsPageProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState(filters[0]);
  const [notifications, setNotifications] = useState(initialNotifications);

  const toggleSidebar = () => {
    setIsSidebarOpen((current) => !current);
  };

  const markOneAsRead = (id: number) => {
    setNotifications((items) =>
      items.map((item) => (item.id === id ? { ...item, unread: false } : item)),
    );
  };

  const markAllAsRead = () => {
    setNotifications((items) => items.map((item) => ({ ...item, unread: false })));
  };

  const handleNavigate = (section: AppSection) => {
    if (section === "home") onHomeClick();
    if (section === "history") onHistoryClick();
    if (section === "tracking") onTrackingClick();
    if (section === "profile") onProfileClick();
  };

  return (
    <div className="min-h-dvh bg-background text-on-surface font-sans">
      <AppSidebar
        active="notifications"
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onNavigate={handleNavigate}
      />

      <header className="fixed top-0 z-50 flex h-16 w-full items-center justify-between border-b border-outline-variant bg-surface px-margin-mobile">
        <div className="flex items-center gap-4">
          <button
            className="-ml-1 p-1 text-on-surface"
            type="button"
            aria-label="Mở menu"
            onClick={toggleSidebar}
          >
            <span className="material-symbols-outlined">menu</span>
          </button>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">
              electric_car
            </span>
            <h1 className="font-headline-lg-mobile text-headline-lg-mobile font-bold text-primary">
              Servio
            </h1>
          </div>
        </div>
        <span className="material-symbols-outlined text-on-surface-variant">
          account_circle
        </span>
      </header>

      <main className="mx-auto w-full max-w-[448px] pb-8 pt-16">
        <section className="bg-surface px-margin-mobile py-4">
          <div className="mb-4 flex items-end justify-between gap-3">
            <h2 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface">
              Thông báo
            </h2>
            <button
              className="font-label-md text-primary transition-all hover:underline"
              type="button"
              onClick={markAllAsRead}
            >
              Đánh dấu tất cả là đã đọc
            </button>
          </div>

          <div className="flex gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {filters.map((filter) => (
              <button
                key={filter}
                className={`whitespace-nowrap rounded-full px-4 py-2 font-label-md transition-transform active:scale-95 ${
                  filter === activeFilter
                    ? "bg-primary text-on-primary"
                    : "bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest"
                }`}
                type="button"
                onClick={() => setActiveFilter(filter)}
              >
                {filter}
              </button>
            ))}
          </div>
        </section>

        <section className="mt-2 space-y-px">
          {notifications.slice(0, 4).map((notification) => (
            <NotificationRow
              key={notification.id}
              item={notification}
              onRead={() => markOneAsRead(notification.id)}
            />
          ))}

          <div className="px-margin-mobile py-4">
            <div className="group relative aspect-[2/1] w-full overflow-hidden rounded-xl shadow-sm">
              <div
                className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                style={{ backgroundImage: `url(${promoImage})` }}
              />
              <div className="absolute inset-0 flex flex-col justify-center bg-gradient-to-r from-primary/80 to-transparent px-6">
                <span className="mb-2 w-fit rounded-full bg-on-primary px-2 py-0.5 text-[10px] font-bold text-primary">
                  HOT
                </span>
                <h4 className="max-w-[160px] font-headline-md leading-tight text-on-primary">
                  Bảo trì định kỳ, Vi vu đón hè
                </h4>
                <button className="mt-3 w-fit rounded-lg bg-on-primary px-4 py-1.5 font-label-md text-primary transition-transform active:scale-95">
                  Xem ngay
                </button>
              </div>
            </div>
          </div>

          {notifications.slice(4).map((notification) => (
            <NotificationRow
              key={notification.id}
              item={notification}
              onRead={() => markOneAsRead(notification.id)}
            />
          ))}
        </section>
      </main>
    </div>
  );
}

function NotificationRow({
  item,
  onRead,
}: {
  item: NotificationItem;
  onRead: () => void;
}) {
  return (
    <button
      className={`flex w-full gap-4 border-b border-outline-variant/30 px-margin-mobile py-4 text-left transition-colors ${
        item.unread ? "bg-surface-container-lowest" : "bg-surface opacity-80"
      }`}
      type="button"
      onClick={onRead}
    >
      <div className="relative shrink-0">
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-xl ${item.iconClassName}`}
        >
          <span
            className="material-symbols-outlined"
            style={{
              fontVariationSettings: item.unread ? "'FILL' 1" : "'FILL' 0",
            }}
          >
            {item.icon}
          </span>
        </div>
        {item.unread && (
          <div className="absolute -right-1 -top-1 h-2 w-2 rounded-full border-2 border-white bg-primary" />
        )}
      </div>

      <div className="min-w-0 flex-grow">
        <div className="mb-1 flex items-start justify-between gap-2">
          <h3
            className={`font-label-md text-on-surface ${
              item.unread ? "font-semibold" : ""
            }`}
          >
            {item.title}
          </h3>
          <span className="shrink-0 text-[10px] font-medium text-outline">
            {item.time}
          </span>
        </div>
        <p className="line-clamp-2 font-body-md text-on-surface-variant">
          {item.body}
        </p>
      </div>
    </button>
  );
}

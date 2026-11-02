import { useState } from "react";
import { type SuperAdminUser } from "../../services/api";
import AdminShell, { type ShellNavigationItem } from "../Admin/AdminShell";
import NotificationsPage from "../Customer/NotificationsPage";
import SuperAdminAppointmentsTab from "./SuperAdminAppointmentsTab";
import SuperAdminCustomersTab from "./SuperAdminCustomersTab";
import SuperAdminGaragesTab from "./SuperAdminGaragesTab";
import SuperAdminOverviewTab from "./SuperAdminOverviewTab";
import SuperAdminReviewsHub from "./SuperAdminReviewsHub";

type TabKey = "overview" | "customers" | "garages" | "appointments" | "reviews" | "notifications";

const NOTIFICATIONS_TAB = {
  key: "notifications" as TabKey,
  icon: "notifications",
  label: "Thông báo",
  description: "Garage mới, thanh toán gói và garage hết hạn.",
};

const TABS: { key: TabKey; icon: string; label: string; description: string }[] = [
  {
    key: "overview",
    icon: "space_dashboard",
    label: "Tổng quan",
    description: "Tình hình nền tảng hôm nay và những việc cần bạn xử lý.",
  },
  {
    key: "customers",
    icon: "groups",
    label: "Khách hàng",
    description: "Xem, chặn hoặc ẩn khách hàng đang sử dụng dịch vụ trên hệ thống.",
  },
  {
    key: "garages",
    icon: "storefront",
    label: "Garage",
    description: "Quản lý garage, Admin Garage phụ trách, chặn hoặc ẩn garage.",
  },
  {
    key: "appointments",
    icon: "event_note",
    label: "Lịch sử đặt lịch",
    description: "Toàn bộ lịch hẹn của khách trên mọi garage (chỉ xem).",
  },
  {
    key: "reviews",
    icon: "reviews",
    label: "Đánh giá",
    description: "Đánh giá garage và góp ý về website Servio. Chỉ ẩn hoặc hiện, không xóa.",
  },
];

const ERROR_TRANSLATIONS: Record<string, string> = {
  "Username already exists": "Tên đăng nhập này đã có người dùng, chọn tên khác nhé.",
  "Email already exists": "Email này đã được đăng ký rồi.",
  "Garage not found": "Không tìm thấy garage này.",
  "Garage ID is required": "Vui lòng chọn garage.",
  "Username is required": "Vui lòng nhập tên đăng nhập.",
  "Password is required": "Vui lòng nhập mật khẩu.",
  "User not found": "Không tìm thấy người dùng này.",
};

function translateError(message: string) {
  return ERROR_TRANSLATIONS[message] ?? message;
}

type Notice = { type: "success" | "error"; message: string };

type SuperAdminDashboardPageProps = {
  onLogout?: () => void;
};

export default function SuperAdminDashboardPage({ onLogout }: SuperAdminDashboardPageProps) {
  const [tab, setTab] = useState<TabKey>("overview");
  const [appointmentCustomer, setAppointmentCustomer] = useState<{ id: number; name: string } | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);

  const notify = (message: string, type: Notice["type"] = "success") => {
    setNotice({ type, message: type === "error" ? translateError(message) : message });
    window.setTimeout(() => setNotice(null), 3500);
  };

  const viewAppointmentsOf = (user: SuperAdminUser) => {
    setAppointmentCustomer({ id: user.id, name: user.fullName || user.username });
    setTab("appointments");
  };

  const active = tab === "notifications" ? NOTIFICATIONS_TAB : (TABS.find((t) => t.key === tab) ?? TABS[0]);
  const navigationItems: ShellNavigationItem[] = TABS;

  return (
    <AdminShell
      activeTab={tab}
      title={active.label}
      description={active.description}
      navigationItems={navigationItems}
      onNavigationItemClick={(key) => setTab(key as TabKey)}
      onNotificationsClick={() => setTab("notifications")}
      onLogout={onLogout}
      notice={notice}
    >
            {tab === "notifications" && <NotificationsPage embedded />}
            {tab === "overview" && <SuperAdminOverviewTab onNavigate={setTab} />}
            {tab === "customers" && (
              <SuperAdminCustomersTab notify={notify} onViewAppointments={viewAppointmentsOf} />
            )}
            {tab === "garages" && <SuperAdminGaragesTab notify={notify} />}
            {tab === "reviews" && <SuperAdminReviewsHub notify={notify} />}
            {tab === "appointments" && (
              <SuperAdminAppointmentsTab
                key={appointmentCustomer?.id ?? "all"}
                customer={appointmentCustomer}
                onClearCustomer={() => setAppointmentCustomer(null)}
              />
            )}
    </AdminShell>
  );
}

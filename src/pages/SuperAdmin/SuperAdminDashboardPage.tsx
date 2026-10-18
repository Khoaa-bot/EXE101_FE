import { useCallback, useEffect, useState } from "react";
import { getPendingWithdrawalCount, type SuperAdminUser } from "../../services/api";
import AdminShell, { type ShellNavigationItem } from "../Admin/AdminShell";
import SuperAdminAppointmentsTab from "./SuperAdminAppointmentsTab";
import SuperAdminCustomersTab from "./SuperAdminCustomersTab";
import SuperAdminGaragesTab from "./SuperAdminGaragesTab";
import SuperAdminOverviewTab from "./SuperAdminOverviewTab";
import SuperAdminReviewHistoryTab from "./SuperAdminReviewHistoryTab";
import SuperAdminWalletTab from "./SuperAdminWalletTab";
import SuperAdminWithdrawalsTab from "./SuperAdminWithdrawalsTab";

type TabKey = "overview" | "customers" | "garages" | "appointments" | "reviews" | "withdrawals" | "wallet";

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
    icon: "rate_review",
    label: "Lịch sử đánh giá",
    description: "Theo dõi phản hồi của khách hàng về dịch vụ tại các garage.",
  },
  {
    key: "withdrawals",
    icon: "payments",
    label: "Yêu cầu chuyển tiền",
    description: "Yêu cầu rút tiền của khách hàng và garage: chuyển khoản thủ công rồi bấm xác nhận.",
  },
  {
    key: "wallet",
    icon: "account_balance_wallet",
    label: "Ví nền tảng",
    description: "Hoa hồng đã nhận, tiền đang giữ hộ khách và đối soát tiền vào/ra.",
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
  const [pendingWithdrawals, setPendingWithdrawals] = useState(0);

  const refreshPending = useCallback(() => {
    getPendingWithdrawalCount()
      .then(setPendingWithdrawals)
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    refreshPending();
  }, [refreshPending]);

  const notify = (message: string, type: Notice["type"] = "success") => {
    setNotice({ type, message: type === "error" ? translateError(message) : message });
    window.setTimeout(() => setNotice(null), 3500);
  };

  const viewAppointmentsOf = (user: SuperAdminUser) => {
    setAppointmentCustomer({ id: user.id, name: user.fullName || user.username });
    setTab("appointments");
  };

  const active = TABS.find((t) => t.key === tab) ?? TABS[0];
  const navigationItems: ShellNavigationItem[] = TABS.map((item) => ({
    ...item,
    endAdornment:
      item.key === "withdrawals" && pendingWithdrawals > 0 ? (
        <span className="ml-auto rounded-full bg-error px-2 py-0.5 text-[11px] font-bold text-on-error">
          {pendingWithdrawals}
        </span>
      ) : undefined,
  }));

  return (
    <AdminShell
      activeTab={tab}
      title={active.label}
      description={active.description}
      navigationItems={navigationItems}
      onNavigationItemClick={(key) => setTab(key as TabKey)}
      onLogout={onLogout}
      notice={notice}
    >
            {tab === "overview" && <SuperAdminOverviewTab onNavigate={setTab} />}
            {tab === "customers" && (
              <SuperAdminCustomersTab notify={notify} onViewAppointments={viewAppointmentsOf} />
            )}
            {tab === "garages" && <SuperAdminGaragesTab notify={notify} />}
            {tab === "withdrawals" && (
              <SuperAdminWithdrawalsTab
                notify={notify}
                onChanged={refreshPending}
                pendingCount={pendingWithdrawals}
              />
            )}
            {tab === "wallet" && <SuperAdminWalletTab onNavigate={setTab} />}
            {tab === "appointments" && (
              <SuperAdminAppointmentsTab
                key={appointmentCustomer?.id ?? "all"}
                customer={appointmentCustomer}
                onClearCustomer={() => setAppointmentCustomer(null)}
              />
            )}
            {tab === "reviews" && <SuperAdminReviewHistoryTab />}
    </AdminShell>
  );
}

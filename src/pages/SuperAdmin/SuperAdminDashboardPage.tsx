import { useCallback, useEffect, useState } from "react";
import { getPendingWithdrawalCount, type SuperAdminUser } from "../../services/api";
import SuperAdminAppointmentsTab from "./SuperAdminAppointmentsTab";
import SuperAdminCustomersTab from "./SuperAdminCustomersTab";
import SuperAdminGaragesTab from "./SuperAdminGaragesTab";
import SuperAdminWalletTab from "./SuperAdminWalletTab";
import SuperAdminWithdrawalsTab from "./SuperAdminWithdrawalsTab";

type TabKey = "customers" | "garages" | "appointments" | "withdrawals" | "wallet";

const TABS: { key: TabKey; icon: string; label: string; description: string }[] = [
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
  const [tab, setTab] = useState<TabKey>("customers");
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

  return (
    <div className="min-h-[100dvh] bg-background font-sans text-on-surface">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-outline-variant bg-surface-container-lowest p-lg md:flex">
        <div className="mb-xl">
          <div className="flex items-center gap-2 text-primary">
            <span className="material-symbols-outlined text-3xl">electric_car</span>
            <span className="font-headline-lg text-headline-lg font-bold">Servio</span>
          </div>
          <p className="mt-1 text-xs text-on-surface-variant">Super Admin</p>
        </div>
        <nav className="space-y-1">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left font-body-md text-body-md transition-colors ${
                tab === t.key
                  ? "bg-primary-container/15 font-semibold text-primary"
                  : "text-on-surface-variant hover:bg-surface-container-low"
              }`}
              type="button"
            >
              <span className="material-symbols-outlined">{t.icon}</span>
              {t.label}
              {t.key === "withdrawals" && pendingWithdrawals > 0 && (
                <span className="ml-auto rounded-full bg-error px-2 py-0.5 text-[11px] font-bold text-on-error">
                  {pendingWithdrawals}
                </span>
              )}
            </button>
          ))}
        </nav>
        {onLogout && (
          <button
            onClick={onLogout}
            className="mt-auto flex items-center gap-3 rounded-lg px-3 py-2.5 text-error hover:bg-error-container/10 transition-colors"
            type="button"
          >
            <span className="material-symbols-outlined">logout</span>
            Đăng xuất
          </button>
        )}
      </aside>

      <main className="min-h-[100dvh] p-margin-mobile md:ml-60 md:p-margin-desktop">
        <div className="mx-auto max-w-6xl">
          <div className="mb-4 flex gap-2 overflow-x-auto md:hidden">
            {TABS.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-semibold ${
                  tab === t.key
                    ? "bg-primary text-on-primary"
                    : "border border-outline-variant text-on-surface-variant"
                }`}
              >
                {t.label}
                {t.key === "withdrawals" && pendingWithdrawals > 0 ? ` (${pendingWithdrawals})` : ""}
              </button>
            ))}
            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                className="ml-auto whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-semibold text-error"
              >
                Đăng xuất
              </button>
            )}
          </div>

          <div className="border-b border-outline-variant pb-5">
            <h1 className="font-headline-lg text-headline-lg font-bold">{active.label}</h1>
            <p className="mt-1 text-body-sm text-on-surface-variant">{active.description}</p>
          </div>

          <div className="mt-6">
            {tab === "customers" && (
              <SuperAdminCustomersTab notify={notify} onViewAppointments={viewAppointmentsOf} />
            )}
            {tab === "garages" && <SuperAdminGaragesTab notify={notify} />}
            {tab === "withdrawals" && (
              <SuperAdminWithdrawalsTab notify={notify} onChanged={refreshPending} />
            )}
            {tab === "wallet" && <SuperAdminWalletTab />}
            {tab === "appointments" && (
              <SuperAdminAppointmentsTab
                key={appointmentCustomer?.id ?? "all"}
                customer={appointmentCustomer}
                onClearCustomer={() => setAppointmentCustomer(null)}
              />
            )}
          </div>
        </div>
      </main>

      {notice && (
        <div
          className="fixed bottom-5 right-5 z-50 flex max-w-[24rem] animate-[toast-in_0.2s_ease-out] items-start gap-3 rounded-xl border bg-surface-container-lowest px-4 py-3 text-body-sm shadow-lg"
          style={{
            borderColor: notice.type === "error" ? "var(--color-error)" : "var(--color-tertiary)",
          }}
          role="status"
        >
          <span
            className={`material-symbols-outlined mt-0.5 text-lg ${
              notice.type === "error" ? "text-error" : "text-tertiary"
            }`}
          >
            {notice.type === "error" ? "error" : "check_circle"}
          </span>
          <p className="text-on-surface">{notice.message}</p>
        </div>
      )}
    </div>
  );
}

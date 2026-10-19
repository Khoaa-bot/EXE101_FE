import WalletPage from "../Customer/WalletPage";
import AdminShell, { type AdminNavProps } from "./AdminShell";

export type AdminWalletPageProps = AdminNavProps;

// Ví của garage: dùng lại nội dung WalletPage (số dư, rút tiền, lịch sử) trong AdminShell nhất quán với SuperAdmin.
export default function AdminWalletPage(props: AdminWalletPageProps) {
  return (
    <AdminShell
      activeTab="wallet"
      title="Ví garage"
      description="Quản lý số dư, yêu cầu rút tiền doanh thu về tài khoản ngân hàng và theo dõi lịch sử dòng tiền."
      maxWidthClass="max-w-6xl"
      {...props}
    >
      <div className="rounded-2xl border border-outline-variant/40 bg-surface-container-lowest p-4 shadow-[0_10px_26px_-14px_rgba(25,28,29,0.28)] md:p-6">
        <WalletPage />
      </div>
    </AdminShell>
  );
}

import WalletPage from "../Customer/WalletPage";

type AdminWalletPageProps = {
  onDashboardClick?: () => void;
  onLogout?: () => void;
};

// Ví của garage: dùng lại nội dung WalletPage (số dư, rút tiền, lịch sử) trong khung gọn cho chủ garage.
export default function AdminWalletPage({ onDashboardClick, onLogout }: AdminWalletPageProps) {
  return (
    <div className="min-h-[100dvh] bg-background font-sans text-on-surface">
      <header className="flex items-center justify-between border-b border-outline-variant bg-surface-container-lowest px-margin-mobile py-3 md:px-margin-desktop">
        <button
          type="button"
          onClick={onDashboardClick}
          className="flex items-center gap-2 font-label-md text-label-md text-primary"
        >
          <span className="material-symbols-outlined">arrow_back</span>
          Về Dashboard
        </button>
        <h1 className="font-headline-md text-headline-md font-bold">Ví garage</h1>
        {onLogout ? (
          <button type="button" onClick={onLogout} className="font-label-md text-label-md text-error">
            Đăng xuất
          </button>
        ) : (
          <span />
        )}
      </header>
      <WalletPage />
    </div>
  );
}

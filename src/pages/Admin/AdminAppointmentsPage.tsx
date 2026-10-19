import { useEffect, useState } from "react";
import { getGarageAppointments, type AdminAppointmentPage } from "../../services/api";

const navItems = [
  ["dashboard", "Dashboard"],
  ["engineering", "Nhân viên"],
  ["groups", "Khách hàng"],
  ["history", "Lịch sử lịch hẹn"],
  ["inventory_2", "Kho linh kiện"],
  ["payments", "Bảng giá"],
  ["storefront", "Thông tin garage"],
  ["account_balance_wallet", "Ví garage"],
];

const STATUS_LABELS: Record<string, string> = {
  pending: "Chờ xử lý",
  confirmed: "Đã xác nhận",
  in_progress: "Đang thực hiện",
  completed: "Hoàn thành",
  successful: "Đã bàn giao",
  cancelled: "Đã huỷ",
  no_show: "Không đến",
};

const STATUS_TONES: Record<string, string> = {
  pending: "bg-tertiary-container/20 text-tertiary",
  confirmed: "bg-primary-container/15 text-primary",
  in_progress: "bg-primary-container/15 text-primary",
  completed: "bg-primary-container/15 text-primary",
  successful: "bg-tertiary-container/20 text-tertiary",
  cancelled: "bg-error-container/20 text-error",
  no_show: "bg-error-container/20 text-error",
};

const PAGE_SIZE = 20;

type Filters = { q: string; status: string; fromDate: string; toDate: string };
const EMPTY_FILTERS: Filters = { q: "", status: "", fromDate: "", toDate: "" };

type AdminAppointmentsPageProps = {
  onDashboardClick?: () => void;
  onEngineersClick?: () => void;
  onCustomersClick?: () => void;
  onAppointmentsClick?: () => void;
  onInventoryClick?: () => void;
  onPricingClick?: () => void;
  onGarageClick?: () => void;
  onWalletClick?: () => void;
  onLogout?: () => void;
};

function formatCurrency(value: number | null) {
  return value === null || value === undefined ? "—" : `${value.toLocaleString("vi-VN")}đ`;
}

// Lịch sử lịch hẹn của garage mình (chỉ xem): BE luôn giới hạn theo garage của chủ garage đang đăng nhập.
export default function AdminAppointmentsPage({
  onDashboardClick,
  onEngineersClick,
  onCustomersClick,
  onInventoryClick,
  onPricingClick,
  onGarageClick,
  onWalletClick,
  onLogout,
}: AdminAppointmentsPageProps) {
  const [draft, setDraft] = useState<Filters>(EMPTY_FILTERS);
  const [applied, setApplied] = useState<Filters>(EMPTY_FILTERS);
  const [page, setPage] = useState(0);
  const [result, setResult] = useState<{
    key: string;
    data: AdminAppointmentPage | null;
    error: string | null;
  } | null>(null);

  const requestKey = JSON.stringify([applied, page]);
  const isLoading = result?.key !== requestKey;
  const data = result?.key === requestKey ? result.data : null;
  const loadError = result?.key === requestKey ? result.error : null;

  useEffect(() => {
    let cancelled = false;
    getGarageAppointments({
      status: applied.status,
      fromDate: applied.fromDate,
      toDate: applied.toDate,
      q: applied.q,
      page,
      size: PAGE_SIZE,
    })
      .then((pageData) => {
        if (!cancelled) setResult({ key: requestKey, data: pageData, error: null });
      })
      .catch((err) => {
        if (!cancelled) {
          setResult({
            key: requestKey,
            data: null,
            error: err instanceof Error ? err.message : "Không tải được lịch sử lịch hẹn.",
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [applied, page, requestKey]);

  const applyFilters = (event: React.FormEvent) => {
    event.preventDefault();
    setPage(0);
    setApplied(draft);
  };

  const resetFilters = () => {
    setDraft(EMPTY_FILTERS);
    setApplied(EMPTY_FILTERS);
    setPage(0);
  };

  const totalPages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1;
  const firstShown = data && data.total > 0 ? page * PAGE_SIZE + 1 : 0;
  const lastShown = data ? Math.min(data.total, page * PAGE_SIZE + data.items.length) : 0;
  const inputClass =
    "rounded-lg border border-outline-variant bg-surface-container-low px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary";

  return (
    <div className="min-h-[100dvh] bg-background font-sans text-on-surface">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-outline-variant bg-surface-container-lowest p-lg md:flex">
        <div className="mb-xl">
          <div className="flex items-center gap-2 text-primary">
            <span className="material-symbols-outlined text-3xl">electric_car</span>
            <span className="font-headline-lg text-headline-lg font-bold">Servio</span>
          </div>
          <p className="mt-1 text-xs text-on-surface-variant">Quản trị garage</p>
        </div>
        <nav className="space-y-1">
          {navItems.map(([icon, label]) => {
            const isCurrent = label === "Lịch sử lịch hẹn";
            return (
              <button
                key={label}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left font-body-md text-body-md transition-colors active:scale-[0.98] ${
                  isCurrent
                    ? "bg-primary-container/15 font-semibold text-primary"
                    : "text-on-surface-variant hover:bg-surface-container-low"
                }`}
                type="button"
                onClick={() => {
                  if (label === "Dashboard") onDashboardClick?.();
                  else if (label === "Nhân viên") onEngineersClick?.();
                  else if (label === "Khách hàng") onCustomersClick?.();
                  else if (label === "Kho linh kiện") onInventoryClick?.();
                  else if (label === "Bảng giá") onPricingClick?.();
                  else if (label === "Thông tin garage") onGarageClick?.();
                  else if (label === "Ví garage") onWalletClick?.();
                }}
              >
                <span className="material-symbols-outlined">{icon}</span>
                {label}
              </button>
            );
          })}
        </nav>
        {onLogout && (
          <button
            onClick={onLogout}
            className="mt-auto flex items-center gap-3 rounded-lg px-3 py-2.5 text-error transition-colors hover:bg-error-container/10"
            type="button"
          >
            <span className="material-symbols-outlined">logout</span>
            Đăng xuất
          </button>
        )}
      </aside>

      <main className="min-h-[100dvh] p-margin-mobile md:ml-60 md:p-margin-desktop">
        <div className="mx-auto max-w-6xl">
          <h1 className="font-headline-lg text-headline-lg font-bold">Lịch sử lịch hẹn</h1>
          <p className="mt-1 text-body-sm text-on-surface-variant">
            Toàn bộ lịch hẹn của garage bạn, kể cả đã huỷ và đã bàn giao (chỉ xem).
          </p>

          <form onSubmit={applyFilters} className="mt-6 flex flex-wrap items-end gap-3">
            <input
              aria-label="Tìm theo tên, SĐT, biển số"
              value={draft.q}
              onChange={(e) => setDraft((f) => ({ ...f, q: e.target.value }))}
              placeholder="Tên, SĐT, biển số..."
              className={`w-56 ${inputClass}`}
            />
            <select
              aria-label="Lọc theo trạng thái"
              value={draft.status}
              onChange={(e) => setDraft((f) => ({ ...f, status: e.target.value }))}
              className={inputClass}
            >
              <option value="">Tất cả trạng thái</option>
              {Object.entries(STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <label className="text-xs text-on-surface-variant">
              Từ ngày
              <input
                type="date"
                value={draft.fromDate}
                onChange={(e) => setDraft((f) => ({ ...f, fromDate: e.target.value }))}
                className={`mt-1 block ${inputClass}`}
              />
            </label>
            <label className="text-xs text-on-surface-variant">
              Đến ngày
              <input
                type="date"
                value={draft.toDate}
                onChange={(e) => setDraft((f) => ({ ...f, toDate: e.target.value }))}
                className={`mt-1 block ${inputClass}`}
              />
            </label>
            <button
              type="submit"
              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-on-primary hover:opacity-90"
            >
              Lọc
            </button>
            <button
              type="button"
              onClick={resetFilters}
              className="rounded-lg border border-outline-variant px-4 py-2 text-sm font-semibold hover:bg-surface-container-low"
            >
              Xoá lọc
            </button>
          </form>

          {isLoading && <p className="mt-6 text-body-sm text-on-surface-variant">Đang tải lịch sử lịch hẹn...</p>}
          {!isLoading && loadError && <p className="mt-6 text-body-sm text-error">{loadError}</p>}

          {!isLoading && !loadError && data && (
            <>
              <div className="mt-6 overflow-x-auto rounded-xl border border-outline-variant bg-surface-container-lowest">
                <table className="w-full min-w-[860px] text-left text-sm">
                  <thead className="border-b border-outline-variant bg-surface-container-low text-xs uppercase text-on-surface-variant">
                    <tr>
                      <th className="px-4 py-3 font-medium">Mã</th>
                      <th className="px-4 py-3 font-medium">Ngày giờ</th>
                      <th className="px-4 py-3 font-medium">Khách hàng</th>
                      <th className="px-4 py-3 font-medium">Xe</th>
                      <th className="px-4 py-3 font-medium">Dịch vụ</th>
                      <th className="px-4 py-3 font-medium">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant">
                    {data.items.map((a) => {
                      const key = a.status.toLowerCase();
                      return (
                        <tr key={a.id} className="hover:bg-surface-container-low">
                          <td className="px-4 py-3 font-semibold">#{a.id}</td>
                          <td className="px-4 py-3">
                            <div>{a.scheduleDate ? new Date(a.scheduleDate).toLocaleDateString("vi-VN") : "—"}</div>
                            <div className="text-xs text-on-surface-variant">{a.timeFrame || ""}</div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-semibold">{a.customerName}</div>
                            <div className="text-xs text-on-surface-variant">{a.customerPhone || ""}</div>
                          </td>
                          <td className="px-4 py-3">
                            <div>{a.vehicleModel || "—"}</div>
                            <div className="text-xs text-on-surface-variant">{a.vehicleLicensePlate || ""}</div>
                          </td>
                          <td className="px-4 py-3">
                            <div>{a.serviceName}</div>
                            <div className="text-xs text-on-surface-variant">{formatCurrency(a.servicePrice)}</div>
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                                STATUS_TONES[key] ?? "bg-surface-container-high text-on-surface-variant"
                              }`}
                            >
                              {STATUS_LABELS[key] ?? a.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                    {data.items.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-on-surface-variant">
                          Không có lịch hẹn phù hợp.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 flex items-center justify-between text-sm text-on-surface-variant">
                <span>
                  {data.total === 0
                    ? "0 lịch hẹn"
                    : `Hiển thị ${firstShown}–${lastShown} trên ${data.total} lịch hẹn`}
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={page === 0}
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    className="rounded-lg border border-outline-variant px-3 py-1.5 font-semibold hover:bg-surface-container-low disabled:opacity-50"
                  >
                    Trước
                  </button>
                  <button
                    type="button"
                    disabled={page + 1 >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
                    className="rounded-lg border border-outline-variant px-3 py-1.5 font-semibold hover:bg-surface-container-low disabled:opacity-50"
                  >
                    Sau
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

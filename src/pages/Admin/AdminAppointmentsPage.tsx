import { useEffect, useState } from "react";
import { getGarageAppointments, type AdminAppointmentPage } from "../../services/api";
import AdminShell, { type AdminNavProps } from "./AdminShell";

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

export type AdminAppointmentsPageProps = AdminNavProps;

function formatCurrency(value: number | null) {
  return value === null || value === undefined ? "—" : `${value.toLocaleString("vi-VN")}đ`;
}

// Lịch sử lịch hẹn của garage mình (chỉ xem): BE luôn giới hạn theo garage của chủ garage đang đăng nhập.
export default function AdminAppointmentsPage(props: AdminAppointmentsPageProps) {
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
    <AdminShell
      activeTab="appointments"
      title="Lịch sử lịch hẹn"
      description="Toàn bộ lịch hẹn của garage bạn, kể cả đã huỷ và đã bàn giao (chỉ xem)."
      maxWidthClass="max-w-6xl"
      {...props}
    >
      <form onSubmit={applyFilters} className="flex flex-wrap items-end gap-3">
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
              {data.total === 0 ? "0 lịch hẹn" : `Hiển thị ${firstShown}–${lastShown} trên ${data.total} lịch hẹn`}
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
    </AdminShell>
  );
}

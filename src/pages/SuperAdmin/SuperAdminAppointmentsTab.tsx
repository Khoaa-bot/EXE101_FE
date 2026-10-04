import { useEffect, useState } from "react";
import {
  getAdminAppointments,
  getAdminGarages,
  type AdminAppointmentPage,
  type SuperAdminGarage,
} from "../../services/api";

const STATUS_LABELS: Record<string, string> = {
  pending: "Chờ xử lý",
  confirmed: "Đã xác nhận",
  in_progress: "Đang thực hiện",
  completed: "Hoàn thành",
  successful: "Bàn giao xong",
  cancelled: "Đã hủy",
  no_show: "Không đến",
};

const PAGE_SIZE = 20;

type Filters = {
  q: string;
  status: string;
  garageId: string;
  fromDate: string;
  toDate: string;
};

const EMPTY_FILTERS: Filters = { q: "", status: "", garageId: "", fromDate: "", toDate: "" };

type Props = {
  customer: { id: number; name: string } | null;
  onClearCustomer: () => void;
};

function formatCurrency(value: number | null) {
  return value === null || value === undefined ? "—" : `${value.toLocaleString("vi-VN")}đ`;
}

export default function SuperAdminAppointmentsTab({ customer, onClearCustomer }: Props) {
  const [draft, setDraft] = useState<Filters>(EMPTY_FILTERS);
  const [applied, setApplied] = useState<Filters>(EMPTY_FILTERS);
  const [page, setPage] = useState(0);
  const [garages, setGarages] = useState<SuperAdminGarage[]>([]);
  const [result, setResult] = useState<{
    key: string;
    data: AdminAppointmentPage | null;
    error: string | null;
  } | null>(null);

  const customerId = customer?.id;
  const requestKey = JSON.stringify([applied, page, customerId]);
  const isLoading = result?.key !== requestKey;
  const data = result?.key === requestKey ? result.data : null;
  const loadError = result?.key === requestKey ? result.error : null;

  useEffect(() => {
    getAdminGarages(true)
      .then(setGarages)
      .catch(() => {});
  }, []);

  useEffect(() => {
    let cancelled = false;
    getAdminAppointments({
      customerId,
      garageId: applied.garageId ? Number(applied.garageId) : undefined,
      status: applied.status,
      fromDate: applied.fromDate,
      toDate: applied.toDate,
      q: applied.q,
      page,
      size: PAGE_SIZE,
    })
      .then((page0) => {
        if (!cancelled) setResult({ key: requestKey, data: page0, error: null });
      })
      .catch((err) => {
        if (!cancelled) {
          setResult({
            key: requestKey,
            data: null,
            error: err instanceof Error ? err.message : "Không tải được lịch sử đặt lịch.",
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [applied, page, customerId, requestKey]);

  const applyFilters = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(0);
    setApplied(draft);
  };

  const resetFilters = () => {
    setDraft(EMPTY_FILTERS);
    setApplied(EMPTY_FILTERS);
    setPage(0);
  };

  const totalPages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1;
  const inputClass =
    "rounded-lg border border-outline-variant bg-surface-container-low px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary";

  return (
    <div>
      {customer && (
        <div className="mb-4 flex items-center gap-3 rounded-lg bg-primary-container/15 px-4 py-2 text-sm">
          <span>
            Đang lọc theo khách hàng: <strong>{customer.name}</strong>
          </span>
          <button type="button" onClick={onClearCustomer} className="font-semibold text-primary hover:underline">
            Bỏ lọc
          </button>
        </div>
      )}

      <form onSubmit={applyFilters} className="flex flex-wrap items-end gap-3">
        <input aria-label="Tên, SĐT, biển số..."
          value={draft.q}
          onChange={(e) => setDraft((f) => ({ ...f, q: e.target.value }))}
          placeholder="Tên, SĐT, biển số..."
          className={`w-56 ${inputClass}`}
        />
        <select aria-label="Lọc theo trạng thái"
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
        <select aria-label="Lọc theo garage"
          value={draft.garageId}
          onChange={(e) => setDraft((f) => ({ ...f, garageId: e.target.value }))}
          className={inputClass}
        >
          <option value="">Tất cả garage</option>
          {garages.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
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
          Xóa lọc
        </button>
      </form>

      {isLoading && <p className="mt-6 text-body-sm text-on-surface-variant">Đang tải lịch sử đặt lịch...</p>}
      {!isLoading && loadError && <p className="mt-6 text-body-sm text-error">{loadError}</p>}

      {!isLoading && !loadError && data && (
        <>
          <div className="mt-6 overflow-x-auto rounded-xl border border-outline-variant bg-surface-container-lowest">
            <table className="w-full min-w-[960px] text-left text-sm">
              <thead className="border-b border-outline-variant bg-surface-container-low text-xs uppercase text-on-surface-variant">
                <tr>
                  <th className="px-4 py-3 font-medium">Ngày giờ</th>
                  <th className="px-4 py-3 font-medium">Khách hàng</th>
                  <th className="px-4 py-3 font-medium">Xe</th>
                  <th className="px-4 py-3 font-medium">Dịch vụ</th>
                  <th className="px-4 py-3 font-medium">Garage</th>
                  <th className="px-4 py-3 font-medium">Giá</th>
                  <th className="px-4 py-3 font-medium">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {data.items.map((a) => (
                  <tr key={a.id} className="hover:bg-surface-container-low">
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
                    <td className="px-4 py-3">{a.serviceName}</td>
                    <td className="px-4 py-3">{a.garageName || "—"}</td>
                    <td className="px-4 py-3">{formatCurrency(a.servicePrice)}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-surface-container-high px-2.5 py-0.5 text-xs font-semibold">
                        {STATUS_LABELS[a.status.toLowerCase()] ?? a.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {data.items.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-on-surface-variant">
                      Không có lịch hẹn phù hợp.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex items-center justify-between text-sm text-on-surface-variant">
            <span>
              {data.total} lịch hẹn · Trang {page + 1}/{totalPages}
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
  );
}

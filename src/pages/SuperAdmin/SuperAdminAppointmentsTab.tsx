import { useEffect, useState } from "react";
import {
  getAdminAppointments,
  getAdminGarages,
  type AdminAppointmentPage,
  type SuperAdminGarage,
} from "../../services/api";
import { FilterChip } from "./SuperAdminChips";

// Nhãn + màu chấm/nhãn cho từng trạng thái lịch hẹn (luôn kèm chữ, không chỉ dựa vào màu).
const STATUSES: { value: string; label: string; dot: string; badge: string }[] = [
  { value: "pending", label: "Chờ xử lý", dot: "bg-[#c47f00]", badge: "bg-[#fff1cc] text-[#6b4200]" },
  { value: "confirmed", label: "Đã xác nhận", dot: "bg-primary", badge: "bg-primary-fixed text-on-primary-fixed-variant" },
  { value: "in_progress", label: "Đang thực hiện", dot: "bg-[#6a4fd1]", badge: "bg-[#e6defa] text-[#3b2a7a]" },
  { value: "completed", label: "Hoàn thành", dot: "bg-tertiary-container", badge: "bg-[#d9f7dd] text-[#00531a]" },
  { value: "successful", label: "Bàn giao xong", dot: "bg-[#00796b]", badge: "bg-[#d4f1ee] text-[#004d45]" },
  { value: "cancelled", label: "Đã hủy", dot: "bg-outline", badge: "bg-[#e9eaeb] text-[#3a3f4b]" },
  { value: "no_show", label: "Không đến", dot: "bg-error", badge: "bg-error-container text-on-error-container" },
];

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

function toIsoDate(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

type QuickRange = "today" | "week" | "month";

function quickRange(kind: QuickRange): { fromDate: string; toDate: string } {
  const now = new Date();
  if (kind === "today") return { fromDate: toIsoDate(now), toDate: toIsoDate(now) };
  if (kind === "week") {
    const mondayOffset = (now.getDay() + 6) % 7;
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - mondayOffset);
    const end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 6);
    return { fromDate: toIsoDate(start), toDate: toIsoDate(end) };
  }
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return { fromDate: toIsoDate(start), toDate: toIsoDate(end) };
}

const QUICK_RANGES: { key: QuickRange; label: string }[] = [
  { key: "today", label: "Hôm nay" },
  { key: "week", label: "Tuần này" },
  { key: "month", label: "Tháng này" },
];

// Danh sách số trang rút gọn: 1 2 3 4 … 12
function pageList(current: number, total: number): (number | "gap")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i);
  const set = new Set<number>([0, total - 1, current - 1, current, current + 1]);
  if (current < 3) [1, 2, 3].forEach((n) => set.add(n));
  if (current > total - 4) [total - 2, total - 3, total - 4].forEach((n) => set.add(n));
  const sorted = [...set].filter((n) => n >= 0 && n < total).sort((a, b) => a - b);
  const out: (number | "gap")[] = [];
  sorted.forEach((n, i) => {
    if (i > 0 && n - sorted[i - 1] > 1) out.push("gap");
    out.push(n);
  });
  return out;
}

export default function SuperAdminAppointmentsTab({ customer, onClearCustomer }: Props) {
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [qDraft, setQDraft] = useState("");
  const [page, setPage] = useState(0);
  const [garages, setGarages] = useState<SuperAdminGarage[]>([]);
  const [result, setResult] = useState<{
    key: string;
    data: AdminAppointmentPage | null;
    error: string | null;
  } | null>(null);

  const customerId = customer?.id;
  const requestKey = JSON.stringify([filters, page, customerId]);
  const isLoading = result?.key !== requestKey;
  const data = result?.key === requestKey ? result.data : null;
  const loadError = result?.key === requestKey ? result.error : null;

  useEffect(() => {
    getAdminGarages(true)
      .then(setGarages)
      .catch(() => {});
  }, []);

  // Ô tìm kiếm áp dụng sau khi ngừng gõ một chút.
  useEffect(() => {
    const timer = window.setTimeout(() => {
      const next = qDraft.trim();
      setFilters((f) => (f.q === next ? f : { ...f, q: next }));
      setPage(0);
    }, 400);
    return () => window.clearTimeout(timer);
  }, [qDraft]);

  useEffect(() => {
    let cancelled = false;
    getAdminAppointments({
      customerId,
      garageId: filters.garageId ? Number(filters.garageId) : undefined,
      status: filters.status,
      fromDate: filters.fromDate,
      toDate: filters.toDate,
      q: filters.q,
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
  }, [filters, page, customerId, requestKey]);

  const update = (patch: Partial<Filters>) => {
    setPage(0);
    setFilters((f) => ({ ...f, ...patch }));
  };

  const resetFilters = () => {
    setQDraft("");
    setFilters(EMPTY_FILTERS);
    setPage(0);
    if (customer) onClearCustomer();
  };

  const hasFilter = Object.values(filters).some(Boolean) || qDraft !== "" || !!customer;
  const totalPages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1;
  const from = data && data.total > 0 ? page * PAGE_SIZE + 1 : 0;
  const to = data ? Math.min(data.total, page * PAGE_SIZE + data.items.length) : 0;
  const fieldClass =
    "flex h-11 items-center gap-2 rounded-xl border border-outline-variant bg-surface-container-lowest px-3.5 text-sm focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/30";
  const innerInput = "min-w-0 bg-transparent text-sm text-on-surface outline-none";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        {customer && (
          <span className="inline-flex h-10 items-center gap-2 rounded-full bg-primary-fixed pl-3.5 pr-1.5 text-[13px] font-bold text-on-primary-fixed-variant">
            <span aria-hidden="true" className="material-symbols-outlined text-lg">
              person
            </span>
            Khách hàng: {customer.name}
            <button
              type="button"
              onClick={onClearCustomer}
              aria-label={`Bỏ lọc khách hàng ${customer.name}`}
              className="flex h-7 w-7 items-center justify-center rounded-full bg-on-primary-fixed-variant/10 hover:bg-on-primary-fixed-variant/20"
            >
              <span aria-hidden="true" className="material-symbols-outlined text-base">
                close
              </span>
            </button>
          </span>
        )}
        <label className={`${fieldClass} w-full text-outline sm:w-72`}>
          <span aria-hidden="true" className="material-symbols-outlined text-xl">
            search
          </span>
          <input
            aria-label="Tìm theo tên, SĐT, biển số"
            value={qDraft}
            onChange={(e) => setQDraft(e.target.value)}
            placeholder="Tên, SĐT, biển số"
            className={`${innerInput} flex-1`}
          />
        </label>
        <label className={fieldClass}>
          <span aria-hidden="true" className="material-symbols-outlined text-xl text-outline">
            storefront
          </span>
          <select
            aria-label="Lọc theo garage"
            value={filters.garageId}
            onChange={(e) => update({ garageId: e.target.value })}
            className={innerInput}
          >
            <option value="">Tất cả garage</option>
            {garages.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
        </label>
        <label className={fieldClass}>
          <span className="text-xs font-semibold text-on-surface-variant">Từ</span>
          <input
            type="date"
            aria-label="Từ ngày"
            value={filters.fromDate}
            max={filters.toDate || undefined}
            onChange={(e) => update({ fromDate: e.target.value })}
            className={innerInput}
          />
        </label>
        <label className={fieldClass}>
          <span className="text-xs font-semibold text-on-surface-variant">Đến</span>
          <input
            type="date"
            aria-label="Đến ngày"
            value={filters.toDate}
            min={filters.fromDate || undefined}
            onChange={(e) => update({ toDate: e.target.value })}
            className={innerInput}
          />
        </label>
        <div role="group" aria-label="Chọn nhanh khoảng ngày" className="flex gap-2">
          {QUICK_RANGES.map((r) => {
            const range = quickRange(r.key);
            const active = filters.fromDate === range.fromDate && filters.toDate === range.toDate;
            return (
              <FilterChip key={r.key} active={active} onClick={() => update(active ? { fromDate: "", toDate: "" } : range)}>
                {r.label}
              </FilterChip>
            );
          })}
        </div>
        {hasFilter && (
          <button
            type="button"
            onClick={resetFilters}
            className="flex h-11 items-center gap-1 rounded-xl px-3.5 text-[13px] font-bold text-on-primary-fixed-variant hover:bg-primary-fixed/50"
          >
            <span aria-hidden="true" className="material-symbols-outlined text-lg">
              filter_alt_off
            </span>
            Xóa lọc
          </button>
        )}
      </div>

      <div role="group" aria-label="Lọc theo trạng thái" className="flex flex-wrap items-center gap-2">
        <FilterChip active={filters.status === ""} onClick={() => update({ status: "" })}>
          Tất cả
        </FilterChip>
        {STATUSES.map((s) => (
          <FilterChip
            key={s.value}
            active={filters.status === s.value}
            onClick={() => update({ status: filters.status === s.value ? "" : s.value })}
          >
            <i aria-hidden="true" className={`h-2 w-2 rounded-full ${s.dot}`} />
            {s.label}
          </FilterChip>
        ))}
        <span aria-live="polite" className="ml-auto text-xs text-on-surface-variant">
          {data ? `Hiển thị ${from}–${to} / ${data.total} lịch hẹn` : ""}
        </span>
      </div>

      {isLoading && <p className="text-body-sm text-on-surface-variant">Đang tải lịch sử đặt lịch...</p>}
      {!isLoading && loadError && <p className="text-body-sm text-error">{loadError}</p>}

      {!isLoading && !loadError && data && data.items.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-outline-variant/40 bg-surface-container-lowest p-10 text-center shadow-[0_10px_26px_-14px_rgba(25,28,29,0.28)]">
          <span
            aria-hidden="true"
            className="flex h-[72px] w-[72px] items-center justify-center rounded-3xl bg-surface-container text-outline"
          >
            <span className="material-symbols-outlined text-4xl">event_busy</span>
          </span>
          <h2 className="text-lg font-extrabold">Không có lịch hẹn phù hợp</h2>
          <p className="max-w-[24rem] text-sm leading-relaxed text-on-surface-variant">
            {customer ? `Khách hàng ${customer.name} chưa có lịch hẹn khớp bộ lọc. ` : ""}
            Thử bỏ bớt bộ lọc để xem nhiều kết quả hơn.
          </p>
          {hasFilter && (
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex h-11 items-center gap-1.5 rounded-xl bg-gradient-to-br from-primary to-primary-container px-5 text-sm font-bold text-on-primary"
            >
              <span aria-hidden="true" className="material-symbols-outlined text-xl">
                filter_alt_off
              </span>
              Xóa tất cả bộ lọc
            </button>
          )}
        </div>
      )}

      {!isLoading && !loadError && data && data.items.length > 0 && (
        <>
          <div className="overflow-x-auto rounded-2xl border border-outline-variant/40 bg-surface-container-lowest shadow-[0_10px_26px_-14px_rgba(25,28,29,0.28)]">
            <table className="w-full min-w-[960px] text-left text-[13px]">
              <thead className="bg-surface-container-low text-[11px] uppercase tracking-wider text-on-surface-variant">
                <tr>
                  <th className="px-4 py-3 font-bold">Ngày giờ</th>
                  <th className="px-4 py-3 font-bold">Khách hàng</th>
                  <th className="px-4 py-3 font-bold">Xe</th>
                  <th className="px-4 py-3 font-bold">Dịch vụ</th>
                  <th className="px-4 py-3 font-bold">Garage</th>
                  <th className="px-4 py-3 text-right font-bold">Giá</th>
                  <th className="px-4 py-3 font-bold">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/40">
                {data.items.map((a) => {
                  const st = STATUSES.find((s) => s.value === a.status.toLowerCase());
                  const initial = (a.customerName || "?").trim().charAt(0).toUpperCase();
                  return (
                    <tr key={a.id} className="hover:bg-surface-container-low/60">
                      <td className="px-4 py-3">
                        <div className="font-bold">
                          {a.scheduleDate ? new Date(a.scheduleDate).toLocaleDateString("vi-VN") : "—"}
                        </div>
                        <div className="text-xs text-on-surface-variant">{a.timeFrame || ""}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <span
                            aria-hidden="true"
                            className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full bg-primary-fixed text-[13px] font-extrabold text-on-primary-fixed-variant"
                          >
                            {initial}
                          </span>
                          <div>
                            <div className="font-bold">{a.customerName}</div>
                            <div className="text-xs text-on-surface-variant">{a.customerPhone || ""}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div>{a.vehicleModel || "—"}</div>
                        {a.vehicleLicensePlate && (
                          <span className="mt-0.5 inline-block rounded-md border border-outline-variant bg-surface-container-lowest px-1.5 font-mono text-[11px] font-bold">
                            {a.vehicleLicensePlate}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">{a.serviceName}</td>
                      <td className="px-4 py-3">{a.garageName || "—"}</td>
                      <td className="px-4 py-3 text-right font-bold">{formatCurrency(a.servicePrice)}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${
                            st?.badge ?? "bg-[#e9eaeb] text-[#3a3f4b]"
                          }`}
                        >
                          <i aria-hidden="true" className={`h-[7px] w-[7px] rounded-full ${st?.dot ?? "bg-outline"}`} />
                          {st?.label ?? a.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <nav aria-label="Phân trang" className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs text-on-surface-variant">
              Trang {page + 1}/{totalPages}
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={page === 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                aria-label="Trang trước"
                className="flex h-9 min-w-9 items-center justify-center rounded-[10px] border border-outline-variant bg-surface-container-lowest hover:bg-surface-container-low disabled:opacity-45"
              >
                <span aria-hidden="true" className="material-symbols-outlined text-xl">
                  chevron_left
                </span>
              </button>
              {pageList(page, totalPages).map((p, i) =>
                p === "gap" ? (
                  <span key={`gap-${i}`} aria-hidden="true" className="px-1 text-outline">
                    …
                  </span>
                ) : (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPage(p)}
                    aria-label={`Trang ${p + 1}`}
                    aria-current={p === page ? "page" : undefined}
                    className={`h-9 min-w-9 rounded-[10px] border px-2 text-[13px] font-bold ${
                      p === page
                        ? "border-primary bg-primary text-on-primary"
                        : "border-outline-variant bg-surface-container-lowest hover:bg-surface-container-low"
                    }`}
                  >
                    {p + 1}
                  </button>
                ),
              )}
              <button
                type="button"
                disabled={page + 1 >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                aria-label="Trang sau"
                className="flex h-9 min-w-9 items-center justify-center rounded-[10px] border border-outline-variant bg-surface-container-lowest hover:bg-surface-container-low disabled:opacity-45"
              >
                <span aria-hidden="true" className="material-symbols-outlined text-xl">
                  chevron_right
                </span>
              </button>
            </div>
          </nav>
        </>
      )}
    </div>
  );
}

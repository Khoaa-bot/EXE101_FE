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
  pending: "bg-[#fff1cc] text-[#6b4200]",
  confirmed: "bg-primary-fixed text-on-primary-fixed-variant",
  in_progress: "bg-[#e6defa] text-[#3b2a7a]",
  completed: "bg-[#d9f7dd] text-[#00531a]",
  successful: "bg-[#d9f7dd] text-[#00531a]",
  cancelled: "bg-error-container text-on-error-container",
  no_show: "bg-surface-container-highest text-on-surface-variant",
};

const PAGE_SIZE = 20;

type Filters = { q: string; status: string; fromDate: string; toDate: string };
const EMPTY_FILTERS: Filters = { q: "", status: "", fromDate: "", toDate: "" };

export type AdminAppointmentsPageProps = AdminNavProps;

function formatCurrency(value: number | null) {
  return value === null || value === undefined ? "—" : `${value.toLocaleString("vi-VN")}đ`;
}

// Hiện tối đa 5 số trang quanh trang hiện tại.
function pageWindow(current: number, total: number): number[] {
  const size = Math.min(5, total);
  const start = Math.min(Math.max(0, current - 2), total - size);
  return Array.from({ length: size }, (_, index) => start + index);
}

const chipClass = (active: boolean) =>
  `inline-flex min-h-9 items-center gap-1.5 rounded-full border px-3.5 text-[13px] font-semibold whitespace-nowrap ${
    active
      ? "border-primary bg-primary-fixed text-on-primary-fixed-variant"
      : "border-outline-variant bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container-low"
  }`;

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

  // Bấm chip trạng thái thì lọc ngay, giữ nguyên các ô tìm kiếm và ngày đang nhập.
  const pickStatus = (status: string) => {
    const next = { ...draft, status };
    setDraft(next);
    setApplied(next);
    setPage(0);
  };

  const resetFilters = () => {
    setDraft(EMPTY_FILTERS);
    setApplied(EMPTY_FILTERS);
    setPage(0);
  };

  const totalPages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1;
  const firstShown = data && data.total > 0 ? page * PAGE_SIZE + 1 : 0;
  const lastShown = data ? Math.min(data.total, page * PAGE_SIZE + data.items.length) : 0;
  const fieldClass =
    "h-12 rounded-2xl border border-outline-variant bg-surface-container-lowest px-3.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20";
  const cardClass =
    "rounded-3xl border border-outline-variant/40 bg-surface-container-lowest shadow-[0_10px_26px_-14px_rgba(25,28,29,0.28)]";

  return (
    <AdminShell
      activeTab="appointments"
      title="Lịch sử lịch hẹn"
      description="Toàn bộ lịch hẹn của garage bạn, kể cả đã huỷ và đã bàn giao (chỉ xem)."
      maxWidthClass="max-w-6xl"
      {...props}
    >
      <div className="space-y-4">
        <form onSubmit={applyFilters} className={`${cardClass} space-y-3.5 p-5`}>
          <div className="flex flex-wrap items-end gap-3">
            <label className="flex h-12 min-w-[16rem] flex-1 items-center gap-2 rounded-2xl border border-outline-variant bg-surface-container-lowest px-3.5 text-outline focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
              <span aria-hidden="true" className="material-symbols-outlined text-xl">
                search
              </span>
              <input
                aria-label="Tìm theo tên, SĐT, biển số"
                value={draft.q}
                onChange={(e) => setDraft((f) => ({ ...f, q: e.target.value }))}
                placeholder="Tìm theo tên, SĐT, biển số..."
                className="min-w-0 flex-1 bg-transparent text-sm text-on-surface outline-none"
              />
            </label>
            <label className="text-xs font-bold text-on-surface-variant">
              Từ ngày
              <input
                type="date"
                value={draft.fromDate}
                onChange={(e) => setDraft((f) => ({ ...f, fromDate: e.target.value }))}
                className={`mt-1 block ${fieldClass}`}
              />
            </label>
            <label className="text-xs font-bold text-on-surface-variant">
              Đến ngày
              <input
                type="date"
                value={draft.toDate}
                onChange={(e) => setDraft((f) => ({ ...f, toDate: e.target.value }))}
                className={`mt-1 block ${fieldClass}`}
              />
            </label>
            <button
              type="submit"
              className="min-h-12 rounded-2xl bg-gradient-to-br from-primary to-primary-container px-5 text-sm font-bold text-on-primary shadow-[0_12px_22px_-14px_rgba(0,89,187,0.9)]"
            >
              Lọc
            </button>
            <button
              type="button"
              onClick={resetFilters}
              className="min-h-12 rounded-2xl border-[1.5px] border-outline-variant bg-surface-container-lowest px-5 text-sm font-bold hover:bg-surface-container-low"
            >
              Xoá lọc
            </button>
          </div>

          <div role="group" aria-label="Lọc theo trạng thái" className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              aria-pressed={applied.status === ""}
              onClick={() => pickStatus("")}
              className={chipClass(applied.status === "")}
            >
              Tất cả
            </button>
            {Object.entries(STATUS_LABELS).map(([value, label]) => (
              <button
                key={value}
                type="button"
                aria-pressed={applied.status === value}
                onClick={() => pickStatus(value)}
                className={chipClass(applied.status === value)}
              >
                {label}
              </button>
            ))}
            {data && (
              <span aria-live="polite" className="ml-auto text-[13px] text-on-surface-variant">
                {data.total === 0 ? "0 lịch hẹn" : `Hiển thị ${firstShown}–${lastShown} trên ${data.total} lịch hẹn`}
              </span>
            )}
          </div>
        </form>

        {isLoading && (
          <div className={`${cardClass} space-y-3 p-5`} role="status" aria-label="Đang tải lịch sử lịch hẹn">
            {[0, 1, 2, 3, 4].map((row) => (
              <div key={row} className="h-12 animate-pulse rounded-2xl bg-surface-container-low" />
            ))}
          </div>
        )}
        {!isLoading && loadError && (
          <p role="alert" className="rounded-2xl bg-error-container px-4 py-3 text-sm text-on-error-container">
            {loadError}
          </p>
        )}

        {!isLoading && !loadError && data && (
          <>
            <div className={`${cardClass} overflow-hidden`}>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[860px] text-left text-[13px]">
                  <thead className="bg-surface-container-low text-[11px] uppercase tracking-wider text-on-surface-variant">
                    <tr>
                      <th className="px-[18px] py-3 font-bold">Mã</th>
                      <th className="px-[18px] py-3 font-bold">Ngày giờ</th>
                      <th className="px-[18px] py-3 font-bold">Khách hàng</th>
                      <th className="px-[18px] py-3 font-bold">Xe</th>
                      <th className="px-[18px] py-3 font-bold">Dịch vụ</th>
                      <th className="px-[18px] py-3 font-bold">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.items.map((a) => {
                      const key = a.status.toLowerCase();
                      return (
                        <tr key={a.id} className="border-t border-outline-variant/40 hover:bg-surface-container-low/60">
                          <td className="px-[18px] py-3.5 font-bold">#{a.id}</td>
                          <td className="px-[18px] py-3.5">
                            <div>{a.scheduleDate ? new Date(a.scheduleDate).toLocaleDateString("vi-VN") : "—"}</div>
                            <div className="text-xs text-on-surface-variant">{a.timeFrame || ""}</div>
                          </td>
                          <td className="px-[18px] py-3.5">
                            <div className="flex items-center gap-2.5">
                              <span
                                aria-hidden="true"
                                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-fixed text-[13px] font-extrabold text-on-primary-fixed-variant"
                              >
                                {(a.customerName || "?").trim().charAt(0).toUpperCase()}
                              </span>
                              <div>
                                <div className="font-bold">{a.customerName}</div>
                                <div className="text-xs text-on-surface-variant">{a.customerPhone || ""}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-[18px] py-3.5">
                            {a.vehicleLicensePlate ? (
                              <span className="inline-block rounded-md border border-outline-variant bg-surface-container-lowest px-1.5 font-mono text-[11px] font-bold">
                                {a.vehicleLicensePlate}
                              </span>
                            ) : null}
                            <div className="mt-0.5 text-xs text-on-surface-variant">{a.vehicleModel || "—"}</div>
                          </td>
                          <td className="px-[18px] py-3.5">
                            <div>{a.serviceName}</div>
                            <div className="text-xs text-on-surface-variant">{formatCurrency(a.servicePrice)}</div>
                          </td>
                          <td className="px-[18px] py-3.5">
                            <span
                              className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-bold ${
                                STATUS_TONES[key] ?? "bg-surface-container-high text-on-surface-variant"
                              }`}
                            >
                              <i aria-hidden="true" className="h-[7px] w-[7px] rounded-full bg-current" />
                              {STATUS_LABELS[key] ?? a.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                    {data.items.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-4 py-12 text-center">
                          <span
                            aria-hidden="true"
                            className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-container text-outline"
                          >
                            <span className="material-symbols-outlined text-3xl">search_off</span>
                          </span>
                          <p className="mt-3 text-sm font-bold">Không có lịch hẹn phù hợp.</p>
                          <button
                            type="button"
                            onClick={resetFilters}
                            className="mt-3 min-h-10 rounded-xl border-[1.5px] border-outline-variant px-4 text-sm font-bold hover:bg-surface-container-low"
                          >
                            Xoá lọc
                          </button>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <nav aria-label="Phân trang" className="flex items-center justify-between">
              <span className="text-[13px] text-on-surface-variant">
                Trang {page + 1}/{totalPages}
              </span>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  aria-label="Trang trước"
                  disabled={page === 0}
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  className={`${chipClass(false)} w-9 justify-center px-0 disabled:opacity-45`}
                >
                  <span aria-hidden="true" className="material-symbols-outlined text-xl">
                    chevron_left
                  </span>
                </button>
                {pageWindow(page, totalPages).map((index) => (
                  <button
                    key={index}
                    type="button"
                    aria-current={index === page ? "page" : undefined}
                    onClick={() => setPage(index)}
                    className={`${chipClass(index === page)} w-9 justify-center px-0`}
                  >
                    {index + 1}
                  </button>
                ))}
                <button
                  type="button"
                  aria-label="Trang sau"
                  disabled={page + 1 >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className={`${chipClass(false)} w-9 justify-center px-0 disabled:opacity-45`}
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
    </AdminShell>
  );
}

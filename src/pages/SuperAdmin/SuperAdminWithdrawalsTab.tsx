import { useCallback, useEffect, useMemo, useState } from "react";
import {
  completeWithdrawal,
  getAdminWithdrawals,
  rejectWithdrawal,
  type WithdrawalAdminFilter,
  type WithdrawalAdminItem,
} from "../../services/api";
import { formatVnd } from "../../utils/format";
import { FilterChip } from "./SuperAdminChips";
import { ConfirmTransferDialog, RejectRequestDialog } from "./WithdrawalDialogs";

type Props = {
  notify: (message: string, type?: "success" | "error") => void;
  onChanged?: () => void;
  pendingCount?: number;
};

type StatusFilter = NonNullable<WithdrawalAdminFilter["status"]>;

const STATUS_META = {
  PENDING: { label: "Chờ chuyển", cls: "bg-[#fff1cc] text-[#6b4200]" },
  COMPLETED: { label: "Đã chuyển", cls: "bg-[#d9f7dd] text-[#00531a]" },
  REJECTED: { label: "Đã từ chối", cls: "bg-[#ffdad6] text-[#93000a]" },
} as const;

const STATUS_FILTERS: Array<{ key: StatusFilter; label: string }> = [
  { key: "PENDING", label: "Chờ chuyển" },
  { key: "COMPLETED", label: "Đã chuyển" },
  { key: "REJECTED", label: "Đã từ chối" },
  { key: "ALL", label: "Tất cả" },
];

const REQUESTER_FILTERS: Array<{ key: "all" | "customer" | "garage"; label: string }> = [
  { key: "all", label: "Khách hàng và garage" },
  { key: "customer", label: "Chỉ khách hàng" },
  { key: "garage", label: "Chỉ garage" },
];

function formatDateTime(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function isGarageRequester(item: WithdrawalAdminItem) {
  return item.requesterRole === "garage_owner" || item.requesterRole === "garage";
}

function requesterLabel(item: WithdrawalAdminItem) {
  return isGarageRequester(item) ? "Garage" : "Khách hàng";
}

// Thời gian đã chờ, tính từ lúc tạo yêu cầu.
function waitingMinutes(createdAt: string, now: number) {
  const created = new Date(createdAt).getTime();
  if (Number.isNaN(created)) return 0;
  return Math.max(0, Math.floor((now - created) / 60000));
}

function formatWaiting(minutes: number) {
  if (minutes < 60) return `${Math.max(minutes, 1)} phút`;
  if (minutes < 60 * 24) return `${Math.floor(minutes / 60)} giờ`;
  return `${Math.floor(minutes / (60 * 24))} ngày`;
}

function waitingTone(minutes: number) {
  if (minutes >= 60 * 24) return "bg-[#ffe4d6] text-[#7a2e00]";
  if (minutes >= 180) return "bg-[#fff1cc] text-[#6b4200]";
  return "bg-[#e9eaeb] text-[#3a3f4b]";
}

export default function SuperAdminWithdrawalsTab({ notify, onChanged, pendingCount }: Props) {
  const [status, setStatus] = useState<StatusFilter>("PENDING");
  const [requesterType, setRequesterType] = useState<"all" | "customer" | "garage">("all");
  const [items, setItems] = useState<WithdrawalAdminItem[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  const [selected, setSelected] = useState<WithdrawalAdminItem | null>(null);
  const [txCode, setTxCode] = useState("");
  const [dialog, setDialog] = useState<null | "transfer" | "reject">(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  const requestKey = `${status}|${requesterType}|${reloadToken}`;
  const isLoading = loadedKey !== requestKey;

  useEffect(() => {
    let cancelled = false;
    getAdminWithdrawals({
      status,
      requesterType: requesterType === "all" ? undefined : requesterType,
    })
      .then((data) => {
        if (cancelled) return;
        setItems(data);
        setNow(Date.now());
        setLoadError(null);
        setLoadedKey(requestKey);
      })
      .catch((err) => {
        if (cancelled) return;
        setItems([]);
        setLoadError(err instanceof Error ? err.message : "Không tải được danh sách yêu cầu.");
        setLoadedKey(requestKey);
      });
    return () => {
      cancelled = true;
    };
  }, [status, requesterType, requestKey]);

  // Yêu cầu chờ chuyển xếp theo thời gian chờ lâu nhất trước.
  const visibleItems = useMemo(() => {
    if (status !== "PENDING") return items;
    return [...items].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }, [items, status]);

  const pendingTotal = useMemo(
    () => (status === "PENDING" ? visibleItems.reduce((sum, item) => sum + item.amount, 0) : 0),
    [visibleItems, status],
  );
  const longestWaiting =
    status === "PENDING" && visibleItems.length > 0 ? waitingMinutes(visibleItems[0].createdAt, now) : 0;

  const open = (item: WithdrawalAdminItem) => {
    setSelected(item);
    setTxCode("");
    setCopied(false);
  };

  const changeStatus = (next: StatusFilter) => {
    setStatus(next);
    setSelected(null);
  };

  const changeRequester = (next: "all" | "customer" | "garage") => {
    setRequesterType(next);
    setSelected(null);
  };

  const finish = useCallback(
    (message: string) => {
      notify(message);
      setSelected(null);
      setDialog(null);
      setReloadToken((n) => n + 1);
      onChanged?.();
    },
    [notify, onChanged],
  );

  const runTransfer = async () => {
    if (!selected) return;
    setBusy(true);
    try {
      await completeWithdrawal(selected.id, txCode);
      finish("Đã xác nhận chuyển tiền và lưu hoàn tất.");
    } catch (err) {
      notify(err instanceof Error ? err.message : "Không xác nhận được.", "error");
    } finally {
      setBusy(false);
    }
  };

  const runReject = async (reason: string) => {
    if (!selected || reason.trim().length === 0) return;
    setBusy(true);
    try {
      await rejectWithdrawal(selected.id, reason);
      finish("Đã từ chối yêu cầu và hoàn tiền về ví.");
    } catch (err) {
      notify(err instanceof Error ? err.message : "Không từ chối được.", "error");
    } finally {
      setBusy(false);
    }
  };

  const copyAccountNumber = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      notify("Không sao chép được, hãy chọn và sao chép thủ công.", "error");
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <div role="group" aria-label="Lọc theo trạng thái" className="flex flex-wrap gap-2">
          {STATUS_FILTERS.map((option) => (
            <FilterChip key={option.key} active={status === option.key} onClick={() => changeStatus(option.key)}>
              {option.label}
              {option.key === "PENDING" && pendingCount !== undefined && pendingCount > 0 && (
                <span className="inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-error px-1.5 text-[11px] font-bold text-on-error">
                  {pendingCount}
                </span>
              )}
            </FilterChip>
          ))}
        </div>
        <span aria-hidden="true" className="hidden h-6 w-px bg-outline-variant sm:block" />
        <div role="group" aria-label="Lọc theo người yêu cầu" className="flex flex-wrap gap-2">
          {REQUESTER_FILTERS.map((option) => (
            <FilterChip
              key={option.key}
              active={requesterType === option.key}
              onClick={() => changeRequester(option.key)}
            >
              {option.label}
            </FilterChip>
          ))}
        </div>
        {status === "PENDING" && (
          <span className="ml-auto text-xs text-on-surface-variant">Xếp theo thời gian chờ lâu nhất trước</span>
        )}
      </div>

      <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-start">
        <div className="min-w-0 flex-1 space-y-3">
          {!isLoading && !loadError && status === "PENDING" && visibleItems.length > 0 && (
            <div className="flex items-center gap-3.5 rounded-2xl border border-[#ffd9c2] bg-gradient-to-br from-surface-container-lowest to-[#fff6f0] px-[18px] py-3.5">
              <span
                aria-hidden="true"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-[#ffe4d6] text-[#7a2e00]"
              >
                <span className="material-symbols-outlined">payments</span>
              </span>
              <div className="min-w-0">
                <p className="text-[15px] font-bold">
                  {visibleItems.length} yêu cầu đang chờ · tổng {formatVnd(pendingTotal)}
                </p>
                <p className="text-xs text-on-surface-variant">
                  Yêu cầu lâu nhất đã chờ {formatWaiting(longestWaiting)}
                </p>
              </div>
            </div>
          )}

          {isLoading ? (
            <p className="rounded-2xl border border-outline-variant/50 bg-surface-container-lowest p-6 text-center text-on-surface-variant">
              Đang tải...
            </p>
          ) : loadError ? (
            <p className="rounded-2xl border border-outline-variant/50 bg-surface-container-lowest p-6 text-center text-error">
              {loadError}
            </p>
          ) : visibleItems.length === 0 ? (
            <p className="rounded-2xl border border-outline-variant/50 bg-surface-container-lowest p-6 text-center text-on-surface-variant">
              Không có yêu cầu nào.
            </p>
          ) : (
            <ul className="space-y-3">
              {visibleItems.map((item) => {
                const meta = STATUS_META[item.status] ?? STATUS_META.PENDING;
                const garage = isGarageRequester(item);
                const isSelected = selected?.id === item.id;
                const minutes = waitingMinutes(item.createdAt, now);
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => open(item)}
                      aria-pressed={isSelected}
                      className={`flex w-full flex-wrap items-center gap-3.5 rounded-2xl border-[1.5px] px-4 py-3.5 text-left shadow-[0_8px_20px_-14px_rgba(25,28,29,0.3)] ${
                        isSelected
                          ? "border-primary bg-primary-fixed/30"
                          : "border-outline-variant/50 bg-surface-container-lowest hover:bg-surface-container-low"
                      }`}
                    >
                      <span
                        aria-hidden="true"
                        className={`flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-[14px] ${
                          garage
                            ? "bg-[#d9f7dd] text-[#00531a]"
                            : "bg-primary-fixed text-on-primary-fixed-variant"
                        }`}
                      >
                        <span className="material-symbols-outlined">{garage ? "storefront" : "person"}</span>
                      </span>
                      <span className="min-w-0 flex-1">
                        <b className="block truncate text-sm">{item.requesterName ?? `#${item.userId}`}</b>
                        <span className="block truncate text-xs text-on-surface-variant">
                          {requesterLabel(item)}
                          {item.garageName ? ` · ${item.garageName}` : ""} · {item.bankName} · {item.accountHolder}
                        </span>
                      </span>
                      {item.status === "PENDING" ? (
                        <span
                          className={`whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${waitingTone(minutes)}`}
                        >
                          Chờ {formatWaiting(minutes)}
                        </span>
                      ) : (
                        <span className={`whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${meta.cls}`}>
                          {meta.label}
                        </span>
                      )}
                      <span className="min-w-32 text-right text-lg font-extrabold tracking-tight">
                        {formatVnd(item.amount)}
                      </span>
                      <span
                        aria-hidden="true"
                        className={`rounded-xl px-3.5 py-2 text-[13px] font-bold ${
                          item.status === "PENDING" && !isSelected
                            ? "border-[1.5px] border-primary bg-surface-container-lowest text-on-primary-fixed-variant"
                            : item.status === "PENDING"
                              ? "bg-primary text-on-primary"
                              : "border-[1.5px] border-outline-variant text-on-surface-variant"
                        }`}
                      >
                        {item.status === "PENDING" ? "Xử lý" : "Xem"}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {selected && (
          <aside
            aria-label="Chi tiết yêu cầu chuyển tiền"
            className="flex w-full shrink-0 flex-col gap-3.5 rounded-2xl border border-outline-variant/50 bg-surface-container-lowest p-5 shadow-[0_10px_26px_-14px_rgba(25,28,29,0.28)] lg:w-[22.5rem]"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-extrabold">Yêu cầu #{selected.id}</h2>
                <p className="text-xs text-on-surface-variant">{formatDateTime(selected.createdAt)}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                aria-label="Đóng chi tiết"
                className="flex h-9 w-9 items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container-low"
              >
                <span aria-hidden="true" className="material-symbols-outlined">
                  close
                </span>
              </button>
            </div>

            <div className="rounded-2xl bg-primary-fixed/40 px-4 py-3.5">
              <p className="text-xs text-on-surface-variant">Số tiền cần chuyển</p>
              <p className="text-[28px] font-extrabold tracking-tight text-on-primary-fixed-variant">
                {formatVnd(selected.amount)}
              </p>
            </div>

            <dl className="grid grid-cols-[6.5rem_1fr] gap-x-2.5 gap-y-2 text-[13px]">
              <dt className="text-on-surface-variant">Người yêu cầu</dt>
              <dd className="font-semibold">
                {selected.requesterName ?? `#${selected.userId}`} ({requesterLabel(selected)})
              </dd>
              {selected.garageName && (
                <>
                  <dt className="text-on-surface-variant">Garage</dt>
                  <dd className="font-semibold">{selected.garageName}</dd>
                </>
              )}
              {selected.requesterPhone && (
                <>
                  <dt className="text-on-surface-variant">Điện thoại</dt>
                  <dd className="font-semibold">{selected.requesterPhone}</dd>
                </>
              )}
              {selected.requesterEmail && (
                <>
                  <dt className="text-on-surface-variant">Email</dt>
                  <dd className="break-all font-semibold">{selected.requesterEmail}</dd>
                </>
              )}
              <dt className="text-on-surface-variant">Ngân hàng</dt>
              <dd className="font-semibold">{selected.bankName}</dd>
              <dt className="text-on-surface-variant">Số tài khoản</dt>
              <dd className="flex flex-wrap items-center gap-2 font-semibold">
                <span className="select-all font-mono tracking-wide">{selected.accountNumber}</span>
                <button
                  type="button"
                  onClick={() => void copyAccountNumber(selected.accountNumber)}
                  className="inline-flex min-h-8 items-center gap-1 rounded-lg border border-outline-variant bg-surface-container-lowest px-2.5 text-[11px] font-bold text-on-primary-fixed-variant hover:bg-surface-container-low"
                >
                  <span aria-hidden="true" className="material-symbols-outlined text-[15px]">
                    {copied ? "check" : "content_copy"}
                  </span>
                  <span aria-live="polite">{copied ? "Đã sao chép" : "Sao chép"}</span>
                </button>
              </dd>
              <dt className="text-on-surface-variant">Chủ tài khoản</dt>
              <dd className="font-semibold">{selected.accountHolder}</dd>
              {selected.status !== "PENDING" && (
                <>
                  <dt className="text-on-surface-variant">Trạng thái</dt>
                  <dd>
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${(STATUS_META[selected.status] ?? STATUS_META.PENDING).cls}`}
                    >
                      {(STATUS_META[selected.status] ?? STATUS_META.PENDING).label}
                    </span>
                  </dd>
                </>
              )}
              {selected.note && (
                <>
                  <dt className="text-on-surface-variant">Ghi chú</dt>
                  <dd className="font-semibold">{selected.note}</dd>
                </>
              )}
              {selected.processedAt && (
                <>
                  <dt className="text-on-surface-variant">Xử lý lúc</dt>
                  <dd className="font-semibold">{formatDateTime(selected.processedAt)}</dd>
                </>
              )}
            </dl>

            {selected.qrImageUrl && (
              <a
                href={selected.qrImageUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-3 rounded-2xl border-[1.5px] border-dashed border-outline-variant px-3 py-2.5 hover:bg-surface-container-low"
              >
                <img
                  src={selected.qrImageUrl}
                  alt="Mã QR ngân hàng"
                  className="h-14 w-14 shrink-0 rounded-[10px] border border-outline-variant object-cover"
                />
                <span className="text-xs text-on-surface-variant">
                  <b className="block text-[13px] text-on-surface">Mã QR người dùng gửi</b>
                  Bấm để mở ảnh lớn
                </span>
              </a>
            )}

            {selected.status === "PENDING" && (
              <div className="space-y-3 border-t border-outline-variant/60 pt-3.5">
                <label className="block text-xs font-semibold text-on-surface-variant">
                  Mã giao dịch ngân hàng (không bắt buộc)
                  <input
                    value={txCode}
                    onChange={(e) => setTxCode(e.target.value)}
                    maxLength={200}
                    placeholder="Ví dụ: FT26274123456"
                    className="mt-1 min-h-11 w-full rounded-xl border border-outline-variant bg-surface-container-low px-3.5 text-sm font-normal text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                </label>
                <div className="flex gap-2.5">
                  <button
                    type="button"
                    onClick={() => setDialog("transfer")}
                    disabled={busy}
                    className="min-h-11 flex-1 rounded-xl bg-primary px-3 text-sm font-bold text-on-primary disabled:opacity-50"
                  >
                    Xác nhận đã chuyển
                  </button>
                  <button
                    type="button"
                    onClick={() => setDialog("reject")}
                    disabled={busy}
                    className="min-h-11 rounded-xl border-[1.5px] border-error bg-surface-container-lowest px-4 text-sm font-bold text-error hover:bg-error-container/20 disabled:opacity-50"
                  >
                    Từ chối
                  </button>
                </div>
              </div>
            )}
          </aside>
        )}
      </div>

      {selected && dialog === "transfer" && (
        <ConfirmTransferDialog
          amountText={formatVnd(selected.amount)}
          accountHolder={selected.accountHolder}
          bankName={selected.bankName}
          accountNumber={selected.accountNumber}
          txCode={txCode}
          busy={busy}
          onCancel={() => setDialog(null)}
          onConfirm={() => void runTransfer()}
        />
      )}
      {selected && dialog === "reject" && (
        <RejectRequestDialog
          id={selected.id}
          requesterText={`${selected.requesterName ?? `#${selected.userId}`} · ${formatVnd(selected.amount)}`}
          busy={busy}
          onCancel={() => setDialog(null)}
          onConfirm={(reason) => void runReject(reason)}
        />
      )}
    </div>
  );
}

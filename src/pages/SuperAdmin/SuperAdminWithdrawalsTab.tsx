import { useCallback, useEffect, useState } from "react";
import {
  completeWithdrawal,
  getAdminWithdrawals,
  rejectWithdrawal,
  type WithdrawalAdminFilter,
  type WithdrawalAdminItem,
} from "../../services/api";
import { formatVnd } from "../../utils/format";

type Props = {
  notify: (message: string, type?: "success" | "error") => void;
  onChanged?: () => void;
};

const STATUS_META = {
  PENDING: { label: "Chờ chuyển", cls: "bg-tertiary-container/20 text-tertiary" },
  COMPLETED: { label: "Đã chuyển", cls: "bg-primary-container/15 text-primary" },
  REJECTED: { label: "Đã từ chối", cls: "bg-error-container/20 text-error" },
} as const;

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

function requesterLabel(item: WithdrawalAdminItem) {
  return item.requesterRole === "garage_owner" || item.requesterRole === "garage" ? "Garage" : "Khách hàng";
}

export default function SuperAdminWithdrawalsTab({ notify, onChanged }: Props) {
  const [status, setStatus] = useState<NonNullable<WithdrawalAdminFilter["status"]>>("PENDING");
  const [requesterType, setRequesterType] = useState<"all" | "customer" | "garage">("all");
  const [items, setItems] = useState<WithdrawalAdminItem[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const [selected, setSelected] = useState<WithdrawalAdminItem | null>(null);
  const [txCode, setTxCode] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [rejecting, setRejecting] = useState(false);
  const [busy, setBusy] = useState(false);

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

  const open = (item: WithdrawalAdminItem) => {
    setSelected(item);
    setTxCode("");
    setRejectReason("");
    setRejecting(false);
  };

  const finish = useCallback(
    (message: string) => {
      notify(message);
      setSelected(null);
      setReloadToken((n) => n + 1);
      onChanged?.();
    },
    [notify, onChanged],
  );

  const confirmTransfer = async () => {
    if (!selected) return;
    const ok = window.confirm(
      `Xác nhận đã chuyển ${formatVnd(selected.amount)} tới ${selected.accountHolder} (${selected.bankName} · ${selected.accountNumber})?`,
    );
    if (!ok) return;
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

  const confirmReject = async () => {
    if (!selected || rejectReason.trim().length === 0) return;
    setBusy(true);
    try {
      await rejectWithdrawal(selected.id, rejectReason);
      finish("Đã từ chối yêu cầu và hoàn tiền về ví.");
    } catch (err) {
      notify(err instanceof Error ? err.message : "Không từ chối được.", "error");
    } finally {
      setBusy(false);
    }
  };

  const selectClass =
    "rounded-lg border border-outline-variant bg-surface-container-low px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary";

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as typeof status)}
          className={selectClass}
          aria-label="Lọc theo trạng thái"
        >
          <option value="PENDING">Chờ chuyển</option>
          <option value="COMPLETED">Đã chuyển</option>
          <option value="REJECTED">Đã từ chối</option>
          <option value="ALL">Tất cả</option>
        </select>
        <select
          value={requesterType}
          onChange={(e) => setRequesterType(e.target.value as typeof requesterType)}
          className={selectClass}
          aria-label="Lọc theo người yêu cầu"
        >
          <option value="all">Khách hàng và garage</option>
          <option value="customer">Chỉ khách hàng</option>
          <option value="garage">Chỉ garage</option>
        </select>
      </div>

      <div className="mt-4 overflow-x-auto rounded-xl border border-outline-variant bg-surface-container-lowest">
        {isLoading ? (
          <p className="p-6 text-center text-on-surface-variant">Đang tải...</p>
        ) : loadError ? (
          <p className="p-6 text-center text-error">{loadError}</p>
        ) : items.length === 0 ? (
          <p className="p-6 text-center text-on-surface-variant">Không có yêu cầu nào.</p>
        ) : (
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-outline-variant text-on-surface-variant">
              <tr>
                <th className="px-4 py-3 font-semibold">Người yêu cầu</th>
                <th className="px-4 py-3 font-semibold">Số tiền</th>
                <th className="px-4 py-3 font-semibold">Ngân hàng</th>
                <th className="px-4 py-3 font-semibold">Ngày tạo</th>
                <th className="px-4 py-3 font-semibold">Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const meta = STATUS_META[item.status] ?? STATUS_META.PENDING;
                return (
                  <tr
                    key={item.id}
                    onClick={() => open(item)}
                    className="cursor-pointer border-b border-outline-variant last:border-0 hover:bg-surface-container-low"
                  >
                    <td className="px-4 py-3">
                      <p className="font-semibold">{item.requesterName ?? `#${item.userId}`}</p>
                      <p className="text-xs text-on-surface-variant">
                        {requesterLabel(item)}
                        {item.garageName ? ` · ${item.garageName}` : ""}
                      </p>
                    </td>
                    <td className="px-4 py-3 font-semibold">{formatVnd(item.amount)}</td>
                    <td className="px-4 py-3">
                      <p>{item.bankName}</p>
                      <p className="text-xs text-on-surface-variant">{item.accountHolder}</p>
                    </td>
                    <td className="px-4 py-3 text-on-surface-variant">{formatDateTime(item.createdAt)}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${meta.cls}`}>
                        {meta.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {selected && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Chi tiết yêu cầu chuyển tiền"
          onClick={() => !busy && setSelected(null)}
        >
          <div
            className="max-h-[90dvh] w-full max-w-[32rem] overflow-y-auto rounded-2xl bg-surface-container-lowest p-lg shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-headline-md text-headline-md">Yêu cầu #{selected.id}</h2>
                <p className="text-sm text-on-surface-variant">{formatDateTime(selected.createdAt)}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                disabled={busy}
                className="material-symbols-outlined text-on-surface-variant"
                aria-label="Đóng"
              >
                close
              </button>
            </div>

            <dl className="mt-4 grid grid-cols-[8rem_1fr] gap-x-3 gap-y-2 text-sm">
              <dt className="text-on-surface-variant">Người yêu cầu</dt>
              <dd className="font-semibold">
                {selected.requesterName ?? `#${selected.userId}`} ({requesterLabel(selected)})
              </dd>
              {selected.garageName && (
                <>
                  <dt className="text-on-surface-variant">Garage</dt>
                  <dd>{selected.garageName}</dd>
                </>
              )}
              {selected.requesterPhone && (
                <>
                  <dt className="text-on-surface-variant">Điện thoại</dt>
                  <dd>{selected.requesterPhone}</dd>
                </>
              )}
              {selected.requesterEmail && (
                <>
                  <dt className="text-on-surface-variant">Email</dt>
                  <dd>{selected.requesterEmail}</dd>
                </>
              )}
              <dt className="text-on-surface-variant">Số tiền</dt>
              <dd className="text-lg font-bold text-primary">{formatVnd(selected.amount)}</dd>
              <dt className="text-on-surface-variant">Ngân hàng</dt>
              <dd>{selected.bankName}</dd>
              <dt className="text-on-surface-variant">Số tài khoản</dt>
              <dd className="select-all font-mono font-semibold">{selected.accountNumber}</dd>
              <dt className="text-on-surface-variant">Chủ tài khoản</dt>
              <dd className="font-semibold">{selected.accountHolder}</dd>
              <dt className="text-on-surface-variant">Trạng thái</dt>
              <dd>{(STATUS_META[selected.status] ?? STATUS_META.PENDING).label}</dd>
              {selected.note && (
                <>
                  <dt className="text-on-surface-variant">Ghi chú</dt>
                  <dd>{selected.note}</dd>
                </>
              )}
              {selected.processedAt && (
                <>
                  <dt className="text-on-surface-variant">Xử lý lúc</dt>
                  <dd>{formatDateTime(selected.processedAt)}</dd>
                </>
              )}
            </dl>

            {selected.qrImageUrl && (
              <div className="mt-4">
                <p className="mb-1 text-sm text-on-surface-variant">Mã QR người dùng gửi</p>
                <a href={selected.qrImageUrl} target="_blank" rel="noreferrer">
                  <img
                    src={selected.qrImageUrl}
                    alt="Mã QR ngân hàng"
                    className="max-h-72 w-full rounded-lg border border-outline-variant object-contain"
                  />
                </a>
              </div>
            )}

            {selected.status === "PENDING" && (
              <div className="mt-5 space-y-3 border-t border-outline-variant pt-4">
                {!rejecting ? (
                  <>
                    <label className="block text-sm text-on-surface-variant">
                      Mã giao dịch ngân hàng (không bắt buộc)
                      <input
                        value={txCode}
                        onChange={(e) => setTxCode(e.target.value)}
                        maxLength={200}
                        placeholder="Ví dụ: FT26274123456"
                        className="mt-1 w-full rounded-lg border border-outline-variant bg-surface-container-low px-3 py-2 text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                      />
                    </label>
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => void confirmTransfer()}
                        disabled={busy}
                        className="flex-1 rounded-lg bg-primary py-2.5 font-label-md text-label-md text-on-primary hover:opacity-90 disabled:opacity-50"
                      >
                        {busy ? "Đang lưu..." : "Xác nhận đã chuyển"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setRejecting(true)}
                        disabled={busy}
                        className="rounded-lg border border-error px-4 py-2.5 font-label-md text-label-md text-error hover:bg-error-container/10 disabled:opacity-50"
                      >
                        Từ chối
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <label className="block text-sm text-on-surface-variant">
                      Lý do từ chối (bắt buộc, tiền sẽ hoàn về ví)
                      <textarea
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        maxLength={500}
                        rows={3}
                        className="mt-1 w-full rounded-lg border border-outline-variant bg-surface-container-low px-3 py-2 text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                      />
                    </label>
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => void confirmReject()}
                        disabled={busy || rejectReason.trim().length === 0}
                        className="flex-1 rounded-lg bg-error py-2.5 font-label-md text-label-md text-on-error hover:opacity-90 disabled:opacity-50"
                      >
                        {busy ? "Đang lưu..." : "Xác nhận từ chối"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setRejecting(false)}
                        disabled={busy}
                        className="rounded-lg border border-outline-variant px-4 py-2.5 font-label-md text-label-md"
                      >
                        Quay lại
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

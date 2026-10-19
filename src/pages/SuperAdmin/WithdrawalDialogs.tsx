import { useId, useRef, useState, type ReactNode } from "react";
import { useDialogA11y } from "../../hooks/useDialogA11y";

const REASON_LIMIT = 500;

function Shell({
  titleId,
  descriptionId,
  role,
  onClose,
  children,
}: {
  titleId: string;
  descriptionId?: string;
  role: "dialog" | "alertdialog";
  onClose: () => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useDialogA11y(true, ref, onClose);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div
        ref={ref}
        role={role}
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className="max-h-[92dvh] w-full max-w-[30rem] overflow-y-auto rounded-3xl bg-surface-container-lowest p-7 shadow-[0_30px_70px_-20px_rgba(0,0,0,0.55)]"
      >
        {children}
      </div>
    </div>
  );
}

// Hộp thoại xác nhận đã chuyển khoản, thay cho window.confirm.
export function ConfirmTransferDialog({
  amountText,
  accountHolder,
  bankName,
  accountNumber,
  txCode,
  busy,
  onCancel,
  onConfirm,
}: {
  amountText: string;
  accountHolder: string;
  bankName: string;
  accountNumber: string;
  txCode: string;
  busy: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const titleId = useId();
  const descriptionId = useId();
  const rows: Array<{ label: string; value: string; mono?: boolean }> = [
    { label: "Người nhận", value: accountHolder },
    { label: "Ngân hàng", value: bankName },
    { label: "Số tài khoản", value: accountNumber, mono: true },
    { label: "Mã giao dịch", value: txCode.trim() || "Không nhập" },
  ];
  return (
    <Shell
      titleId={titleId}
      descriptionId={descriptionId}
      role="alertdialog"
      onClose={() => {
        if (!busy) onCancel();
      }}
    >
      <div className="flex items-start gap-4">
        <span
          aria-hidden="true"
          className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-2xl bg-primary-fixed text-on-primary-fixed-variant"
        >
          <span className="material-symbols-outlined text-[28px]" style={{ fontVariationSettings: "'FILL' 1" }}>
            payments
          </span>
        </span>
        <div className="min-w-0">
          <h2 id={titleId} className="text-xl font-extrabold tracking-tight">
            Xác nhận đã chuyển {amountText}?
          </h2>
          <p id={descriptionId} className="mt-1.5 text-sm leading-relaxed text-on-surface-variant">
            Hãy chắc chắn bạn đã chuyển khoản thành công trước khi xác nhận.
          </p>
        </div>
      </div>
      <dl className="mt-4 grid grid-cols-[6.875rem_1fr] gap-x-3 gap-y-2 rounded-2xl bg-surface-container-low px-4 py-3.5 text-[13px]">
        {rows.map((row) => (
          <div key={row.label} className="contents">
            <dt className="text-on-surface-variant">{row.label}</dt>
            <dd className={`break-all font-bold ${row.mono ? "font-mono tracking-wide" : ""}`}>{row.value}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-6 flex justify-end gap-2.5">
        <button
          type="button"
          onClick={onCancel}
          disabled={busy}
          className="min-h-11 rounded-xl border-[1.5px] border-outline-variant bg-surface-container-lowest px-5 text-sm font-bold hover:bg-surface-container-low disabled:opacity-60"
        >
          Hủy
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={busy}
          className="flex min-h-11 items-center gap-1.5 rounded-xl bg-primary px-5 text-sm font-bold text-on-primary disabled:opacity-60"
        >
          <span aria-hidden="true" className="material-symbols-outlined text-xl">
            check
          </span>
          {busy ? "Đang lưu..." : "Xác nhận đã chuyển"}
        </button>
      </div>
    </Shell>
  );
}

// Hộp thoại từ chối yêu cầu: lý do bắt buộc, tiền hoàn về ví người yêu cầu.
export function RejectRequestDialog({
  id,
  requesterText,
  busy,
  onCancel,
  onConfirm,
}: {
  id: number;
  requesterText: string;
  busy: boolean;
  onCancel: () => void;
  onConfirm: (reason: string) => void;
}) {
  const [reason, setReason] = useState("");
  const titleId = useId();
  const noteId = useId();
  const canSubmit = reason.trim().length > 0 && !busy;
  return (
    <Shell
      titleId={titleId}
      role="dialog"
      onClose={() => {
        if (!busy) onCancel();
      }}
    >
      <div className="flex items-start gap-4">
        <span
          aria-hidden="true"
          className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-2xl bg-error-container text-error"
        >
          <span className="material-symbols-outlined text-[28px]" style={{ fontVariationSettings: "'FILL' 1" }}>
            cancel
          </span>
        </span>
        <div className="min-w-0">
          <h2 id={titleId} className="text-xl font-extrabold tracking-tight">
            Từ chối yêu cầu #{id}?
          </h2>
          <p className="mt-1.5 text-sm leading-relaxed text-on-surface-variant">
            {requesterText}. Tiền sẽ hoàn về ví của người yêu cầu.
          </p>
        </div>
      </div>
      <div className="mt-4">
        <label htmlFor={noteId} className="mb-1 ml-0.5 block text-xs font-semibold text-on-surface-variant">
          Lý do từ chối (bắt buộc)
        </label>
        <textarea
          id={noteId}
          rows={4}
          maxLength={REASON_LIMIT}
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          placeholder="Ví dụ: Sai số tài khoản, vui lòng tạo lại yêu cầu"
          className="w-full resize-none rounded-2xl border-[1.5px] border-primary bg-surface-container-lowest px-3.5 py-3 text-sm leading-relaxed outline-none"
        />
        <p className="mt-1 text-right text-xs text-on-surface-variant">
          {reason.length}/{REASON_LIMIT}
        </p>
      </div>
      <div className="mt-5 flex justify-end gap-2.5">
        <button
          type="button"
          onClick={onCancel}
          disabled={busy}
          className="min-h-11 rounded-xl border-[1.5px] border-outline-variant bg-surface-container-lowest px-5 text-sm font-bold hover:bg-surface-container-low disabled:opacity-60"
        >
          Quay lại
        </button>
        <button
          type="button"
          onClick={() => onConfirm(reason)}
          disabled={!canSubmit}
          className="flex min-h-11 items-center gap-1.5 rounded-xl bg-error px-5 text-sm font-bold text-on-error disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span aria-hidden="true" className="material-symbols-outlined text-xl">
            cancel
          </span>
          {busy ? "Đang lưu..." : "Xác nhận từ chối"}
        </button>
      </div>
    </Shell>
  );
}

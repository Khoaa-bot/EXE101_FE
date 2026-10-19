import { useEffect, useId, useRef, useState } from "react";
import { useDialogA11y } from "../../hooks/useDialogA11y";

export const OTHER_REASON = "Lý do khác";
const NOTE_LIMIT = 200;

export type DialogEffect = {
  icon: string;
  tone: "danger" | "warning" | "ok";
  text: string;
};

type Props = {
  tone: "danger" | "warning";
  icon: string;
  // Có `reasons` thì hộp thoại có 2 bước: chọn lý do rồi xác nhận. Không có thì chỉ xác nhận.
  reasonTitle?: string;
  reasonSubtitle?: string;
  reasons?: string[];
  confirmTitle: string;
  confirmDescription?: string;
  effects?: DialogEffect[];
  confirmLabel: string;
  confirmIcon: string;
  busy?: boolean;
  onCancel: () => void;
  onConfirm: (reason: string | null) => void;
};

const TILE_CLASS = {
  danger: "bg-error-container text-error",
  warning: "bg-[#fff1cc] text-[#6b4200]",
} as const;

const CONFIRM_CLASS = {
  danger: "bg-error text-on-error",
  warning: "bg-primary text-on-primary",
} as const;

const EFFECT_CLASS = {
  danger: "text-error",
  warning: "text-[#6b4200]",
  ok: "text-tertiary",
} as const;

// Hộp thoại xác nhận chặn/ẩn: bước 1 chọn lý do (tuỳ chọn), bước 2 xác nhận.
// Chỉ gắn vào cây DOM khi đang mở nên trạng thái luôn được đặt lại cho mỗi lần mở.
export default function ReasonConfirmDialog({
  tone,
  icon,
  reasonTitle,
  reasonSubtitle,
  reasons,
  confirmTitle,
  confirmDescription,
  effects,
  confirmLabel,
  confirmIcon,
  busy = false,
  onCancel,
  onConfirm,
}: Props) {
  const hasReasonStep = Boolean(reasons && reasons.length > 0);
  const [step, setStep] = useState<0 | 1>(hasReasonStep ? 0 : 1);
  const [selected, setSelected] = useState("");
  const [note, setNote] = useState("");

  const dialogRef = useRef<HTMLDivElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  const noteId = useId();
  useDialogA11y(true, dialogRef, onCancel);

  // Sang bước xác nhận thì đưa focus về nút Hủy để tránh bấm nhầm.
  useEffect(() => {
    if (hasReasonStep && step === 1) cancelRef.current?.focus();
  }, [hasReasonStep, step]);

  const reasonText = selected === OTHER_REASON ? note.trim() : selected;
  const canContinue = Boolean(selected) && Boolean(reasonText);
  const title = step === 0 ? (reasonTitle ?? confirmTitle) : confirmTitle;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={step === 1 && confirmDescription ? descriptionId : undefined}
        className="max-h-[92dvh] w-full max-w-[30rem] overflow-y-auto rounded-3xl bg-surface-container-lowest p-7 shadow-[0_30px_70px_-20px_rgba(0,0,0,0.55)]"
      >
        {hasReasonStep && (
          <div className="mb-4 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
              Bước {step + 1}/2 · {step === 0 ? "Chọn lý do" : "Xác nhận"}
            </span>
            <div className="flex gap-1.5" aria-hidden="true">
              <i className="h-[5px] w-7 rounded-full bg-primary" />
              <i className={`h-[5px] w-7 rounded-full ${step === 1 ? "bg-primary" : "bg-surface-container-high"}`} />
            </div>
          </div>
        )}

        <div className="flex items-start gap-4">
          <span
            aria-hidden="true"
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${TILE_CLASS[tone]}`}
          >
            <span className="material-symbols-outlined text-[26px]" style={{ fontVariationSettings: "'FILL' 1" }}>
              {icon}
            </span>
          </span>
          <div className="min-w-0">
            <h2 id={titleId} className="text-xl font-extrabold tracking-tight">
              {title}
            </h2>
            {step === 0 && reasonSubtitle && (
              <p className="mt-1 text-sm text-on-surface-variant">{reasonSubtitle}</p>
            )}
            {step === 1 && confirmDescription && (
              <p id={descriptionId} className="mt-1 text-sm leading-relaxed text-on-surface-variant">
                {confirmDescription}
              </p>
            )}
          </div>
        </div>

        {step === 0 && reasons && (
          <div className="mt-5">
            <fieldset className="space-y-2">
              <legend className="mb-2 text-[13px] font-bold text-on-surface-variant">Chọn một lý do</legend>
              {[...reasons, OTHER_REASON].map((reason) => (
                <label
                  key={reason}
                  className={`flex min-h-12 cursor-pointer items-center gap-3 rounded-2xl border-[1.5px] px-3.5 text-sm ${
                    selected === reason
                      ? "border-primary bg-primary-fixed/40 font-bold text-on-primary-fixed-variant"
                      : "border-outline-variant/60 bg-surface-container-lowest font-medium"
                  }`}
                >
                  <input
                    type="radio"
                    name="superadmin-reason"
                    value={reason}
                    checked={selected === reason}
                    onChange={() => setSelected(reason)}
                    className="h-5 w-5 shrink-0 accent-primary"
                  />
                  {reason}
                </label>
              ))}
            </fieldset>

            {selected === OTHER_REASON && (
              <div className="mt-3">
                <label htmlFor={noteId} className="mb-1 ml-0.5 block text-xs font-semibold text-on-surface-variant">
                  Ghi chú lý do (bắt buộc khi chọn “Lý do khác”)
                </label>
                <textarea
                  id={noteId}
                  rows={3}
                  maxLength={NOTE_LIMIT}
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  placeholder="Mô tả ngắn gọn lý do"
                  className="w-full resize-none rounded-2xl border-[1.5px] border-primary bg-surface-container-lowest px-3.5 py-3 text-sm leading-relaxed outline-none"
                />
                <p className="mt-1 text-right text-xs text-on-surface-variant">
                  {note.length}/{NOTE_LIMIT}
                </p>
              </div>
            )}
          </div>
        )}

        {step === 1 && (
          <div className="mt-5 space-y-3">
            {effects && effects.length > 0 && (
              <ul className="space-y-2.5 rounded-2xl bg-surface-container-low px-4 py-3.5">
                {effects.map((effect) => (
                  <li key={effect.text} className="flex items-start gap-2.5 text-[13px] leading-snug">
                    <span
                      aria-hidden="true"
                      className={`material-symbols-outlined mt-px shrink-0 text-xl ${EFFECT_CLASS[effect.tone]}`}
                    >
                      {effect.icon}
                    </span>
                    {effect.text}
                  </li>
                ))}
              </ul>
            )}
            {hasReasonStep && (
              <p className="rounded-2xl bg-surface-container-low px-4 py-3 text-[13px]">
                <span className="text-on-surface-variant">Lý do: </span>
                <b>{reasonText}</b>
              </p>
            )}
          </div>
        )}

        <div className="mt-6 flex flex-wrap items-center justify-end gap-2.5">
          {hasReasonStep && step === 1 && (
            <button
              type="button"
              onClick={() => setStep(0)}
              disabled={busy}
              className="mr-auto min-h-11 rounded-xl px-3 text-sm font-semibold text-on-surface-variant hover:bg-surface-container-low disabled:opacity-60"
            >
              ← Chọn lại lý do
            </button>
          )}
          <button
            ref={cancelRef}
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="min-h-11 rounded-xl border-[1.5px] border-outline-variant bg-surface-container-lowest px-5 text-sm font-bold hover:bg-surface-container-low disabled:opacity-60"
          >
            Hủy
          </button>
          {step === 0 ? (
            <button
              type="button"
              onClick={() => setStep(1)}
              disabled={!canContinue}
              className="flex min-h-11 items-center gap-1.5 rounded-xl bg-primary px-5 text-sm font-bold text-on-primary disabled:cursor-not-allowed disabled:opacity-50"
            >
              Tiếp tục
              <span aria-hidden="true" className="material-symbols-outlined text-xl">
                arrow_forward
              </span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onConfirm(hasReasonStep ? reasonText : null)}
              disabled={busy}
              className={`flex min-h-11 items-center gap-1.5 rounded-xl px-5 text-sm font-bold disabled:opacity-60 ${CONFIRM_CLASS[tone]}`}
            >
              <span aria-hidden="true" className="material-symbols-outlined text-xl">
                {confirmIcon}
              </span>
              {confirmLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

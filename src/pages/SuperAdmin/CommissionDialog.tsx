import { useEffect, useId, useRef, useState } from "react";
import { useDialogA11y } from "../../hooks/useDialogA11y";

const QUICK_RATES = [5, 10, 15, 20];
const MIN_RATE = 0;
const MAX_RATE = 50;
const SAMPLE_PRICE = 500_000;

type Props = {
  garageName: string;
  currentPercent: number;
  // Mức mặc định của hệ thống (khi garage không có mức riêng).
  defaultPercent: number;
  usingDefault: boolean;
  busy: boolean;
  onCancel: () => void;
  onSave: (percent: number | null) => void;
};

function parsePercent(text: string): number | null {
  const trimmed = text.trim();
  if (trimmed === "") return null;
  const value = Number(trimmed.replace(",", "."));
  return Number.isFinite(value) ? value : null;
}

function formatVnd(value: number) {
  return `${Math.round(value).toLocaleString("vi-VN")}đ`;
}

// Hộp thoại sửa hoa hồng garage, thay cho window.prompt.
export default function CommissionDialog({
  garageName,
  currentPercent,
  defaultPercent,
  usingDefault,
  busy,
  onCancel,
  onSave,
}: Props) {
  const [text, setText] = useState(String(currentPercent));
  const [useDefault, setUseDefault] = useState(usingDefault);
  const dialogRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const titleId = useId();
  const inputId = useId();
  const errorId = useId();
  useDialogA11y(true, dialogRef, onCancel);

  useEffect(() => {
    inputRef.current?.select();
  }, []);

  const percent = useDefault ? defaultPercent : parsePercent(text);
  const invalid = !useDefault && (percent === null || percent < MIN_RATE || percent > MAX_RATE);
  const fee = percent !== null && !invalid ? (SAMPLE_PRICE * percent) / 100 : null;

  const toggleDefault = (checked: boolean) => {
    setUseDefault(checked);
    if (checked) setText(String(defaultPercent));
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (invalid || busy) return;
    onSave(useDefault ? null : percent);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="max-h-[92dvh] w-full max-w-[30rem] overflow-y-auto rounded-3xl bg-surface-container-lowest p-7 shadow-[0_30px_70px_-20px_rgba(0,0,0,0.55)]"
      >
        <form onSubmit={submit}>
          <div className="flex items-start gap-4">
            <span
              aria-hidden="true"
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary-fixed text-on-primary-fixed-variant"
            >
              <span className="material-symbols-outlined text-[26px]">percent</span>
            </span>
            <div className="min-w-0">
              <h2 id={titleId} className="text-xl font-extrabold tracking-tight">
                Sửa hoa hồng
              </h2>
              <p className="mt-1 text-sm text-on-surface-variant">
                {garageName} · hiện đang <b>{currentPercent}%</b>
                {usingDefault ? " (mức mặc định)" : ""}
              </p>
            </div>
          </div>

          <label htmlFor={inputId} className="mb-1.5 ml-0.5 mt-5 block text-[13px] font-bold text-on-surface-variant">
            Hoa hồng nền tảng thu ({MIN_RATE}–{MAX_RATE}%)
          </label>
          <div
            className={`flex h-[52px] items-center gap-2 rounded-2xl border-[1.5px] bg-surface-container-lowest px-4 focus-within:ring-[3px] focus-within:ring-primary/20 ${
              invalid ? "border-error" : "border-primary"
            } ${useDefault ? "opacity-60" : ""}`}
          >
            <input
              ref={inputRef}
              id={inputId}
              inputMode="decimal"
              value={text}
              disabled={useDefault}
              onChange={(e) => setText(e.target.value)}
              aria-invalid={invalid}
              aria-describedby={invalid ? errorId : undefined}
              className="min-w-0 flex-1 bg-transparent text-[22px] font-extrabold outline-none"
            />
            <span className="text-lg font-bold text-outline">%</span>
          </div>
          {invalid && (
            <p id={errorId} role="alert" className="ml-0.5 mt-1.5 text-xs font-semibold text-error">
              Nhập số từ {MIN_RATE} đến {MAX_RATE}.
            </p>
          )}

          <div role="group" aria-label="Chọn nhanh" className="mt-3 flex gap-2">
            {QUICK_RATES.map((rate) => {
              const active = !useDefault && percent === rate;
              return (
                <button
                  key={rate}
                  type="button"
                  aria-pressed={active}
                  disabled={useDefault}
                  onClick={() => setText(String(rate))}
                  className={`min-h-9 rounded-full border px-3.5 text-[13px] font-semibold disabled:opacity-50 ${
                    active
                      ? "border-primary bg-primary-fixed text-on-primary-fixed-variant"
                      : "border-outline-variant bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container-low"
                  }`}
                >
                  {rate}%
                </button>
              );
            })}
          </div>

          <label className="mt-4 flex min-h-11 cursor-pointer items-center gap-2.5 text-sm">
            <input
              type="checkbox"
              checked={useDefault}
              onChange={(e) => toggleDefault(e.target.checked)}
              className="h-5 w-5 accent-primary"
            />
            Dùng mức mặc định của hệ thống ({defaultPercent}%)
          </label>

          <div className="mt-2 space-y-2.5 rounded-2xl bg-surface-container-low px-4 py-3.5 text-[13px]">
            <p className="flex items-start gap-2.5">
              <span
                aria-hidden="true"
                className="material-symbols-outlined shrink-0 text-xl text-on-primary-fixed-variant"
              >
                update
              </span>
              <span>
                Áp dụng cho các lịch bàn giao <b>từ bây giờ</b>; lịch đã bàn giao không đổi.
              </span>
            </p>
            <p className="flex items-start gap-2.5">
              <span aria-hidden="true" className="material-symbols-outlined shrink-0 text-xl text-tertiary">
                payments
              </span>
              <span>
                {fee === null ? (
                  "Nhập hoa hồng hợp lệ để xem ví dụ."
                ) : (
                  <>
                    Ví dụ: dịch vụ {formatVnd(SAMPLE_PRICE)} → nền tảng thu <b>{formatVnd(fee)}</b>, garage nhận{" "}
                    <b>{formatVnd(SAMPLE_PRICE - fee)}</b>.
                  </>
                )}
              </span>
            </p>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onCancel}
              disabled={busy}
              className="min-h-11 rounded-xl border-[1.5px] border-outline-variant bg-surface-container-lowest px-5 text-sm font-bold hover:bg-surface-container-low disabled:opacity-60"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={invalid || busy}
              className="flex min-h-11 items-center gap-1.5 rounded-xl bg-gradient-to-br from-primary to-primary-container px-5 text-sm font-bold text-on-primary disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span aria-hidden="true" className="material-symbols-outlined text-xl">
                check
              </span>
              Lưu hoa hồng
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

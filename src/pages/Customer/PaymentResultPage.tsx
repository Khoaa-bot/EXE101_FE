import { useEffect, useState, type ReactNode } from "react";
import { confirmPayosReturn, type PaymentReturnResult } from "../../services/api";
import { formatVnd } from "../../utils/format";

type PaymentResultPageProps = {
  onHomeClick: () => void;
  onTrackingClick: () => void;
};

// PayOS đôi khi báo "đang xử lý" vài giây sau khi khách đã trả; hỏi lại vài lần trước khi kết luận.
const MAX_ATTEMPTS = 5;
const RETRY_DELAY_MS = 2000;

const REDIRECT_SECONDS = 3;

const sleep = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));

type Outcome = "loading" | "success" | "cancelled" | "pending" | "error";

function Badge({ icon, tone, spin = false }: { icon: string; tone: string; spin?: boolean }) {
  return (
    <span aria-hidden="true" className={`flex h-[84px] w-[84px] items-center justify-center rounded-full ${tone}`}>
      <span className={`material-symbols-outlined text-[46px] ${spin ? "animate-spin" : ""}`}>{icon}</span>
    </span>
  );
}

function Detail({ rows }: { rows: Array<{ label: string; value: ReactNode }> }) {
  if (rows.length === 0) return null;
  return (
    <dl className="mt-2 grid w-full grid-cols-[auto_1fr] gap-x-4 gap-y-2 rounded-2xl bg-surface-container-low p-4 text-left text-[13px]">
      {rows.map((row) => (
        <div key={row.label} className="contents">
          <dt className="text-on-surface-variant">{row.label}</dt>
          <dd className="text-right font-bold">{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export default function PaymentResultPage({
  onHomeClick,
  onTrackingClick,
}: PaymentResultPageProps) {
  const search = window.location.search;
  const params = new URLSearchParams(search);
  const hasOrderCode = Boolean(params.get("orderCode"));
  const wasCancelledAtPayos =
    params.get("cancel") === "true" || params.get("status")?.toUpperCase() === "CANCELLED";

  const [attemptKey, setAttemptKey] = useState(0);
  const [attempt, setAttempt] = useState(1);
  const [outcome, setOutcome] = useState<Outcome>(hasOrderCode ? "loading" : "error");
  const [result, setResult] = useState<PaymentReturnResult | null>(null);
  const [error, setError] = useState<string | null>(
    hasOrderCode ? null : "Không tìm thấy thông tin giao dịch.",
  );

  useEffect(() => {
    if (!hasOrderCode) return;
    let cancelled = false;

    const run = async () => {
      for (let current = 1; current <= MAX_ATTEMPTS; current += 1) {
        setAttempt(current);
        let data: PaymentReturnResult;
        try {
          data = await confirmPayosReturn(search);
        } catch (err) {
          if (cancelled) return;
          setError(err instanceof Error ? err.message : "Không xác nhận được giao dịch.");
          setOutcome("error");
          return;
        }
        if (cancelled) return;

        if (data.success) {
          setResult(data);
          setOutcome("success");
          return;
        }
        if (wasCancelledAtPayos) {
          setResult(data);
          setOutcome("cancelled");
          return;
        }
        if (current === MAX_ATTEMPTS) {
          setResult(data);
          setOutcome("pending");
          return;
        }
        await sleep(RETRY_DELAY_MS);
        if (cancelled) return;
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [attemptKey, hasOrderCode, search, wasCancelledAtPayos]);

  // Hóa đơn đặt lịch: thành công thì sang Theo dõi; không thành công (lịch bị huỷ) thì về trang chủ. Tự chuyển sau vài giây.
  const redirectTo: "tracking" | "home" | null =
    result?.type === "INVOICE"
      ? outcome === "success"
        ? "tracking"
        : outcome === "cancelled"
          ? result.bookingCancelled
            ? "home"
            : "tracking"
          : null
      : null;
  const [secondsLeft, setSecondsLeft] = useState(REDIRECT_SECONDS);

  useEffect(() => {
    if (!redirectTo) return;
    const id = window.setInterval(() => setSecondsLeft((value) => value - 1), 1000);
    return () => window.clearInterval(id);
  }, [redirectTo]);

  useEffect(() => {
    if (redirectTo && secondsLeft <= 0) {
      (redirectTo === "home" ? onHomeClick : onTrackingClick)();
    }
  }, [redirectTo, secondsLeft, onHomeClick, onTrackingClick]);

  const retry = () => {
    setOutcome("loading");
    setError(null);
    setAttemptKey((key) => key + 1);
  };

  const isInvoice = result?.type === "INVOICE";
  const isTopUp = result?.type === "TOPUP";

  // Nút chính đưa khách về nơi hợp lý nhất theo loại giao dịch.
  const primaryAction = isInvoice
    ? result?.bookingCancelled
      ? { label: "Về trang chủ", onClick: onHomeClick }
      : { label: "Xem lịch hẹn của tôi", onClick: onTrackingClick }
    : { label: "Về trang chủ", onClick: onHomeClick };

  // Chỉ hiện những dòng chi tiết mà API thực sự trả về.
  const detailRows: Array<{ label: string; value: ReactNode }> = [];
  if (result?.orderCode !== undefined) detailRows.push({ label: "Mã giao dịch", value: `#${result.orderCode}` });
  if (isInvoice && result?.appointmentId !== undefined) {
    detailRows.push({ label: "Lịch hẹn", value: `#${result.appointmentId}` });
  }

  const outlineButton =
    "min-h-12 w-full rounded-2xl border-[1.5px] border-primary text-sm font-bold text-on-primary-fixed-variant transition hover:bg-primary-fixed/40";

  return (
    <div className="flex min-h-dvh items-center justify-center bg-gradient-to-b from-primary-fixed/50 to-background p-margin-mobile font-sans text-on-surface">
      <div
        role={outcome === "error" ? "alert" : "status"}
        aria-live="polite"
        className="flex min-h-[26rem] w-full max-w-[26rem] flex-col items-center gap-2.5 rounded-[28px] border border-outline-variant/40 bg-surface-container-lowest px-7 py-8 text-center shadow-[0_18px_40px_-22px_rgba(25,28,29,0.4)]"
      >
        {outcome === "loading" && (
          <>
            <Badge icon="sync" tone="bg-primary-fixed text-primary" spin />
            <h1 className="mt-1.5 text-[22px] font-extrabold">Đang xác nhận giao dịch…</h1>
            <p className="max-w-[17.5rem] text-sm text-on-surface-variant">
              Vui lòng không đóng trang. Việc này thường chỉ mất vài giây.
            </p>
            <div className="mt-3.5 h-2 w-full overflow-hidden rounded bg-surface-container-high">
              <div
                className="h-full rounded bg-gradient-to-r from-primary to-primary-container transition-all duration-500"
                style={{ width: `${(attempt / MAX_ATTEMPTS) * 100}%` }}
              />
            </div>
            <span className="text-xs text-on-surface-variant">
              Lần thử {attempt}/{MAX_ATTEMPTS}
            </span>
          </>
        )}

        {outcome === "error" && (
          <>
            <Badge icon="error" tone="bg-error-container text-error" />
            <h1 className="mt-1.5 text-[22px] font-extrabold">Không xác nhận được giao dịch</h1>
            <p className="max-w-[18.75rem] text-sm text-on-surface-variant">
              {error ?? "Vui lòng kiểm tra lại số dư hoặc thử lại sau."}
            </p>
            {hasOrderCode && (
              <button type="button" onClick={retry} className={`${outlineButton} mt-3`}>
                Thử lại
              </button>
            )}
          </>
        )}

        {outcome === "success" && result && (
          <>
            <span className="rounded-full ring-[10px] ring-[#008730]/10">
              <Badge icon={isInvoice ? "receipt_long" : "check"} tone="bg-[#d9f7dd] text-[#008730]" />
            </span>
            <h1 className="mt-1.5 text-[22px] font-extrabold">
              {isInvoice ? "Thanh toán thành công" : "Nạp tiền thành công!"}
            </h1>
            {result.amount !== undefined && (
              <p className={`text-4xl font-extrabold tracking-tight ${isInvoice ? "text-on-primary-fixed-variant" : "text-[#008730]"}`}>
                {isTopUp ? "+" : ""}
                {formatVnd(result.amount)}
              </p>
            )}
            <p className="text-sm text-on-surface-variant">
              {result.message}
              {isInvoice ? " Lịch hẹn của bạn đã được ghi nhận." : ""}
            </p>
            <Detail rows={detailRows} />
            {redirectTo === "tracking" && (
              <p className="text-xs text-on-surface-variant" role="status">
                Tự chuyển sang màn Theo dõi sau {Math.max(0, secondsLeft)} giây
              </p>
            )}
          </>
        )}

        {outcome === "cancelled" && (
          <>
            <Badge icon="block" tone="bg-[#e9eaeb] text-[#3a3f4b]" />
            <h1 className="mt-1.5 text-[22px] font-extrabold">
              {result?.bookingCancelled ? "Đặt lịch không thành công" : "Bạn đã huỷ thanh toán"}
            </h1>
            <p className="max-w-[18.75rem] text-sm text-on-surface-variant">
              {result?.bookingCancelled
                ? "Bạn chưa hoàn tất thanh toán nên lịch hẹn không được giữ. Bạn có thể đặt lại bất cứ lúc nào."
                : isInvoice
                ? "Hoá đơn vẫn chưa được thanh toán. Bạn có thể thanh toán lại trong mục Theo dõi."
                : "Chưa có khoản tiền nào được trừ hoặc nạp vào ví. Bạn có thể thử lại bất cứ lúc nào."}
            </p>
            <Detail rows={detailRows} />
            {redirectTo && (
              <p className="text-xs text-on-surface-variant" role="status">
                {redirectTo === "home" ? "Tự về trang chủ" : "Tự chuyển sang màn Theo dõi"} sau {Math.max(0, secondsLeft)} giây
              </p>
            )}
          </>
        )}

        {outcome === "pending" && (
          <>
            <Badge icon="schedule" tone="bg-[#fff1cc] text-[#c47f00]" />
            <h1 className="mt-1.5 text-[22px] font-extrabold">Giao dịch đang được xử lý</h1>
            <p className="max-w-[19.375rem] text-sm text-on-surface-variant">
              Chưa nhận được xác nhận từ ngân hàng. Nếu bạn đã chuyển tiền, hệ thống sẽ tự cập nhật sau ít phút —
              bạn có thể kiểm tra lại hoặc xem trong Thông báo.
            </p>
            <Detail rows={detailRows} />
            <button type="button" onClick={retry} className={`${outlineButton} mt-3`}>
              Kiểm tra lại
            </button>
          </>
        )}

        {outcome !== "loading" && (
          <div className="mt-auto w-full space-y-3 pt-4">
            <button
              type="button"
              onClick={primaryAction.onClick}
              className="min-h-12 w-full rounded-2xl bg-gradient-to-br from-primary to-primary-container text-sm font-bold text-on-primary shadow-[0_12px_22px_-14px_rgba(0,89,187,0.9)] transition active:scale-[0.98]"
            >
              {primaryAction.label}
            </button>
            {primaryAction.onClick !== onHomeClick && (
              <button
                type="button"
                onClick={onHomeClick}
                className="min-h-12 w-full rounded-2xl border-[1.5px] border-outline-variant text-sm font-bold text-on-surface-variant transition hover:bg-surface-container"
              >
                Về trang chủ
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

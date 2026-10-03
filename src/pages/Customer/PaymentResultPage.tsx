import { useEffect, useState } from "react";
import { confirmPayosReturn, type PaymentReturnResult } from "../../services/api";
import { formatVnd } from "../../utils/format";

type PaymentResultPageProps = {
  onHomeClick: () => void;
  onTrackingClick: () => void;
  onWalletClick: () => void;
};

// PayOS đôi khi báo "đang xử lý" vài giây sau khi khách đã trả; hỏi lại vài lần trước khi kết luận.
const MAX_ATTEMPTS = 5;
const RETRY_DELAY_MS = 2000;

const sleep = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));

type Outcome = "loading" | "success" | "cancelled" | "pending" | "error";

export default function PaymentResultPage({
  onHomeClick,
  onTrackingClick,
  onWalletClick,
}: PaymentResultPageProps) {
  const search = window.location.search;
  const params = new URLSearchParams(search);
  const hasOrderCode = Boolean(params.get("orderCode"));
  const wasCancelledAtPayos =
    params.get("cancel") === "true" || params.get("status")?.toUpperCase() === "CANCELLED";

  const [attemptKey, setAttemptKey] = useState(0);
  const [outcome, setOutcome] = useState<Outcome>(hasOrderCode ? "loading" : "error");
  const [result, setResult] = useState<PaymentReturnResult | null>(null);
  const [error, setError] = useState<string | null>(
    hasOrderCode ? null : "Không tìm thấy thông tin giao dịch.",
  );

  useEffect(() => {
    if (!hasOrderCode) return;
    let cancelled = false;

    const run = async () => {
      for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
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
        if (attempt === MAX_ATTEMPTS) {
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

  const retry = () => {
    setOutcome("loading");
    setError(null);
    setAttemptKey((key) => key + 1);
  };

  const isInvoice = result?.type === "INVOICE";
  const isTopUp = result?.type === "TOPUP";

  // Nút chính đưa khách về nơi hợp lý nhất theo loại giao dịch.
  const primaryAction = isInvoice
    ? { label: "Xem lịch hẹn của tôi", onClick: onTrackingClick }
    : isTopUp
      ? { label: "Về trang ví", onClick: onWalletClick }
      : { label: "Về trang chủ", onClick: onHomeClick };

  return (
    <div className="flex min-h-dvh items-center justify-center bg-background p-margin-mobile font-sans text-on-surface">
      <div className="w-full max-w-[28rem] rounded-2xl border border-outline-variant bg-surface-container-lowest p-xl text-center shadow-lg">
        {outcome === "loading" && (
          <>
            <span className="material-symbols-outlined animate-spin text-4xl text-primary">
              sync
            </span>
            <p className="mt-4 font-body-md text-body-md text-on-surface-variant">
              Đang xác nhận giao dịch...
            </p>
          </>
        )}

        {outcome === "error" && (
          <>
            <span className="material-symbols-outlined text-5xl text-error">error</span>
            <h1 className="mt-4 font-headline-md text-headline-md">
              Không xác nhận được giao dịch
            </h1>
            <p className="mt-2 font-body-md text-body-md text-on-surface-variant">
              {error ?? "Vui lòng kiểm tra lại số dư hoặc thử lại sau."}
            </p>
            {hasOrderCode && (
              <button
                type="button"
                onClick={retry}
                className="mt-6 w-full rounded-lg border border-primary py-3 font-label-md text-label-md text-primary transition hover:bg-primary-container/10"
              >
                Thử lại
              </button>
            )}
          </>
        )}

        {outcome === "success" && result && (
          <>
            <span className="material-symbols-outlined text-5xl text-tertiary">check_circle</span>
            <h1 className="mt-4 font-headline-md text-headline-md">
              {isInvoice ? "Thanh toán hoá đơn thành công!" : "Nạp tiền thành công!"}
            </h1>
            <p className="mt-2 font-body-md text-body-md text-on-surface-variant">
              {result.message}
            </p>
            {result.amount !== undefined && (
              <p className="mt-4 font-headline-lg text-headline-lg text-primary">
                {isTopUp ? "+" : ""}
                {formatVnd(result.amount)}
              </p>
            )}
            {isInvoice && (
              <p className="mt-1 font-body-sm text-body-sm text-on-surface-variant">
                Lịch hẹn của bạn đã được ghi nhận thanh toán.
              </p>
            )}
          </>
        )}

        {outcome === "cancelled" && (
          <>
            <span className="material-symbols-outlined text-5xl text-error">cancel</span>
            <h1 className="mt-4 font-headline-md text-headline-md">Bạn đã huỷ thanh toán</h1>
            <p className="mt-2 font-body-md text-body-md text-on-surface-variant">
              {isInvoice
                ? "Hoá đơn vẫn chưa được thanh toán. Bạn có thể thanh toán lại trong mục Theo dõi."
                : "Chưa có khoản tiền nào được nạp vào ví."}
            </p>
          </>
        )}

        {outcome === "pending" && (
          <>
            <span className="material-symbols-outlined text-5xl text-tertiary">schedule</span>
            <h1 className="mt-4 font-headline-md text-headline-md">
              Giao dịch đang được xử lý
            </h1>
            <p className="mt-2 font-body-md text-body-md text-on-surface-variant">
              Chưa nhận được xác nhận từ ngân hàng. Nếu bạn đã chuyển tiền, hệ thống sẽ tự cập nhật
              sau ít phút — bạn có thể kiểm tra lại hoặc xem trong Thông báo.
            </p>
            <button
              type="button"
              onClick={retry}
              className="mt-6 w-full rounded-lg border border-primary py-3 font-label-md text-label-md text-primary transition hover:bg-primary-container/10"
            >
              Kiểm tra lại
            </button>
          </>
        )}

        {outcome !== "loading" && (
          <div className="mt-6 space-y-3">
            <button
              type="button"
              onClick={primaryAction.onClick}
              className="w-full rounded-lg bg-primary py-3 font-label-md text-label-md text-on-primary transition hover:opacity-90 active:scale-[0.98]"
            >
              {primaryAction.label}
            </button>
            {primaryAction.onClick !== onHomeClick && (
              <button
                type="button"
                onClick={onHomeClick}
                className="w-full rounded-lg border border-outline-variant py-3 font-label-md text-label-md text-on-surface-variant transition hover:bg-surface-container"
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

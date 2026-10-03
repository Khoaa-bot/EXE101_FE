import { useEffect, useState } from "react";
import { confirmVnpayReturn, type VnpayReturnResult } from "../../services/api";

type PaymentResultPageProps = {
  onHomeClick: () => void;
};

function formatCurrency(value: number | null | undefined) {
  if (value === null || value === undefined) return "";
  return `${value.toLocaleString("vi-VN")}đ`;
}

export default function PaymentResultPage({ onHomeClick }: PaymentResultPageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [result, setResult] = useState<VnpayReturnResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const search = window.location.search;
    if (!search) {
      setError("Không tìm thấy thông tin giao dịch.");
      setIsLoading(false);
      return;
    }
    confirmVnpayReturn(search)
      .then((data) => setResult(data))
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Không xác nhận được giao dịch.");
      })
      .finally(() => setIsLoading(false));
  }, []);

  const success = result?.success === true;

  return (
    <div className="flex min-h-dvh items-center justify-center bg-background p-margin-mobile font-sans text-on-surface">
      <div className="w-full max-w-[28rem] rounded-2xl border border-outline-variant bg-surface-container-lowest p-xl text-center shadow-lg">
        {isLoading && (
          <>
            <span className="material-symbols-outlined animate-spin text-4xl text-primary">
              sync
            </span>
            <p className="mt-4 font-body-md text-body-md text-on-surface-variant">
              Đang xác nhận giao dịch...
            </p>
          </>
        )}

        {!isLoading && (error || !result) && (
          <>
            <span className="material-symbols-outlined text-5xl text-error">
              error
            </span>
            <h1 className="mt-4 font-headline-md text-headline-md">
              Không xác nhận được giao dịch
            </h1>
            <p className="mt-2 font-body-md text-body-md text-on-surface-variant">
              {error ?? "Vui lòng kiểm tra lại số dư hoặc thử lại sau."}
            </p>
          </>
        )}

        {!isLoading && result && (
          <>
            <span
              className={`material-symbols-outlined text-5xl ${success ? "text-tertiary" : "text-error"}`}
            >
              {success ? "check_circle" : "cancel"}
            </span>
            <h1 className="mt-4 font-headline-md text-headline-md">
              {success
                ? result.type === "INVOICE"
                  ? "Thanh toán hóa đơn thành công!"
                  : "Nạp tiền thành công!"
                : "Giao dịch không thành công"}
            </h1>
            <p className="mt-2 font-body-md text-body-md text-on-surface-variant">
              {result.message}
            </p>
            {success && result.amount !== undefined && (
              <p className="mt-4 font-headline-lg text-headline-lg text-primary">
                +{formatCurrency(result.amount as number)}
              </p>
            )}
            {success && result.newBalance !== undefined && (
              <p className="mt-1 font-body-sm text-body-sm text-on-surface-variant">
                Số dư mới: {formatCurrency(result.newBalance as number)}
              </p>
            )}
          </>
        )}

        <button
          type="button"
          onClick={onHomeClick}
          className="mt-8 w-full rounded-lg bg-primary py-3 font-label-md text-label-md text-on-primary transition hover:opacity-90 active:scale-[0.98]"
        >
          Về trang chủ
        </button>
      </div>
    </div>
  );
}

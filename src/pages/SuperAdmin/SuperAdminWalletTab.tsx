import { useEffect, useState } from "react";
import { getPlatformWallet, type PlatformWallet } from "../../services/api";
import { formatVnd } from "../../utils/format";
import WalletPage from "../Customer/WalletPage";

// Ví nền tảng: hoa hồng đã nhận, tiền đang giữ hộ khách và đối soát tiền vào/ra; bên dưới là ví của Super Admin (rút tiền, lịch sử).
export default function SuperAdminWalletTab() {
  const [data, setData] = useState<PlatformWallet | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getPlatformWallet()
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Không tải được ví nền tảng.");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const cards: { label: string; value: number; hint: string }[] = data
    ? [
        { label: "Hoa hồng đã nhận", value: data.totalCommission, hint: "Tổng hoa hồng đã vào ví nền tảng" },
        { label: "Tiền đang giữ hộ khách", value: data.heldForCustomers, hint: "Chờ bàn giao hoặc hoàn lại" },
        { label: "Chờ chuyển khoản", value: data.pendingWithdrawals, hint: "Yêu cầu rút tiền chưa xử lý" },
        { label: "Tổng số dư các ví", value: data.totalUserBalances, hint: "Khách, garage và admin" },
      ]
    : [];

  return (
    <div className="space-y-6">
      {error && <p className="text-error">{error}</p>}
      {!error && !data && <p className="text-on-surface-variant">Đang tải...</p>}

      {data && (
        <>
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {cards.map((card) => (
              <article
                key={card.label}
                className="rounded-xl border border-outline-variant bg-surface-container-lowest p-5"
              >
                <p className="font-label-md text-label-md text-on-surface-variant">{card.label}</p>
                <p className="mt-2 font-headline-lg text-headline-lg">{formatVnd(card.value)}</p>
                <p className="mt-1 text-xs text-on-surface-variant">{card.hint}</p>
              </article>
            ))}
          </section>

          <section
            className={`rounded-xl border p-5 ${
              data.balanced ? "border-tertiary/40 bg-tertiary-container/10" : "border-error/40 bg-error-container/10"
            }`}
            data-testid="reconciliation"
          >
            <div className="flex items-center gap-2">
              <span className={`material-symbols-outlined ${data.balanced ? "text-tertiary" : "text-error"}`}>
                {data.balanced ? "verified" : "warning"}
              </span>
              <h2 className="font-headline-md text-headline-md">
                {data.balanced ? "Đối soát khớp" : "Đối soát lệch"}
              </h2>
            </div>
            <dl className="mt-3 grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
              <dt className="text-on-surface-variant">Tiền thật vào qua PayOS</dt>
              <dd className="font-semibold">{formatVnd(data.cashInViaPayos)}</dd>
              <dt className="text-on-surface-variant">Đã chuyển khoản trả ra (rút tiền)</dt>
              <dd className="font-semibold">{formatVnd(data.cashOutWithdrawals)}</dd>
              <dt className="text-on-surface-variant">Chênh lệch</dt>
              <dd className={`font-bold ${data.balanced ? "text-tertiary" : "text-error"}`}>
                {formatVnd(data.difference)}
              </dd>
            </dl>
            {!data.balanced && (
              <p className="mt-3 text-xs text-on-surface-variant">
                Chênh lệch khác 0 nghĩa là tiền vào/ra không khớp với số dư các ví cộng tiền đang giữ. Các hóa đơn
                tạo trước khi có cơ chế giữ tiền (tiền PayOS đã vào nhưng chưa ghi sổ) cũng gây chênh lệch cố định.
              </p>
            )}
          </section>
        </>
      )}

      <WalletPage />
    </div>
  );
}

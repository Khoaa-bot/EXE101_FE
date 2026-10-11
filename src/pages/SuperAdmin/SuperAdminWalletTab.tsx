import { useEffect, useState } from "react";
import { getPlatformWallet, type PlatformWallet } from "../../services/api";
import { formatVnd } from "../../utils/format";
import WalletPage from "../Customer/WalletPage";

type Props = {
  onNavigate?: (tab: "withdrawals") => void;
};

// Ví nền tảng: hoa hồng đã nhận, tiền đang giữ hộ khách và đối soát tiền vào/ra; bên dưới là ví của Super Admin (rút tiền, lịch sử).
export default function SuperAdminWalletTab({ onNavigate }: Props) {
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

  const cards: { label: string; value: number; hint: string; icon: string; tone: string; goToWithdrawals?: boolean }[] =
    data
      ? [
          {
            label: "Hoa hồng đã nhận",
            value: data.totalCommission,
            hint: "Tổng hoa hồng đã vào ví nền tảng",
            icon: "account_balance",
            tone: "bg-primary-fixed text-on-primary-fixed-variant",
          },
          {
            label: "Tiền đang giữ hộ khách",
            value: data.heldForCustomers,
            hint: "Chờ bàn giao hoặc hoàn lại",
            icon: "lock_clock",
            tone: "bg-[#fff1cc] text-[#6b4200]",
          },
          {
            label: "Chờ chuyển khoản",
            value: data.pendingWithdrawals,
            hint: "Yêu cầu rút tiền chưa xử lý",
            icon: "payments",
            tone: "bg-[#ffe4d6] text-[#7a2e00]",
            goToWithdrawals: true,
          },
          {
            label: "Tổng số dư các ví",
            value: data.totalUserBalances,
            hint: "Khách, garage và admin",
            icon: "wallet",
            tone: "bg-[#e6defa] text-[#3b2a7a]",
          },
        ]
      : [];

  const moneyParts = data
    ? [
        { label: "Hoa hồng đã nhận", value: data.totalCommission, color: "bg-primary" },
        { label: "Đang giữ hộ khách", value: data.heldForCustomers, color: "bg-[#c47f00]" },
        { label: "Số dư các ví", value: data.totalUserBalances, color: "bg-tertiary-container" },
      ]
    : [];
  const moneyTotal = moneyParts.reduce((sum, part) => sum + Math.max(part.value, 0), 0);

  return (
    <div className="space-y-5">
      {error && <p className="text-error">{error}</p>}
      {!error && !data && <p className="text-on-surface-variant">Đang tải...</p>}

      {data && (
        <>
          <section aria-label="Số liệu ví nền tảng" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {cards.map((card) => (
              <article
                key={card.label}
                className="flex flex-col gap-3 rounded-2xl border border-outline-variant/40 bg-surface-container-lowest p-5 shadow-[0_10px_26px_-14px_rgba(25,28,29,0.28)]"
              >
                <div className="flex items-center gap-3">
                  <span
                    aria-hidden="true"
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] ${card.tone}`}
                  >
                    <span className="material-symbols-outlined">{card.icon}</span>
                  </span>
                  <p className="text-[13px] font-semibold text-on-surface-variant">{card.label}</p>
                </div>
                <div>
                  <p className="text-2xl font-extrabold leading-tight tracking-tight">{formatVnd(card.value)}</p>
                  <p className="mt-1 text-xs text-on-surface-variant">{card.hint}</p>
                </div>
                {card.goToWithdrawals && onNavigate && (
                  <button
                    type="button"
                    onClick={() => onNavigate("withdrawals")}
                    className="min-h-6 self-start rounded text-xs font-bold text-on-primary-fixed-variant hover:underline"
                  >
                    Đi tới yêu cầu chuyển tiền →
                  </button>
                )}
              </article>
            ))}
          </section>

          <div className="grid gap-4 lg:grid-cols-2">
            <section
              className={`rounded-2xl border p-5 ${
                data.balanced
                  ? "border-tertiary/35 bg-gradient-to-br from-surface-container-lowest to-[#f1fbf3]"
                  : "border-error/40 bg-error-container/10"
              }`}
              data-testid="reconciliation"
            >
              <div className="flex items-center gap-3">
                <span
                  aria-hidden="true"
                  className={`flex h-10 w-10 items-center justify-center rounded-[14px] ${
                    data.balanced ? "bg-[#d9f7dd] text-on-tertiary-fixed-variant" : "bg-error-container text-error"
                  }`}
                >
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                    {data.balanced ? "verified" : "warning"}
                  </span>
                </span>
                <div>
                  <h2 className="font-headline-md text-headline-md font-bold">
                    {data.balanced ? "Đối soát khớp" : "Đối soát lệch"}
                  </h2>
                  <p className="text-xs text-on-surface-variant">
                    {data.balanced
                      ? "Tiền vào ra khớp với số dư các ví cộng tiền đang giữ"
                      : "Tiền vào ra không khớp với số dư các ví cộng tiền đang giữ"}
                  </p>
                </div>
              </div>
              <dl className="mt-3 grid grid-cols-[1fr_auto] gap-x-4 gap-y-2 text-[13px]">
                <dt className="text-on-surface-variant">Tiền thật vào qua PayOS</dt>
                <dd className="font-bold">{formatVnd(data.cashInViaPayos)}</dd>
                <dt className="text-on-surface-variant">Đã chuyển khoản trả ra (rút tiền)</dt>
                <dd className="font-bold">{formatVnd(data.cashOutWithdrawals)}</dd>
                <dt className="border-t border-outline-variant/40 pt-2 text-on-surface-variant">Chênh lệch</dt>
                <dd
                  className={`border-t border-outline-variant/40 pt-2 font-extrabold ${
                    data.balanced ? "text-tertiary" : "text-error"
                  }`}
                >
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

            <section className="rounded-2xl border border-outline-variant/40 bg-surface-container-lowest p-5 shadow-[0_10px_26px_-14px_rgba(25,28,29,0.28)]">
              <h2 className="font-headline-md text-headline-md font-bold">Tiền trong hệ thống</h2>
              <div
                role="img"
                aria-label={`Phân bổ: ${moneyParts.map((part) => `${part.label} ${formatVnd(part.value)}`).join(", ")}`}
                className="mt-3 flex h-3.5 gap-0.5 overflow-hidden rounded-full bg-surface-container"
              >
                {moneyTotal > 0 &&
                  moneyParts.map((part) => (
                    <div key={part.label} className={part.color} style={{ flex: Math.max(part.value, 0) }} />
                  ))}
              </div>
              <ul className="mt-3 space-y-2 text-[13px]">
                {moneyParts.map((part) => (
                  <li key={part.label} className="flex items-center gap-2">
                    <span aria-hidden="true" className={`h-2.5 w-2.5 rounded-full ${part.color}`} />
                    <span className="flex-1 text-on-surface-variant">{part.label}</span>
                    <b>{formatVnd(part.value)}</b>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </>
      )}

      <section aria-labelledby="superadmin-own-wallet">
        <h2 id="superadmin-own-wallet" className="mb-3 text-lg font-extrabold">
          Ví của Super Admin
        </h2>
        <WalletPage />
      </section>
    </div>
  );
}

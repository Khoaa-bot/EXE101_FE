import { useEffect, useRef, useState } from "react";
import { useDialogA11y } from "../../hooks/useDialogA11y";
import {
  getLoyaltySummary,
  getMyVouchers,
  getPointHistory,
  getVoucherCatalog,
  redeemVoucher,
  type LoyaltySummary,
  type MyVoucher,
  type PointEntry,
  type VoucherTemplate,
  type VoucherType,
} from "../../services/api";
import { formatDateTime, formatVnd } from "../../utils/format";

type Tab = "redeem" | "mine" | "history";
type Filter = "all" | "affordable" | VoucherType;

type LoadResult = {
  key: number;
  summary: LoyaltySummary | null;
  catalog: VoucherTemplate[];
  mine: MyVoucher[];
  history: PointEntry[];
  error: string | null;
};

type Props = {
  onBookingClick: () => void;
};

const TYPE_STYLE: Record<VoucherType, { stub: string; icon: string; label: string }> = {
  FIXED: { stub: "from-[#0059bb] to-[#0070ea]", icon: "sell", label: "Giảm tiền" },
  PERCENT: { stub: "from-[#c47f00] to-[#e29a14]", icon: "percent", label: "Giảm theo %" },
  GIFT: { stub: "from-[#008730] to-[#1fa651]", icon: "card_giftcard", label: "Tặng dịch vụ" },
};

const FILTERS: Array<{ id: Filter; label: string }> = [
  { id: "all", label: "Tất cả" },
  { id: "affordable", label: "Đủ điểm đổi" },
  { id: "FIXED", label: "Giảm tiền" },
  { id: "PERCENT", label: "Giảm theo %" },
  { id: "GIFT", label: "Dịch vụ tặng" },
];

function compactMoney(value: number | null) {
  if (value === null) return "";
  return value >= 1000 ? `${Math.round(value / 1000)}K` : String(value);
}

function stubText(v: { discountType: VoucherType; discountValue: number | null }) {
  if (v.discountType === "PERCENT") return `${v.discountValue ?? 0}%`;
  if (v.discountType === "GIFT") return "Tặng";
  return compactMoney(v.discountValue);
}

function conditionText(v: { minOrder: number; discountType: VoucherType; maxDiscount: number | null }) {
  const parts: string[] = [];
  if (v.minOrder > 0) parts.push(`Đơn từ ${formatVnd(v.minOrder)}`);
  if (v.discountType === "PERCENT" && v.maxDiscount) parts.push(`Giảm tối đa ${formatVnd(v.maxDiscount)}`);
  parts.push("Dùng ở mọi garage");
  return parts.join(" · ");
}

function formatDay(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleDateString("vi-VN");
}

function formatPoints(value: number) {
  return value.toLocaleString("vi-VN");
}

function ConfirmDialog({
  template,
  balance,
  busy,
  error,
  onCancel,
  onConfirm,
}: {
  template: VoucherTemplate;
  balance: number;
  busy: boolean;
  error: string | null;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useDialogA11y(true, ref, onCancel);
  const style = TYPE_STYLE[template.discountType];
  return (
    <div
      ref={ref}
      role="dialog"
      aria-modal="true"
      aria-labelledby="redeem-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
    >
      <div className="flex w-full max-w-[32rem] flex-col gap-4 rounded-[28px] bg-surface-container-lowest p-7 shadow-xl">
        <div className="flex items-center gap-3">
          <span aria-hidden="true" className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#ffe9c2] text-[#7a4a00]">
            <span className="material-symbols-outlined">redeem</span>
          </span>
          <h2 id="redeem-title" className="text-xl font-extrabold">Đổi voucher này bằng điểm?</h2>
        </div>
        <div className="flex overflow-hidden rounded-2xl border-[1.5px] border-outline-variant/60">
          <div className={`flex w-24 shrink-0 items-center justify-center bg-gradient-to-br ${style.stub} text-xl font-extrabold text-white`}>
            {stubText(template)}
          </div>
          <div className="flex flex-col gap-1 border-l-2 border-dashed border-outline-variant px-4 py-3">
            <b>{template.title}</b>
            <span className="text-xs text-on-surface-variant">
              {conditionText(template)} · Hạn dùng {template.validDays} ngày sau khi đổi
            </span>
          </div>
        </div>
        <div className="flex flex-col gap-2 rounded-2xl bg-surface-container-low p-4 text-sm">
          <div className="flex justify-between"><span>Điểm hiện có</span><b>{formatPoints(balance)} điểm</b></div>
          <div className="flex justify-between"><span>Điểm đổi voucher</span><b className="text-error">−{formatPoints(template.pointCost)} điểm</b></div>
          <div className="flex justify-between border-t border-outline-variant pt-2"><span>Điểm còn lại</span><b>{formatPoints(balance - template.pointCost)} điểm</b></div>
        </div>
        <p className="text-xs leading-relaxed text-on-surface-variant">
          Voucher đã đổi không hoàn lại điểm. Bạn chọn voucher này ở bước thanh toán khi đặt lịch.
        </p>
        {error && <p role="alert" className="text-sm font-semibold text-error">{error}</p>}
        <div className="flex justify-end gap-3">
          <button type="button" onClick={onCancel} disabled={busy} className="min-h-11 rounded-2xl border-[1.5px] border-outline-variant px-5 text-sm font-bold disabled:opacity-50">
            Để sau
          </button>
          <button type="button" onClick={onConfirm} disabled={busy} className="inline-flex min-h-11 items-center gap-1.5 rounded-2xl bg-primary px-5 text-sm font-bold text-on-primary disabled:opacity-60">
            <span aria-hidden="true" className="material-symbols-outlined text-xl">redeem</span>
            {busy ? "Đang đổi..." : `Xác nhận đổi ${formatPoints(template.pointCost)} điểm`}
          </button>
        </div>
      </div>
    </div>
  );
}

function SuccessDialog({
  voucher,
  balance,
  onClose,
  onBook,
}: {
  voucher: MyVoucher;
  balance: number;
  onClose: () => void;
  onBook: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  useDialogA11y(true, ref, onClose);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(voucher.code);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div
      ref={ref}
      role="dialog"
      aria-modal="true"
      aria-labelledby="redeemed-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
    >
      <div className="flex w-full max-w-[32rem] flex-col gap-4 rounded-[28px] bg-surface-container-lowest p-7 shadow-xl">
        <div className="flex items-center gap-3">
          <span aria-hidden="true" className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#d9f7dd] text-[#00531a]">
            <span className="material-symbols-outlined">check_circle</span>
          </span>
          <h2 id="redeemed-title" className="text-xl font-extrabold">Đổi voucher thành công</h2>
        </div>
        <p className="text-sm text-on-surface-variant">
          Voucher <b>{voucher.title}</b> đã nằm trong mục “Voucher của tôi”. Còn <b>{formatPoints(balance)} điểm</b>.
        </p>
        <div
          aria-label={`Mã voucher ${voucher.code}`}
          className="rounded-2xl border-[1.5px] border-dashed border-outline-variant bg-surface-container-low px-4 py-3 text-center font-mono text-2xl font-extrabold tracking-[0.12em]"
        >
          {voucher.code}
        </div>
        <div className="flex items-center gap-2 text-sm text-on-surface-variant">
          <span aria-hidden="true" className="material-symbols-outlined text-lg">event</span>
          Dùng được đến {formatDay(voucher.expiresAt)}
        </div>
        <div className="flex flex-wrap justify-end gap-3">
          <button type="button" onClick={copy} className="inline-flex min-h-11 items-center gap-1.5 rounded-2xl border-[1.5px] border-outline-variant px-5 text-sm font-bold">
            <span aria-hidden="true" className="material-symbols-outlined text-xl">content_copy</span>
            {copied ? "Đã sao chép" : "Sao chép mã"}
          </button>
          <button type="button" onClick={onBook} className="inline-flex min-h-11 items-center gap-1.5 rounded-2xl bg-primary px-5 text-sm font-bold text-on-primary">
            <span aria-hidden="true" className="material-symbols-outlined text-xl">event_available</span>
            Đặt lịch ngay
          </button>
        </div>
        <button type="button" onClick={onClose} className="min-h-10 self-center text-sm font-semibold text-on-surface-variant underline">
          Đóng
        </button>
      </div>
    </div>
  );
}

export default function PointsPage({ onBookingClick }: Props) {
  const [tab, setTab] = useState<Tab>("redeem");
  const [filter, setFilter] = useState<Filter>("all");
  const [reloadKey, setReloadKey] = useState(0);
  const [result, setResult] = useState<LoadResult | null>(null);
  const [confirming, setConfirming] = useState<VoucherTemplate | null>(null);
  const [redeeming, setRedeeming] = useState(false);
  const [redeemError, setRedeemError] = useState<string | null>(null);
  const [redeemed, setRedeemed] = useState<{ voucher: MyVoucher; balanceAfter: number } | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([getLoyaltySummary(), getVoucherCatalog(), getMyVouchers(), getPointHistory()])
      .then(([summary, catalog, mine, history]) => {
        if (!cancelled) setResult({ key: reloadKey, summary, catalog, mine, history, error: null });
      })
      .catch((err) => {
        if (!cancelled) {
          setResult({
            key: reloadKey,
            summary: null,
            catalog: [],
            mine: [],
            history: [],
            error: err instanceof Error ? err.message : "Không tải được điểm thưởng.",
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const summary = result?.summary ?? null;
  const balance = summary?.balance ?? 0;
  const catalog = result?.catalog ?? [];
  const mine = result?.mine ?? [];
  const history = result?.history ?? [];
  const unusedCount = mine.filter((v) => v.status === "unused").length;

  const visibleCatalog = catalog.filter((t) => {
    if (filter === "all") return true;
    if (filter === "affordable") return balance >= t.pointCost;
    return t.discountType === filter;
  });

  const confirmRedeem = () => {
    if (!confirming) return;
    const balanceAfter = balance - confirming.pointCost;
    setRedeeming(true);
    setRedeemError(null);
    redeemVoucher(confirming.id)
      .then((voucher) => {
        setConfirming(null);
        setRedeemed({ voucher, balanceAfter });
        setTab("mine");
        setReloadKey((key) => key + 1);
      })
      .catch((err) => setRedeemError(err instanceof Error ? err.message : "Không đổi được voucher."))
      .finally(() => setRedeeming(false));
  };

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-5 px-4 py-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Điểm thưởng và voucher</h1>
        <p className="mt-1 text-on-surface-variant">Tích điểm mỗi lần sửa xe xong, dùng điểm đổi voucher giảm giá.</p>
      </div>

      {result === null && <p className="text-on-surface-variant">Đang tải điểm thưởng...</p>}
      {result?.error && <p role="alert" className="text-error">{result.error}</p>}

      {summary && (
        <>
          <section aria-label="Điểm hiện có" className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0059bb] to-[#0070ea] p-6 text-white">
            <span aria-hidden="true" className="material-symbols-outlined pointer-events-none absolute -right-4 -top-6 text-[180px] opacity-10">redeem</span>
            <div className="text-sm font-semibold opacity-85">Điểm hiện có</div>
            <div className="mt-1 text-5xl font-extrabold tracking-tight">
              {formatPoints(summary.balance)} <span className="text-xl font-bold">điểm</span>
            </div>
            <div className="mt-1 text-sm opacity-90">
              Cứ chi <b>{formatVnd(summary.vndPerPoint)}</b> cho dịch vụ đã hoàn thành được <b>1 điểm</b>.
            </div>
            <div className="mt-5 grid max-w-md grid-cols-2 gap-3">
              <div className="rounded-2xl bg-white/15 px-4 py-3">
                <div className="text-xs opacity-85">Tổng điểm đã tích</div>
                <b className="text-lg">{formatPoints(summary.totalEarned)}</b>
              </div>
              <div className="rounded-2xl bg-white/15 px-4 py-3">
                <div className="text-xs opacity-85">Đã đổi voucher</div>
                <b className="text-lg">{formatPoints(summary.totalSpent)}</b>
              </div>
            </div>
          </section>

          <div role="tablist" aria-label="Mục điểm thưởng" className="inline-flex self-start rounded-2xl bg-surface-container p-1">
            {(
              [
                { id: "redeem", label: "Đổi voucher", icon: "storefront" },
                { id: "mine", label: `Voucher của tôi${unusedCount ? ` (${unusedCount})` : ""}`, icon: "confirmation_number" },
                { id: "history", label: "Lịch sử điểm", icon: "history" },
              ] as Array<{ id: Tab; label: string; icon: string }>
            ).map((item) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={tab === item.id}
                onClick={() => setTab(item.id)}
                className={`inline-flex min-h-10 items-center gap-1.5 rounded-xl px-4 text-sm font-bold ${
                  tab === item.id ? "bg-surface-container-lowest text-primary shadow-sm" : "text-on-surface-variant"
                }`}
              >
                <span aria-hidden="true" className="material-symbols-outlined text-xl">{item.icon}</span>
                {item.label}
              </button>
            ))}
          </div>

          {tab === "redeem" && (
            <section aria-label="Voucher có thể đổi" className="flex flex-col gap-4">
              <div role="group" aria-label="Lọc voucher" className="flex flex-wrap gap-2">
                {FILTERS.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    aria-pressed={filter === item.id}
                    onClick={() => setFilter(item.id)}
                    className={`min-h-9 rounded-full border px-3.5 text-[13px] font-semibold ${
                      filter === item.id
                        ? "border-primary bg-primary-fixed text-on-primary-fixed-variant"
                        : "border-outline-variant bg-surface-container-lowest text-on-surface-variant"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
              {catalog.length === 0 && <p className="text-on-surface-variant">Hiện chưa có voucher nào để đổi.</p>}
              {catalog.length > 0 && visibleCatalog.length === 0 && (
                <p className="text-on-surface-variant">Không có voucher phù hợp với bộ lọc này.</p>
              )}
              <div className="grid gap-4 md:grid-cols-2">
                {visibleCatalog.map((template) => {
                  const style = TYPE_STYLE[template.discountType];
                  const missing = template.pointCost - balance;
                  const affordable = missing <= 0;
                  return (
                    <article key={template.id} className={`flex overflow-hidden rounded-[20px] border-[1.5px] border-outline-variant/60 ${affordable ? "bg-surface-container-lowest" : "bg-surface-container-low"}`}>
                      <div className={`flex w-28 shrink-0 flex-col items-center justify-center gap-0.5 bg-gradient-to-br px-2 py-4 text-center text-white ${affordable ? style.stub : "from-[#9aa0ae] to-[#b3b8c4]"}`}>
                        <span aria-hidden="true" className="material-symbols-outlined text-2xl">{style.icon}</span>
                        <b className="text-2xl font-extrabold leading-tight">{stubText(template)}</b>
                        <span className="text-xs font-semibold">{style.label}</span>
                      </div>
                      <div className="flex min-w-0 flex-1 flex-col gap-1.5 border-l-2 border-dashed border-outline-variant px-4 py-4">
                        <b className="text-base">{template.title}</b>
                        <span className="text-xs text-on-surface-variant">{conditionText(template)}</span>
                        <span className="text-xs text-on-surface-variant">Hạn dùng {template.validDays} ngày sau khi đổi</span>
                        <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
                          <span className="inline-flex items-center gap-1 font-extrabold text-[#9a5b00]">
                            <span aria-hidden="true" className="material-symbols-outlined text-lg text-[#c47f00]">stars</span>
                            {formatPoints(template.pointCost)} điểm
                          </span>
                          {affordable ? (
                            <button
                              type="button"
                              onClick={() => {
                                setRedeemError(null);
                                setConfirming(template);
                              }}
                              className="min-h-11 rounded-2xl bg-primary px-4 text-sm font-bold text-on-primary"
                            >
                              Đổi ngay
                            </button>
                          ) : (
                            <span className="text-xs font-bold text-on-surface-variant">Cần thêm {formatPoints(missing)} điểm</span>
                          )}
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          )}

          {tab === "mine" && (
            <section aria-label="Voucher của tôi" className="rounded-3xl border border-outline-variant/50 bg-surface-container-lowest p-5">
              {mine.length === 0 && <p className="text-on-surface-variant">Bạn chưa đổi voucher nào. Chọn “Đổi voucher” để bắt đầu.</p>}
              {mine.map((v) => (
                <div key={v.id} className={`flex flex-wrap items-center gap-4 border-t border-outline-variant/50 py-3.5 first:border-t-0 ${v.status !== "unused" ? "opacity-70" : ""}`}>
                  <span aria-hidden="true" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary-fixed text-on-primary-fixed-variant">
                    <span className="material-symbols-outlined">{TYPE_STYLE[v.discountType].icon}</span>
                  </span>
                  <div className="min-w-0 flex-1">
                    <b>{v.title}</b>
                    <div className="text-xs text-on-surface-variant">
                      {conditionText(v)} ·{" "}
                      {v.status === "used" && v.usedAt ? `Đã dùng ${formatDay(v.usedAt)}` : `Hạn dùng đến ${formatDay(v.expiresAt)}`}
                    </div>
                  </div>
                  <span className="rounded-lg bg-surface-container-low px-2 py-1 font-mono text-sm font-bold tracking-widest">{v.code}</span>
                  <span
                    className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-bold ${
                      v.status === "unused" ? "bg-[#d9f7dd] text-[#00531a]" : v.status === "used" ? "bg-[#e9eaeb] text-[#3a3f4b]" : "bg-[#ffdad6] text-[#93000a]"
                    }`}
                  >
                    {v.status === "unused" ? "Chưa dùng" : v.status === "used" ? "Đã dùng" : "Hết hạn"}
                  </span>
                </div>
              ))}
            </section>
          )}

          {tab === "history" && (
            <section aria-label="Lịch sử điểm" className="rounded-3xl border border-outline-variant/50 bg-surface-container-lowest p-5">
              {history.length === 0 && <p className="text-on-surface-variant">Chưa có lịch sử điểm. Điểm được cộng sau khi bạn thanh toán xong một dịch vụ.</p>}
              {history.map((entry) => (
                <div key={entry.id} className="flex items-center gap-4 border-t border-outline-variant/50 py-3.5 first:border-t-0">
                  <span
                    aria-hidden="true"
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${entry.points > 0 ? "bg-[#d9f7dd] text-[#00531a]" : "bg-[#ffdad6] text-[#93000a]"}`}
                  >
                    <span className="material-symbols-outlined">{entry.points > 0 ? "add_circle" : "remove_circle"}</span>
                  </span>
                  <div className="min-w-0 flex-1">
                    <b>{entry.description}</b>
                    <div className="text-xs text-on-surface-variant">{formatDateTime(entry.createdAt)}</div>
                  </div>
                  <b className={entry.points > 0 ? "text-[#00531a]" : "text-[#93000a]"}>
                    {entry.points > 0 ? "+" : "−"}
                    {formatPoints(Math.abs(entry.points))} điểm
                  </b>
                </div>
              ))}
            </section>
          )}
        </>
      )}

      {confirming && (
        <ConfirmDialog
          template={confirming}
          balance={balance}
          busy={redeeming}
          error={redeemError}
          onCancel={() => setConfirming(null)}
          onConfirm={confirmRedeem}
        />
      )}
      {redeemed && (
        <SuccessDialog
          voucher={redeemed.voucher}
          balance={redeemed.balanceAfter}
          onClose={() => setRedeemed(null)}
          onBook={() => {
            setRedeemed(null);
            onBookingClick();
          }}
        />
      )}
    </div>
  );
}

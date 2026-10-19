import { useMemo, useRef, useState } from "react";
import { useDialogA11y } from "../../hooks/useDialogA11y";
import type { WalletTransactionItem } from "../../services/api";
import { formatDateTime, formatVnd } from "../../utils/format";

const RECENT_COUNT = 5;
const PAGE_SIZE = 10;
const RECENT_DAYS = 30;
const DAY_MS = 24 * 60 * 60 * 1000;

// Loại giao dịch -> nhãn, icon và chiều tiền (+ vào ví, - ra khỏi ví).
const TRANSACTION_META: Record<string, { label: string; icon: string; sign: 1 | -1 }> = {
  TOPUP: { label: "Nạp tiền", icon: "add_card", sign: 1 },
  PAYMENT: { label: "Thanh toán dịch vụ", icon: "shopping_bag", sign: -1 },
  RECEIVE_PAYMENT: { label: "Nhận thanh toán", icon: "payments", sign: 1 },
  COMMISSION: { label: "Hoa hồng", icon: "percent", sign: 1 },
  COMMISSION_DEBIT: { label: "Trừ hoa hồng tiền mặt", icon: "percent", sign: -1 },
  REFUND: { label: "Hoàn tiền", icon: "undo", sign: 1 },
  WITHDRAW: { label: "Rút tiền", icon: "account_balance", sign: -1 },
  WITHDRAW_REFUND: { label: "Hoàn tiền rút", icon: "undo", sign: 1 },
};

const REFERENCE_LABELS: Record<string, string> = {
  APPOINTMENT: "Lịch hẹn",
  WITHDRAWAL: "Yêu cầu rút tiền",
  WITHDRAW: "Yêu cầu rút tiền",
  INVOICE: "Hóa đơn",
};

function metaOf(item: WalletTransactionItem) {
  return TRANSACTION_META[item.type] ?? { label: item.type, icon: "receipt_long", sign: 1 as const };
}

function timeOnly(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? ""
    : date.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
}

function dayLabel(value: string, now: Date) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Không rõ ngày";
  const text = date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
  const startOf = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const diff = Math.round((startOf(now) - startOf(date)) / DAY_MS);
  if (diff === 0) return `Hôm nay · ${text}`;
  if (diff === 1) return `Hôm qua · ${text}`;
  return text;
}

function pageList(current: number, total: number): (number | "gap")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i);
  const set = new Set<number>([0, total - 1, current - 1, current, current + 1]);
  if (current < 3) [1, 2, 3].forEach((n) => set.add(n));
  if (current > total - 4) [total - 2, total - 3, total - 4].forEach((n) => set.add(n));
  const sorted = [...set].filter((n) => n >= 0 && n < total).sort((a, b) => a - b);
  const out: (number | "gap")[] = [];
  sorted.forEach((n, i) => {
    if (i > 0 && n - sorted[i - 1] > 1) out.push("gap");
    out.push(n);
  });
  return out;
}

function AmountText({ item, className = "" }: { item: WalletTransactionItem; className?: string }) {
  const { sign } = metaOf(item);
  return (
    <span className={`font-extrabold ${sign > 0 ? "text-tertiary" : "text-error"} ${className}`}>
      {sign > 0 ? "+" : "−"}
      {formatVnd(item.amount)}
    </span>
  );
}

function TypeIcon({ item, size = "md" }: { item: WalletTransactionItem; size?: "md" | "lg" }) {
  const { sign, icon } = metaOf(item);
  const dim = size === "lg" ? "h-[52px] w-[52px] rounded-[18px]" : "h-10 w-10 rounded-[14px]";
  return (
    <span
      aria-hidden="true"
      className={`flex shrink-0 items-center justify-center ${dim} ${
        sign > 0 ? "bg-[#d9f7dd] text-[#00531a]" : "bg-[#ffe4d6] text-[#7a2e00]"
      }`}
    >
      <span className={`material-symbols-outlined ${size === "lg" ? "text-[28px]" : ""}`}>{icon}</span>
    </span>
  );
}

function TransactionRow({
  item,
  onOpen,
  showDate,
}: {
  item: WalletTransactionItem;
  onOpen: () => void;
  showDate: boolean;
}) {
  const meta = metaOf(item);
  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex w-full items-center gap-3.5 px-5 py-3 text-left hover:bg-surface-container-low/70"
    >
      <TypeIcon item={item} />
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-bold">{meta.label}</span>
        <span className="block truncate text-xs text-on-surface-variant">
          {showDate ? formatDateTime(item.createdAt) : timeOnly(item.createdAt)}
          {item.description ? ` · ${item.description}` : ""}
        </span>
      </span>
      <span className="text-right">
        <AmountText item={item} className="block text-sm" />
        {item.balanceAfter !== null && (
          <span className="block text-xs text-on-surface-variant">Số dư: {formatVnd(item.balanceAfter)}</span>
        )}
      </span>
      <span aria-hidden="true" className="material-symbols-outlined text-outline">
        chevron_right
      </span>
    </button>
  );
}

function Overlay({ children }: { children: React.ReactNode }) {
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">{children}</div>;
}

type Filter = "all" | "in" | "out";
const FILTERS: Array<{ key: Filter; label: string }> = [
  { key: "all", label: "Tất cả" },
  { key: "in", label: "Tiền vào" },
  { key: "out", label: "Tiền ra" },
];

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`inline-flex min-h-9 items-center gap-1 rounded-full border px-3.5 text-[13px] font-semibold ${
        active
          ? "border-primary bg-primary-fixed text-on-primary-fixed-variant"
          : "border-outline-variant bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container-low"
      }`}
    >
      {children}
    </button>
  );
}

function AllTransactionsDialog({
  items,
  onClose,
  onOpen,
}: {
  items: WalletTransactionItem[];
  onClose: () => void;
  onOpen: (item: WalletTransactionItem) => void;
}) {
  const [filter, setFilter] = useState<Filter>("all");
  const [recentOnly, setRecentOnly] = useState(false);
  const [page, setPage] = useState(0);
  const [now] = useState(() => new Date());
  const ref = useRef<HTMLDivElement>(null);
  useDialogA11y(true, ref, onClose);

  const filtered = useMemo(() => {
    const since = now.getTime() - RECENT_DAYS * DAY_MS;
    return items.filter((item) => {
      const sign = metaOf(item).sign;
      if (filter === "in" && sign < 0) return false;
      if (filter === "out" && sign > 0) return false;
      if (recentOnly && new Date(item.createdAt).getTime() < since) return false;
      return true;
    });
  }, [items, filter, recentOnly, now]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages - 1);
  const pageItems = filtered.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE);
  const from = filtered.length === 0 ? 0 : safePage * PAGE_SIZE + 1;
  const to = safePage * PAGE_SIZE + pageItems.length;

  const groups: Array<{ label: string; rows: WalletTransactionItem[] }> = [];
  for (const item of pageItems) {
    const label = dayLabel(item.createdAt, now);
    const last = groups[groups.length - 1];
    if (last && last.label === label) last.rows.push(item);
    else groups.push({ label, rows: [item] });
  }

  const change = (apply: () => void) => {
    apply();
    setPage(0);
  };

  return (
    <Overlay>
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby="wallet-all-title"
        className="flex max-h-[92dvh] w-full max-w-[38rem] flex-col overflow-hidden rounded-3xl bg-surface-container-lowest shadow-[0_30px_70px_-20px_rgba(0,0,0,0.55)]"
      >
        <div className="flex items-start justify-between px-6 pb-3 pt-5">
          <div>
            <h2 id="wallet-all-title" className="text-xl font-extrabold">
              Tất cả giao dịch
            </h2>
            <p aria-live="polite" className="mt-0.5 text-xs text-on-surface-variant">
              {filtered.length} giao dịch{filtered.length > 0 ? ` · Hiển thị ${from}–${to}` : ""}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-container hover:bg-surface-container-high"
          >
            <span aria-hidden="true" className="material-symbols-outlined">
              close
            </span>
          </button>
        </div>

        <div role="group" aria-label="Lọc giao dịch" className="flex flex-wrap items-center gap-2 px-6 pb-3">
          {FILTERS.map((f) => (
            <Chip key={f.key} active={filter === f.key} onClick={() => change(() => setFilter(f.key))}>
              {f.label}
            </Chip>
          ))}
          <span className="flex-1" />
          <Chip active={recentOnly} onClick={() => change(() => setRecentOnly((v) => !v))}>
            <span aria-hidden="true" className="material-symbols-outlined text-lg">
              calendar_month
            </span>
            {RECENT_DAYS} ngày qua
          </Chip>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto border-t border-outline-variant/40">
          {groups.length === 0 ? (
            <p className="px-6 py-10 text-center text-sm text-on-surface-variant">Không có giao dịch phù hợp.</p>
          ) : (
            groups.map((group) => (
              <section key={group.label} aria-label={group.label}>
                <h3 className="sticky top-0 bg-surface-container-low px-6 pb-1 pt-2.5 text-[11px] font-bold uppercase tracking-wider text-outline">
                  {group.label}
                </h3>
                {group.rows.map((item) => (
                  <TransactionRow key={item.id} item={item} showDate={false} onOpen={() => onOpen(item)} />
                ))}
              </section>
            ))
          )}
        </div>

        <nav
          aria-label="Phân trang"
          className="flex items-center justify-between border-t border-outline-variant/40 px-6 py-3"
        >
          <span className="text-xs text-on-surface-variant">
            Trang {safePage + 1}/{totalPages}
          </span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={safePage === 0}
              onClick={() => setPage(safePage - 1)}
              aria-label="Trang trước"
              className="flex h-[34px] min-w-[34px] items-center justify-center rounded-[10px] border border-outline-variant hover:bg-surface-container-low disabled:opacity-45"
            >
              <span aria-hidden="true" className="material-symbols-outlined text-xl">
                chevron_left
              </span>
            </button>
            {pageList(safePage, totalPages).map((p, i) =>
              p === "gap" ? (
                <span key={`gap-${i}`} aria-hidden="true" className="px-1 text-outline">
                  …
                </span>
              ) : (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPage(p)}
                  aria-label={`Trang ${p + 1}`}
                  aria-current={p === safePage ? "page" : undefined}
                  className={`h-[34px] min-w-[34px] rounded-[10px] border px-2 text-[13px] font-bold ${
                    p === safePage
                      ? "border-primary bg-primary text-on-primary"
                      : "border-outline-variant hover:bg-surface-container-low"
                  }`}
                >
                  {p + 1}
                </button>
              ),
            )}
            <button
              type="button"
              disabled={safePage + 1 >= totalPages}
              onClick={() => setPage(safePage + 1)}
              aria-label="Trang sau"
              className="flex h-[34px] min-w-[34px] items-center justify-center rounded-[10px] border border-outline-variant hover:bg-surface-container-low disabled:opacity-45"
            >
              <span aria-hidden="true" className="material-symbols-outlined text-xl">
                chevron_right
              </span>
            </button>
          </div>
        </nav>
      </div>
    </Overlay>
  );
}

function TransactionDetailDialog({
  item,
  fromList,
  onBack,
  onClose,
}: {
  item: WalletTransactionItem;
  fromList: boolean;
  onBack: () => void;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useDialogA11y(true, ref, fromList ? onBack : onClose);
  const meta = metaOf(item);

  const copyId = () => {
    navigator.clipboard
      ?.writeText(String(item.id))
      .then(() => {
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1500);
      })
      .catch(() => undefined);
  };

  const referenceText = item.referenceType
    ? `${REFERENCE_LABELS[item.referenceType.toUpperCase()] ?? item.referenceType}${
        item.referenceId !== null ? ` #${item.referenceId}` : ""
      }`
    : null;

  const rows: Array<{ label: string; value: React.ReactNode }> = [
    { label: "Thời gian", value: formatDateTime(item.createdAt) },
    {
      label: "Mã giao dịch",
      value: (
        <span className="inline-flex items-center gap-1 font-mono">
          #{item.id}
          <button
            type="button"
            onClick={copyId}
            aria-label="Sao chép mã giao dịch"
            className="flex h-7 w-7 items-center justify-center rounded-full text-on-primary-fixed-variant hover:bg-primary-fixed/50"
          >
            <span aria-hidden="true" className="material-symbols-outlined text-lg">
              {copied ? "check" : "content_copy"}
            </span>
          </button>
        </span>
      ),
    },
  ];
  if (item.description) rows.push({ label: "Nội dung", value: item.description });
  if (referenceText) rows.push({ label: "Liên quan", value: referenceText });
  if (item.balanceBefore !== null) rows.push({ label: "Số dư trước", value: formatVnd(item.balanceBefore) });
  if (item.balanceAfter !== null) rows.push({ label: "Số dư sau", value: formatVnd(item.balanceAfter) });

  return (
    <Overlay>
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby="wallet-detail-title"
        className="max-h-[92dvh] w-full max-w-[28.75rem] overflow-y-auto rounded-3xl bg-surface-container-lowest p-7 shadow-[0_30px_70px_-20px_rgba(0,0,0,0.55)]"
      >
        <div className="flex items-start justify-between">
          <TypeIcon item={item} size="lg" />
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-container hover:bg-surface-container-high"
          >
            <span aria-hidden="true" className="material-symbols-outlined">
              close
            </span>
          </button>
        </div>
        <h2 id="wallet-detail-title" className="mt-3.5 text-lg font-extrabold">
          {meta.label}
        </h2>
        <AmountText item={item} className="mt-0.5 block text-[32px] tracking-tight" />
        <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-[#d9f7dd] px-2.5 py-1 text-xs font-bold text-[#00531a]">
          <i aria-hidden="true" className="h-[7px] w-[7px] rounded-full bg-tertiary-container" />
          Thành công
        </span>

        <dl className="mt-5 grid grid-cols-[auto_1fr] gap-x-5 gap-y-3 rounded-2xl bg-surface-container-low p-[18px] text-sm">
          {rows.map((row) => (
            <div key={row.label} className="contents">
              <dt className="text-on-surface-variant">{row.label}</dt>
              <dd className="text-right font-semibold">{row.value}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-5 flex items-center justify-between gap-3">
          {fromList ? (
            <button
              type="button"
              onClick={onBack}
              className="min-h-11 rounded-xl px-3 text-sm font-semibold text-on-surface-variant hover:bg-surface-container-low"
            >
              ← Về danh sách
            </button>
          ) : (
            <span />
          )}
          <button
            type="button"
            onClick={onClose}
            className="min-h-11 rounded-xl bg-gradient-to-br from-primary to-primary-container px-6 text-sm font-bold text-on-primary"
          >
            Đóng
          </button>
        </div>
      </div>
    </Overlay>
  );
}

type View = { kind: "none" } | { kind: "list" } | { kind: "detail"; item: WalletTransactionItem; fromList: boolean };

// Lịch sử giao dịch: thẻ chỉ hiện vài giao dịch mới nhất; xem đầy đủ và chi tiết trong hộp thoại.
export default function WalletHistory({ history }: { history: WalletTransactionItem[] }) {
  const [view, setView] = useState<View>({ kind: "none" });

  const sorted = useMemo(
    () => [...history].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [history],
  );
  const recent = sorted.slice(0, RECENT_COUNT);
  const older = sorted.length - recent.length;

  return (
    <section
      aria-labelledby="wallet-history-title"
      className="overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest"
    >
      <div className="flex items-center justify-between gap-3 px-5 pb-3 pt-5">
        <div>
          <h2 id="wallet-history-title" className="font-headline-md text-headline-md">
            Lịch sử giao dịch
          </h2>
          {sorted.length > 0 && (
            <p className="mt-0.5 text-xs text-on-surface-variant">
              {sorted.length > RECENT_COUNT ? `${recent.length} giao dịch gần nhất` : `${sorted.length} giao dịch`}
            </p>
          )}
        </div>
        {older > 0 && (
          <button
            type="button"
            onClick={() => setView({ kind: "list" })}
            className="inline-flex min-h-10 items-center gap-1 rounded-xl border-[1.5px] border-outline-variant px-3.5 text-[13px] font-bold text-on-primary-fixed-variant hover:bg-surface-container-low"
          >
            Xem tất cả
            <span aria-hidden="true" className="material-symbols-outlined text-lg">
              arrow_forward
            </span>
          </button>
        )}
      </div>

      {sorted.length === 0 ? (
        <p className="px-5 pb-5 text-sm text-on-surface-variant">Chưa có giao dịch nào.</p>
      ) : (
        <ul className="divide-y divide-outline-variant/40 border-t border-outline-variant/40">
          {recent.map((item) => (
            <li key={item.id}>
              <TransactionRow
                item={item}
                showDate
                onOpen={() => setView({ kind: "detail", item, fromList: false })}
              />
            </li>
          ))}
        </ul>
      )}

      {older > 0 && (
        <div className="flex items-center justify-between border-t border-outline-variant/40 bg-surface-container-low/50 px-5 py-3">
          <span className="text-xs text-on-surface-variant">Còn {older} giao dịch cũ hơn</span>
          <button
            type="button"
            onClick={() => setView({ kind: "list" })}
            className="min-h-9 text-[13px] font-bold text-on-primary-fixed-variant hover:underline"
          >
            Xem tất cả giao dịch →
          </button>
        </div>
      )}

      {view.kind === "list" && (
        <AllTransactionsDialog
          items={sorted}
          onClose={() => setView({ kind: "none" })}
          onOpen={(item) => setView({ kind: "detail", item, fromList: true })}
        />
      )}
      {view.kind === "detail" && (
        <TransactionDetailDialog
          item={view.item}
          fromList={view.fromList}
          onBack={() => setView({ kind: "list" })}
          onClose={() => setView({ kind: "none" })}
        />
      )}
    </section>
  );
}

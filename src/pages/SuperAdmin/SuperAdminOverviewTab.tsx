import { useEffect, useState } from "react";
import {
  getAdminGarages,
  getAllUsers,
  getPendingWithdrawalCount,
  getPlatformWallet,
  type PlatformWallet,
  type SuperAdminGarage,
  type SuperAdminUser,
} from "../../services/api";
import { formatVnd } from "../../utils/format";
import OverviewStatsSection from "./OverviewStatsSection";

type OverviewTarget = "customers" | "garages" | "withdrawals";

type Props = {
  onNavigate: (tab: OverviewTarget) => void;
};

type OverviewData = {
  customers: SuperAdminUser[] | null;
  garages: SuperAdminGarage[] | null;
  wallet: PlatformWallet | null;
  pendingCount: number | null;
};

const EMPTY: OverviewData = { customers: null, garages: null, wallet: null, pendingCount: null };

function settled<T>(result: PromiseSettledResult<T>): T | null {
  return result.status === "fulfilled" ? result.value : null;
}

function formatCount(count: number | null) {
  return count === null ? "—" : count.toLocaleString("vi-VN");
}

export default function SuperAdminOverviewTab({ onNavigate }: Props) {
  const [data, setData] = useState<OverviewData>(EMPTY);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Promise.allSettled([
      getAllUsers({ role: "customer", includeHidden: true }),
      getAdminGarages(true),
      getPlatformWallet(),
      getPendingWithdrawalCount(),
    ]).then(([customers, garages, wallet, pending]) => {
      if (cancelled) return;
      setData({
        customers: settled(customers),
        garages: settled(garages),
        wallet: settled(wallet),
        pendingCount: settled(pending),
      });
      setLoaded(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Danh sách khách lấy cả người đã ẩn để đếm đăng ký mới; các con số quản lý chỉ tính khách chưa ẩn.
  const visibleCustomers = data.customers?.filter((u) => !u.hidden) ?? null;
  const blockedCustomers = visibleCustomers?.filter((u) => u.status === "blocked").length ?? null;
  const garagesWithoutOwner = data.garages?.filter((g) => g.ownerId === null && !g.hidden) ?? null;
  const blockedGarages = data.garages?.filter((g) => g.status === "blocked").length ?? null;
  const hiddenGarages = data.garages?.filter((g) => g.hidden).length ?? null;
  const wallet = data.wallet;
  const hasFailure = Object.values(data).some((value) => value === null);

  const kpis: { icon: string; tone: string; label: string; value: string; hint: string }[] = [
    {
      icon: "groups",
      tone: "bg-primary-fixed text-on-primary-fixed-variant",
      label: "Khách hàng",
      value: formatCount(visibleCustomers?.length ?? null),
      hint: blockedCustomers === null ? "" : `${blockedCustomers} đang bị chặn`,
    },
    {
      icon: "storefront",
      tone: "bg-[#d9f7dd] text-on-tertiary-fixed-variant",
      label: "Garage",
      value: formatCount(data.garages?.length ?? null),
      hint:
        blockedGarages === null || hiddenGarages === null
          ? ""
          : `${blockedGarages} bị chặn · ${hiddenGarages} đã ẩn`,
    },
    {
      icon: "payments",
      tone: "bg-[#ffe4d6] text-[#7a2e00]",
      label: "Yêu cầu chuyển tiền chờ",
      value: formatCount(data.pendingCount),
      hint: wallet ? `Tổng ${formatVnd(wallet.pendingWithdrawals)}` : "",
    },
    {
      icon: "account_balance",
      tone: "bg-[#e6defa] text-[#3b2a7a]",
      label: "Hoa hồng đã nhận",
      value: wallet ? formatVnd(wallet.totalCommission) : "—",
      hint: "Đã vào ví nền tảng",
    },
  ];

  const todos: {
    key: OverviewTarget;
    icon: string;
    tone: string;
    title: string;
    text: string;
    action: string;
  }[] = [];
  if (data.pendingCount && data.pendingCount > 0) {
    todos.push({
      key: "withdrawals",
      icon: "payments",
      tone: "bg-[#ffe4d6] text-[#7a2e00]",
      title: `${data.pendingCount} yêu cầu chuyển tiền đang chờ`,
      text: "Chuyển khoản thủ công rồi bấm xác nhận",
      action: "Xử lý",
    });
  }
  if (garagesWithoutOwner && garagesWithoutOwner.length > 0) {
    const extra = garagesWithoutOwner.length - 1;
    todos.push({
      key: "garages",
      icon: "person_off",
      tone: "bg-[#fff1cc] text-[#6b4200]",
      title: `${garagesWithoutOwner.length} garage chưa có Admin Garage`,
      text: `${garagesWithoutOwner[0].name}${extra > 0 ? ` và ${extra} garage khác` : ""} cần được gán Admin để vận hành`,
      action: "Gán Admin",
    });
  }
  if (blockedGarages && blockedGarages > 0) {
    todos.push({
      key: "garages",
      icon: "block",
      tone: "bg-surface-container text-on-surface-variant",
      title: `${blockedGarages} garage đang bị chặn`,
      text: "Kiểm tra và mở chặn nếu đã giải quyết xong",
      action: "Xem",
    });
  }
  if (blockedCustomers && blockedCustomers > 0) {
    todos.push({
      key: "customers",
      icon: "person_off",
      tone: "bg-[#fff1cc] text-[#6b4200]",
      title: `${blockedCustomers} khách hàng đang bị chặn`,
      text: "Xem lại danh sách khách bị chặn",
      action: "Xem",
    });
  }

  const moneyParts = wallet
    ? [
        { label: "Hoa hồng đã nhận", value: wallet.totalCommission, color: "bg-primary" },
        { label: "Đang giữ hộ khách", value: wallet.heldForCustomers, color: "bg-[#c47f00]" },
        { label: "Số dư các ví", value: wallet.totalUserBalances, color: "bg-tertiary-container" },
      ]
    : [];
  const moneyTotal = moneyParts.reduce((sum, part) => sum + Math.max(part.value, 0), 0);

  return (
    <div className="space-y-5">
      {!loaded && <p className="text-on-surface-variant">Đang tải...</p>}

      <section aria-label="Số liệu chính" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => (
          <article
            key={kpi.label}
            className="flex items-center gap-4 rounded-2xl border border-outline-variant/40 bg-surface-container-lowest p-5"
          >
            <span
              aria-hidden="true"
              className={`flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-2xl ${kpi.tone}`}
            >
              <span className="material-symbols-outlined text-[26px]">{kpi.icon}</span>
            </span>
            <div className="min-w-0">
              <p className="text-body-sm text-on-surface-variant">{kpi.label}</p>
              <p className="truncate text-[26px] font-extrabold leading-tight tracking-tight">
                {kpi.value}
              </p>
              {kpi.hint && <p className="text-xs text-on-surface-variant">{kpi.hint}</p>}
            </div>
          </article>
        ))}
      </section>

      <OverviewStatsSection customerCreatedAt={data.customers ? data.customers.map((u) => u.createdAt) : null} />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
        <section className="rounded-2xl border border-outline-variant/40 bg-surface-container-lowest p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-headline-md text-headline-md font-bold">Cần xử lý</h2>
            {todos.length > 0 && (
              <span className="rounded-full bg-[#ffe4d6] px-2.5 py-1 text-xs font-bold text-[#7a2e00]">
                {todos.length} việc
              </span>
            )}
          </div>

          <div className="mt-4 space-y-3">
            {loaded && hasFailure && (
              <p
                className="flex items-center gap-2 rounded-xl bg-error-container/40 px-4 py-4 text-on-error-container"
                role="alert"
              >
                <span aria-hidden="true" className="material-symbols-outlined text-error">
                  error
                </span>
                Không tải được một số số liệu nên danh sách có thể chưa đầy đủ. Thử tải lại trang.
              </p>
            )}
            {loaded && !hasFailure && todos.length === 0 && (
              <p className="flex items-center gap-2 rounded-xl bg-tertiary-container/10 px-4 py-4 text-on-surface">
                <span aria-hidden="true" className="material-symbols-outlined text-tertiary">
                  check_circle
                </span>
                Mọi thứ đều ổn, hiện không có việc cần xử lý.
              </p>
            )}
            {todos.map((todo) => (
              <div
                key={todo.key}
                className="flex items-center gap-4 rounded-2xl border border-outline-variant/40 bg-surface px-4 py-3.5"
              >
                <span
                  aria-hidden="true"
                  className={`flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-[14px] ${todo.tone}`}
                >
                  <span className="material-symbols-outlined">{todo.icon}</span>
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold">{todo.title}</p>
                  <p className="text-xs text-on-surface-variant">{todo.text}</p>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigate(todo.key)}
                  className="flex min-h-9 items-center gap-1 rounded-xl border-[1.5px] border-primary bg-surface-container-lowest px-3.5 text-[13px] font-bold text-on-primary-fixed-variant hover:bg-primary-fixed/40"
                >
                  {todo.action}
                  <span aria-hidden="true" className="material-symbols-outlined text-[18px]">
                    arrow_forward
                  </span>
                </button>
              </div>
            ))}
          </div>
        </section>

        <div className="space-y-4">
          {wallet && (
            <section
              className={`rounded-2xl border p-5 ${
                wallet.balanced
                  ? "border-tertiary/35 bg-tertiary-container/10"
                  : "border-error/40 bg-error-container/10"
              }`}
            >
              <div className="flex items-center gap-3">
                <span
                  aria-hidden="true"
                  className={`flex h-10 w-10 items-center justify-center rounded-[14px] ${
                    wallet.balanced
                      ? "bg-[#d9f7dd] text-on-tertiary-fixed-variant"
                      : "bg-error-container text-error"
                  }`}
                >
                  <span
                    className="material-symbols-outlined"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    {wallet.balanced ? "verified" : "warning"}
                  </span>
                </span>
                <div>
                  <h2 className="font-headline-md text-headline-md font-bold">
                    {wallet.balanced ? "Đối soát khớp" : "Đối soát lệch"}
                  </h2>
                  <p className="text-xs text-on-surface-variant">
                    {wallet.balanced
                      ? "Tiền vào ra khớp với số dư các ví"
                      : "Tiền vào ra không khớp với số dư các ví"}
                  </p>
                </div>
              </div>
              <dl className="mt-3 grid grid-cols-[1fr_auto] gap-x-4 gap-y-1.5 text-[13px]">
                <dt className="text-on-surface-variant">Tiền thật vào qua PayOS</dt>
                <dd className="font-bold">{formatVnd(wallet.cashInViaPayos)}</dd>
                <dt className="text-on-surface-variant">Đã chuyển khoản trả ra</dt>
                <dd className="font-bold">{formatVnd(wallet.cashOutWithdrawals)}</dd>
                <dt className="text-on-surface-variant">Chênh lệch</dt>
                <dd className={`font-extrabold ${wallet.balanced ? "text-tertiary" : "text-error"}`}>
                  {formatVnd(wallet.difference)}
                </dd>
              </dl>
            </section>
          )}

          {wallet && (
            <section className="rounded-2xl border border-outline-variant/40 bg-surface-container-lowest p-5">
              <h2 className="font-headline-md text-headline-md font-bold">Tiền trong hệ thống</h2>
              <div
                role="img"
                aria-label={`Phân bổ: ${moneyParts
                  .map((part) => `${part.label} ${formatVnd(part.value)}`)
                  .join(", ")}`}
                className="mt-3 flex h-3.5 gap-0.5 overflow-hidden rounded-full bg-surface-container"
              >
                {moneyTotal > 0 &&
                  moneyParts.map((part) => (
                    <div
                      key={part.label}
                      className={part.color}
                      style={{ flex: Math.max(part.value, 0) }}
                    />
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
          )}
        </div>
      </div>
    </div>
  );
}

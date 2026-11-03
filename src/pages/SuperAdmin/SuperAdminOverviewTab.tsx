import { useEffect, useMemo, useState } from "react";
import { getAdminOverview, type AdminOverview } from "../../services/api";
import { SOURCE_META, sourceGroup, type SourceGroup } from "../../utils/signupSource";
import OverviewStatsSection from "./OverviewStatsSection";
import { SourceBadge } from "./SuperAdminChips";

const SOURCE_BAR: Record<SourceGroup, string> = {
  facebook: "#0059bb",
  tiktok: "#c2185b",
  instagram: "#8e24aa",
  direct: "#717786",
  counter: "#c47f00",
  other: "#00749e",
  unknown: "#c1c6d7",
};

type OverviewTarget = "customers" | "garages";

type Props = {
  onNavigate: (tab: OverviewTarget) => void;
};

function formatCount(count: number | null) {
  return count === null ? "—" : count.toLocaleString("vi-VN");
}

export default function SuperAdminOverviewTab({ onNavigate }: Props) {
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getAdminOverview()
      .then((result) => {
        if (!cancelled) setOverview(result);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const blockedCustomers = overview?.blockedCustomerCount ?? null;
  const garagesWithoutOwner = overview?.garagesWithoutOwner ?? null;
  const blockedGarages = overview?.blockedGarageCount ?? null;
  const hiddenGarages = overview?.hiddenGarageCount ?? null;
  const hasFailure = loaded && overview === null;

  // BE trả theo từng nguồn thô; gom về các nhóm hiển thị (Facebook, TikTok, Khác...) và xếp nhiều nhất trước.
  const signupRows = useMemo(() => {
    const totals = new Map<SourceGroup, number>();
    for (const item of overview?.signupSources ?? []) {
      const group = sourceGroup(item.source);
      totals.set(group, (totals.get(group) ?? 0) + item.count);
    }
    return [...totals.entries()].map(([group, count]) => ({ group, count })).sort((a, b) => b.count - a.count);
  }, [overview]);
  const signupTotal = signupRows.reduce((sum, row) => sum + row.count, 0);
  const signupMax = signupRows[0]?.count ?? 1;

  const kpis: { icon: string; tone: string; label: string; value: string; hint: string }[] = [
    {
      icon: "groups",
      tone: "bg-primary-fixed text-on-primary-fixed-variant",
      label: "Khách hàng",
      value: formatCount(overview?.customerCount ?? null),
      hint: blockedCustomers === null ? "" : `${blockedCustomers} đang bị chặn`,
    },
    {
      icon: "storefront",
      tone: "bg-[#d9f7dd] text-on-tertiary-fixed-variant",
      label: "Garage",
      value: formatCount(overview?.garageCount ?? null),
      hint:
        blockedGarages === null || hiddenGarages === null
          ? ""
          : `${blockedGarages} bị chặn · ${hiddenGarages} đã ẩn`,
    },
    {
      icon: "workspace_premium",
      tone: "bg-[#e6defa] text-[#3b2a7a]",
      label: "Gói đã bán",
      value: formatCount(overview?.successfulTransactionCount ?? null),
      hint: "Giao dịch bán gói đã thanh toán qua PayOS",
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

  return (
    <div className="space-y-5">
      {!loaded && <p className="text-on-surface-variant">Đang tải...</p>}

      <section aria-label="Số liệu chính" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
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

      {signupRows.length > 0 && (
        <section
          aria-labelledby="signup-source-title"
          className="rounded-2xl border border-outline-variant/40 bg-surface-container-lowest p-5"
        >
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 id="signup-source-title" className="font-headline-md text-headline-md font-bold">
              Đăng ký theo nguồn
            </h2>
            <span className="text-xs text-on-surface-variant">
              {overview?.signupSourceDays ?? 30} ngày qua · {signupTotal.toLocaleString("vi-VN")} khách mới
            </span>
          </div>
          <ul className="mt-4 space-y-3">
            {signupRows.map((row) => (
              <li key={row.group} className="grid grid-cols-[130px_1fr_48px] items-center gap-3">
                <SourceBadge source={row.group} />
                <div
                  role="img"
                  aria-label={`${SOURCE_META[row.group].label}: ${row.count} khách`}
                  className="h-3 overflow-hidden rounded-full bg-surface-container"
                >
                  <i
                    className="block h-full rounded-full"
                    style={{ width: `${Math.max(4, (row.count / signupMax) * 100)}%`, background: SOURCE_BAR[row.group] }}
                  />
                </div>
                <b className="text-right">{row.count.toLocaleString("vi-VN")}</b>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex justify-end border-t border-outline-variant/40 pt-3">
            <button
              type="button"
              onClick={() => onNavigate("customers")}
              className="min-h-9 rounded-[10px] border-[1.5px] border-primary bg-surface-container-lowest px-3 text-xs font-bold text-on-primary-fixed-variant hover:bg-primary-fixed/40"
            >
              Xem khách hàng
            </button>
          </div>
        </section>
      )}

      <OverviewStatsSection />

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
              key={todo.key + todo.title}
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
    </div>
  );
}

import { useEffect, useState } from "react";
import { getAdminOverview, type AdminOverview } from "../../services/api";
import OverviewStatsSection from "./OverviewStatsSection";

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

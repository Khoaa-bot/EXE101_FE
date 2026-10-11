import type { ReactNode } from "react";
import type { Delta } from "./overviewStats";

// Các khối dùng chung cho thống kê Tổng quan: chip tăng/giảm, biểu đồ cột, thẻ số liệu.
export function DeltaChip({
  delta,
  compareLabel,
  previousText,
}: {
  delta: Delta;
  compareLabel: string;
  previousText: string;
}) {
  const meta = {
    up: { icon: "trending_up", cls: "bg-[#d9f7dd] text-[#00531a]", text: `Tăng ${delta.percent}%` },
    down: { icon: "trending_down", cls: "bg-[#ffe4d6] text-[#7a2e00]", text: `Giảm ${delta.percent}%` },
    flat: { icon: "trending_flat", cls: "bg-[#e9eaeb] text-[#3a3f4b]", text: "Không đổi" },
    new: { icon: "fiber_new", cls: "bg-[#e9eaeb] text-[#3a3f4b]", text: "Mới phát sinh" },
  }[delta.direction];
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${meta.cls}`}>
      <span aria-hidden="true" className="material-symbols-outlined text-base">
        {meta.icon}
      </span>
      {meta.text} so với {compareLabel} ({previousText})
    </span>
  );
}

export function BarChart({
  values,
  labels,
  barColor,
  highlightColor,
  ariaLabel,
  formatValue,
  futureFrom,
  showLabel,
}: {
  values: number[];
  labels: string[];
  barColor: string;
  highlightColor: string;
  ariaLabel: string;
  formatValue?: (value: number) => string;
  futureFrom?: number;
  showLabel?: (index: number) => boolean;
}) {
  const max = Math.max(...values, 0);
  const highlight = max > 0 ? values.indexOf(max) : -1;
  const dense = values.length > 12;
  return (
    <div>
      <div
        role="img"
        aria-label={ariaLabel}
        className={`flex h-[140px] items-end pt-2 ${dense ? "gap-[3px]" : "gap-2.5"}`}
      >
        {values.map((value, index) => {
          const isFuture = futureFrom !== undefined && index > futureFrom;
          const height = isFuture || max === 0 ? 3 : Math.max(3, Math.round((value / max) * 100));
          return (
            <div key={labels[index] + index} className="flex h-full flex-1 flex-col items-center justify-end gap-1.5">
              {formatValue && !isFuture && (
                <span className="text-[11px] font-bold text-on-surface-variant">{formatValue(value)}</span>
              )}
              <div
                className={`w-full rounded-t-lg rounded-b-sm ${dense ? "" : "max-w-9"}`}
                style={{
                  height,
                  background: isFuture || max === 0 ? "#eceeef" : index === highlight ? highlightColor : barColor,
                }}
              />
            </div>
          );
        })}
      </div>
      <div aria-hidden="true" className={`mt-1.5 flex ${dense ? "gap-[3px]" : "gap-2.5"}`}>
        {labels.map((label, index) => (
          <span
            key={label + index}
            className={`flex-1 text-center text-[11px] font-semibold text-on-surface-variant ${
              !showLabel || showLabel(index) ? "" : "invisible"
            }`}
          >
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}

export function StatCard({
  icon,
  tone,
  title,
  subtitle,
  children,
}: {
  icon: string;
  tone: string;
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <article className="flex flex-col gap-2.5 rounded-2xl border border-outline-variant/40 bg-surface-container-lowest p-5 shadow-[0_10px_26px_-14px_rgba(25,28,29,0.28)]">
      <div className="flex items-center gap-3">
        <span aria-hidden="true" className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] ${tone}`}>
          <span className="material-symbols-outlined">{icon}</span>
        </span>
        <div className="min-w-0">
          <h3 className="text-[15px] font-extrabold">{title}</h3>
          <p className="text-xs text-on-surface-variant">{subtitle}</p>
        </div>
      </div>
      {children}
    </article>
  );
}

export function Status({ children }: { children: ReactNode }) {
  return <p className="py-10 text-center text-sm text-on-surface-variant">{children}</p>;
}

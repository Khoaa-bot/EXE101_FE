import { useEffect, useState } from "react";
import { getGarageReport, type GarageReport } from "../../services/api";
import { formatVnd } from "../../utils/format";
import AdminShell, { type AdminNavProps } from "./AdminShell";

export type AdminReportsPageProps = AdminNavProps;

// 38200000 -> "38,2 tr"; dưới 1 triệu thì viết đủ số.
const compactVnd = (n: number) =>
  n >= 1_000_000 ? `${(n / 1_000_000).toLocaleString("vi-VN", { maximumFractionDigits: 1 })} tr` : formatVnd(n);

const percent = (rate: number) => `${Math.round(rate * 100)}%`;

// "2026-10" -> "10/26"
const monthLabel = (month: string) => `${month.slice(5)}/${month.slice(2, 4)}`;

function Kpi({ value, label, hint }: { value: string; label: string; hint?: string }) {
  return (
    <div className="rounded-2xl bg-surface-container-low p-4">
      <p className="text-2xl font-extrabold tracking-tight">{value}</p>
      <p className="mt-0.5 text-xs text-on-surface-variant">{label}</p>
      {hint && <p className="mt-1 text-xs font-semibold text-primary">{hint}</p>}
    </div>
  );
}

function RankList({ title, rows, empty }: { title: string; rows: Array<{ key: string; name: string; value: string }>; empty: string }) {
  return (
    <section className="rounded-3xl border border-outline-variant/40 bg-surface-container-lowest p-5">
      <h2 className="text-base font-extrabold">{title}</h2>
      {rows.length === 0 ? (
        <p className="mt-3 text-sm text-on-surface-variant">{empty}</p>
      ) : (
        <ul className="mt-2 divide-y divide-outline-variant/40">
          {rows.map((row) => (
            <li key={row.key} className="flex items-center justify-between gap-3 py-2.5 text-sm">
              <span>{row.name}</span>
              <b className="shrink-0 font-bold">{row.value}</b>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default function AdminReportsPage(props: AdminReportsPageProps) {
  const [report, setReport] = useState<GarageReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getGarageReport()
      .then((data) => {
        if (!cancelled) setReport(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Không tải được báo cáo.");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const months = report?.months ?? [];
  const current = months[months.length - 1];
  const previous = months[months.length - 2];
  const maxRevenue = Math.max(1, ...months.map((m) => m.revenue));
  const change =
    current && previous && previous.revenue > 0
      ? Math.round(((current.revenue - previous.revenue) / previous.revenue) * 100)
      : null;

  return (
    <AdminShell
      activeTab="reports"
      title="Báo cáo"
      description="Doanh thu, dịch vụ bán chạy, khung giờ đông và hiệu suất kỹ thuật viên trong 12 tháng gần nhất."
      maxWidthClass="max-w-6xl"
      {...props}
    >
      {isLoading && (
        <div className="flex items-center justify-center gap-2 p-8 text-sm text-on-surface-variant">
          <span className="material-symbols-outlined animate-spin text-primary">sync</span>
          Đang tải báo cáo...
        </div>
      )}
      {!isLoading && error && <p className="p-6 text-sm text-error">{error}</p>}

      {report && current && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Kpi
              value={compactVnd(current.revenue)}
              label={`Doanh thu tháng ${current.month.slice(5)}`}
              hint={change === null ? undefined : `${change >= 0 ? "+" : ""}${change}% so với tháng trước`}
            />
            <Kpi
              value={String(report.totals.completed)}
              label="Lịch hoàn thành (12 tháng)"
              hint={`${percent(report.totals.completionRate)} tổng số lịch`}
            />
            <Kpi value={percent(report.totals.cancelRate)} label="Tỷ lệ huỷ" />
            <Kpi value={percent(report.totals.noShowRate)} label="Tỷ lệ không đến" />
          </div>

          <section className="rounded-3xl border border-outline-variant/40 bg-surface-container-lowest p-5">
            <h2 className="text-base font-extrabold">Doanh thu theo tháng</h2>
            <p className="mt-0.5 text-xs text-on-surface-variant">Chỉ tính lịch đã hoàn thành.</p>
            <div className="mt-4 flex h-40 items-end gap-1.5">
              {months.map((m) => (
                <div
                  key={m.month}
                  className="flex h-full flex-1 flex-col justify-end"
                  title={`${monthLabel(m.month)}: ${formatVnd(m.revenue)} · ${m.completed} lịch hoàn thành`}
                >
                  <div
                    className="w-full rounded-t bg-primary"
                    style={{ height: `${Math.max(m.revenue > 0 ? 3 : 0, Math.round((m.revenue / maxRevenue) * 100))}%` }}
                  />
                </div>
              ))}
            </div>
            <div className="mt-1.5 flex gap-1.5 text-[10px] text-on-surface-variant">
              {months.map((m) => (
                <span key={m.month} className="flex-1 text-center">
                  {monthLabel(m.month)}
                </span>
              ))}
            </div>
          </section>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <RankList
              title="Dịch vụ bán chạy"
              empty="Chưa có lịch hoàn thành."
              rows={report.topServices.map((s) => ({
                key: String(s.serviceId),
                name: s.name,
                value: `${s.count} lượt · ${compactVnd(s.revenue)}`,
              }))}
            />
            <RankList
              title="Khung giờ đông nhất"
              empty="Chưa có lịch hẹn."
              rows={report.busiestSlots.map((s) => ({ key: s.label, name: s.label, value: `${s.count} lịch` }))}
            />
          </div>
          <RankList
            title="Kỹ thuật viên (lịch hoàn thành)"
            empty="Chưa có lịch nào được kỹ thuật viên hoàn thành."
            rows={report.engineers.map((e) => ({ key: String(e.engineerId), name: e.name, value: String(e.completed) }))}
          />
        </div>
      )}
    </AdminShell>
  );
}

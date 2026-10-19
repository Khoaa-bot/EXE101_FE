import { useEffect, useMemo, useState } from "react";
import { getAdminYearStats, type AdminYearStats } from "../../services/api";
import { formatVnd } from "../../utils/format";
import { BarChart, DeltaChip, StatCard, Status } from "./StatsWidgets";
import { formatShortVnd, percentChange } from "./overviewStats";
import { cutoffFor, emptyRow, sumRows, type MonthRow } from "./yearBuckets";

const COMPARE_YEARS = 3;
const MONTH_LABELS = Array.from({ length: 12 }, (_, i) => `T${i + 1}`);

type Metric = "registrations" | "appointments" | "revenue";

const METRICS: Array<{ key: Metric; label: string; colors: string[] }> = [
  { key: "registrations", label: "Đăng ký mới", colors: ["#c9ccd6", "#7fa9e6", "#0059bb"] },
  { key: "appointments", label: "Lịch hẹn", colors: ["#c9ccd6", "#8fd09a", "#008730"] },
  { key: "revenue", label: "Doanh thu", colors: ["#c9ccd6", "#b9a8ec", "#6a4fd1"] },
];

type YearState = { year: number; data: AdminYearStats | null; failed: boolean };

const formatCount = (value: number) => value.toLocaleString("vi-VN");

// Thống kê theo năm: 12 tháng, so với cùng kỳ năm trước và so sánh nhiều năm. Số liệu do backend gom sẵn.
export default function YearStats() {
  const [now] = useState(() => new Date());
  const nowYear = now.getFullYear();
  const [year, setYear] = useState(nowYear);
  const [metric, setMetric] = useState<Metric>("appointments");
  const [state, setState] = useState<YearState | null>(null);

  useEffect(() => {
    let cancelled = false;
    getAdminYearStats(year)
      .then((data) => {
        if (!cancelled) setState({ year, data, failed: false });
      })
      .catch(() => {
        if (!cancelled) setState({ year, data: null, failed: true });
      });
    return () => {
      cancelled = true;
    };
  }, [year]);

  const loading = state?.year !== year;
  const failed = !loading && state?.failed === true;
  const data = loading ? null : (state?.data ?? null);
  // Giữ năm đầu tiên đã biết khi đang chuyển năm để nút "Năm trước" không nhảy trạng thái.
  const minYear = state?.data?.firstYear ?? nowYear;

  const compareFrom = Math.max(minYear, year - (COMPARE_YEARS - 1));
  const years = useMemo(() => {
    const list: number[] = [];
    for (let y = compareFrom; y <= year; y += 1) list.push(y);
    return list;
  }, [compareFrom, year]);

  const rowsByYear = useMemo(() => {
    const map = new Map<number, MonthRow[]>();
    for (const entry of data?.years ?? []) map.set(entry.year, entry.months);
    return map;
  }, [data]);

  const cutoff = data ? { month: data.cutoffMonth, day: data.cutoffDay } : cutoffFor(year, now);
  const currentRows = rowsByYear.get(year) ?? Array.from({ length: 12 }, emptyRow);
  const previousRows = rowsByYear.get(year - 1);
  const total = sumRows(currentRows);
  const previousTotal = previousRows ? sumRows(previousRows) : null;
  const futureFrom = year === nowYear ? now.getMonth() : undefined;
  const cutoffMonthLabel = `tháng ${cutoff.month + 1}`;
  const periodText = year === nowYear ? `Năm ${year} (đến ${cutoffMonthLabel})` : `Năm ${year}`;
  const compareLabel = `cùng kỳ ${year - 1}`;
  const percentOf = (value: number, base: number) => (base === 0 ? 0 : Math.round((value / base) * 100));

  const metricDef = METRICS.find((m) => m.key === metric) ?? METRICS[1];
  const palette = metricDef.colors.slice(-years.length);
  const chartMonths = Array.from({ length: cutoff.month + 1 }, (_, i) => i);
  const chartMax = Math.max(
    1,
    ...years.flatMap((y) => chartMonths.map((m) => rowsByYear.get(y)?.[m]?.[metric] ?? 0)),
  );

  const loadingText = failed ? "Không tải được số liệu theo năm." : "Đang tải...";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <div role="group" aria-label="Chọn năm" className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Năm trước"
            disabled={year <= minYear}
            onClick={() => setYear((y) => y - 1)}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-outline-variant bg-surface-container-lowest hover:bg-surface-container-low disabled:opacity-40"
          >
            <span aria-hidden="true" className="material-symbols-outlined">
              chevron_left
            </span>
          </button>
          <b aria-live="polite" className="min-w-14 text-center text-base">
            {year}
          </b>
          <button
            type="button"
            aria-label="Năm sau"
            disabled={year >= nowYear}
            onClick={() => setYear((y) => y + 1)}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-outline-variant bg-surface-container-lowest hover:bg-surface-container-low disabled:opacity-40"
          >
            <span aria-hidden="true" className="material-symbols-outlined">
              chevron_right
            </span>
          </button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <StatCard
          icon="person_add"
          tone="bg-primary-fixed text-on-primary-fixed-variant"
          title="Người dùng đăng ký mới"
          subtitle={periodText}
        >
          {data ? (
            <>
              <div className="flex flex-wrap items-baseline gap-2.5">
                <b className="text-[32px] font-extrabold tracking-tight">{formatCount(total.registrations)}</b>
                <DeltaChip
                  delta={percentChange(total.registrations, previousTotal?.registrations ?? 0)}
                  compareLabel={compareLabel}
                  previousText={formatCount(previousTotal?.registrations ?? 0)}
                />
              </div>
              <BarChart
                values={currentRows.map((r) => r.registrations)}
                labels={MONTH_LABELS}
                barColor="#7fa9e6"
                highlightColor="#0059bb"
                ariaLabel={`Đăng ký mới theo tháng năm ${year}: tổng ${total.registrations}`}
                formatValue={formatCount}
                futureFrom={futureFrom}
              />
            </>
          ) : (
            <Status>{loadingText}</Status>
          )}
        </StatCard>

        <StatCard
          icon="event_available"
          tone="bg-[#d9f7dd] text-on-tertiary-fixed-variant"
          title="Lịch hẹn"
          subtitle={`Có ngày hẹn trong ${periodText.toLowerCase()}`}
        >
          {data ? (
            <>
              <div className="flex flex-wrap items-baseline gap-2.5">
                <b className="text-[32px] font-extrabold tracking-tight">{formatCount(total.appointments)}</b>
                <DeltaChip
                  delta={percentChange(total.appointments, previousTotal?.appointments ?? 0)}
                  compareLabel={compareLabel}
                  previousText={formatCount(previousTotal?.appointments ?? 0)}
                />
              </div>
              <BarChart
                values={currentRows.map((r) => r.appointments)}
                labels={MONTH_LABELS}
                barColor="#8fd09a"
                highlightColor="#008730"
                ariaLabel={`Lịch hẹn theo tháng năm ${year}: tổng ${total.appointments}`}
                formatValue={formatCount}
                futureFrom={futureFrom}
              />
            </>
          ) : (
            <Status>{loadingText}</Status>
          )}
        </StatCard>

        <StatCard
          icon="account_balance"
          tone="bg-[#e6defa] text-[#3b2a7a]"
          title="Doanh thu nền tảng"
          subtitle={`Hoa hồng ghi vào ví ${periodText.toLowerCase()}`}
        >
          {data ? (
            <>
              <div className="flex flex-wrap items-baseline gap-2.5">
                <b className="text-[32px] font-extrabold tracking-tight">{formatVnd(total.revenue)}</b>
                <DeltaChip
                  delta={percentChange(total.revenue, previousTotal?.revenue ?? 0)}
                  compareLabel={compareLabel}
                  previousText={formatVnd(previousTotal?.revenue ?? 0)}
                />
              </div>
              <BarChart
                values={currentRows.map((r) => r.revenue)}
                labels={MONTH_LABELS}
                barColor="#b9a8ec"
                highlightColor="#6a4fd1"
                ariaLabel={`Doanh thu theo tháng năm ${year}: tổng ${formatVnd(total.revenue)}`}
                formatValue={formatShortVnd}
                futureFrom={futureFrom}
              />
            </>
          ) : (
            <Status>{loadingText}</Status>
          )}
        </StatCard>
      </div>

      <article className="overflow-hidden rounded-2xl border border-outline-variant/40 bg-surface-container-lowest shadow-[0_10px_26px_-14px_rgba(25,28,29,0.28)]">
        <div className="flex flex-wrap items-center justify-between gap-2 px-5 pb-3 pt-4">
          <div>
            <h3 className="text-base font-extrabold">Chi tiết theo tháng · {year}</h3>
            <p className="text-xs text-on-surface-variant">Tổng hợp 12 tháng; tháng đang diễn ra được tô nền xanh.</p>
          </div>
          {data && total.appointments > 0 && (
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-[#d9f7dd] px-2.5 py-1 text-xs font-bold text-[#00531a]">
                Tỷ lệ hoàn thành {percentOf(total.done, total.appointments)}%
              </span>
              <span className="rounded-full bg-[#ffe4d6] px-2.5 py-1 text-xs font-bold text-[#7a2e00]">
                Hủy + không đến {percentOf(total.lost, total.appointments)}%
              </span>
            </div>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-[13px]">
            <thead className="bg-surface-container-low text-[11px] uppercase tracking-wider text-on-surface-variant">
              <tr>
                <th className="px-4 py-2.5 font-bold">Tháng</th>
                <th className="px-4 py-2.5 text-right font-bold">Đăng ký mới</th>
                <th className="px-4 py-2.5 text-right font-bold">Lịch hẹn</th>
                <th className="px-4 py-2.5 text-right font-bold">Hoàn thành</th>
                <th className="px-4 py-2.5 text-right font-bold">Hủy + không đến</th>
                <th className="px-4 py-2.5 text-right font-bold">Doanh thu</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/40">
              {currentRows.map((row, index) => {
                const isFuture = futureFrom !== undefined && index > futureFrom;
                const isNow = futureFrom !== undefined && index === futureFrom;
                return (
                  <tr
                    key={MONTH_LABELS[index]}
                    className={isNow ? "bg-primary-fixed/40 font-bold" : isFuture ? "text-outline" : ""}
                  >
                    <td className="px-4 py-2.5">
                      Tháng {index + 1}
                      {isNow ? " (đang diễn ra)" : ""}
                    </td>
                    {isFuture ? (
                      [0, 1, 2, 3, 4].map((i) => (
                        <td key={i} className="px-4 py-2.5 text-right">
                          —
                        </td>
                      ))
                    ) : (
                      <>
                        <td className="px-4 py-2.5 text-right">{formatCount(row.registrations)}</td>
                        <td className="px-4 py-2.5 text-right">{formatCount(row.appointments)}</td>
                        <td className="px-4 py-2.5 text-right">{formatCount(row.done)}</td>
                        <td className="px-4 py-2.5 text-right">{formatCount(row.lost)}</td>
                        <td className="px-4 py-2.5 text-right">{formatVnd(row.revenue)}</td>
                      </>
                    )}
                  </tr>
                );
              })}
              <tr className="bg-surface-container-low font-extrabold">
                <td className="px-4 py-2.5">Cả năm</td>
                <td className="px-4 py-2.5 text-right">{formatCount(total.registrations)}</td>
                <td className="px-4 py-2.5 text-right">{formatCount(total.appointments)}</td>
                <td className="px-4 py-2.5 text-right">{formatCount(total.done)}</td>
                <td className="px-4 py-2.5 text-right">{formatCount(total.lost)}</td>
                <td className="px-4 py-2.5 text-right">{formatVnd(total.revenue)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </article>

      <article className="space-y-3.5 rounded-2xl border border-outline-variant/40 bg-surface-container-lowest p-5 shadow-[0_10px_26px_-14px_rgba(25,28,29,0.28)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-extrabold">So sánh các năm</h3>
            <p className="text-xs text-on-surface-variant">
              Cùng kỳ từ tháng 1 đến hết {cutoffMonthLabel} của mỗi năm
            </p>
          </div>
          <div role="group" aria-label="Chỉ số so sánh" className="inline-flex gap-1 rounded-2xl bg-surface-container p-1">
            {METRICS.map((option) => (
              <button
                key={option.key}
                type="button"
                aria-pressed={metric === option.key}
                onClick={() => setMetric(option.key)}
                className={`min-h-9 rounded-xl px-3.5 text-[13px] font-bold ${
                  metric === option.key
                    ? "bg-surface-container-lowest text-on-primary-fixed-variant shadow-sm"
                    : "text-on-surface-variant hover:text-on-surface"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {data ? (
          <>
            <ul className="flex flex-wrap gap-4 text-xs font-semibold text-on-surface-variant">
              {years.map((y, index) => (
                <li key={y} className="flex items-center gap-1.5">
                  <i aria-hidden="true" className="h-2.5 w-2.5 rounded-[3px]" style={{ background: palette[index] }} />
                  {y}
                </li>
              ))}
            </ul>
            <div
              role="img"
              aria-label={`${metricDef.label} theo tháng, so sánh các năm ${years.join(", ")}`}
              className="flex h-[170px] items-end gap-3.5"
            >
              {chartMonths.map((m) => (
                <div key={m} className="flex h-full flex-1 items-end gap-[3px]">
                  {years.map((y, index) => {
                    const value = rowsByYear.get(y)?.[m]?.[metric] ?? 0;
                    return (
                      <i
                        key={y}
                        title={`${y} · ${MONTH_LABELS[m]}: ${metric === "revenue" ? formatVnd(value) : formatCount(value)}`}
                        className="flex-1 rounded-t-[5px] rounded-b-sm"
                        style={{
                          height: `${Math.max(3, Math.round((value / chartMax) * 100))}%`,
                          background: palette[index],
                        }}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
            <div aria-hidden="true" className="flex gap-3.5">
              {chartMonths.map((m) => (
                <span key={m} className="flex-1 text-center text-[11px] font-semibold text-on-surface-variant">
                  {MONTH_LABELS[m]}
                </span>
              ))}
            </div>

            <div className="overflow-x-auto rounded-xl border border-outline-variant/40">
              <table className="w-full min-w-[640px] text-left text-[13px]">
                <thead className="bg-surface-container-low text-[11px] uppercase tracking-wider text-on-surface-variant">
                  <tr>
                    <th className="px-4 py-2.5 font-bold">Năm</th>
                    <th className="px-4 py-2.5 text-right font-bold">Đăng ký mới</th>
                    <th className="px-4 py-2.5 text-right font-bold">Lịch hẹn</th>
                    <th className="px-4 py-2.5 text-right font-bold">Hoàn thành</th>
                    <th className="px-4 py-2.5 text-right font-bold">Doanh thu</th>
                    <th className="px-4 py-2.5 text-right font-bold">Tăng trưởng doanh thu</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/40">
                  {years.map((y, index) => {
                    const sum = sumRows(rowsByYear.get(y) ?? []);
                    const prev = index > 0 ? sumRows(rowsByYear.get(years[index - 1]) ?? []) : null;
                    const growth =
                      prev && prev.revenue > 0 ? Math.round(((sum.revenue - prev.revenue) / prev.revenue) * 100) : null;
                    return (
                      <tr key={y} className={y === year ? "bg-primary-fixed/40 font-bold" : ""}>
                        <td className="px-4 py-2.5">
                          {y}
                          {y === nowYear ? ` (đến ${cutoffMonthLabel})` : ""}
                        </td>
                        <td className="px-4 py-2.5 text-right">{formatCount(sum.registrations)}</td>
                        <td className="px-4 py-2.5 text-right">{formatCount(sum.appointments)}</td>
                        <td className="px-4 py-2.5 text-right">{formatCount(sum.done)}</td>
                        <td className="px-4 py-2.5 text-right">{formatVnd(sum.revenue)}</td>
                        <td
                          className={`px-4 py-2.5 text-right font-bold ${
                            growth === null ? "text-outline" : growth >= 0 ? "text-[#00531a]" : "text-[#7a2e00]"
                          }`}
                        >
                          {growth === null ? "—" : `${growth >= 0 ? "▲" : "▼"} ${Math.abs(growth)}%`}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <Status>{loadingText}</Status>
        )}
      </article>
    </div>
  );
}

import { useEffect, useMemo, useState } from "react";
import { getGarageOwnerPeriodStats, type GaragePeriodStats } from "../../services/api";
import {
  getPeriodRanges,
  parseDateTime,
  percentChange,
  type AppointmentOutcome,
  type Period,
} from "../SuperAdmin/overviewStats";
import { BarChart, DeltaChip, StatCard, Status } from "../SuperAdmin/StatsWidgets";
import GarageYearStats from "./GarageYearStats";

const PERIODS: Array<{ key: Period; label: string }> = [
  { key: "day", label: "Hôm nay" },
  { key: "week", label: "Tuần này" },
  { key: "month", label: "Tháng này" },
];

const OUTCOMES: Array<{ key: AppointmentOutcome; label: string; color: string }> = [
  { key: "done", label: "Hoàn thành", color: "#008730" },
  { key: "active", label: "Đang xử lý", color: "#0059bb" },
  { key: "cancelled", label: "Đã hủy", color: "#c47f00" },
  { key: "noShow", label: "Không đến", color: "#ba1a1a" },
];

type StatsState = { key: Period; data: GaragePeriodStats | null; failed: boolean };

// Khách hàng mới + lịch hẹn theo hôm nay/tuần này/tháng này/năm tại garage đang đăng nhập.
// Mirror OverviewStatsSection.tsx của Super Admin, tái dùng BarChart/StatCard/DeltaChip,
// nhưng lọc theo 1 garage và bỏ thẻ doanh thu (doanh thu bán gói là của nền tảng, không áp dụng cho garage).
export default function GarageStatsSection() {
  const [mode, setMode] = useState<Period | "year">("week");
  const [browserNow] = useState(() => new Date());
  const [state, setState] = useState<StatsState | null>(null);

  useEffect(() => {
    if (mode === "year") return;
    let cancelled = false;
    getGarageOwnerPeriodStats(mode)
      .then((data) => {
        if (!cancelled) setState({ key: mode, data, failed: false });
      })
      .catch(() => {
        if (!cancelled) setState({ key: mode, data: null, failed: true });
      });
    return () => {
      cancelled = true;
    };
  }, [mode]);

  const period: Period = mode === "year" ? "week" : mode;
  const loading = state?.key !== period;
  const failed = !loading && state?.failed === true;
  const stats = loading ? null : (state?.data ?? null);
  const serverNowText = stats?.serverNow ?? null;

  const ranges = useMemo(
    () => getPeriodRanges(period, parseDateTime(serverNowText) ?? browserNow),
    [period, serverNowText, browserNow],
  );

  const outcomeCounts = stats?.outcomes ?? { done: 0, active: 0, cancelled: 0, noShow: 0 };
  const outcomeTotal =
    outcomeCounts.done + outcomeCounts.active + outcomeCounts.cancelled + outcomeCounts.noShow;
  const percentOf = (value: number) =>
    outcomeTotal === 0 ? 0 : Math.round((value / outcomeTotal) * 100);

  const timeFrameBars = stats?.timeFrames
    ? { labels: stats.timeFrames.map((f) => f.label), values: stats.timeFrames.map((f) => f.count) }
    : null;

  const sparseLabel = (index: number) =>
    period === "day"
      ? index % 6 === 0 || index === 23
      : [0, 7, 14, 21, ranges.bucketCount - 1].includes(index);
  const showLabel = period === "week" ? undefined : sparseLabel;
  const futureFrom = period === "day" ? undefined : ranges.todayIndex;
  const formatCount = (value: number) => value.toLocaleString("vi-VN");
  const showValues = true;

  return (
    <section aria-labelledby="garage-stats-title" className="space-y-3.5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="garage-stats-title" className="text-xl font-extrabold">
          Thống kê theo thời gian
        </h2>
        <div
          role="group"
          aria-label="Chọn khoảng thời gian"
          className="inline-flex gap-1 rounded-2xl bg-surface-container p-1"
        >
          {PERIODS.map((option) => (
            <button
              key={option.key}
              type="button"
              aria-pressed={mode === option.key}
              onClick={() => setMode(option.key)}
              className={`min-h-9 rounded-xl px-4 text-[13px] font-bold ${
                mode === option.key
                  ? "bg-surface-container-lowest text-on-primary-fixed-variant shadow-sm"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              {option.label}
            </button>
          ))}
          <button
            type="button"
            aria-pressed={mode === "year"}
            onClick={() => setMode("year")}
            className={`min-h-9 rounded-xl px-4 text-[13px] font-bold ${
              mode === "year"
                ? "bg-surface-container-lowest text-on-primary-fixed-variant shadow-sm"
                : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            Năm
          </button>
        </div>
      </div>

      {mode === "year" ? (
        <GarageYearStats />
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            <StatCard
              icon="person_add"
              tone="bg-primary-fixed text-on-primary-fixed-variant"
              title="Khách hàng mới"
              subtitle={ranges.currentLabel}
            >
              {failed ? (
                <Status>Không tải được số khách hàng mới.</Status>
              ) : stats ? (
                <>
                  <div className="flex flex-wrap items-baseline gap-2.5">
                    <b className="text-[32px] font-extrabold tracking-tight">
                      {formatCount(stats.newCustomers.total)}
                    </b>
                    <DeltaChip
                      delta={percentChange(stats.newCustomers.total, stats.newCustomers.previousTotal)}
                      compareLabel={ranges.compareLabel}
                      previousText={formatCount(stats.newCustomers.previousTotal)}
                    />
                  </div>
                  <BarChart
                    values={stats.newCustomers.buckets}
                    labels={ranges.bucketLabels}
                    barColor="#7fa9e6"
                    highlightColor="#0059bb"
                    ariaLabel={`Khách hàng mới ${ranges.periodWord}: tổng ${stats.newCustomers.total}`}
                    formatValue={showValues ? formatCount : undefined}
                    futureFrom={futureFrom}
                    showLabel={showLabel}
                  />
                </>
              ) : (
                <Status>Đang tải...</Status>
              )}
            </StatCard>

            <StatCard
              icon="event_available"
              tone="bg-[#d9f7dd] text-on-tertiary-fixed-variant"
              title="Lịch hẹn"
              subtitle={
                period === "day"
                  ? "Có ngày hẹn hôm nay"
                  : `Có ngày hẹn từ đầu ${period === "week" ? "tuần" : "tháng"} đến hết hôm nay`
              }
            >
              {failed ? (
                <Status>Không tải được lịch hẹn.</Status>
              ) : stats ? (
                <>
                  <div className="flex flex-wrap items-baseline gap-2.5">
                    <b className="text-[32px] font-extrabold tracking-tight">
                      {formatCount(stats.appointments.total)}
                    </b>
                    <DeltaChip
                      delta={percentChange(stats.appointments.total, stats.appointments.previousTotal)}
                      compareLabel={ranges.compareLabel}
                      previousText={formatCount(stats.appointments.previousTotal)}
                    />
                  </div>
                  {period === "day" ? (
                    timeFrameBars && timeFrameBars.values.length > 0 ? (
                      <BarChart
                        values={timeFrameBars.values}
                        labels={timeFrameBars.labels}
                        barColor="#8fd09a"
                        highlightColor="#008730"
                        ariaLabel={`Lịch hẹn hôm nay theo khung giờ: tổng ${stats.appointments.total}`}
                        formatValue={formatCount}
                      />
                    ) : (
                      <Status>Chưa có lịch hẹn nào hôm nay.</Status>
                    )
                  ) : (
                    <BarChart
                      values={stats.appointments.buckets}
                      labels={ranges.bucketLabels}
                      barColor="#8fd09a"
                      highlightColor="#008730"
                      ariaLabel={`Lịch hẹn ${ranges.periodWord}: tổng ${stats.appointments.total}`}
                      formatValue={showValues ? formatCount : undefined}
                      futureFrom={futureFrom}
                      showLabel={showLabel}
                    />
                  )}
                </>
              ) : (
                <Status>Đang tải...</Status>
              )}
            </StatCard>
          </div>

          {outcomeTotal > 0 && (
            <article className="space-y-3 rounded-2xl border border-outline-variant/40 bg-surface-container-lowest p-5 shadow-[0_10px_26px_-14px_rgba(25,28,29,0.28)]">
              <h3 className="text-base font-extrabold">Kết quả lịch hẹn {ranges.periodWord}</h3>
              <div
                role="img"
                aria-label={OUTCOMES.map((o) => `${o.label} ${outcomeCounts[o.key]}`).join(", ")}
                className="flex h-[18px] gap-[3px] overflow-hidden rounded-full"
              >
                {OUTCOMES.filter((o) => outcomeCounts[o.key] > 0).map((o) => (
                  <div key={o.key} style={{ flex: outcomeCounts[o.key], background: o.color }} />
                ))}
              </div>
              <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {OUTCOMES.map((o) => (
                  <li key={o.key} className="flex items-center gap-2 text-[13px]">
                    <i aria-hidden="true" className="h-3 w-3 shrink-0 rounded" style={{ background: o.color }} />
                    <span className="flex-1 text-on-surface-variant">{o.label}</span>
                    <b>
                      {formatCount(outcomeCounts[o.key])} · {percentOf(outcomeCounts[o.key])}%
                    </b>
                  </li>
                ))}
              </ul>
            </article>
          )}
        </>
      )}
    </section>
  );
}

import { useEffect, useMemo, useState } from "react";
import { getAdminPeriodStats, type AdminPeriodStats } from "../../services/api";
import { formatVnd } from "../../utils/format";
import {
  formatShortVnd,
  getPeriodRanges,
  parseDateTime,
  percentChange,
  // type AppointmentOutcome,
  type Period,
} from "./overviewStats";
import { BarChart, DeltaChip, StatCard, Status } from "./StatsWidgets";
import YearStats from "./YearStats";

type View = Period | "year";

const PERIODS: Array<{ key: View; label: string }> = [
  { key: "day", label: "Hôm nay" },
  { key: "week", label: "Tuần này" },
  { key: "month", label: "Tháng này" },
  { key: "year", label: "Năm" },
];

// const OUTCOMES: Array<{
//   key: AppointmentOutcome;
//   label: string;
//   color: string;
// }> = [
//   { key: "done", label: "Hoàn thành", color: "#008730" },
//   { key: "active", label: "Đang xử lý", color: "#0059bb" },
//   { key: "cancelled", label: "Đã hủy", color: "#c47f00" },
//   { key: "noShow", label: "Không đến", color: "#ba1a1a" },
// ];

type StatsState = {
  key: Period;
  data: AdminPeriodStats | null;
  failed: boolean;
};

// Thống kê đăng ký mới, lịch hẹn và doanh thu (tiền thực thu từ bán gói qua PayOS) theo hôm nay / tuần này / tháng này.
// Số liệu do backend gom sẵn theo giờ Việt Nam; giao diện chỉ vẽ.
export default function OverviewStatsSection() {
  const [period, setPeriod] = useState<Period>("week");
  // "Năm" có giao diện riêng; period giữ kỳ ngắn gần nhất để không tải lại dữ liệu khi quay lại.
  const [view, setView] = useState<View>("week");
  const [browserNow] = useState(() => new Date());
  const [state, setState] = useState<StatsState | null>(null);

  useEffect(() => {
    let cancelled = false;
    getAdminPeriodStats(period)
      .then((data) => {
        if (!cancelled) setState({ key: period, data, failed: false });
      })
      .catch(() => {
        if (!cancelled) setState({ key: period, data: null, failed: true });
      });
    return () => {
      cancelled = true;
    };
  }, [period]);

  const loading = state?.key !== period;
  const failed = !loading && state?.failed === true;
  const stats = loading ? null : (state?.data ?? null);
  const serverNowText = stats?.serverNow ?? null;

  // Nhãn kỳ (ngày, tuần, tháng) tính theo giờ của server khi đã có, nếu chưa thì theo giờ trình duyệt.
  const ranges = useMemo(
    () => getPeriodRanges(period, parseDateTime(serverNowText) ?? browserNow),
    [period, serverNowText, browserNow],
  );

  const outcomeCounts = stats?.outcomes ?? {
    done: 0,
    active: 0,
    cancelled: 0,
    noShow: 0,
  };
  const outcomeTotal =
    outcomeCounts.done +
    outcomeCounts.active +
    outcomeCounts.cancelled +
    outcomeCounts.noShow;
  const percentOf = (value: number) =>
    outcomeTotal === 0 ? 0 : Math.round((value / outcomeTotal) * 100);

  // Hôm nay: lịch hẹn nhóm theo khung giờ hẹn thay vì theo giờ.
  const timeFrameBars = stats?.timeFrames
    ? {
        labels: stats.timeFrames.map((frame) => frame.label),
        values: stats.timeFrames.map((frame) => frame.count),
      }
    : null;

  const sparseLabel = (index: number) =>
    period === "day"
      ? index % 6 === 0 || index === 23
      : [0, 7, 14, 21, ranges.bucketCount - 1].includes(index);
  const showLabel = period === "week" ? undefined : sparseLabel;
  const futureFrom = period === "day" ? undefined : ranges.todayIndex;
  const formatCount = (value: number) => value.toLocaleString("vi-VN");
  const showValues = true;

  // const doneRate = percentOf(outcomeCounts.done);
  // const lostRate = percentOf(outcomeCounts.cancelled + outcomeCounts.noShow);

  return (
    <section aria-labelledby="overview-stats-title" className="space-y-3.5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="overview-stats-title" className="text-xl font-extrabold">
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
              aria-pressed={view === option.key}
              onClick={() => {
                setView(option.key);
                if (option.key !== "year") setPeriod(option.key);
              }}
              className={`min-h-9 rounded-xl px-4 text-[13px] font-bold ${
                view === option.key
                  ? "bg-surface-container-lowest text-on-primary-fixed-variant shadow-sm"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {view === "year" ? (
        <YearStats />
      ) : (
        <>
          <div className="grid gap-4 lg:grid-cols-3">
            <StatCard
              icon="person_add"
              tone="bg-primary-fixed text-on-primary-fixed-variant"
              title="Người dùng đăng ký mới"
              subtitle={ranges.currentLabel}
            >
              {stats ? (
                <>
                  <div className="flex flex-wrap items-baseline gap-2.5">
                    <b className="text-[32px] font-extrabold tracking-tight">
                      {formatCount(stats.registrations.total)}
                    </b>
                    <DeltaChip
                      delta={percentChange(
                        stats.registrations.total,
                        stats.registrations.previousTotal,
                      )}
                      compareLabel={ranges.compareLabel}
                      previousText={formatCount(
                        stats.registrations.previousTotal,
                      )}
                    />
                  </div>
                  <BarChart
                    values={stats.registrations.buckets}
                    labels={ranges.bucketLabels}
                    barColor="#7fa9e6"
                    highlightColor="#0059bb"
                    ariaLabel={`Đăng ký mới ${ranges.periodWord}: tổng ${stats.registrations.total}`}
                    formatValue={showValues ? formatCount : undefined}
                    futureFrom={futureFrom}
                    showLabel={showLabel}
                  />
                </>
              ) : (
                <Status>
                  {failed ? "Không tải được số người đăng ký." : "Đang tải..."}
                </Status>
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
                      delta={percentChange(
                        stats.appointments.total,
                        stats.appointments.previousTotal,
                      )}
                      compareLabel={ranges.compareLabel}
                      previousText={formatCount(
                        stats.appointments.previousTotal,
                      )}
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
                      ariaLabel={`Lịch hẹn ${ranges.periodWord} theo ngày hẹn: tổng ${stats.appointments.total}`}
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

            <StatCard
              icon="account_balance"
              tone="bg-[#e6defa] text-[#3b2a7a]"
              title="Doanh thu bán gói"
              subtitle={`Tiền thực thu từ bán gói qua PayOS ${ranges.periodWord}`}
            >
              {stats ? (
                <>
                  <div className="flex flex-wrap items-baseline gap-2.5">
                    <b className="text-[32px] font-extrabold tracking-tight">
                      {formatVnd(stats.revenue.total)}
                    </b>
                    <DeltaChip
                      delta={percentChange(
                        stats.revenue.total,
                        stats.revenue.previousTotal,
                      )}
                      compareLabel={ranges.compareLabel}
                      previousText={formatVnd(stats.revenue.previousTotal)}
                    />
                  </div>
                  <BarChart
                    values={stats.revenue.buckets}
                    labels={ranges.bucketLabels}
                    barColor="#b9a8ec"
                    highlightColor="#6a4fd1"
                    ariaLabel={`Doanh thu ${ranges.periodWord}: tổng ${formatVnd(stats.revenue.total)}`}
                    formatValue={period === "day" ? undefined : formatShortVnd}
                    futureFrom={futureFrom}
                    showLabel={showLabel}
                  />
                </>
              ) : (
                <Status>
                  {failed ? "Không tải được doanh thu." : "Đang tải..."}
                </Status>
              )}
            </StatCard>
          </div>
        </>
      )}
    </section>
  );
}

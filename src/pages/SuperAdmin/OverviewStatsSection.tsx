import { useEffect, useMemo, useState, type ReactNode } from "react";
import { getAdminAppointments, getWalletHistory, type AdminAppointment } from "../../services/api";
import { formatVnd } from "../../utils/format";
import {
  addDays,
  bucketAmounts,
  bucketCounts,
  formatShortVnd,
  getPeriodRanges,
  outcomeOf,
  parseDateTime,
  parseLocalDate,
  percentChange,
  toIsoDate,
  type AppointmentOutcome,
  type Delta,
  type Period,
  type PeriodRanges,
} from "./overviewStats";

const PAGE_SIZE = 100;
const MAX_PAGES = 10;

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

type AppointmentState = {
  key: Period;
  items: AdminAppointment[];
  truncated: boolean;
  failed: boolean;
};

// Lọc lịch hẹn của backend theo ngày hẹn (atDate), mỗi trang tối đa 100, nên tải lần lượt nhiều trang.
async function loadAppointments(ranges: PeriodRanges) {
  const fromDate = toIsoDate(ranges.compareStart);
  const toDate = toIsoDate(addDays(ranges.end, -1));
  const items: AdminAppointment[] = [];
  let total = 0;
  for (let page = 0; page < MAX_PAGES; page += 1) {
    const result = await getAdminAppointments({ fromDate, toDate, page, size: PAGE_SIZE });
    total = result.total;
    items.push(...result.items);
    if (items.length >= total || result.items.length === 0) break;
  }
  return { items, truncated: items.length < total };
}

function DeltaChip({
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

function BarChart({
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

function StatCard({
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

function Status({ children }: { children: ReactNode }) {
  return <p className="py-10 text-center text-sm text-on-surface-variant">{children}</p>;
}

// Thống kê đăng ký mới, lịch hẹn và doanh thu (hoa hồng nền tảng) theo hôm nay / tuần này / tháng này.
export default function OverviewStatsSection({ customerCreatedAt }: { customerCreatedAt: string[] | null }) {
  const [period, setPeriod] = useState<Period>("week");
  const [now] = useState(() => new Date());
  const ranges = useMemo(() => getPeriodRanges(period, now), [period, now]);

  const [commissions, setCommissions] = useState<Array<{ date: Date | null; amount: number }> | null>(null);
  const [commissionsFailed, setCommissionsFailed] = useState(false);
  const [appointmentState, setAppointmentState] = useState<AppointmentState | null>(null);

  useEffect(() => {
    let cancelled = false;
    getWalletHistory()
      .then((rows) => {
        if (cancelled) return;
        setCommissions(
          rows
            .filter((row) => row.type === "COMMISSION")
            .map((row) => ({ date: parseDateTime(row.createdAt), amount: row.amount })),
        );
      })
      .catch(() => {
        if (!cancelled) setCommissionsFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    loadAppointments(ranges)
      .then((result) => {
        if (!cancelled) setAppointmentState({ key: period, ...result, failed: false });
      })
      .catch(() => {
        if (!cancelled) setAppointmentState({ key: period, items: [], truncated: false, failed: true });
      });
    return () => {
      cancelled = true;
    };
  }, [ranges, period]);

  const registrations = useMemo(
    () => (customerCreatedAt ? bucketCounts(customerCreatedAt.map(parseDateTime), ranges) : null),
    [customerCreatedAt, ranges],
  );
  const revenue = useMemo(() => (commissions ? bucketAmounts(commissions, ranges) : null), [commissions, ranges]);

  const appointmentsLoading = appointmentState?.key !== period;
  const appointmentsFailed = !appointmentsLoading && appointmentState?.failed === true;
  const datedAppointments = useMemo(() => {
    if (appointmentsLoading || !appointmentState || appointmentState.failed) return [];
    return appointmentState.items
      .map((item) => ({ item, date: parseLocalDate(item.scheduleDate) }))
      .filter((entry): entry is { item: AdminAppointment; date: Date } => entry.date !== null);
  }, [appointmentState, appointmentsLoading]);

  const appointments = useMemo(
    () =>
      appointmentsLoading || appointmentsFailed
        ? null
        : bucketCounts(
            datedAppointments.map((entry) => entry.date),
            ranges,
          ),
    [appointmentsLoading, appointmentsFailed, datedAppointments, ranges],
  );

  const inCurrent = useMemo(
    () => datedAppointments.filter((entry) => entry.date >= ranges.start && entry.date < ranges.elapsedEnd),
    [datedAppointments, ranges],
  );
  const outcomeCounts = useMemo(() => {
    const counts: Record<AppointmentOutcome, number> = { done: 0, active: 0, cancelled: 0, noShow: 0 };
    for (const entry of inCurrent) counts[outcomeOf(entry.item.status)] += 1;
    return counts;
  }, [inCurrent]);
  const outcomeTotal = inCurrent.length;
  const percentOf = (value: number) => (outcomeTotal === 0 ? 0 : Math.round((value / outcomeTotal) * 100));

  // Hôm nay: lịch hẹn nhóm theo khung giờ hẹn thay vì theo giờ.
  const timeFrameBars = useMemo(() => {
    if (period !== "day") return null;
    const groups = new Map<string, number>();
    for (const entry of inCurrent) {
      const label = entry.item.timeFrame || "Không rõ";
      groups.set(label, (groups.get(label) ?? 0) + 1);
    }
    const labels = [...groups.keys()].sort();
    return { labels, values: labels.map((label) => groups.get(label) ?? 0) };
  }, [period, inCurrent]);

  const sparseLabel = (index: number) =>
    period === "day" ? index % 6 === 0 || index === 23 : [0, 7, 14, 21, ranges.bucketCount - 1].includes(index);
  const showLabel = period === "week" ? undefined : sparseLabel;
  const futureFrom = period === "day" ? undefined : ranges.todayIndex;
  const formatCount = (value: number) => value.toLocaleString("vi-VN");
  const showValues = period === "week";

  const doneRate = percentOf(outcomeCounts.done);
  const lostRate = percentOf(outcomeCounts.cancelled + outcomeCounts.noShow);

  return (
    <section aria-labelledby="overview-stats-title" className="space-y-3.5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="overview-stats-title" className="text-xl font-extrabold">
          Thống kê theo thời gian
        </h2>
        <div role="group" aria-label="Chọn khoảng thời gian" className="inline-flex gap-1 rounded-2xl bg-surface-container p-1">
          {PERIODS.map((option) => (
            <button
              key={option.key}
              type="button"
              aria-pressed={period === option.key}
              onClick={() => setPeriod(option.key)}
              className={`min-h-9 rounded-xl px-4 text-[13px] font-bold ${
                period === option.key
                  ? "bg-surface-container-lowest text-on-primary-fixed-variant shadow-sm"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <StatCard
          icon="person_add"
          tone="bg-primary-fixed text-on-primary-fixed-variant"
          title="Người dùng đăng ký mới"
          subtitle={ranges.currentLabel}
        >
          {registrations ? (
            <>
              <div className="flex flex-wrap items-baseline gap-2.5">
                <b className="text-[32px] font-extrabold tracking-tight">{formatCount(registrations.total)}</b>
                <DeltaChip
                  delta={percentChange(registrations.total, registrations.previousTotal)}
                  compareLabel={ranges.compareLabel}
                  previousText={formatCount(registrations.previousTotal)}
                />
              </div>
              <BarChart
                values={registrations.buckets}
                labels={ranges.bucketLabels}
                barColor="#7fa9e6"
                highlightColor="#0059bb"
                ariaLabel={`Đăng ký mới ${ranges.periodWord}: tổng ${registrations.total}`}
                formatValue={showValues ? formatCount : undefined}
                futureFrom={futureFrom}
                showLabel={showLabel}
              />
            </>
          ) : (
            <Status>{customerCreatedAt === null ? "Không tải được số người đăng ký." : "Đang tải..."}</Status>
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
          {appointmentsFailed ? (
            <Status>Không tải được lịch hẹn.</Status>
          ) : appointments ? (
            <>
              <div className="flex flex-wrap items-baseline gap-2.5">
                <b className="text-[32px] font-extrabold tracking-tight">{formatCount(appointments.total)}</b>
                <DeltaChip
                  delta={percentChange(appointments.total, appointments.previousTotal)}
                  compareLabel={ranges.compareLabel}
                  previousText={formatCount(appointments.previousTotal)}
                />
              </div>
              {period === "day" ? (
                timeFrameBars && timeFrameBars.values.length > 0 ? (
                  <BarChart
                    values={timeFrameBars.values}
                    labels={timeFrameBars.labels}
                    barColor="#8fd09a"
                    highlightColor="#008730"
                    ariaLabel={`Lịch hẹn hôm nay theo khung giờ: tổng ${appointments.total}`}
                    formatValue={formatCount}
                  />
                ) : (
                  <Status>Chưa có lịch hẹn nào hôm nay.</Status>
                )
              ) : (
                <BarChart
                  values={appointments.buckets}
                  labels={ranges.bucketLabels}
                  barColor="#8fd09a"
                  highlightColor="#008730"
                  ariaLabel={`Lịch hẹn ${ranges.periodWord} theo ngày hẹn: tổng ${appointments.total}`}
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
          title="Doanh thu nền tảng"
          subtitle={`Hoa hồng ghi vào ví ${ranges.periodWord}`}
        >
          {revenue ? (
            <>
              <div className="flex flex-wrap items-baseline gap-2.5">
                <b className="text-[32px] font-extrabold tracking-tight">{formatVnd(revenue.total)}</b>
                <DeltaChip
                  delta={percentChange(revenue.total, revenue.previousTotal)}
                  compareLabel={ranges.compareLabel}
                  previousText={formatVnd(revenue.previousTotal)}
                />
              </div>
              <BarChart
                values={revenue.buckets}
                labels={ranges.bucketLabels}
                barColor="#b9a8ec"
                highlightColor="#6a4fd1"
                ariaLabel={`Doanh thu ${ranges.periodWord}: tổng ${formatVnd(revenue.total)}`}
                formatValue={showValues ? formatShortVnd : undefined}
                futureFrom={futureFrom}
                showLabel={showLabel}
              />
            </>
          ) : (
            <Status>{commissionsFailed ? "Không tải được doanh thu." : "Đang tải..."}</Status>
          )}
        </StatCard>
      </div>

      <article className="space-y-3.5 rounded-2xl border border-outline-variant/40 bg-surface-container-lowest p-5 shadow-[0_10px_26px_-14px_rgba(25,28,29,0.28)]">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-extrabold">Kết quả lịch hẹn {ranges.periodWord}</h3>
            <p className="text-xs text-on-surface-variant">
              {appointmentsLoading
                ? "Đang tải..."
                : appointmentsFailed
                  ? "Không tải được lịch hẹn."
                  : `Chia theo tình trạng của ${formatCount(outcomeTotal)} lịch hẹn`}
            </p>
          </div>
          {outcomeTotal > 0 && (
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-[#d9f7dd] px-2.5 py-1 text-xs font-bold text-[#00531a]">
                Tỷ lệ hoàn thành {doneRate}%
              </span>
              <span className="rounded-full bg-[#ffe4d6] px-2.5 py-1 text-xs font-bold text-[#7a2e00]">
                Hủy + không đến {lostRate}%
              </span>
            </div>
          )}
        </div>
        {outcomeTotal > 0 ? (
          <>
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
          </>
        ) : (
          !appointmentsLoading &&
          !appointmentsFailed && <p className="text-sm text-on-surface-variant">Chưa có lịch hẹn trong kỳ này.</p>
        )}
        {appointmentState?.truncated && (
          <p className="text-xs text-on-surface-variant">
            Chỉ thống kê {formatCount(PAGE_SIZE * MAX_PAGES)} lịch hẹn đầu tiên trong khoảng này.
          </p>
        )}
      </article>
    </section>
  );
}

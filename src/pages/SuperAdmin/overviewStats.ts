// Hàm thuần tính thống kê theo ngày / tuần / tháng cho màn Tổng quan Super Admin.
// Tuần tính từ thứ Hai đến Chủ nhật, theo giờ địa phương của trình duyệt.

export type Period = "day" | "week" | "month";

const DAY_MS = 24 * 60 * 60 * 1000;
const WEEKDAY_LABELS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

export function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function addDays(date: Date, days: number) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

function formatDayMonth(date: Date) {
  return `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function toIsoDate(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

// "2026-10-04" -> ngày địa phương (tránh lệch múi giờ khi parse chuỗi chỉ có ngày).
export function parseLocalDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!match) return null;
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

export function parseDateTime(value: string | null | undefined): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export type PeriodRanges = {
  period: Period;
  start: Date; // đầu kỳ (gồm)
  end: Date; // hết kỳ (không gồm)
  elapsedEnd: Date; // hết hôm nay hoặc hết kỳ, tuỳ cái nào đến trước (không gồm)
  compareStart: Date;
  compareEnd: Date; // cửa sổ kỳ trước có cùng độ dài (không gồm)
  bucketCount: number;
  bucketLabels: string[];
  todayIndex: number;
  currentLabel: string;
  compareLabel: string;
  periodWord: string;
};

export function getPeriodRanges(period: Period, now: Date): PeriodRanges {
  const today = startOfDay(now);

  if (period === "day") {
    const end = addDays(today, 1);
    return {
      period,
      start: today,
      end,
      elapsedEnd: end,
      compareStart: addDays(today, -1),
      compareEnd: today,
      bucketCount: 24,
      bucketLabels: Array.from({ length: 24 }, (_, hour) => `${hour}h`),
      todayIndex: now.getHours(),
      currentLabel: `Hôm nay (${formatDayMonth(today)})`,
      compareLabel: "hôm qua",
      periodWord: "hôm nay",
    };
  }

  if (period === "week") {
    const weekday = (now.getDay() + 6) % 7; // thứ Hai = 0
    const start = addDays(today, -weekday);
    const end = addDays(start, 7);
    const compareStart = addDays(start, -7);
    return {
      period,
      start,
      end,
      elapsedEnd: addDays(start, weekday + 1),
      compareStart,
      compareEnd: addDays(compareStart, weekday + 1),
      bucketCount: 7,
      bucketLabels: WEEKDAY_LABELS,
      todayIndex: weekday,
      currentLabel: `Tuần này (${formatDayMonth(start)} – ${formatDayMonth(addDays(end, -1))})`,
      compareLabel: "cùng kỳ tuần trước",
      periodWord: "tuần này",
    };
  }

  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const dayCount = Math.round((end.getTime() - start.getTime()) / DAY_MS);
  const compareStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const previousDayCount = Math.round((start.getTime() - compareStart.getTime()) / DAY_MS);
  const elapsedDays = now.getDate();
  return {
    period,
    start,
    end,
    elapsedEnd: addDays(start, elapsedDays),
    compareStart,
    compareEnd: addDays(compareStart, Math.min(elapsedDays, previousDayCount)),
    bucketCount: dayCount,
    bucketLabels: Array.from({ length: dayCount }, (_, index) => String(index + 1)),
    todayIndex: elapsedDays - 1,
    currentLabel: `Tháng ${now.getMonth() + 1} (đến ngày ${elapsedDays})`,
    compareLabel: "cùng kỳ tháng trước",
    periodWord: "tháng này",
  };
}

function bucketIndex(date: Date, ranges: PeriodRanges) {
  if (ranges.period === "day") return date.getHours();
  if (ranges.period === "week") {
    return Math.round((startOfDay(date).getTime() - ranges.start.getTime()) / DAY_MS);
  }
  return date.getDate() - 1;
}

export type BucketResult = {
  buckets: number[];
  total: number;
  previousTotal: number;
};

// Cộng dồn `weight` của từng mục vào đúng ô (giờ / ngày) của kỳ hiện tại và vào tổng kỳ trước.
function accumulate<T>(
  items: T[],
  ranges: PeriodRanges,
  getDate: (item: T) => Date | null,
  getWeight: (item: T) => number,
): BucketResult {
  const buckets = new Array<number>(ranges.bucketCount).fill(0);
  let total = 0;
  let previousTotal = 0;
  for (const item of items) {
    const date = getDate(item);
    if (!date) continue;
    const weight = getWeight(item);
    if (date >= ranges.start && date < ranges.elapsedEnd) {
      const index = bucketIndex(date, ranges);
      if (index >= 0 && index < buckets.length) {
        buckets[index] += weight;
        total += weight;
      }
    } else if (date >= ranges.compareStart && date < ranges.compareEnd) {
      previousTotal += weight;
    }
  }
  return { buckets, total, previousTotal };
}

export function bucketCounts(dates: Array<Date | null>, ranges: PeriodRanges): BucketResult {
  return accumulate(dates, ranges, (date) => date, () => 1);
}

export function bucketAmounts(
  entries: Array<{ date: Date | null; amount: number }>,
  ranges: PeriodRanges,
): BucketResult {
  return accumulate(
    entries,
    ranges,
    (entry) => entry.date,
    (entry) => (Number.isFinite(entry.amount) ? entry.amount : 0),
  );
}

export type Delta = {
  direction: "up" | "down" | "flat" | "new";
  percent: number | null;
};

export function percentChange(current: number, previous: number): Delta {
  if (previous === 0) {
    return current === 0 ? { direction: "flat", percent: null } : { direction: "new", percent: null };
  }
  const percent = Math.round(((current - previous) / previous) * 100);
  if (percent === 0) return { direction: "flat", percent: 0 };
  return { direction: percent > 0 ? "up" : "down", percent: Math.abs(percent) };
}

export type AppointmentOutcome = "done" | "active" | "cancelled" | "noShow";

export function outcomeOf(status: string | null | undefined): AppointmentOutcome {
  switch ((status ?? "").toLowerCase()) {
    case "completed":
    case "successful":
      return "done";
    case "cancelled":
      return "cancelled";
    case "no_show":
      return "noShow";
    default:
      return "active"; // chờ xử lý, đã xác nhận, đang thực hiện và các trạng thái khác
  }
}

export function formatShortVnd(value: number) {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1).replace(/\.0$/, "")}tr`;
  if (value >= 1_000) return `${Math.round(value / 1_000)}k`;
  return String(Math.round(value));
}

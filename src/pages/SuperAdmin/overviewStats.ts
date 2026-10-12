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

export function formatShortVnd(value: number) {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1).replace(/\.0$/, "")}tr`;
  if (value >= 1_000) return `${Math.round(value / 1_000)}k`;
  return String(Math.round(value));
}

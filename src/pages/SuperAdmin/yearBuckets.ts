// Hàm thuần cho thống kê theo năm: gom theo tháng, cắt "cùng kỳ" và tổng hợp từng năm.
import { outcomeOf, startOfDay } from "./overviewStats";

export type YearAppointment = { date: Date; status: string };
export type DatedAmount = { date: Date | null; amount: number };

// Mốc cắt "cùng kỳ": năm đang diễn ra cắt tại hôm nay, năm đã qua lấy trọn năm.
export type YearCutoff = { month: number; day: number }; // month: 0-11

export function cutoffFor(year: number, now: Date): YearCutoff {
  if (year >= now.getFullYear()) return { month: now.getMonth(), day: now.getDate() };
  return { month: 11, day: 31 };
}

export function withinCutoff(date: Date, year: number, cutoff: YearCutoff) {
  if (date.getFullYear() !== year) return false;
  const month = date.getMonth();
  return month < cutoff.month || (month === cutoff.month && date.getDate() <= cutoff.day);
}

export type MonthRow = {
  registrations: number;
  appointments: number;
  done: number;
  lost: number;
  revenue: number;
};

export type YearData = {
  registrations: Array<Date | null>;
  appointments: YearAppointment[];
  commissions: DatedAmount[];
};

export function emptyRow(): MonthRow {
  return { registrations: 0, appointments: 0, done: 0, lost: 0, revenue: 0 };
}

// 12 dòng (tháng 1..12) của một năm, chỉ tính đến mốc cắt.
export function monthRows(data: YearData, year: number, cutoff: YearCutoff): MonthRow[] {
  const rows = Array.from({ length: 12 }, emptyRow);
  for (const date of data.registrations) {
    if (date && withinCutoff(date, year, cutoff)) rows[date.getMonth()].registrations += 1;
  }
  for (const item of data.appointments) {
    if (!withinCutoff(item.date, year, cutoff)) continue;
    const row = rows[item.date.getMonth()];
    row.appointments += 1;
    const outcome = outcomeOf(item.status);
    if (outcome === "done") row.done += 1;
    else if (outcome === "cancelled" || outcome === "noShow") row.lost += 1;
  }
  for (const entry of data.commissions) {
    if (entry.date && Number.isFinite(entry.amount) && withinCutoff(entry.date, year, cutoff)) {
      rows[entry.date.getMonth()].revenue += entry.amount;
    }
  }
  return rows;
}

export function sumRows(rows: MonthRow[]): MonthRow {
  return rows.reduce(
    (total, row) => ({
      registrations: total.registrations + row.registrations,
      appointments: total.appointments + row.appointments,
      done: total.done + row.done,
      lost: total.lost + row.lost,
      revenue: total.revenue + row.revenue,
    }),
    emptyRow(),
  );
}

// Năm đầu tiên có dữ liệu (đăng ký hoặc hoa hồng); không có thì lấy năm hiện tại.
export function firstDataYear(data: Pick<YearData, "registrations" | "commissions">, now: Date) {
  let first = now.getFullYear();
  for (const date of data.registrations) if (date && date.getFullYear() < first) first = date.getFullYear();
  for (const entry of data.commissions) {
    if (entry.date && entry.date.getFullYear() < first) first = entry.date.getFullYear();
  }
  return first;
}

export function yearRange(year: number) {
  return { start: startOfDay(new Date(year, 0, 1)), end: startOfDay(new Date(year, 11, 31)) };
}

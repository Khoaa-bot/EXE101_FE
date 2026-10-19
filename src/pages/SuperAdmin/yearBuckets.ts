// Hàm thuần cho thống kê theo năm: mốc cắt "cùng kỳ" và tổng hợp các dòng tháng do backend trả về.

// Mốc cắt "cùng kỳ": năm đang diễn ra cắt tại hôm nay, năm đã qua lấy trọn năm.
export type YearCutoff = { month: number; day: number }; // month: 0-11

export function cutoffFor(year: number, now: Date): YearCutoff {
  if (year >= now.getFullYear()) return { month: now.getMonth(), day: now.getDate() };
  return { month: 11, day: 31 };
}

export type MonthRow = {
  registrations: number;
  appointments: number;
  done: number;
  lost: number;
  revenue: number;
};

export function emptyRow(): MonthRow {
  return { registrations: 0, appointments: 0, done: 0, lost: 0, revenue: 0 };
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

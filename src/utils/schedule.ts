// Khung giờ còn đặt được: chưa tới giờ bắt đầu của khung (khớp quy tắc kiểm tra ở BE). BE vẫn là nơi quyết định cuối cùng.
export function isSlotUpcoming(dateStr: string, timeFrame: string) {
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return true;
  const startHour = Number.parseInt(timeFrame, 10);
  date.setHours(Number.isNaN(startHour) ? 0 : Math.min(Math.max(startHour, 0), 23), 0, 0, 0);
  return date >= new Date();
}

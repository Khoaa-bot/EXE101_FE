export function formatVnd(value: number | null | undefined) {
  if (value === null || value === undefined) return "—";
  return `${value.toLocaleString("vi-VN")}đ`;
}

export function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

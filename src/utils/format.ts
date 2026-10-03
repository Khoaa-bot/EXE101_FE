export function formatVnd(value: number | null | undefined) {
  if (value === null || value === undefined) return "—";
  return `${value.toLocaleString("vi-VN")}đ`;
}

// Trạng thái lịch hẹn thực tế trả về từ backend (EngineerController /
// AppointmentDto.status) — xem EngineerService.updateAppointment ở BE.
export type EngineerAppointmentStatus =
  | "pending"
  | "confirmed"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "no_show";

export const ENGINEER_STATUS_OPTIONS: { value: EngineerAppointmentStatus; label: string }[] = [
  { value: "pending", label: "Chờ xử lý" },
  { value: "confirmed", label: "Đã tiếp nhận" },
  { value: "in_progress", label: "Đang thực hiện" },
  { value: "completed", label: "Hoàn thành" },
  { value: "cancelled", label: "Đã hủy" },
  { value: "no_show", label: "Khách không đến" },
];

export function statusLabel(status: string): string {
  const match = ENGINEER_STATUS_OPTIONS.find(
    (option) => option.value === status.toLowerCase(),
  );
  return match?.label ?? status;
}

export function statusBadgeClass(status: string): string {
  switch (status.toLowerCase()) {
    case "in_progress":
      return "bg-primary-container/15 text-primary";
    case "confirmed":
      return "bg-tertiary-container/15 text-tertiary";
    case "completed":
      return "bg-tertiary text-on-tertiary";
    case "cancelled":
    case "no_show":
      return "bg-error-container/40 text-on-error-container";
    default:
      return "bg-surface-container-high text-on-surface-variant";
  }
}

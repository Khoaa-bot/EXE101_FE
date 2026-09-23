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

// Luồng trạng thái hợp lệ — chỉ được đi tới, không quay lui (trừ khi huỷ /
// khách không đến, coi như thoát sớm). completed/cancelled/no_show là
// trạng thái cuối, không đổi được nữa.
const ALLOWED_NEXT_STATUSES: Record<EngineerAppointmentStatus, EngineerAppointmentStatus[]> = {
  pending: ["pending", "confirmed", "cancelled", "no_show"],
  confirmed: ["confirmed", "in_progress", "cancelled", "no_show"],
  in_progress: ["in_progress", "completed", "cancelled", "no_show"],
  completed: ["completed"],
  cancelled: ["cancelled"],
  no_show: ["no_show"],
};

export function getSelectableStatusOptions(currentStatus: string) {
  const current = currentStatus.toLowerCase() as EngineerAppointmentStatus;
  const allowed = ALLOWED_NEXT_STATUSES[current] ?? ENGINEER_STATUS_OPTIONS.map((o) => o.value);
  return ENGINEER_STATUS_OPTIONS.filter((option) => allowed.includes(option.value));
}

export function isTerminalStatus(status: string): boolean {
  const s = status.toLowerCase();
  return s === "completed" || s === "cancelled" || s === "no_show";
}

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

import type { MaintenanceStage, MaintenanceStatus } from "../services/api";

// Tiêu đề thông báo do backend (MaintenanceReminderService) gửi; backend chưa có
// trường riêng cho mức độ nên FE nhận diện qua tiêu đề.
export const MAINTENANCE_TITLE_OVERDUE = "Xe đã quá hạn bảo dưỡng";
export const MAINTENANCE_TITLE_SOON = "Xe sắp đến hạn bảo dưỡng";

export const MAX_ODOMETER_KM = 500_000;

export const STAGE_RANK: Record<MaintenanceStage, number> = {
  OK: 0,
  SOON: 1,
  OVERDUE: 2,
};

export const STAGE_META: Record<
  MaintenanceStage,
  { label: string; icon: string; badge: string; panel: string; bar: string; text: string }
> = {
  OK: {
    label: "Tốt",
    icon: "check_circle",
    badge: "bg-[#d7f5dc] text-on-tertiary-fixed-variant",
    panel: "bg-surface-container-low",
    bar: "bg-tertiary-container",
    text: "text-on-surface-variant",
  },
  SOON: {
    label: "Sắp đến hạn",
    icon: "schedule",
    badge: "bg-[#ffe9c7] text-[#6b4000]",
    panel: "border border-[#f1d29b] bg-[#fff7ea]",
    bar: "bg-[#b36a00]",
    text: "font-semibold text-[#6b4000]",
  },
  OVERDUE: {
    label: "Quá hạn",
    icon: "warning",
    badge: "bg-error-container text-on-error-container",
    panel: "border border-[#f3b6af] bg-[#fff1ef]",
    bar: "bg-error",
    text: "font-semibold text-on-error-container",
  },
};

const numberFormat = new Intl.NumberFormat("vi-VN");

export function sortByUrgency(items: MaintenanceStatus[]): MaintenanceStatus[] {
  return [...items].sort((a, b) => {
    const byStage = STAGE_RANK[b.stage] - STAGE_RANK[a.stage];
    if (byStage !== 0) return byStage;
    return (a.daysRemaining ?? Infinity) - (b.daysRemaining ?? Infinity);
  });
}

export function worstStage(items: MaintenanceStatus[]): MaintenanceStage {
  return items.reduce<MaintenanceStage>(
    (worst, item) => (STAGE_RANK[item.stage] > STAGE_RANK[worst] ? item.stage : worst),
    "OK",
  );
}

// "Còn 280 km · 14 ngày" hoặc "Quá 2.300 km · quá 14 ngày".
export function formatRemaining(status: MaintenanceStatus): string {
  const { kmRemaining, daysRemaining } = status;
  const parts: string[] = [];

  if (status.stage === "OVERDUE") {
    if (kmRemaining != null && kmRemaining < 0) {
      parts.push(`quá ${numberFormat.format(-kmRemaining)} km`);
    }
    if (daysRemaining != null && daysRemaining < 0) {
      parts.push(`quá ${numberFormat.format(-daysRemaining)} ngày`);
    }
    const text = parts.join(" · ");
    return text.charAt(0).toUpperCase() + text.slice(1);
  }

  if (kmRemaining != null) parts.push(`${numberFormat.format(Math.max(kmRemaining, 0))} km`);
  if (daysRemaining != null) parts.push(`${numberFormat.format(Math.max(daysRemaining, 0))} ngày`);
  return `Còn ${parts.join(" · ")}`;
}

// Tỷ lệ (0-100) quãng bảo dưỡng đã đi qua; lấy mốc nào gần hạn hơn.
export function progressPercent(status: MaintenanceStatus): number {
  if (status.stage === "OVERDUE") return 100;

  const ratios: number[] = [];
  if (status.nextDueKm != null && status.lastServiceKm != null && status.kmRemaining != null) {
    const interval = status.nextDueKm - status.lastServiceKm;
    if (interval > 0) ratios.push((interval - status.kmRemaining) / interval);
  }
  if (status.nextDueDate && status.daysRemaining != null) {
    const interval =
      (new Date(`${status.nextDueDate}T00:00:00`).getTime() -
        new Date(`${status.lastServiceDate}T00:00:00`).getTime()) /
      86_400_000;
    if (interval > 0) ratios.push((interval - status.daysRemaining) / interval);
  }

  if (ratios.length === 0) return 0;
  return Math.round(Math.min(Math.max(Math.max(...ratios), 0), 1) * 100);
}

export function dueLabel(status: MaintenanceStatus): string {
  if (status.nextDueKm != null) return `Hạn ${numberFormat.format(status.nextDueKm)} km`;
  if (status.nextDueDate) {
    return `Hạn ${new Date(`${status.nextDueDate}T00:00:00`).toLocaleDateString("vi-VN")}`;
  }
  return "";
}

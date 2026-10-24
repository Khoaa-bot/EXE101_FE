import type { MaintenanceStage, MaintenanceStatus } from "../services/api";
import {
  STAGE_META,
  dueLabel,
  formatRemaining,
  progressPercent,
  sortByUrgency,
} from "../utils/maintenance";

export function MaintenanceBadge({ stage }: { stage: MaintenanceStage }) {
  const meta = STAGE_META[stage];
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${meta.badge}`}
    >
      <span className="material-symbols-outlined text-[16px]" aria-hidden="true">
        {meta.icon}
      </span>
      {meta.label}
    </span>
  );
}

// Khối chi tiết hạn bảo dưỡng trong thẻ xe: dịch vụ gấp nhất + thanh tiến độ.
export function MaintenancePanel({ items }: { items: MaintenanceStatus[] }) {
  if (items.length === 0) {
    return (
      <p className="rounded-2xl bg-surface-container-low p-3.5 text-xs text-on-surface-variant">
        Chưa có dữ liệu bảo dưỡng định kỳ. Hạn sẽ được tính sau lần bảo dưỡng đầu tiên tại garage.
      </p>
    );
  }

  const [urgent] = sortByUrgency(items);
  const meta = STAGE_META[urgent.stage];

  return (
    <div className={`space-y-2 rounded-2xl p-3.5 ${meta.panel}`}>
      <div className="flex justify-between gap-2 text-[13px]">
        <span className="font-semibold text-on-surface">{urgent.serviceName}</span>
        <span className="shrink-0 text-on-surface-variant">{dueLabel(urgent)}</span>
      </div>
      <div
        className="h-1.5 overflow-hidden rounded-full bg-surface-container-highest"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={progressPercent(urgent)}
        aria-label={`Tiến độ đến hạn ${urgent.serviceName}`}
      >
        <div className={`h-full ${meta.bar}`} style={{ width: `${progressPercent(urgent)}%` }} />
      </div>
      <p className={`text-xs ${meta.text}`}>{formatRemaining(urgent)}</p>
    </div>
  );
}

// Dòng cảnh báo ở trang chủ cho một dịch vụ sắp/đã quá hạn.
export function MaintenanceAlert({
  status,
  vehicleLabel,
  onBook,
}: {
  status: MaintenanceStatus;
  vehicleLabel: string;
  onBook: () => void;
}) {
  const overdue = status.stage === "OVERDUE";
  const meta = STAGE_META[status.stage];

  return (
    <div
      className={`flex flex-col gap-3 rounded-2xl p-4 sm:flex-row sm:items-center ${meta.panel}`}
    >
      <span
        className={`material-symbols-outlined text-[28px] ${
          overdue ? "text-on-error-container" : "text-[#6b4000]"
        }`}
        aria-hidden="true"
      >
        {meta.icon}
      </span>
      <div className="min-w-0 flex-1">
        <p
          className={`text-sm font-bold ${
            overdue ? "text-on-error-container" : "text-[#4f2f00]"
          }`}
        >
          {vehicleLabel} {overdue ? "đã quá hạn" : "sắp đến hạn"} {status.serviceName}
        </p>
        <p
          className={`text-xs ${
            overdue ? "text-on-error-container" : "text-[#6b4000]"
          }`}
        >
          {formatRemaining(status)}.
          {overdue ? " Nên đặt lịch sớm để đảm bảo an toàn." : ""}
        </p>
      </div>
      <button
        type="button"
        onClick={onBook}
        className={`min-h-11 shrink-0 rounded-xl px-5 text-sm font-bold text-white transition-all hover:shadow-lg active:scale-95 ${
          overdue ? "bg-error" : "bg-primary"
        }`}
      >
        Đặt lịch ngay
      </button>
    </div>
  );
}

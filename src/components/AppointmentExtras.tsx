import type { AppointmentDto, AppointmentExtra } from "../services/api";
import { formatVnd } from "../utils/format";

const EXTRA_STATUS: Record<AppointmentExtra["status"], { label: string; cls: string }> = {
  proposed: { label: "Chờ khách duyệt", cls: "bg-tertiary-container/20 text-tertiary" },
  approved: { label: "Đã đồng ý", cls: "bg-primary-container/15 text-primary" },
  rejected: { label: "Đã từ chối", cls: "bg-error-container/20 text-error" },
};

type ExtrasListProps = {
  extras: AppointmentExtra[];
  busyId?: number | null;
  onDecide?: (extra: AppointmentExtra, approve: boolean) => void;
};

export function ExtrasList({ extras, busyId = null, onDecide }: ExtrasListProps) {
  if (extras.length === 0) return null;

  return (
    <ul className="space-y-3">
      {extras.map((extra) => {
        const status = EXTRA_STATUS[extra.status] ?? EXTRA_STATUS.proposed;
        const canDecide = Boolean(onDecide) && extra.status === "proposed";

        return (
          <li
            key={extra.id}
            className="rounded-lg border border-outline-variant bg-surface-container-low p-4"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-semibold">{extra.name}</p>
                {extra.reason && (
                  <p className="mt-1 text-xs text-on-surface-variant">Lý do: {extra.reason}</p>
                )}
              </div>
              <div className="text-right">
                <p className="font-bold text-primary">{formatVnd(extra.price)}</p>
                <span
                  className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold ${status.cls}`}
                >
                  {status.label}
                </span>
              </div>
            </div>

            {canDecide && (
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  disabled={busyId === extra.id}
                  onClick={() => onDecide?.(extra, true)}
                  className="flex-1 rounded-lg bg-primary py-2 text-sm font-medium text-on-primary transition hover:opacity-90 disabled:opacity-50"
                >
                  Đồng ý
                </button>
                <button
                  type="button"
                  disabled={busyId === extra.id}
                  onClick={() => onDecide?.(extra, false)}
                  className="flex-1 rounded-lg border border-error py-2 text-sm font-medium text-error transition hover:bg-error-container/10 disabled:opacity-50"
                >
                  Từ chối
                </button>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

export function CostBreakdown({ appointment }: { appointment: AppointmentDto }) {
  const approvedExtras = (appointment.extras ?? []).filter((extra) => extra.status === "approved");
  const parts = appointment.parts ?? [];
  const total = appointment.totalAmount ?? appointment.servicePrice;
  const isEstimate = appointment.invoiceId === null || appointment.invoiceId === undefined;

  return (
    <div className="space-y-2 text-body-md">
      <div className="flex justify-between">
        <span className="text-on-surface-variant">{appointment.serviceName}</span>
        <span className="font-bold">{formatVnd(appointment.servicePrice)}</span>
      </div>

      {approvedExtras.map((extra) => (
        <div key={`extra-${extra.id}`} className="flex justify-between">
          <span className="text-on-surface-variant">Phát sinh: {extra.name}</span>
          <span className="font-bold">{formatVnd(extra.price)}</span>
        </div>
      ))}

      {parts.map((part) => (
        <div key={`part-${part.id}`} className="flex justify-between">
          <span className="text-on-surface-variant">
            {part.partName} × {part.quantity}
          </span>
          <span className="font-bold">{formatVnd(part.lineTotal)}</span>
        </div>
      ))}

      <div className="mt-3 flex items-center justify-between border-t border-outline-variant pt-3">
        <span className="font-headline-md text-headline-md">
          Tổng cộng{isEstimate ? " (tạm tính)" : ""}
        </span>
        <span className="font-headline-md text-headline-md text-primary">{formatVnd(total)}</span>
      </div>

      {appointment.invoicePaymentStatus && (
        <p
          className={`text-right text-xs font-semibold ${
            appointment.invoicePaymentStatus === "paid" ? "text-tertiary" : "text-error"
          }`}
        >
          {appointment.invoicePaymentStatus === "paid" ? "Đã thanh toán" : "Chưa thanh toán"}
        </p>
      )}
    </div>
  );
}

import type { AppointmentDto } from "../services/api";
import { formatVnd } from "../utils/format";

export function CostBreakdown({ appointment }: { appointment: AppointmentDto }) {
  const parts = appointment.parts ?? [];
  const total = appointment.totalAmount ?? appointment.servicePrice;
  const isEstimate = appointment.invoiceId === null || appointment.invoiceId === undefined;

  return (
    <div className="space-y-2 text-body-md">
      <div className="flex justify-between">
        <span className="text-on-surface-variant">{appointment.serviceName}</span>
        <span className="font-bold">{formatVnd(appointment.servicePrice)}</span>
      </div>

      {parts.map((part) => (
        <div key={`part-${part.id}`} className="flex justify-between">
          <span className="text-on-surface-variant">
            {part.partName} × {part.quantity}
          </span>
          <span className="font-bold">{formatVnd(part.lineTotal)}</span>
        </div>
      ))}

      <div className="mt-3 flex items-center justify-between border-t border-outline-variant pt-3">
        <span className="text-base font-extrabold">
          Tổng cộng{isEstimate ? " (tạm tính)" : ""}
        </span>
        <span className="text-2xl font-extrabold text-on-primary-fixed-variant">{formatVnd(total)}</span>
      </div>

      {appointment.invoicePaymentStatus === "paid" && (
        <p className="text-right text-xs font-semibold text-tertiary">Đã thanh toán đủ tại garage</p>
      )}
    </div>
  );
}

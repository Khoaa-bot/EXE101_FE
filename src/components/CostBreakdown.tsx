import type { AppointmentDto } from "../services/api";
import { formatVnd } from "../utils/format";

export function CostBreakdown({ appointment }: { appointment: AppointmentDto }) {
  const hasVoucher = Boolean(appointment.voucherCode);
  const total = hasVoucher
    ? (appointment.payableAmount ?? appointment.servicePrice)
    : (appointment.totalAmount ?? appointment.servicePrice);
  const isEstimate = appointment.invoiceId === null || appointment.invoiceId === undefined;

  return (
    <div className="space-y-2 text-body-md">
      <div className="flex justify-between">
        <span className="text-on-surface-variant">{appointment.serviceName}</span>
        <span className="font-bold">{formatVnd(appointment.servicePrice)}</span>
      </div>

      {hasVoucher && (
        <div className="flex justify-between text-[#00531a]">
          <span className="inline-flex items-center gap-1.5">
            <span aria-hidden="true" className="material-symbols-outlined text-lg">
              {appointment.voucherType === "GIFT" ? "card_giftcard" : "sell"}
            </span>
            Voucher {appointment.voucherCode}
          </span>
          <span className="font-bold">
            {appointment.voucherType === "GIFT" || !appointment.discountAmount
              ? "Tặng dịch vụ"
              : `−${formatVnd(appointment.discountAmount)}`}
          </span>
        </div>
      )}
      {hasVoucher && appointment.voucherType === "GIFT" && appointment.voucherTitle && (
        <p className="text-xs text-on-surface-variant">{appointment.voucherTitle}</p>
      )}

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

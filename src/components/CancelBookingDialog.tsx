import { useRef } from "react";
import { useDialogA11y } from "../hooks/useDialogA11y";
import type { AppointmentDto } from "../services/api";

type CancelBookingDialogProps = {
  appointment: AppointmentDto;
  isCancelling: boolean;
  onKeep: () => void;
  onConfirm: () => void;
};

// Cảnh báo trước khi khách huỷ lịch: khung giờ bị nhả và việc huỷ không hoàn tác được.
export default function CancelBookingDialog({ appointment, isCancelling, onKeep, onConfirm }: CancelBookingDialogProps) {
  const ref = useRef<HTMLDivElement>(null);
  useDialogA11y(true, ref, onKeep);

  return (
    <div
      ref={ref}
      role="dialog"
      aria-modal="true"
      aria-labelledby="cancel-booking-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
    >
      <div className="w-full max-w-[28rem] rounded-2xl border border-outline-variant bg-surface-container-lowest p-6 shadow-xl">
        <div className="flex items-center gap-3">
          <span
            aria-hidden="true"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#fff1cc] text-[#6b4200]"
          >
            <span className="material-symbols-outlined">warning</span>
          </span>
          <h3 id="cancel-booking-title" className="text-lg font-extrabold">
            Huỷ lịch hẹn #{appointment.id}?
          </h3>
        </div>
        <p className="mt-2 text-[13px] text-on-surface-variant">
          {appointment.serviceName} · {appointment.garageName} · {appointment.scheduleDate}, {appointment.timeFrame}
        </p>

        <ul className="mt-4 list-disc space-y-1.5 pl-5 text-[13px]">
          <li>Khung giờ sẽ được nhả cho khách khác, huỷ xong không hoàn tác được. Muốn đi lại bạn cần đặt lịch mới.</li>
          <li>Chỉ huỷ được khi xe chưa được tiếp nhận. Sau đó hãy liên hệ garage.</li>
        </ul>

        <div className="mt-5 flex gap-3">
          <button
            type="button"
            onClick={onKeep}
            disabled={isCancelling}
            className="min-h-11 flex-1 rounded-xl border-[1.5px] border-outline-variant text-sm font-bold text-on-surface-variant transition hover:bg-surface-container disabled:opacity-50"
          >
            Giữ lịch
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isCancelling}
            className="min-h-11 flex-1 rounded-xl bg-error text-sm font-bold text-on-error transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isCancelling ? "Đang huỷ..." : "Huỷ lịch"}
          </button>
        </div>
      </div>
    </div>
  );
}

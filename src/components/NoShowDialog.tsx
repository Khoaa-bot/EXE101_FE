import { useRef } from "react";
import { useDialogA11y } from "../hooks/useDialogA11y";
import type { AppointmentDto } from "../services/api";
import { formatVnd } from "../utils/format";

type NoShowDialogProps = {
  appointment: AppointmentDto;
  isBusy: boolean;
  onKeep: () => void;
  onConfirm: () => void;
};

// Khớp cấu hình BE servio.no-show.retain-rate (mặc định 20%). Thông báo gửi khách luôn dùng số thật của BE.
const NO_SHOW_RETAIN_RATE = 0.2;

// Cảnh báo trước khi lễ tân ghi nhận khách không đến: nói rõ tiền giữ lại, tiền hoàn và hậu quả với khách.
export default function NoShowDialog({ appointment, isBusy, onKeep, onConfirm }: NoShowDialogProps) {
  const ref = useRef<HTMLDivElement>(null);
  useDialogA11y(true, ref, onKeep);

  const paid = appointment.amountPaid ?? 0;
  const retained = Math.round(paid * NO_SHOW_RETAIN_RATE);

  return (
    <div
      ref={ref}
      role="dialog"
      aria-modal="true"
      aria-labelledby="no-show-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
    >
      <div className="w-full max-w-[28rem] rounded-2xl border border-outline-variant bg-surface-container-lowest p-6 shadow-xl">
        <div className="flex items-center gap-3">
          <span
            aria-hidden="true"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#fff1cc] text-[#6b4200]"
          >
            <span className="material-symbols-outlined">person_off</span>
          </span>
          <h3 id="no-show-title" className="text-lg font-extrabold">
            Ghi nhận khách không đến?
          </h3>
        </div>
        <p className="mt-2 text-[13px] text-on-surface-variant">
          Lịch #{appointment.id} · {appointment.serviceName} · {appointment.customerName}
        </p>

        <ul className="mt-4 list-disc space-y-1.5 pl-5 text-[13px]">
          {paid > 0 ? (
            <li>
              Garage giữ lại <b>{formatVnd(retained)}</b> ({Math.round(NO_SHOW_RETAIN_RATE * 100)}%), hoàn{" "}
              <b>{formatVnd(paid - retained)}</b> vào Ví Servio của khách.
            </li>
          ) : (
            <li>Khách chưa thanh toán nên không có khoản nào giữ lại hay hoàn.</li>
          )}
          <li>Khách bị tính 1 lần không đến. Đủ 3 lần, khách bị chặn đặt lịch.</li>
          <li>Khung giờ được nhả cho khách khác. Khách sẽ nhận thông báo.</li>
        </ul>

        <div className="mt-5 flex gap-3">
          <button
            type="button"
            onClick={onKeep}
            disabled={isBusy}
            className="min-h-11 flex-1 rounded-xl border-[1.5px] border-outline-variant text-sm font-bold text-on-surface-variant transition hover:bg-surface-container disabled:opacity-50"
          >
            Quay lại
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isBusy}
            className="min-h-11 flex-1 rounded-xl bg-[#fff1cc] text-sm font-bold text-[#6b4200] ring-1 ring-[#c47f00]/40 transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isBusy ? "Đang ghi nhận..." : "Ghi nhận không đến"}
          </button>
        </div>
      </div>
    </div>
  );
}

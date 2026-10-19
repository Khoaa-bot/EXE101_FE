import { useEffect, useRef, useState } from "react";

type PaymentCountdownProps = {
  expiresAt: string | null | undefined;
  onExpired?: () => void;
};

// Đồng hồ đếm ngược hạn thanh toán của lịch đặt chưa trả; hết hạn thì báo một lần để màn hình tải lại danh sách.
export default function PaymentCountdown({ expiresAt, onExpired }: PaymentCountdownProps) {
  const target = expiresAt ? new Date(expiresAt).getTime() : null;
  const [now, setNow] = useState(() => Date.now());
  const callback = useRef(onExpired);

  useEffect(() => {
    callback.current = onExpired;
  });

  useEffect(() => {
    if (target === null) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [target]);

  const remaining = target === null || Number.isNaN(target) ? 0 : Math.max(0, Math.floor((target - now) / 1000));
  const expired = target !== null && !Number.isNaN(target) && remaining === 0;

  useEffect(() => {
    if (expired) callback.current?.();
  }, [expired]);

  if (target === null || Number.isNaN(target)) return null;

  const minutes = String(Math.floor(remaining / 60)).padStart(2, "0");
  const seconds = String(remaining % 60).padStart(2, "0");

  return (
    <span
      role="timer"
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
        expired ? "bg-error-container/20 text-error" : "bg-tertiary-container/20 text-tertiary"
      }`}
    >
      {expired ? "Đã hết hạn thanh toán" : `Chờ thanh toán · còn ${minutes}:${seconds}`}
    </span>
  );
}

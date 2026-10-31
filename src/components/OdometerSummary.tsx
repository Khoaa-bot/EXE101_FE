type Props = {
  before?: number | null;
  after?: number | null;
  className?: string;
};

const km = (value: number) => `${value.toLocaleString("vi-VN")} km`;

// Km ghi nhận trước và sau khi sửa của một lịch hẹn. Không có km nào thì không hiển thị gì.
export default function OdometerSummary({ before, after, className = "" }: Props) {
  const hasBefore = before != null;
  const hasAfter = after != null;
  if (!hasBefore && !hasAfter) return null;
  const delta = hasBefore && hasAfter ? after - before : null;

  return (
    <div
      aria-label="Số km của xe"
      className={`flex flex-wrap items-center gap-x-3 gap-y-1 rounded-2xl bg-surface-container-low px-3.5 py-2.5 text-[13px] ${className}`}
    >
      <span aria-hidden="true" className="material-symbols-outlined text-xl text-primary">
        speed
      </span>
      {hasBefore && (
        <span>
          Trước khi sửa <b className="text-sm">{km(before)}</b>
        </span>
      )}
      {hasBefore && hasAfter && (
        <span aria-hidden="true" className="material-symbols-outlined text-lg text-outline">
          arrow_forward
        </span>
      )}
      {hasAfter && (
        <span>
          Sau khi sửa <b className="text-sm">{km(after)}</b>
        </span>
      )}
      {delta !== null && delta >= 0 && (
        <span className="rounded-full bg-[#d9f7dd] px-2.5 py-0.5 text-xs font-bold text-[#00531a]">
          +{delta.toLocaleString("vi-VN")} km
        </span>
      )}
    </div>
  );
}

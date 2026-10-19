import type { ReactNode } from "react";

// Chip trạng thái: luôn có chữ đi kèm chấm màu, không chỉ dựa vào màu.
export function StatusChips({ blocked, hidden }: { blocked: boolean; hidden: boolean }) {
  return (
    <span className="inline-flex flex-wrap items-center gap-1.5">
      <span
        className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${
          blocked ? "bg-[#e9eaeb] text-[#3a3f4b]" : "bg-[#d9f7dd] text-[#00531a]"
        }`}
      >
        <i className={`h-[7px] w-[7px] rounded-full ${blocked ? "bg-outline" : "bg-tertiary-container"}`} />
        {blocked ? "Bị chặn" : "Hoạt động"}
      </span>
      {hidden && (
        <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-[#fff1cc] px-2.5 py-1 text-xs font-semibold text-[#6b4200]">
          <i className="h-[7px] w-[7px] rounded-full bg-[#c47f00]" />
          Đã ẩn
        </span>
      )}
    </span>
  );
}

// Chip lọc dạng bật/tắt.
export function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`inline-flex min-h-9 items-center gap-1.5 rounded-full border px-3.5 text-[13px] font-semibold ${
        active
          ? "border-primary bg-primary-fixed text-on-primary-fixed-variant"
          : "border-outline-variant bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container-low"
      }`}
    >
      {children}
    </button>
  );
}

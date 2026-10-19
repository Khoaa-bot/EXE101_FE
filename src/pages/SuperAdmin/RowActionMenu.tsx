import { useCallback, useEffect, useRef, useState } from "react";

export type RowMenuItem = {
  label: string;
  icon: string;
  danger?: boolean;
  onSelect: () => void;
};

type Props = {
  label: string;
  items: RowMenuItem[];
  disabled?: boolean;
};

// Menu ba chấm cho mỗi hàng của bảng. Menu dùng vị trí cố định theo nút để không bị bảng cuộn ngang cắt mất.
export default function RowActionMenu({ label, items, disabled = false }: Props) {
  const [position, setPosition] = useState<{ top: number; right: number } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const isOpen = position !== null;

  const close = useCallback((restoreFocus: boolean) => {
    setPosition(null);
    if (restoreFocus) buttonRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    menuRef.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus();

    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (menuRef.current?.contains(target) || buttonRef.current?.contains(target)) return;
      close(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        close(true);
        return;
      }
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        const entries = Array.from(menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? []);
        if (entries.length === 0) return;
        event.preventDefault();
        const index = entries.indexOf(document.activeElement as HTMLElement);
        const next = event.key === "ArrowDown" ? index + 1 : index - 1;
        entries[(next + entries.length) % entries.length].focus();
      }
    };
    const onViewportChange = () => close(false);

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown, true);
    window.addEventListener("resize", onViewportChange);
    window.addEventListener("scroll", onViewportChange, true);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown, true);
      window.removeEventListener("resize", onViewportChange);
      window.removeEventListener("scroll", onViewportChange, true);
    };
  }, [isOpen, close]);

  const toggle = () => {
    if (isOpen) {
      close(false);
      return;
    }
    const rect = buttonRef.current?.getBoundingClientRect();
    if (!rect) return;
    setPosition({ top: rect.bottom + 6, right: window.innerWidth - rect.right });
  };

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        disabled={disabled}
        onClick={toggle}
        className={`inline-flex h-9 w-9 items-center justify-center rounded-[10px] border bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container-low disabled:opacity-50 ${
          isOpen ? "border-primary text-primary" : "border-outline-variant"
        }`}
      >
        <span aria-hidden="true" className="material-symbols-outlined text-xl">
          more_vert
        </span>
      </button>
      {isOpen && position && (
        <div
          ref={menuRef}
          role="menu"
          aria-label={label}
          style={{ position: "fixed", top: position.top, right: position.right }}
          className="z-50 w-56 rounded-2xl border border-outline-variant/50 bg-surface-container-lowest p-1.5 shadow-[0_18px_40px_-12px_rgba(25,28,29,0.4)]"
        >
          {items.map((item) => (
            <button
              key={item.label}
              type="button"
              role="menuitem"
              onClick={() => {
                close(false);
                item.onSelect();
              }}
              className={`flex min-h-10 w-full items-center gap-2.5 rounded-xl px-3 text-left text-[13px] font-semibold hover:bg-surface-container-low focus-visible:bg-surface-container-low ${
                item.danger ? "text-error" : "text-on-surface"
              }`}
            >
              <span aria-hidden="true" className="material-symbols-outlined text-xl">
                {item.icon}
              </span>
              {item.label}
            </button>
          ))}
        </div>
      )}
    </>
  );
}

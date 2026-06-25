import { useEffect } from "react";

export type AppSection =
  | "home"
  | "history"
  | "tracking"
  | "notifications"
  | "profile";

type AppSidebarProps = {
  active: AppSection;
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (section: AppSection) => void;
};

const navItems: Array<{
  label: string;
  icon: string;
  section: AppSection;
  hasNotification?: boolean;
}> = [
  { label: "Trang chủ", icon: "home", section: "home" },
  { label: "Lịch sử", icon: "history", section: "history" },
  { label: "Theo dõi", icon: "location_on", section: "tracking" },
  {
    label: "Thông báo",
    icon: "notifications",
    section: "notifications",
    hasNotification: true,
  },
];

export default function AppSidebar({
  active,
  isOpen,
  onClose,
  onNavigate,
}: AppSidebarProps) {
  useEffect(() => {
    document.body.classList.toggle("overflow-hidden", isOpen);

    return () => {
      document.body.classList.remove("overflow-hidden");
    };
  }, [isOpen]);

  return (
    <>
      <div
        onClick={onClose}
        className={`fixed inset-0 z-[60] bg-black/50 transition-opacity duration-300 ${
          isOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
      />

      <aside
        className="fixed left-0 top-0 z-[70] flex h-full w-[280px] flex-col bg-surface-container-lowest shadow-2xl transition-transform duration-300 ease-in-out"
        style={{ transform: isOpen ? "translateX(0)" : "translateX(-100%)" }}
      >
        <div className="flex items-center gap-3 border-b border-outline-variant p-lg">
          <span className="material-symbols-outlined text-[28px] text-primary">
            electric_car
          </span>
          <span className="font-headline-lg-mobile text-headline-lg-mobile font-bold text-primary">
            Servio
          </span>
        </div>

        <nav className="flex-1 overflow-y-auto py-md">
          {navItems.map((item) => {
            const isActive = item.section === active;

            return (
              <div key={item.section} className="mb-2 px-md">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onNavigate(item.section);
                  }}
                  className={`relative flex w-full items-center gap-4 rounded-xl p-md text-left transition-colors ${
                    isActive
                      ? "bg-secondary-container text-on-secondary-container"
                      : "text-on-surface-variant hover:bg-surface-container"
                  }`}
                >
                  <span
                    className="material-symbols-outlined"
                    style={{
                      fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0",
                    }}
                  >
                    {item.icon}
                  </span>
                  <span className="font-label-md">{item.label}</span>
                  {item.hasNotification && (
                    <span className="ml-auto h-2 w-2 rounded-full bg-error" />
                  )}
                </button>
              </div>
            );
          })}

          <div className="mt-md border-t border-outline-variant px-md pt-md">
            <button
              type="button"
              onClick={() => {
                onClose();
                onNavigate("profile");
              }}
              className={`flex w-full items-center gap-4 rounded-xl p-md text-left transition-colors ${
                active === "profile"
                  ? "bg-secondary-container text-on-secondary-container"
                  : "text-on-surface-variant hover:bg-surface-container"
              }`}
            >
              <span
                className="material-symbols-outlined"
                style={{
                  fontVariationSettings:
                    active === "profile" ? "'FILL' 1" : "'FILL' 0",
                }}
              >
                person
              </span>
              <span className="font-label-md">Cá nhân</span>
            </button>
          </div>
        </nav>

        <div className="border-t border-outline-variant p-md">
          <button
            type="button"
            className="flex w-full items-center gap-4 rounded-xl p-md text-error transition-colors hover:bg-error-container/10"
          >
            <span className="material-symbols-outlined">logout</span>
            <span className="font-label-md">Đăng xuất</span>
          </button>
        </div>
      </aside>
    </>
  );
}

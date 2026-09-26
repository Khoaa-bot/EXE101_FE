import { useEffect, useMemo, useState } from "react";
import {
  addService,
  deleteService,
  getAllServices,
  getMyProfile,
  type MaintenanceService,
} from "../../services/api";

const navItems = [
  ["dashboard", "Dashboard"],
  ["engineering", "Nhân viên"],
  ["groups", "Khách hàng"],
  ["inventory_2", "Kho linh kiện"],
  ["payments", "Bảng giá"],
  ["storefront", "Thông tin garage"],
];

type AdminPricingPageProps = {
  onDashboardClick?: () => void;
  onEngineersClick?: () => void;
  onCustomersClick?: () => void;
  onInventoryClick?: () => void;
  onPricingClick?: () => void;
  onGarageClick?: () => void;
  onLogout?: () => void;
};

const formatPrice = (n: number) => `${n.toLocaleString("vi-VN")}đ`;

export default function AdminPricingPage({
  onDashboardClick,
  onEngineersClick,
  onCustomersClick,
  onInventoryClick,
  onPricingClick,
  onGarageClick,
  onLogout,
}: AdminPricingPageProps) {
  const [list, setList] = useState<MaintenanceService[]>([]);
  const [myGarageId, setMyGarageId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [notice, setNotice] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const [form, setForm] = useState({
    name: "",
    price: "",
    duration: "",
    description: "",
  });

  const showNotice = (message: string, type: "success" | "error" = "success") => {
    setNotice({ type, message });
    window.setTimeout(() => setNotice(null), 3000);
  };

  const loadServices = () => {
    setIsLoading(true);
    setLoadError(null);
    // Lấy garageId của chính admin đang đăng nhập để chỉ hiện dịch vụ dùng
    // chung + dịch vụ riêng của garage này — tránh hiện lẫn dịch vụ riêng mà
    // garage khác vừa thêm.
    getMyProfile()
      .then((profile) => {
        setMyGarageId(profile.garageId ?? null);
        return getAllServices(profile.garageId ?? undefined);
      })
      .then((data) => setList(data))
      .catch((err) => {
        setLoadError(
          err instanceof Error ? err.message : "Không tải được bảng giá dịch vụ.",
        );
      })
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadServices();
  }, []);

  const removeService = (service: MaintenanceService) => {
    if (!window.confirm(`Xóa dịch vụ "${service.name}" khỏi bảng giá?`)) return;
    setDeletingId(service.id);
    deleteService(service.id)
      .then(() => {
        setList((prev) => prev.filter((item) => item.id !== service.id));
        showNotice("Đã xóa dịch vụ khỏi bảng giá.");
      })
      .catch((err) => {
        showNotice(
          err instanceof Error ? err.message : "Không thể xóa dịch vụ.",
          "error",
        );
      })
      .finally(() => setDeletingId(null));
  };

  const visiblePricing = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return list;
    return list.filter((item) => item.name.toLowerCase().includes(q));
  }, [list, query]);

  const submitNewPricing = (e: React.FormEvent) => {
    e.preventDefault();
    const priceNum = parseInt(form.price.replace(/\D/g, "")) || 0;
    if (!form.name.trim() || priceNum <= 0) {
      showNotice("Vui lòng điền tên dịch vụ và giá hợp lệ!", "error");
      return;
    }

    setIsSubmitting(true);
    addService({
      name: form.name.trim(),
      price: priceNum,
      duration: form.duration.trim() || undefined,
      description: form.description.trim() || undefined,
    })
      .then((created) => {
        setList((prev) => [created, ...prev]);
        showNotice(`Đã thêm dịch vụ vào bảng giá: ${created.name}`);
        setForm({ name: "", price: "", duration: "", description: "" });
        setAddOpen(false);
      })
      .catch((err) => {
        showNotice(
          err instanceof Error ? err.message : "Không thể thêm dịch vụ.",
          "error",
        );
      })
      .finally(() => setIsSubmitting(false));
  };

  return (
    <div className="min-h-[100dvh] bg-background font-sans text-on-surface">
      {/* Sidebar Navigation */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-outline-variant bg-surface-container-lowest p-lg md:flex">
        <div className="mb-xl">
          <div className="flex items-center gap-2 text-primary">
            <span className="material-symbols-outlined text-3xl">
              electric_car
            </span>
            <span className="font-headline-lg text-headline-lg font-bold">
              Servio
            </span>
          </div>
          <p className="mt-1 text-xs text-on-surface-variant">
            Quản trị garage
          </p>
        </div>
        <nav className="space-y-1">
          {navItems.map(([icon, label]) => {
            const isCurrent = label === "Bảng giá";
            return (
              <button
                key={label}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left font-body-md text-body-md transition-colors active:scale-[0.98] ${
                  isCurrent
                    ? "bg-primary-container/15 font-semibold text-primary"
                    : "text-on-surface-variant hover:bg-surface-container-low"
                }`}
                type="button"
                onClick={() => {
                  if (label === "Dashboard") onDashboardClick?.();
                  else if (label === "Nhân viên") onEngineersClick?.();
                  else if (label === "Khách hàng") onCustomersClick?.();
                  else if (label === "Kho linh kiện") onInventoryClick?.();
                  else if (label === "Bảng giá") onPricingClick?.();
                  else if (label === "Thông tin garage") onGarageClick?.();
                }}
              >
                <span className="material-symbols-outlined">{icon}</span>
                {label}
              </button>
            );
          })}
        </nav>
        {onLogout && (
          <button
            onClick={onLogout}
            className="mt-auto flex items-center gap-3 rounded-lg px-3 py-2.5 text-error hover:bg-error-container/10 transition-colors"
            type="button"
          >
            <span className="material-symbols-outlined">logout</span>
            Đăng xuất
          </button>
        )}
      </aside>

      {/* Main Content Area */}
      <main className="min-h-[100dvh] md:ml-60">
        {/* Header Bar */}
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-outline-variant bg-surface/95 px-margin-mobile backdrop-blur md:px-margin-desktop">
          <button
            className="rounded-full p-2 text-on-surface-variant md:hidden"
            type="button"
            aria-label="Mở menu"
          >
            <span className="material-symbols-outlined">menu</span>
          </button>
          <label className="relative hidden w-full max-w-[28rem] md:block">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">
              search
            </span>
            <input
              className="w-full rounded-full border border-outline-variant bg-surface-container-low px-4 py-2 pl-10 text-body-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
              placeholder="Tìm kiếm dịch vụ..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
          <div className="ml-auto flex items-center gap-2">
            <button
              className="rounded-full p-2 text-on-surface-variant hover:bg-surface-container"
              type="button"
              aria-label="Thông báo"
            >
              <span className="material-symbols-outlined">notifications</span>
            </button>
            <div className="ml-2 flex items-center gap-2 border-l border-outline-variant pl-3">
              <div className="hidden text-right sm:block">
                <p className="font-label-md text-label-md">Quản trị viên</p>
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-fixed font-bold text-on-primary-fixed">
                A
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="mx-auto max-w-[1440px] p-margin-mobile md:p-margin-desktop">
          {/* Header Banner */}
          <section className="mb-xl flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="font-headline-lg text-headline-lg font-bold">
                Bảng giá dịch vụ
              </h1>
              <p className="mt-1 font-body-md text-body-md text-on-surface-variant">
                Danh sách dịch vụ bảo dưỡng, sửa chữa và đơn giá niêm yết.
              </p>
            </div>
            <button
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 font-label-md text-label-md text-on-primary transition hover:opacity-90 active:scale-[0.98]"
              type="button"
              onClick={() => setAddOpen(true)}
            >
              <span className="material-symbols-outlined text-lg">
                add_circle
              </span>
              Thêm dịch vụ mới
            </button>
          </section>

          {/* Pricing Table Section */}
          <section className="overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-outline-variant p-lg">
              <span className="text-xs text-outline">
                Hiển thị {visiblePricing.length} dịch vụ
              </span>
            </div>

            {isLoading && (
              <p className="p-lg text-body-sm text-on-surface-variant">
                Đang tải bảng giá...
              </p>
            )}

            {!isLoading && loadError && (
              <p className="p-lg text-body-sm text-error">{loadError}</p>
            )}

            {!isLoading && !loadError && (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[600px] text-left text-body-sm">
                  <thead className="bg-surface-container-low text-xs text-outline">
                    <tr>
                      <th className="px-5 py-3 font-semibold">Tên dịch vụ</th>
                      <th className="px-5 py-3 font-semibold">Mô tả</th>
                      <th className="px-5 py-3 font-semibold">Thời gian dự kiến</th>
                      <th className="px-5 py-3 font-semibold">Đơn giá</th>
                      <th className="px-5 py-3 font-semibold">Phạm vi</th>
                      <th className="px-5 py-3 font-semibold text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visiblePricing.map((item) => {
                      const isMine = item.garageId !== null && item.garageId === myGarageId;
                      return (
                      <tr
                        key={item.id}
                        className="border-t border-outline-variant transition-colors hover:bg-surface-container-low"
                      >
                        <td className="px-5 py-4">
                          <p className="font-semibold text-on-surface">
                            {item.name}
                          </p>
                        </td>
                        <td className="px-5 py-4 text-on-surface-variant">
                          {item.description || "—"}
                        </td>
                        <td className="px-5 py-4 text-on-surface-variant">
                          {item.duration ? (
                            <span className="inline-flex items-center gap-1">
                              <span className="material-symbols-outlined text-sm text-outline">
                                schedule
                              </span>
                              {item.duration}
                            </span>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="px-5 py-4 font-bold text-primary font-mono text-base">
                          {formatPrice(item.price)}
                        </td>
                        <td className="px-5 py-4 text-on-surface-variant">
                          {isMine ? (
                            <span className="rounded-full bg-secondary-container px-2 py-0.5 text-xs text-on-secondary-container">
                              Riêng garage này
                            </span>
                          ) : (
                            <span className="rounded-full bg-surface-container px-2 py-0.5 text-xs">
                              Dùng chung
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-4 text-right">
                          {isMine && (
                            <button
                              type="button"
                              onClick={() => removeService(item)}
                              disabled={deletingId === item.id}
                              className="rounded-lg border border-error/30 px-3 py-1.5 text-xs font-semibold text-error hover:bg-error-container/10 disabled:opacity-60"
                            >
                              {deletingId === item.id ? "Đang xóa..." : "Xóa"}
                            </button>
                          )}
                        </td>
                      </tr>
                      );
                    })}

                    {visiblePricing.length === 0 && (
                      <tr>
                        <td
                          colSpan={6}
                          className="px-5 py-8 text-center text-on-surface-variant"
                        >
                          Không có dịch vụ nào phù hợp.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </main>

      {/* Add New Pricing Modal */}
      {addOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-[28rem] rounded-2xl border border-outline-variant bg-surface-container-lowest p-6 shadow-xl">
            <h3 className="font-headline-md text-lg font-bold">
              Thêm dịch vụ mới vào bảng giá
            </h3>
            <form onSubmit={submitNewPricing} className="mt-4 space-y-4">
              <div>
                <label className="block mb-1 text-xs font-semibold text-on-surface-variant">
                  Tên dịch vụ *
                </label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Ví dụ: Thay bình ắc quy 12V phụ"
                  className="w-full rounded-lg border border-outline-variant bg-surface-container-low px-3 py-2 text-body-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block mb-1 text-xs font-semibold text-on-surface-variant">
                  Đơn giá (VNĐ) *
                </label>
                <input
                  type="text"
                  required
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  placeholder="800000"
                  className="w-full rounded-lg border border-outline-variant bg-surface-container-low px-3 py-2 text-body-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block mb-1 text-xs font-semibold text-on-surface-variant">
                  Thời gian thực hiện ước tính
                </label>
                <input
                  type="text"
                  value={form.duration}
                  onChange={(e) =>
                    setForm({ ...form, duration: e.target.value })
                  }
                  placeholder="60 phút"
                  className="w-full rounded-lg border border-outline-variant bg-surface-container-low px-3 py-2 text-body-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block mb-1 text-xs font-semibold text-on-surface-variant">
                  Mô tả dịch vụ
                </label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  placeholder="Mô tả ngắn về dịch vụ..."
                  className="w-full rounded-lg border border-outline-variant bg-surface-container-low px-3 py-2 text-body-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="mt-6 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAddOpen(false)}
                  className="rounded-lg border border-outline-variant px-4 py-2 text-xs font-semibold hover:bg-surface-container-low"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-on-primary hover:opacity-90 disabled:opacity-60"
                >
                  {isSubmitting ? "Đang thêm..." : "Xác nhận thêm"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Floating Notice Toast */}
      {notice && (
        <div
          className={`fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-lg border px-4 py-3 text-body-sm shadow-lg animate-[toast-in_0.2s_ease-out] ${
            notice.type === "success"
              ? "border-tertiary/30 bg-surface-container-lowest text-on-surface"
              : "border-error/30 bg-surface-container-lowest text-on-surface"
          }`}
          role="status"
        >
          <span
            className={`material-symbols-outlined text-lg ${
              notice.type === "success" ? "text-tertiary" : "text-error"
            }`}
          >
            {notice.type === "success" ? "check_circle" : "error"}
          </span>
          {notice.message}
        </div>
      )}
    </div>
  );
}

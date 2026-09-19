import { useMemo, useState } from "react";

export type PriceItem = {
  id: string;
  name: string;
  category: string;
  laborPrice: string;
  partPrice: string;
  totalPrice: string;
  duration: string;
  status: "active" | "hidden";
};

const INITIAL_PRICING: PriceItem[] = [
  {
    id: "PRC-01",
    name: "Bảo dưỡng định kỳ 10.000 km",
    category: "Bảo dưỡng",
    laborPrice: "350.000đ",
    partPrice: "450.000đ",
    totalPrice: "800.000đ",
    duration: "60 phút",
    status: "active",
  },
  {
    id: "PRC-02",
    name: "Kiểm tra & cân bằng Cell Pin EV",
    category: "Hệ thống điện / Pin",
    laborPrice: "850.000đ",
    partPrice: "0đ",
    totalPrice: "850.000đ",
    duration: "120 phút",
    status: "active",
  },
  {
    id: "PRC-03",
    name: "Thay sạc Onboard AC-DC 7kW",
    category: "Hệ thống điện / Pin",
    laborPrice: "1.200.000đ",
    partPrice: "5.800.000đ",
    totalPrice: "7.000.000đ",
    duration: "180 phút",
    status: "active",
  },
  {
    id: "PRC-04",
    name: "Chẩn đoán phần mềm & Nâng cấp Firmware",
    category: "Phần mềm & Chẩn đoán",
    laborPrice: "500.000đ",
    partPrice: "0đ",
    totalPrice: "500.000đ",
    duration: "45 phút",
    status: "active",
  },
  {
    id: "PRC-05",
    name: "Bảo dưỡng hệ thống phanh & Thay dầu phanh",
    category: "Khung gầm & Phanh",
    laborPrice: "400.000đ",
    partPrice: "300.000đ",
    totalPrice: "700.000đ",
    duration: "60 phút",
    status: "active",
  },
];

const navItems = [
  ["dashboard", "Dashboard"],
  ["engineering", "Nhân viên"],
  ["groups", "Khách hàng"],
  ["inventory_2", "Kho linh kiện"],
  ["payments", "Bảng giá"],
];

type AdminPricingPageProps = {
  onDashboardClick?: () => void;
  onEngineersClick?: () => void;
  onCustomersClick?: () => void;
  onInventoryClick?: () => void;
  onPricingClick?: () => void;
  onLogout?: () => void;
};

export default function AdminPricingPage({
  onDashboardClick,
  onEngineersClick,
  onCustomersClick,
  onInventoryClick,
  onPricingClick,
  onLogout,
}: AdminPricingPageProps) {
  const [list, setList] = useState<PriceItem[]>(INITIAL_PRICING);
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [notice, setNotice] = useState("");
  const [addOpen, setAddOpen] = useState(false);

  const [form, setForm] = useState({
    name: "",
    category: "Bảo dưỡng",
    laborPrice: "",
    partPrice: "",
    duration: "60 phút",
  });

  const showNotice = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 3000);
  };

  const visiblePricing = useMemo(() => {
    return list.filter((item) => {
      const matchCat =
        selectedCategory === "all" || item.category === selectedCategory;
      const matchQuery =
        item.name.toLowerCase().includes(query.toLowerCase()) ||
        item.category.toLowerCase().includes(query.toLowerCase()) ||
        item.id.toLowerCase().includes(query.toLowerCase());
      return matchCat && matchQuery;
    });
  }, [list, selectedCategory, query]);

  const submitNewPricing = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.laborPrice.trim()) {
      showNotice("Vui lòng điền tên dịch vụ và giá công lặp!");
      return;
    }

    const laborNum = parseInt(form.laborPrice.replace(/\D/g, "")) || 0;
    const partNum = parseInt(form.partPrice.replace(/\D/g, "")) || 0;
    const totalNum = laborNum + partNum;

    const newItem: PriceItem = {
      id: `PRC-${10 + list.length + 1}`,
      name: form.name.trim(),
      category: form.category,
      laborPrice: `${laborNum.toLocaleString("vi-VN")}đ`,
      partPrice: `${partNum.toLocaleString("vi-VN")}đ`,
      totalPrice: `${totalNum.toLocaleString("vi-VN")}đ`,
      duration: form.duration.trim() || "60 phút",
      status: "active",
    };

    setList((prev) => [newItem, ...prev]);
    showNotice(`Đã thêm dịch vụ vào bảng giá: ${newItem.name}`);
    setForm({
      name: "",
      category: "Bảo dưỡng",
      laborPrice: "",
      partPrice: "",
      duration: "60 phút",
    });
    setAddOpen(false);
  };

  const toggleStatus = (id: string) => {
    setList((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const nextStatus = item.status === "active" ? "hidden" : "active";
          showNotice(
            `Đã ${nextStatus === "active" ? "hiện" : "ẩn"} dịch vụ: ${item.name}`,
          );
          return { ...item, status: nextStatus };
        }
        return item;
      }),
    );
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
          <label className="relative hidden w-full max-w-md md:block">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">
              search
            </span>
            <input
              className="w-full rounded-full border border-outline-variant bg-surface-container-low px-4 py-2 pl-10 text-body-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
              placeholder="Tìm kiếm dịch vụ, danh mục bảng giá..."
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
                <p className="text-[11px] text-on-surface-variant">
                  Garage ABC
                </p>
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
                Bảng giá dịch vụ & phụ tùng
              </h1>
              <p className="mt-1 font-body-md text-body-md text-on-surface-variant">
                Quản lý và cập nhật đơn giá dịch vụ bảo dưỡng, sửa chữa định kỳ tại garage.
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
              <div className="flex flex-wrap items-center gap-2">
                {(
                  [
                    ["all", "Tất cả"],
                    ["Bảo dưỡng", "Bảo dưỡng"],
                    ["Hệ thống điện / Pin", "Điện & Pin"],
                    ["Khung gầm & Phanh", "Khung gầm"],
                    ["Phần mềm & Chẩn đoán", "Phần mềm"],
                  ] as const
                ).map(([val, label]) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setSelectedCategory(val)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                      selectedCategory === val
                        ? "bg-primary text-on-primary"
                        : "border border-outline-variant bg-surface-container-low text-on-surface-variant hover:bg-surface-container"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <span className="text-xs text-outline">
                Hiển thị {visiblePricing.length} dịch vụ
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[750px] text-left text-body-sm">
                <thead className="bg-surface-container-low text-xs text-outline">
                  <tr>
                    <th className="px-5 py-3 font-semibold">Tên dịch vụ</th>
                    <th className="px-5 py-3 font-semibold">Danh mục</th>
                    <th className="px-5 py-3 font-semibold">Thời gian dự kiến</th>
                    <th className="px-5 py-3 font-semibold">Tiền công</th>
                    <th className="px-5 py-3 font-semibold">Vật tư / Phụ tùng</th>
                    <th className="px-5 py-3 font-semibold">Tổng giá niêm yết</th>
                    <th className="px-5 py-3 font-semibold text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {visiblePricing.map((item) => {
                    const isActive = item.status === "active";
                    return (
                      <tr
                        key={item.id}
                        className="border-t border-outline-variant transition-colors hover:bg-surface-container-low"
                      >
                        <td className="px-5 py-4">
                          <p className="font-semibold text-on-surface">
                            {item.name}
                          </p>
                          <p className="text-xs text-outline">{item.id}</p>
                        </td>
                        <td className="px-5 py-4">
                          <span className="inline-flex items-center rounded-md bg-surface-container-high px-2.5 py-1 text-xs font-medium text-on-surface-variant">
                            {item.category}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-on-surface-variant">
                          <span className="inline-flex items-center gap-1">
                            <span className="material-symbols-outlined text-sm text-outline">
                              schedule
                            </span>
                            {item.duration}
                          </span>
                        </td>
                        <td className="px-5 py-4 font-mono">{item.laborPrice}</td>
                        <td className="px-5 py-4 font-mono">{item.partPrice}</td>
                        <td className="px-5 py-4 font-bold text-primary font-mono text-base">
                          {item.totalPrice}
                        </td>
                        <td className="px-5 py-4 text-right">
                          <button
                            type="button"
                            onClick={() => toggleStatus(item.id)}
                            className={`rounded-lg px-3 py-1 text-xs font-semibold ${
                              isActive
                                ? "border border-outline-variant text-on-surface-variant hover:border-error hover:text-error"
                                : "bg-primary-container/15 text-primary hover:bg-primary/20"
                            }`}
                          >
                            {isActive ? "Ẩn dịch vụ" : "Hiện lại"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}

                  {visiblePricing.length === 0 && (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-5 py-8 text-center text-on-surface-variant"
                      >
                        Không có dịch vụ nào trong danh mục này.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </main>

      {/* Add New Pricing Modal */}
      {addOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl border border-outline-variant bg-surface-container-lowest p-6 shadow-xl">
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
                  Danh mục dịch vụ
                </label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full rounded-lg border border-outline-variant bg-surface-container-low px-3 py-2 text-body-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                >
                  <option value="Bảo dưỡng">Bảo dưỡng</option>
                  <option value="Hệ thống điện / Pin">Hệ thống điện / Pin</option>
                  <option value="Khung gầm & Phanh">Khung gầm & Phanh</option>
                  <option value="Phần mềm & Chẩn đoán">Phần mềm & Chẩn đoán</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1 text-xs font-semibold text-on-surface-variant">
                    Tiền công sửa chữa (VNĐ) *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.laborPrice}
                    onChange={(e) =>
                      setForm({ ...form, laborPrice: e.target.value })
                    }
                    placeholder="300000"
                    className="w-full rounded-lg border border-outline-variant bg-surface-container-low px-3 py-2 text-body-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block mb-1 text-xs font-semibold text-on-surface-variant">
                    Giá vật tư/phụ tùng (VNĐ)
                  </label>
                  <input
                    type="text"
                    value={form.partPrice}
                    onChange={(e) =>
                      setForm({ ...form, partPrice: e.target.value })
                    }
                    placeholder="1500000"
                    className="w-full rounded-lg border border-outline-variant bg-surface-container-low px-3 py-2 text-body-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                </div>
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
                  className="rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-on-primary hover:opacity-90"
                >
                  Xác nhận thêm
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Floating Notice Toast */}
      {notice && (
        <div
          className="fixed bottom-5 right-5 z-50 rounded-lg bg-inverse-surface px-4 py-3 text-body-sm text-inverse-on-surface shadow-lg"
          role="status"
        >
          {notice}
        </div>
      )}
    </div>
  );
}

import { useEffect, useMemo, useState } from "react";
import { getAdminParts, createAdminPart, type AdminPart } from "../../services/api";

export type InventoryPart = {
  id: string;
  sku: string;
  name: string;
  category: string;
  location: string;
  stock: number;
  capacity: number;
  price: string;
};

function mapApiPart(p: AdminPart): InventoryPart {
  return {
    id: String(p.id),
    sku: p.sku,
    name: p.partName,
    category: p.category,
    location: p.location,
    stock: p.quantity,
    capacity: p.maxQuantity,
    price: p.price.toLocaleString("vi-VN") + "đ",
  };
}

const navItems = [
  ["dashboard", "Dashboard"],
  ["engineering", "Nhân viên"],
  ["groups", "Khách hàng"],
  ["inventory_2", "Kho linh kiện"],
  ["payments", "Bảng giá"],
  ["storefront", "Thông tin garage"],
];

type AdminInventoryPageProps = {
  onDashboardClick?: () => void;
  onEngineersClick?: () => void;
  onCustomersClick?: () => void;
  onInventoryClick?: () => void;
  onPricingClick?: () => void;
  onGarageClick?: () => void;
  onLogout?: () => void;
};

export default function AdminInventoryPage({
  onDashboardClick,
  onEngineersClick,
  onCustomersClick,
  onInventoryClick,
  onPricingClick,
  onGarageClick,
  onLogout,
}: AdminInventoryPageProps) {
  const [list, setList] = useState<InventoryPart[]>([]);
  const [query, setQuery] = useState("");
  const [restockPart, setRestockPart] = useState<InventoryPart | null>(null);
  const [restockAmount, setRestockAmount] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getAdminParts()
      .then((data) => {
        const arr: AdminPart[] = Array.isArray(data)
          ? data
          : (Object.values(data) as AdminPart[]);
        setList(arr.map(mapApiPart));
        setLoading(false);
      })
      .catch((err) => {
        setNotice(err instanceof Error ? err.message : "Không thể tải danh sách linh kiện");
        setLoading(false);
      });
  }, []);

  const emptyPart = {
    name: "",
    category: "Phụ tùng",
    location: "",
    stock: "",
    capacity: "",
    price: "",
    status: "in-stock",
  };
  const [newPart, setNewPart] = useState(emptyPart);

  const showNotice = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 3000);
  };

  const stats = useMemo(() => {
    const totalItems = list.length;
    const totalStock = list.reduce((sum, item) => sum + item.stock, 0);
    const low = list.filter((item) => item.stock / item.capacity < 0.6).length;
    const healthy = totalItems - low;
    return { totalItems, totalStock, low, healthy };
  }, [list]);

  const visibleList = useMemo(() => {
    return list.filter(
      (item) =>
        item.name.toLowerCase().includes(query.toLowerCase()) ||
        item.sku.toLowerCase().includes(query.toLowerCase()) ||
        item.category.toLowerCase().includes(query.toLowerCase()) ||
        item.location.toLowerCase().includes(query.toLowerCase()),
    );
  }, [list, query]);

  const openRestockModal = (part: InventoryPart) => {
    setRestockPart(part);
    setRestockAmount(String(Math.max(part.capacity - part.stock, 10)));
  };

  const confirmRestock = () => {
    if (!restockPart) return;
    const amountNum = Number(restockAmount);
    if (!amountNum || amountNum <= 0) {
      showNotice("Vui lòng nhập số lượng hợp lệ!");
      return;
    }
    setList((prev) =>
      prev.map((p) =>
        p.id === restockPart.id
          ? { ...p, stock: Math.min(p.stock + amountNum, p.capacity) }
          : p,
      ),
    );
    showNotice(`Đã nhập thêm ${amountNum} units cho ${restockPart.name}`);
    setRestockPart(null);
    setRestockAmount("");
  };

  const confirmAddPart = async () => {
    if (
      !newPart.name.trim() ||
      !newPart.location.trim() ||
      !newPart.stock ||
      !newPart.capacity ||
      !newPart.price.trim()
    ) {
      showNotice("Vui lòng điền đầy đủ thông tin linh kiện!");
      return;
    }
    const stock = Number(newPart.stock);
    const capacity = Number(newPart.capacity);
    if (isNaN(stock) || isNaN(capacity) || stock < 0 || capacity <= 0) {
      showNotice("Số lượng hoặc sức chứa không hợp lệ!");
      return;
    }

    const priceStr = newPart.price.replace(/[^\d]/g, "");
    const price = Number(priceStr);
    if (isNaN(price) || price < 0) {
      showNotice("Đơn giá không hợp lệ!");
      return;
    }

    try {
      setSubmitting(true);
      const session = JSON.parse(localStorage.getItem("auth_session") || "{}");
      const garageId = session.id ?? 0;

      const created = await createAdminPart({
        partName: newPart.name.trim(),
        category: newPart.category,
        sku: `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
        location: newPart.location.trim(),
        quantity: stock,
        maxQuantity: capacity,
        price,
        garageId,
      });

      const newItem: InventoryPart = mapApiPart(created);
      setList((prev) => [newItem, ...prev]);
      showNotice(`Đã thêm linh kiện mới: ${newItem.name}`);
      setNewPart(emptyPart);
      setAddOpen(false);
    } catch (err) {
      showNotice(err instanceof Error ? err.message : "Không thể thêm linh kiện");
    } finally {
      setSubmitting(false);
    }
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
            const isCurrent = label === "Kho linh kiện";
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
          <label className="relative hidden w-full max-w-md md:block">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">
              search
            </span>
            <input
              className="w-full rounded-full border border-outline-variant bg-surface-container-low px-4 py-2 pl-10 text-body-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
              placeholder="Tìm kiếm linh kiện, SKU, vị trí..."
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
          {/* Header Section */}
          <section className="mb-xl flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="font-headline-lg text-headline-lg font-bold">
                Quản lý kho linh kiện
              </h1>
              <p className="mt-1 font-body-md text-body-md text-on-surface-variant">
                Theo dõi tồn kho, cảnh báo linh kiện sắp hết và nhập thêm khi cần.
              </p>
            </div>
            <button
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 font-label-md text-label-md text-on-primary transition hover:opacity-90 active:scale-[0.98]"
              type="button"
              onClick={() => setAddOpen(true)}
            >
              <span className="material-symbols-outlined text-lg">
                add_box
              </span>
              Thêm linh kiện
            </button>
          </section>

          {/* Stats Cards */}
          <section className="mb-xl grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <article className="rounded-xl border border-outline-variant bg-surface-container-lowest p-5">
              <div className="flex items-center justify-between">
                <p className="font-label-md text-xs font-semibold text-outline">
                  TỔNG DANH MỤC
                </p>
                <span className="material-symbols-outlined rounded-lg bg-primary-container/10 p-2 text-primary">
                  inventory_2
                </span>
              </div>
              <p className="mt-2 font-headline-lg text-2xl font-bold">
                {stats.totalItems}
              </p>
            </article>

            <article className="rounded-xl border border-outline-variant bg-surface-container-lowest p-5">
              <div className="flex items-center justify-between">
                <p className="font-label-md text-xs font-semibold text-outline">
                  TỔNG TỒN KHO
                </p>
                <span className="material-symbols-outlined rounded-lg bg-tertiary-container/10 p-2 text-tertiary">
                  trending_up
                </span>
              </div>
              <p className="mt-2 font-headline-lg text-2xl font-bold text-tertiary">
                {stats.totalStock}
              </p>
            </article>

            <article className="rounded-xl border border-outline-variant bg-surface-container-lowest p-5">
              <div className="flex items-center justify-between">
                <p className="font-label-md text-xs font-semibold text-outline">
                  CẦN NHẬP THÊM
                </p>
                <span className="material-symbols-outlined rounded-lg bg-error-container p-2 text-on-error-container">
                  warning
                </span>
              </div>
              <p className="mt-2 font-headline-lg text-2xl font-bold text-error">
                {stats.low}
              </p>
            </article>

            <article className="rounded-xl border border-outline-variant bg-surface-container-lowest p-5">
              <div className="flex items-center justify-between">
                <p className="font-label-md text-xs font-semibold text-outline">
                  ĐỦ TỒN KHO
                </p>
                <span className="material-symbols-outlined rounded-lg bg-tertiary-container/10 p-2 text-tertiary">
                  check_circle
                </span>
              </div>
              <p className="mt-2 font-headline-lg text-2xl font-bold text-tertiary">
                {stats.healthy}
              </p>
            </article>
          </section>

          {/* Inventory Table */}
          <section className="overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest">
            <div className="flex items-center justify-between border-b border-outline-variant p-lg">
              <h2 className="font-headline-md text-headline-md">
                Danh mục kho linh kiện
              </h2>
              <span className="text-xs text-outline">
                Hiển thị {visibleList.length} trên {list.length} linh kiện
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px] text-left text-body-sm">
                <thead className="bg-surface-container-low text-xs text-outline">
                  <tr>
                    <th className="px-5 py-3 font-semibold">Tên linh kiện</th>
                    <th className="px-5 py-3 font-semibold">Danh mục</th>
                    <th className="px-5 py-3 font-semibold">SKU</th>
                    <th className="px-5 py-3 font-semibold">Vị trí</th>
                    <th className="px-5 py-3 font-semibold w-56">
                      Số lượng tồn
                    </th>
                    <th className="px-5 py-3 font-semibold">Đơn giá</th>
                    <th className="px-5 py-3 font-semibold">Trạng thái</th>
                    <th className="px-5 py-3 font-semibold text-right">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {visibleList.map((item) => {
                    const ratio = item.stock / item.capacity;
                    const healthy = ratio >= 0.6;

                    return (
                      <tr
                        key={item.id}
                        className="border-t border-outline-variant transition-colors hover:bg-surface-container-low"
                      >
                        <td className="px-5 py-4 font-semibold">
                          {item.name}
                        </td>
                        <td className="px-5 py-4 text-on-surface-variant">
                          {item.category}
                        </td>
                        <td className="px-5 py-4 font-medium text-primary font-mono text-xs">
                          {item.sku}
                        </td>
                        <td className="px-5 py-4">
                          <span className="rounded-md bg-surface-container-high px-2 py-1 text-xs font-medium">
                            {item.location}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <span
                              className={`w-14 text-xs font-semibold font-mono ${
                                healthy ? "" : "text-error"
                              }`}
                            >
                              {item.stock} / {item.capacity}
                            </span>
                            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-container-high">
                              <div
                                className={`h-full rounded-full ${
                                  healthy ? "bg-tertiary" : "bg-error"
                                }`}
                                style={{
                                  width: `${Math.max(ratio * 100, 5)}%`,
                                }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 font-semibold text-on-surface font-mono">
                          {item.price}
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                              healthy
                                ? "bg-tertiary-container/15 text-tertiary"
                                : "bg-error-container text-on-error-container"
                            }`}
                          >
                            {healthy ? "Còn hàng" : "Cần nhập"}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <button
                            type="button"
                            onClick={() => openRestockModal(item)}
                            className={`inline-flex items-center gap-1 rounded-lg px-3 py-1 text-xs font-semibold transition ${
                              healthy
                                ? "border border-outline-variant text-on-surface-variant hover:border-primary hover:text-primary"
                                : "bg-primary text-on-primary hover:opacity-90"
                            }`}
                          >
                            <span className="material-symbols-outlined text-base">
                              autorenew
                            </span>
                            Nhập thêm
                          </button>
                        </td>
                      </tr>
                    );
                  })}

                  {loading && (
                    <tr>
                      <td
                        colSpan={8}
                        className="px-5 py-8 text-center text-on-surface-variant"
                      >
                        <div className="flex items-center justify-center gap-2">
                          <span className="material-symbols-outlined animate-spin text-primary">sync</span>
                          <span>Đang tải danh mục linh kiện...</span>
                        </div>
                      </td>
                    </tr>
                  )}

                  {!loading && visibleList.length === 0 && (
                    <tr>
                      <td
                        colSpan={8}
                        className="px-5 py-8 text-center text-on-surface-variant"
                      >
                        Không tìm thấy linh kiện phù hợp.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </main>

      {/* Restock Modal */}
      {restockPart && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl border border-outline-variant bg-surface-container-lowest p-6 shadow-xl">
            <h3 className="font-headline-md text-lg font-bold">
              Nhập thêm linh kiện
            </h3>
            <p className="mt-1 text-xs text-on-surface-variant">
              {restockPart.name} · Tồn hiện tại: {restockPart.stock} /{" "}
              {restockPart.capacity}
            </p>

            <div className="mt-4 space-y-2">
              <label className="block text-xs font-semibold text-on-surface-variant">
                Số lượng nhập thêm *
              </label>
              <input
                type="number"
                min={1}
                value={restockAmount}
                onChange={(e) => setRestockAmount(e.target.value)}
                className="w-full rounded-lg border border-outline-variant bg-surface-container-low px-3 py-2 text-body-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setRestockPart(null)}
                className="rounded-lg border border-outline-variant px-4 py-2 text-xs font-semibold hover:bg-surface-container-low"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={confirmRestock}
                className="rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-on-primary hover:opacity-90"
              >
                Xác nhận nhập kho
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add New Part Modal */}
      {addOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-xl rounded-2xl border border-outline-variant bg-surface-container-lowest p-6 shadow-xl">
            <h3 className="font-headline-md text-lg font-bold">
              Thêm linh kiện mới
            </h3>
            <p className="mt-1 text-xs text-on-surface-variant">
              Điền thông tin chi tiết để thêm linh kiện vào danh mục kho.
            </p>

            <div className="mt-4 space-y-4">
              <div>
                <label className="block mb-1 text-xs font-semibold text-on-surface-variant">
                  Tên linh kiện *
                </label>
                <input
                  type="text"
                  value={newPart.name}
                  onChange={(e) =>
                    setNewPart({ ...newPart, name: e.target.value })
                  }
                  placeholder="Ví dụ: Lọc dầu động cơ"
                  className="w-full rounded-lg border border-outline-variant bg-surface-container-low px-3 py-2 text-body-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1 text-xs font-semibold text-on-surface-variant">
                    Danh mục
                  </label>
                  <select
                    value={newPart.category}
                    onChange={(e) =>
                      setNewPart({ ...newPart, category: e.target.value })
                    }
                    className="w-full rounded-lg border border-outline-variant bg-surface-container-low px-3 py-2 text-body-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  >
                    <option value="Phụ tùng">Phụ tùng</option>
                    <option value="Linh kiện điện">Linh kiện điện</option>
                    <option value="Thiết bị">Thiết bị</option>
                    <option value="Vật tư tiêu hao">Vật tư tiêu hao</option>
                  </select>
                </div>

                <div>
                  <label className="block mb-1 text-xs font-semibold text-on-surface-variant">
                    Vị trí trong kho *
                  </label>
                  <input
                    type="text"
                    value={newPart.location}
                    onChange={(e) =>
                      setNewPart({ ...newPart, location: e.target.value })
                    }
                    placeholder="Ví dụ: Kệ A1-R4"
                    className="w-full rounded-lg border border-outline-variant bg-surface-container-low px-3 py-2 text-body-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1 text-xs font-semibold text-on-surface-variant">
                    Số lượng tồn *
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={newPart.stock}
                    onChange={(e) =>
                      setNewPart({ ...newPart, stock: e.target.value })
                    }
                    placeholder="10"
                    className="w-full rounded-lg border border-outline-variant bg-surface-container-low px-3 py-2 text-body-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block mb-1 text-xs font-semibold text-on-surface-variant">
                    Sức chứa tối đa *
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={newPart.capacity}
                    onChange={(e) =>
                      setNewPart({ ...newPart, capacity: e.target.value })
                    }
                    placeholder="50"
                    className="w-full rounded-lg border border-outline-variant bg-surface-container-low px-3 py-2 text-body-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block mb-1 text-xs font-semibold text-on-surface-variant">
                  Đơn giá *
                </label>
                <input
                  type="text"
                  value={newPart.price}
                  onChange={(e) =>
                    setNewPart({ ...newPart, price: e.target.value })
                  }
                  placeholder="Ví dụ: 850.000đ"
                  className="w-full rounded-lg border border-outline-variant bg-surface-container-low px-3 py-2 text-body-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>
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
                type="button"
                onClick={confirmAddPart}
                disabled={submitting}
                className="rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-on-primary hover:opacity-90 disabled:opacity-50"
              >
                {submitting ? "Đang thêm..." : "Thêm vào kho"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notice Toast */}
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

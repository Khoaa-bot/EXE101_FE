import { useEffect, useMemo, useState, useRef } from "react";
import { useDialogA11y } from "../../hooks/useDialogA11y";
import {
  getAdminParts,
  createAdminPart,
  getMyProfile,
  restockAdminPart,
  type AdminPart,
} from "../../services/api";
import AdminShell, { StatusPill, type AdminNavProps } from "./AdminShell";

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

export function mapApiPart(p: AdminPart): InventoryPart {
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

export type AdminInventoryPageProps = AdminNavProps;

export default function AdminInventoryPage(props: AdminInventoryPageProps) {
  const [list, setList] = useState<InventoryPart[]>([]);
  const [query, setQuery] = useState("");
  const [restockPart, setRestockPart] = useState<InventoryPart | null>(null);
  const [restockAmount, setRestockAmount] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const restockRef = useRef<HTMLDivElement>(null);
  const addRef = useRef<HTMLDivElement>(null);
  useDialogA11y(restockPart !== null, restockRef, () => setRestockPart(null));
  useDialogA11y(addOpen, addRef, () => setAddOpen(false));
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [garageName, setGarageName] = useState("");
  const [restocking, setRestocking] = useState(false);

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

  useEffect(() => {
    getMyProfile()
      .then((profile) => setGarageName(profile.garageName ?? ""))
      .catch(() => {});
  }, []);

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
        setNotice(
          err instanceof Error
            ? err.message
            : "Không thể tải danh sách linh kiện",
        );
        setLoading(false);
      });
  }, []);

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

  const confirmRestock = async () => {
    if (!restockPart || restocking) return;
    const amountNum = Number(restockAmount);
    if (!amountNum || amountNum <= 0) {
      showNotice("Vui lòng nhập số lượng hợp lệ!");
      return;
    }

    setRestocking(true);
    try {
      const updated = await restockAdminPart(restockPart.id, {
        quantityToAdd: amountNum,
        quantity: restockPart.stock + amountNum,
      });
      setList((prev) =>
        prev.map((p) => (p.id === restockPart.id ? mapApiPart(updated) : p)),
      );
      showNotice(`Đã nhập thêm ${amountNum} đơn vị cho ${restockPart.name}`);
      setRestockPart(null);
      setRestockAmount("");
    } catch (err) {
      showNotice(
        err instanceof Error ? err.message : "Nhập kho không thành công.",
      );
    } finally {
      setRestocking(false);
    }
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
      const created = await createAdminPart({
        partName: newPart.name.trim(),
        category: newPart.category,
        sku: `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
        location: newPart.location.trim(),
        quantity: stock,
        maxQuantity: capacity,
        price,
      });

      const newItem: InventoryPart = mapApiPart(created);
      setList((prev) => [newItem, ...prev]);
      showNotice(`Đã thêm linh kiện mới: ${newItem.name}`);
      setNewPart(emptyPart);
      setAddOpen(false);
    } catch (err) {
      showNotice(
        err instanceof Error ? err.message : "Không thể thêm linh kiện",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AdminShell
      activeTab="inventory"
      title="Kho linh kiện &amp; Phụ tùng"
      description="Quản lý tồn kho linh kiện, vật tư và thiết bị thay thế tại garage."
      garageName={garageName}
      notice={notice}
      maxWidthClass="max-w-7xl"
      headerAction={
        <button
          type="button"
          onClick={() => setAddOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-on-primary transition hover:opacity-90 active:scale-[0.98]"
        >
          <span className="material-symbols-outlined text-lg">add_box</span>
          Thêm linh kiện mới
        </button>
      }
      {...props}
    >
      {/* Top Stats Cards */}
      <section className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <InventoryMetric
          icon="inventory_2"
          tone="bg-primary-fixed text-on-primary-fixed-variant"
          label="Mã linh kiện"
          value={String(stats.totalItems)}
          hint="Tổng số danh mục phụ tùng"
        />
        <InventoryMetric
          icon="warehouse"
          tone="bg-[#d9f7dd] text-[#00531a]"
          label="Tổng lượng tồn"
          value={String(stats.totalStock)}
          hint="Số đơn vị tồn trong kho"
        />
        <InventoryMetric
          icon="warning"
          tone="bg-[#ffe4d6] text-[#7a2e00]"
          label="Sắp hết hàng"
          value={String(stats.low)}
          hint="Dưới 60% sức chứa tối đa"
        />
        <InventoryMetric
          icon="check_circle"
          tone="bg-[#fff1cc] text-[#6b4200]"
          label="Đủ định mức"
          value={String(stats.healthy)}
          hint="Tồn kho đạt định mức ổn định"
        />
      </section>

      {/* Search and Action Bar */}
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <input
          aria-label="Tìm kiếm linh kiện..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Tìm theo tên, mã SKU, vị trí, danh mục..."
          className="min-h-11 w-80 max-w-full rounded-xl border border-outline-variant bg-surface-container-lowest px-3.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
        />
        <span className="ml-auto text-xs text-on-surface-variant">
          {loading
            ? "Đang tải kho linh kiện..."
            : `Hiển thị ${visibleList.length} / ${list.length} linh kiện`}
        </span>
      </div>

      {/* Inventory Table */}
      <div className="overflow-hidden rounded-2xl border border-outline-variant/50 bg-surface-container-lowest shadow-[0_10px_26px_-14px_rgba(25,28,29,0.28)]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[840px] text-left text-sm">
            <thead className="bg-surface-container-low text-[11px] uppercase tracking-wider text-on-surface-variant">
              <tr>
                <th className="px-5 py-3 font-bold">Mã SKU</th>
                <th className="px-5 py-3 font-bold">Tên linh kiện</th>
                <th className="px-5 py-3 font-bold">Danh mục</th>
                <th className="px-5 py-3 font-bold">Vị trí</th>
                <th className="px-5 py-3 font-bold">Tồn kho / Sức chứa</th>
                <th className="px-5 py-3 font-bold">Đơn giá</th>
                <th className="px-5 py-3 text-right font-bold">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/50">
              {visibleList.map((item) => {
                const ratio = item.capacity > 0 ? item.stock / item.capacity : 0;
                const isLow = ratio < 0.6;
                const isCritical = ratio < 0.25;

                return (
                  <tr
                    key={item.id}
                    className="transition-colors hover:bg-surface-container-low"
                  >
                    <td className="px-5 py-3.5 font-mono text-xs font-semibold text-primary">
                      {item.sku}
                    </td>
                    <td className="px-5 py-3.5 font-semibold text-on-surface">
                      {item.name}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-on-surface-variant">
                      {item.category}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-on-surface-variant">
                      <span className="inline-flex items-center gap-1 rounded-md bg-surface-container px-2 py-0.5">
                        <span className="material-symbols-outlined text-[13px]">location_on</span>
                        {item.location}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="h-2 w-24 overflow-hidden rounded-full bg-surface-container-high">
                          <div
                            className={`h-full rounded-full ${
                              isCritical
                                ? "bg-error"
                                : isLow
                                  ? "bg-[#c47f00]"
                                  : "bg-[#00872d]"
                            }`}
                            style={{
                              width: `${Math.min(Math.round(ratio * 100), 100)}%`,
                            }}
                          />
                        </div>
                        <span className="text-xs font-semibold text-on-surface">
                          {item.stock} / {item.capacity}
                        </span>
                        {isLow && (
                          <StatusPill tone={isCritical ? "error" : "warning"}>
                            {isCritical ? "Rất thấp" : "Sắp hết"}
                          </StatusPill>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-xs font-semibold text-on-surface">
                      {item.price}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        type="button"
                        onClick={() => openRestockModal(item)}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-primary/50 bg-primary-fixed/20 px-3 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary hover:text-on-primary"
                      >
                        <span className="material-symbols-outlined text-base">add</span>
                        Nhập kho
                      </button>
                    </td>
                  </tr>
                );
              })}

              {loading && (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-sm text-on-surface-variant">
                    <div className="flex items-center justify-center gap-2">
                      <span className="material-symbols-outlined animate-spin text-primary">sync</span>
                      <span>Đang tải kho linh kiện...</span>
                    </div>
                  </td>
                </tr>
              )}

              {!loading && visibleList.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-sm text-on-surface-variant">
                    Không tìm thấy linh kiện nào phù hợp với tìm kiếm.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Restock Modal */}
      {restockPart && (
        <div
          ref={restockRef}
          role="dialog"
          aria-modal="true"
          aria-label="Nhập thêm linh kiện"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-[fade-in_0.15s_ease-out]"
        >
          <div className="w-full max-w-[28rem] rounded-2xl border border-outline-variant/50 bg-surface-container-lowest p-6 shadow-[0_18px_40px_-12px_rgba(25,28,29,0.4)]">
            <div className="flex items-center gap-3 border-b border-outline-variant/40 pb-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#d9f7dd] text-[#00531a]">
                <span className="material-symbols-outlined">add_business</span>
              </span>
              <div>
                <h3 className="text-base font-bold text-on-surface">Nhập thêm linh kiện</h3>
                <p className="text-xs text-on-surface-variant">{restockPart.name}</p>
              </div>
            </div>

            <p className="mt-4 text-xs text-on-surface-variant">
              Tồn hiện tại: <strong className="text-on-surface">{restockPart.stock}</strong> / Sức chứa: <strong className="text-on-surface">{restockPart.capacity}</strong>
            </p>

            <div className="mt-3 space-y-2">
              <label htmlFor="restock-amount-input" className="block text-xs font-semibold text-on-surface-variant">
                Số lượng nhập thêm *
              </label>
              <input
                id="restock-amount-input"
                type="number"
                min={1}
                value={restockAmount}
                onChange={(e) => setRestockAmount(e.target.value)}
                className="w-full rounded-xl border border-outline-variant bg-surface-container-low px-3.5 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="mt-6 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setRestockPart(null)}
                disabled={restocking}
                className="rounded-xl border border-outline-variant px-4 py-2 text-xs font-semibold text-on-surface hover:bg-surface-container-low transition-colors disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={() => void confirmRestock()}
                disabled={restocking}
                className="rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-on-primary hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {restocking ? "Đang nhập..." : "Xác nhận nhập kho"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add New Part Modal */}
      {addOpen && (
        <div
          ref={addRef}
          role="dialog"
          aria-modal="true"
          aria-label="Thêm linh kiện mới"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-[fade-in_0.15s_ease-out]"
        >
          <div className="w-full max-w-[34rem] rounded-2xl border border-outline-variant/50 bg-surface-container-lowest p-6 shadow-[0_18px_40px_-12px_rgba(25,28,29,0.4)]">
            <div className="flex items-center gap-3 border-b border-outline-variant/40 pb-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-on-primary">
                <span className="material-symbols-outlined">add_box</span>
              </span>
              <div>
                <h3 className="text-base font-bold text-on-surface">Thêm linh kiện mới</h3>
                <p className="text-xs text-on-surface-variant">
                  Điền thông tin chi tiết vào danh mục kho phụ tùng
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-3.5">
              <div>
                <label htmlFor="new-part-name" className="mb-1 block text-xs font-semibold text-on-surface-variant">
                  Tên linh kiện *
                </label>
                <input
                  id="new-part-name"
                  type="text"
                  value={newPart.name}
                  onChange={(e) => setNewPart({ ...newPart, name: e.target.value })}
                  placeholder="Ví dụ: Lọc dầu động cơ VinFast VF8"
                  className="w-full rounded-xl border border-outline-variant bg-surface-container-low px-3.5 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label htmlFor="new-part-category" className="mb-1 block text-xs font-semibold text-on-surface-variant">
                    Danh mục
                  </label>
                  <select
                    id="new-part-category"
                    value={newPart.category}
                    onChange={(e) => setNewPart({ ...newPart, category: e.target.value })}
                    className="w-full rounded-xl border border-outline-variant bg-surface-container-low px-3.5 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  >
                    <option value="Phụ tùng">Phụ tùng</option>
                    <option value="Linh kiện điện">Linh kiện điện</option>
                    <option value="Thiết bị">Thiết bị</option>
                    <option value="Vật tư tiêu hao">Vật tư tiêu hao</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="new-part-location" className="mb-1 block text-xs font-semibold text-on-surface-variant">
                    Vị trí trong kho *
                  </label>
                  <input
                    id="new-part-location"
                    type="text"
                    value={newPart.location}
                    onChange={(e) => setNewPart({ ...newPart, location: e.target.value })}
                    placeholder="Ví dụ: Kệ A1-R4"
                    className="w-full rounded-xl border border-outline-variant bg-surface-container-low px-3.5 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label htmlFor="new-part-stock" className="mb-1 block text-xs font-semibold text-on-surface-variant">
                    Số lượng tồn *
                  </label>
                  <input
                    id="new-part-stock"
                    type="number"
                    min={0}
                    value={newPart.stock}
                    onChange={(e) => setNewPart({ ...newPart, stock: e.target.value })}
                    placeholder="10"
                    className="w-full rounded-xl border border-outline-variant bg-surface-container-low px-3.5 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div>
                  <label htmlFor="new-part-capacity" className="mb-1 block text-xs font-semibold text-on-surface-variant">
                    Sức chứa tối đa *
                  </label>
                  <input
                    id="new-part-capacity"
                    type="number"
                    min={1}
                    value={newPart.capacity}
                    onChange={(e) => setNewPart({ ...newPart, capacity: e.target.value })}
                    placeholder="50"
                    className="w-full rounded-xl border border-outline-variant bg-surface-container-low px-3.5 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="new-part-price" className="mb-1 block text-xs font-semibold text-on-surface-variant">
                  Đơn giá (VNĐ) *
                </label>
                <input
                  id="new-part-price"
                  type="text"
                  value={newPart.price}
                  onChange={(e) => setNewPart({ ...newPart, price: e.target.value })}
                  placeholder="Ví dụ: 850.000"
                  className="w-full rounded-xl border border-outline-variant bg-surface-container-low px-3.5 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setAddOpen(false)}
                className="rounded-xl border border-outline-variant px-4 py-2 text-xs font-semibold text-on-surface hover:bg-surface-container-low transition-colors"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={confirmAddPart}
                disabled={submitting}
                className="rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-on-primary hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {submitting ? "Đang thêm..." : "Thêm vào kho"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  );
}

function InventoryMetric({
  icon,
  tone,
  label,
  value,
  hint,
}: {
  icon: string;
  tone: string;
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <article className="flex items-center gap-3.5 rounded-2xl border border-outline-variant/40 bg-surface-container-lowest p-4 shadow-[0_10px_26px_-14px_rgba(25,28,29,0.28)]">
      <span
        aria-hidden="true"
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] ${tone}`}
      >
        <span className="material-symbols-outlined">{icon}</span>
      </span>
      <div className="min-w-0">
        <p className="text-xs text-on-surface-variant">{label}</p>
        <p className="text-xl font-extrabold text-on-surface">{value}</p>
        <p className="truncate text-[11px] text-on-surface-variant">{hint}</p>
      </div>
    </article>
  );
}

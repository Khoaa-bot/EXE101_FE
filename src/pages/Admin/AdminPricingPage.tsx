import { useEffect, useMemo, useState, useRef } from "react";
import { useDialogA11y } from "../../hooks/useDialogA11y";
import {
  addService,
  deleteService,
  getAllServices,
  getMyProfile,
  type MaintenanceService,
} from "../../services/api";
import AdminShell, { StatusPill, type AdminNavProps } from "./AdminShell";

export type AdminPricingPageProps = AdminNavProps;

const formatPrice = (n: number) => `${n.toLocaleString("vi-VN")}đ`;

export default function AdminPricingPage(props: AdminPricingPageProps) {
  const [list, setList] = useState<MaintenanceService[]>([]);
  const [myGarageId, setMyGarageId] = useState<number | null>(null);
  const [garageName, setGarageName] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [notice, setNotice] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const addRef = useRef<HTMLDivElement>(null);
  useDialogA11y(addOpen, addRef, () => setAddOpen(false));
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
    getMyProfile()
      .then((profile) => {
        setMyGarageId(profile.garageId ?? null);
        setGarageName(profile.garageName ?? "");
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
    return list.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        (item.description ?? "").toLowerCase().includes(q),
    );
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
    <AdminShell
      activeTab="pricing"
      title="Bảng giá dịch vụ"
      description="Danh sách dịch vụ bảo dưỡng, sửa chữa và bảng giá niêm yết của garage."
      garageName={garageName}
      notice={notice}
      maxWidthClass="max-w-7xl"
      headerAction={
        <button
          type="button"
          onClick={() => setAddOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-on-primary transition hover:opacity-90 active:scale-[0.98]"
        >
          <span className="material-symbols-outlined text-lg">add_circle</span>
          Thêm dịch vụ mới
        </button>
      }
      {...props}
    >
      {/* Search and Counter */}
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <input
          aria-label="Tìm kiếm dịch vụ..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Tìm kiếm theo tên dịch vụ, mô tả..."
          className="min-h-11 w-80 max-w-full rounded-xl border border-outline-variant bg-surface-container-lowest px-3.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
        />
        <span className="ml-auto text-xs text-on-surface-variant">
          {isLoading
            ? "Đang tải dữ liệu..."
            : `Hiển thị ${visiblePricing.length} / ${list.length} dịch vụ`}
        </span>
      </div>

      {/* Pricing Table */}
      <div className="overflow-hidden rounded-2xl border border-outline-variant/50 bg-surface-container-lowest shadow-[0_10px_26px_-14px_rgba(25,28,29,0.28)]">
        {isLoading && (
          <div className="flex items-center justify-center gap-2 p-8 text-body-sm text-on-surface-variant">
            <span className="material-symbols-outlined animate-spin text-primary">sync</span>
            <span>Đang tải bảng giá dịch vụ...</span>
          </div>
        )}

        {!isLoading && loadError && (
          <div className="p-6 text-body-sm text-error">{loadError}</div>
        )}

        {!isLoading && !loadError && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-left text-sm">
              <thead className="bg-surface-container-low text-[11px] uppercase tracking-wider text-on-surface-variant">
                <tr>
                  <th className="px-5 py-3 font-bold">Tên dịch vụ</th>
                  <th className="px-5 py-3 font-bold">Mô tả</th>
                  <th className="px-5 py-3 font-bold">Thời gian ước tính</th>
                  <th className="px-5 py-3 font-bold">Đơn giá</th>
                  <th className="px-5 py-3 font-bold">Phạm vi</th>
                  <th className="px-5 py-3 text-right font-bold">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/50">
                {visiblePricing.map((item) => {
                  const isMine =
                    item.garageId !== null && item.garageId === myGarageId;

                  return (
                    <tr
                      key={item.id}
                      className="transition-colors hover:bg-surface-container-low"
                    >
                      <td className="px-5 py-3.5 font-semibold text-on-surface">
                        {item.name}
                      </td>
                      <td className="px-5 py-3.5 text-xs text-on-surface-variant max-w-xs truncate">
                        {item.description || "—"}
                      </td>
                      <td className="px-5 py-3.5 text-xs text-on-surface-variant">
                        {item.duration ? (
                          <span className="inline-flex items-center gap-1">
                            <span className="material-symbols-outlined text-[15px] text-primary">
                              schedule
                            </span>
                            {item.duration}
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-5 py-3.5 font-bold font-mono text-primary text-sm">
                        {formatPrice(item.price)}
                      </td>
                      <td className="px-5 py-3.5">
                        {isMine ? (
                          <StatusPill tone="primary">Riêng garage</StatusPill>
                        ) : (
                          <StatusPill tone="neutral">Dùng chung</StatusPill>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        {isMine && (
                          <button
                            type="button"
                            onClick={() => removeService(item)}
                            disabled={deletingId === item.id}
                            className="inline-flex items-center gap-1 rounded-xl border border-error/30 bg-error-container/20 px-2.5 py-1 text-xs font-semibold text-error hover:bg-error-container/50 transition-colors disabled:opacity-50"
                          >
                            <span className="material-symbols-outlined text-base">delete</span>
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
                      className="px-5 py-8 text-center text-sm text-on-surface-variant"
                    >
                      Không tìm thấy dịch vụ nào phù hợp với tìm kiếm.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add New Pricing Modal */}
      {addOpen && (
        <div
          ref={addRef}
          role="dialog"
          aria-modal="true"
          aria-label="Thêm dịch vụ mới vào bảng giá"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-[fade-in_0.15s_ease-out]"
        >
          <div className="w-full max-w-[30rem] rounded-2xl border border-outline-variant/50 bg-surface-container-lowest p-6 shadow-[0_18px_40px_-12px_rgba(25,28,29,0.4)]">
            <div className="flex items-center gap-3 border-b border-outline-variant/40 pb-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-on-primary">
                <span className="material-symbols-outlined">add_circle</span>
              </span>
              <div>
                <h3 className="text-base font-bold text-on-surface">Thêm dịch vụ mới</h3>
                <p className="text-xs text-on-surface-variant">
                  Dịch vụ sẽ hiển thị trong bảng giá cho khách đặt lịch
                </p>
              </div>
            </div>

            <form onSubmit={submitNewPricing} className="mt-4 space-y-3.5">
              <div>
                <label
                  htmlFor="new-service-name"
                  className="mb-1 block text-xs font-semibold text-on-surface-variant"
                >
                  Tên dịch vụ *
                </label>
                <input
                  id="new-service-name"
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Ví dụ: Thay bình ắc quy 12V phụ"
                  className="w-full rounded-xl border border-outline-variant bg-surface-container-low px-3.5 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label
                  htmlFor="new-service-price"
                  className="mb-1 block text-xs font-semibold text-on-surface-variant"
                >
                  Đơn giá (VNĐ) *
                </label>
                <input
                  id="new-service-price"
                  type="text"
                  required
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  placeholder="800000"
                  className="w-full rounded-xl border border-outline-variant bg-surface-container-low px-3.5 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label
                  htmlFor="new-service-duration"
                  className="mb-1 block text-xs font-semibold text-on-surface-variant"
                >
                  Thời gian thực hiện ước tính
                </label>
                <input
                  id="new-service-duration"
                  type="text"
                  value={form.duration}
                  onChange={(e) => setForm({ ...form, duration: e.target.value })}
                  placeholder="Ví dụ: 60 phút"
                  className="w-full rounded-xl border border-outline-variant bg-surface-container-low px-3.5 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label
                  htmlFor="new-service-desc"
                  className="mb-1 block text-xs font-semibold text-on-surface-variant"
                >
                  Mô tả dịch vụ
                </label>
                <textarea
                  id="new-service-desc"
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Mô tả các hạng mục chi tiết trong quy trình..."
                  className="w-full rounded-xl border border-outline-variant bg-surface-container-low px-3.5 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                />
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
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-on-primary hover:opacity-90 transition-opacity disabled:opacity-60"
                >
                  {isSubmitting ? "Đang thêm..." : "Xác nhận thêm"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminShell>
  );
}

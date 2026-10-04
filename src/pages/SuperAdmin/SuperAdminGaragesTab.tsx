import { useEffect, useMemo, useState } from "react";
import {
  createGarage,
  createGarageOwner,
  getAdminGarages,
  setGarageCommission,
  setGarageHidden,
  setGarageStatus,
  type SuperAdminGarage,
} from "../../services/api";

const NO_GARAGES: SuperAdminGarage[] = [];

type Props = {
  notify: (message: string, type?: "success" | "error") => void;
};

const inputClass =
  "w-full rounded-lg border border-outline-variant bg-surface-container-low px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary";
const labelClass = "mb-1 block text-xs font-semibold text-on-surface-variant";

const EMPTY_GARAGE_FORM = { name: "", address: "", phone: "" };
const EMPTY_OWNER_FORM = { username: "", password: "", fullName: "", email: "", phone: "", garageId: "" };

export default function SuperAdminGaragesTab({ notify }: Props) {
  const [showHidden, setShowHidden] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const [garageOpen, setGarageOpen] = useState(false);
  const [garageForm, setGarageForm] = useState(EMPTY_GARAGE_FORM);
  const [isCreatingGarage, setIsCreatingGarage] = useState(false);

  const [ownerOpen, setOwnerOpen] = useState(false);
  const [ownerForm, setOwnerForm] = useState(EMPTY_OWNER_FORM);
  const [isCreatingOwner, setIsCreatingOwner] = useState(false);

  const [result, setResult] = useState<{
    key: string;
    garages: SuperAdminGarage[];
    error: string | null;
  } | null>(null);

  const requestKey = `${showHidden}-${reloadKey}`;
  const isLoading = result?.key !== requestKey;
  const garages = result?.garages ?? NO_GARAGES;
  const loadError = result?.key === requestKey ? result.error : null;

  useEffect(() => {
    let cancelled = false;
    getAdminGarages(showHidden)
      .then((data) => {
        if (!cancelled) setResult({ key: requestKey, garages: data, error: null });
      })
      .catch((err) => {
        if (!cancelled) {
          setResult({
            key: requestKey,
            garages: [],
            error: err instanceof Error ? err.message : "Không tải được danh sách garage.",
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [showHidden, requestKey]);

  const garagesWithoutOwner = useMemo(() => garages.filter((g) => g.ownerId === null), [garages]);

  const applyUpdate = (updated: SuperAdminGarage) => {
    setResult((prev) =>
      prev && {
        ...prev,
        garages: prev.garages.map((g) => (g.id === updated.id ? updated : g)).filter((g) => showHidden || !g.hidden),
      },
    );
  };

  const toggleBlock = (garage: SuperAdminGarage) => {
    const blocking = garage.status !== "blocked";
    const confirmed = window.confirm(
      blocking
        ? `Chặn garage "${garage.name}"? Khách sẽ không thấy hoặc đặt lịch được ở garage này, Admin Garage và nhân viên sẽ không đăng nhập được. Lịch hẹn đang chờ không bị tự hủy.`
        : `Mở chặn garage "${garage.name}"?`,
    );
    if (!confirmed) return;
    setBusyId(garage.id);
    setGarageStatus(garage.id, blocking ? "blocked" : "active")
      .then((updated) => {
        applyUpdate(updated);
        notify(blocking ? `Đã chặn garage ${garage.name}.` : `Đã mở chặn garage ${garage.name}.`);
      })
      .catch((err) => notify(err instanceof Error ? err.message : "Không cập nhật được trạng thái garage.", "error"))
      .finally(() => setBusyId(null));
  };

  const editCommission = (garage: SuperAdminGarage) => {
    const current = Math.round(garage.effectiveCommissionRate * 1000) / 10;
    const input = window.prompt(
      `Hoa hồng nền tảng thu của "${garage.name}" (%, từ 0 đến 50). Để trống để dùng mức mặc định. Áp dụng cho các lịch bàn giao từ bây giờ.`,
      String(current),
    );
    if (input === null) return;
    const trimmed = input.trim();
    const percent = trimmed === "" ? null : Number(trimmed.replace(",", "."));
    if (percent !== null && (!Number.isFinite(percent) || percent < 0 || percent > 50)) {
      notify("Hoa hồng phải là số từ 0 đến 50.", "error");
      return;
    }
    setBusyId(garage.id);
    setGarageCommission(garage.id, percent)
      .then((updated) => {
        applyUpdate(updated);
        notify(`Hoa hồng của ${garage.name} là ${Math.round(updated.effectiveCommissionRate * 1000) / 10}%.`);
      })
      .catch((err) => notify(err instanceof Error ? err.message : "Không cập nhật được hoa hồng.", "error"))
      .finally(() => setBusyId(null));
  };

  const toggleHidden = (garage: SuperAdminGarage) => {
    const hiding = !garage.hidden;
    const confirmed = window.confirm(
      hiding
        ? `Ẩn garage "${garage.name}"? Garage sẽ không hiển thị cho khách và khỏi danh sách quản lý này. Có thể bỏ ẩn lại.`
        : `Bỏ ẩn garage "${garage.name}"?`,
    );
    if (!confirmed) return;
    setBusyId(garage.id);
    setGarageHidden(garage.id, hiding)
      .then((updated) => {
        applyUpdate(updated);
        notify(hiding ? `Đã ẩn garage ${garage.name}.` : `Đã bỏ ẩn garage ${garage.name}.`);
      })
      .catch((err) => notify(err instanceof Error ? err.message : "Không cập nhật được trạng thái ẩn.", "error"))
      .finally(() => setBusyId(null));
  };

  const submitCreateGarage = () => {
    if (!garageForm.name.trim() || !garageForm.address.trim()) {
      notify("Vui lòng nhập tên và địa chỉ garage.", "error");
      return;
    }
    setIsCreatingGarage(true);
    createGarage({
      name: garageForm.name.trim(),
      address: garageForm.address.trim(),
      phone: garageForm.phone.trim() || undefined,
    })
      .then((created) => {
        notify(`Đã tạo garage: ${created.name}`);
        setGarageOpen(false);
        setGarageForm(EMPTY_GARAGE_FORM);
        setReloadKey((k) => k + 1);
      })
      .catch((err) => notify(err instanceof Error ? err.message : "Tạo garage không thành công.", "error"))
      .finally(() => setIsCreatingGarage(false));
  };

  const submitCreateOwner = () => {
    if (!ownerForm.username.trim() || !ownerForm.password.trim() || !ownerForm.garageId) {
      notify("Vui lòng nhập username, password và chọn garage.", "error");
      return;
    }
    setIsCreatingOwner(true);
    createGarageOwner({
      username: ownerForm.username.trim(),
      password: ownerForm.password,
      fullName: ownerForm.fullName.trim() || undefined,
      email: ownerForm.email.trim() || undefined,
      phone: ownerForm.phone.trim() || undefined,
      garageId: Number(ownerForm.garageId),
    })
      .then((created) => {
        notify(`Đã tạo Admin Garage: ${created.username}`);
        setOwnerOpen(false);
        setOwnerForm(EMPTY_OWNER_FORM);
        setReloadKey((k) => k + 1);
      })
      .catch((err) => notify(err instanceof Error ? err.message : "Tạo Admin Garage không thành công.", "error"))
      .finally(() => setIsCreatingOwner(false));
  };

  const openOwnerModal = (garageId?: number) => {
    setOwnerForm({ ...EMPTY_OWNER_FORM, garageId: garageId ? String(garageId) : "" });
    setOwnerOpen(true);
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <label className="flex items-center gap-2 text-sm text-on-surface-variant">
          <input type="checkbox" checked={showHidden} onChange={(e) => setShowHidden(e.target.checked)} />
          Hiện cả garage đã ẩn
        </label>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setGarageOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg border border-outline-variant bg-surface-container-lowest px-4 py-2 text-sm font-semibold text-on-surface hover:bg-surface-container-low"
          >
            <span className="material-symbols-outlined text-base">storefront</span>
            Tạo Garage mới
          </button>
          <button
            type="button"
            onClick={() => openOwnerModal()}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-on-primary hover:opacity-90"
          >
            <span className="material-symbols-outlined text-base">add</span>
            Tạo Admin Garage
          </button>
        </div>
      </div>

      {isLoading && <p className="mt-6 text-body-sm text-on-surface-variant">Đang tải danh sách garage...</p>}
      {!isLoading && loadError && <p className="mt-6 text-body-sm text-error">{loadError}</p>}

      {!isLoading && !loadError && (
        <div className="mt-6 overflow-x-auto rounded-xl border border-outline-variant bg-surface-container-lowest">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="border-b border-outline-variant bg-surface-container-low text-xs uppercase text-on-surface-variant">
              <tr>
                <th className="px-4 py-3 font-medium">Garage</th>
                <th className="px-4 py-3 font-medium">Admin Garage</th>
                <th className="px-4 py-3 font-medium">Nhân viên</th>
                <th className="px-4 py-3 font-medium">Lịch hẹn</th>
                <th className="px-4 py-3 font-medium">Hoa hồng</th>
                <th className="px-4 py-3 font-medium">Trạng thái</th>
                <th className="px-4 py-3 text-right font-medium">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {garages.map((g) => (
                <tr key={g.id} className={`hover:bg-surface-container-low ${g.hidden ? "opacity-60" : ""}`}>
                  <td className="px-4 py-3">
                    <div className="font-semibold">{g.name}</div>
                    <div className="text-xs text-on-surface-variant">{g.address || "—"}</div>
                    <div className="text-xs text-on-surface-variant">{g.phone || ""}</div>
                  </td>
                  <td className="px-4 py-3">
                    {g.ownerId !== null ? (
                      <>
                        <div>{g.ownerName || g.ownerUsername}</div>
                        <div className="text-xs text-on-surface-variant">{g.ownerUsername}</div>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => openOwnerModal(g.id)}
                        className="text-xs font-semibold text-primary hover:underline"
                      >
                        Chưa có — tạo Admin
                      </button>
                    )}
                  </td>
                  <td className="px-4 py-3">{g.employeeCount}</td>
                  <td className="px-4 py-3">{g.appointmentCount}</td>
                  <td className="px-4 py-3">
                    {Math.round(g.effectiveCommissionRate * 1000) / 10}%
                    {g.commissionRate === null && (
                      <span className="ml-1 text-xs text-on-surface-variant">(mặc định)</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        g.status === "blocked"
                          ? "bg-error-container/40 text-on-error-container"
                          : "bg-tertiary-container/20 text-tertiary"
                      }`}
                    >
                      {g.status === "blocked" ? "Đã chặn" : "Hoạt động"}
                    </span>
                    {g.hidden && (
                      <span className="ml-2 rounded-full bg-surface-container-high px-2.5 py-0.5 text-xs font-semibold text-on-surface-variant">
                        Đã ẩn
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-3">
                      <button
                        type="button"
                        disabled={busyId === g.id}
                        onClick={() => toggleBlock(g)}
                        className="text-xs font-semibold text-error hover:underline disabled:opacity-50"
                      >
                        {g.status === "blocked" ? "Mở chặn" : "Chặn"}
                      </button>
                      <button
                        type="button"
                        disabled={busyId === g.id}
                        onClick={() => editCommission(g)}
                        className="text-xs font-semibold text-primary hover:underline disabled:opacity-50"
                      >
                        Hoa hồng
                      </button>
                      <button
                        type="button"
                        disabled={busyId === g.id}
                        onClick={() => toggleHidden(g)}
                        className="text-xs font-semibold text-on-surface-variant hover:underline disabled:opacity-50"
                      >
                        {g.hidden ? "Bỏ ẩn" : "Ẩn"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {garages.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-on-surface-variant">
                    Chưa có garage nào.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {garageOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-[28rem] rounded-2xl border border-outline-variant bg-surface-container-lowest p-6 shadow-xl">
            <h3 className="font-headline-md text-lg font-bold">Tạo garage mới</h3>
            <div className="mt-4 space-y-3">
              <div>
                <label className={labelClass}>Tên garage *</label>
                <input
                  value={garageForm.name}
                  onChange={(e) => setGarageForm((f) => ({ ...f, name: e.target.value }))}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Địa chỉ *</label>
                <input
                  value={garageForm.address}
                  onChange={(e) => setGarageForm((f) => ({ ...f, address: e.target.value }))}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Số điện thoại</label>
                <input
                  value={garageForm.phone}
                  onChange={(e) => setGarageForm((f) => ({ ...f, phone: e.target.value }))}
                  className={inputClass}
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setGarageOpen(false)}
                className="rounded-lg border border-outline-variant px-4 py-2 text-xs font-semibold hover:bg-surface-container-low"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={submitCreateGarage}
                disabled={isCreatingGarage}
                className="rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-on-primary hover:opacity-90 disabled:opacity-60"
              >
                {isCreatingGarage ? "Đang tạo..." : "Tạo"}
              </button>
            </div>
          </div>
        </div>
      )}

      {ownerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-[28rem] rounded-2xl border border-outline-variant bg-surface-container-lowest p-6 shadow-xl">
            <h3 className="font-headline-md text-lg font-bold">Tạo Admin Garage mới</h3>
            <div className="mt-4 space-y-3">
              <div>
                <label className={labelClass}>Username *</label>
                <input
                  value={ownerForm.username}
                  onChange={(e) => setOwnerForm((f) => ({ ...f, username: e.target.value }))}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Password *</label>
                <input
                  type="password"
                  value={ownerForm.password}
                  onChange={(e) => setOwnerForm((f) => ({ ...f, password: e.target.value }))}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Họ tên</label>
                <input
                  value={ownerForm.fullName}
                  onChange={(e) => setOwnerForm((f) => ({ ...f, fullName: e.target.value }))}
                  className={inputClass}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Email</label>
                  <input
                    value={ownerForm.email}
                    onChange={(e) => setOwnerForm((f) => ({ ...f, email: e.target.value }))}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>SĐT</label>
                  <input
                    value={ownerForm.phone}
                    onChange={(e) => setOwnerForm((f) => ({ ...f, phone: e.target.value }))}
                    className={inputClass}
                  />
                </div>
              </div>
              <div>
                <label className={labelClass}>Garage *</label>
                <select
                  value={ownerForm.garageId}
                  onChange={(e) => setOwnerForm((f) => ({ ...f, garageId: e.target.value }))}
                  className={inputClass}
                >
                  <option value="">-- Chọn garage --</option>
                  {garagesWithoutOwner.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </select>
                {garagesWithoutOwner.length === 0 && (
                  <p className="mt-1 text-xs text-error">
                    Tất cả garage đều đã có Admin Garage. Tạo garage mới trước nếu muốn thêm.
                  </p>
                )}
                <p className="mt-1 text-xs text-on-surface-variant">
                  Chỉ hiện garage chưa có Admin Garage — mỗi garage chỉ được gán đúng 1 admin.
                </p>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setOwnerOpen(false)}
                className="rounded-lg border border-outline-variant px-4 py-2 text-xs font-semibold hover:bg-surface-container-low"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={submitCreateOwner}
                disabled={isCreatingOwner}
                className="rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-on-primary hover:opacity-90 disabled:opacity-60"
              >
                {isCreatingOwner ? "Đang tạo..." : "Tạo"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

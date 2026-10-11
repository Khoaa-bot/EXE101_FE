import { useEffect, useMemo, useState, useRef, type ComponentProps } from "react";
import { useDialogA11y } from "../../hooks/useDialogA11y";
import {
  createGarage,
  createGarageOwner,
  getAdminGarages,
  setGarageCommission,
  setGarageHidden,
  setGarageStatus,
  type SuperAdminGarage,
} from "../../services/api";

import ReasonConfirmDialog from "./ReasonConfirmDialog";
import RowActionMenu from "./RowActionMenu";
import { FilterChip, StatusChips } from "./SuperAdminChips";

const NO_GARAGES: SuperAdminGarage[] = [];

const BLOCK_REASONS = [
  "Vi phạm quy định của nền tảng",
  "Nhận nhiều khiếu nại từ khách",
  "Thông tin garage không chính xác",
  "Garage tạm ngừng hoạt động",
];
const HIDE_REASONS = [
  "Garage ngừng hợp tác",
  "Garage trùng lặp hoặc tạo nhầm",
  "Garage đang cập nhật thông tin",
];

type StatusFilter = "all" | "active" | "blocked";
type Pending = { kind: "block" | "hide"; garage: SuperAdminGarage };
type DialogConfig = Omit<ComponentProps<typeof ReasonConfirmDialog>, "busy" | "onCancel" | "onConfirm">;

function withReason(message: string, reason: string | null) {
  return reason ? `${message} Lý do: ${reason}.` : message;
}

function buildDialog({ kind, garage }: Pending): DialogConfig {
  const name = garage.name;
  const summary = `${garage.employeeCount} nhân viên · ${garage.appointmentCount} lịch hẹn`;

  if (kind === "block") {
    if (garage.status === "blocked") {
      return {
        tone: "warning",
        icon: "lock_open",
        confirmTitle: `Mở chặn garage “${name}”?`,
        confirmLabel: "Mở chặn",
        confirmIcon: "lock_open",
      };
    }
    return {
      tone: "danger",
      icon: "block",
      reasonTitle: `Vì sao chặn “${name}”?`,
      reasonSubtitle: summary,
      reasons: BLOCK_REASONS,
      confirmTitle: `Chặn garage “${name}”?`,
      confirmDescription: "Khi chặn, những điều sau sẽ xảy ra:",
      effects: [
        { icon: "visibility_off", tone: "danger", text: "Khách sẽ không thấy hoặc đặt lịch được ở garage này." },
        { icon: "lock", tone: "danger", text: "Admin Garage và nhân viên sẽ không đăng nhập được." },
        { icon: "check_circle", tone: "ok", text: "Lịch hẹn đang chờ không bị tự hủy." },
      ],
      confirmLabel: "Chặn garage",
      confirmIcon: "block",
    };
  }

  if (garage.hidden) {
    return {
      tone: "warning",
      icon: "visibility",
      confirmTitle: `Bỏ ẩn garage “${name}”?`,
      confirmLabel: "Bỏ ẩn",
      confirmIcon: "visibility",
    };
  }
  return {
    tone: "warning",
    icon: "visibility_off",
    reasonTitle: `Vì sao ẩn “${name}”?`,
    reasonSubtitle: "Có thể bỏ ẩn lại bất cứ lúc nào.",
    reasons: HIDE_REASONS,
    confirmTitle: `Ẩn garage “${name}”?`,
    confirmDescription: "Khi ẩn, những điều sau sẽ xảy ra:",
    effects: [
      { icon: "visibility_off", tone: "warning", text: "Garage sẽ không hiển thị cho khách." },
      { icon: "list_alt", tone: "warning", text: "Garage sẽ biến mất khỏi danh sách quản lý này." },
      { icon: "undo", tone: "ok", text: "Có thể bỏ ẩn lại bất cứ lúc nào." },
    ],
    confirmLabel: "Ẩn garage",
    confirmIcon: "visibility_off",
  };
}

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
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [pending, setPending] = useState<Pending | null>(null);

  const [garageOpen, setGarageOpen] = useState(false);
  const [garageForm, setGarageForm] = useState(EMPTY_GARAGE_FORM);
  const [isCreatingGarage, setIsCreatingGarage] = useState(false);

  const [ownerOpen, setOwnerOpen] = useState(false);
  const garageRef = useRef<HTMLDivElement>(null);
  const ownerRef = useRef<HTMLDivElement>(null);
  useDialogA11y(garageOpen, garageRef, () => setGarageOpen(false));
  useDialogA11y(ownerOpen, ownerRef, () => setOwnerOpen(false));
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

  const visibleGarages = useMemo(() => {
    const q = query.trim().toLowerCase();
    return garages.filter((g) => {
      const matchesStatus = statusFilter === "all" || g.status === statusFilter;
      const matchesQuery =
        !q ||
        g.name.toLowerCase().includes(q) ||
        (g.address ?? "").toLowerCase().includes(q) ||
        (g.ownerName ?? "").toLowerCase().includes(q) ||
        (g.ownerUsername ?? "").toLowerCase().includes(q);
      return matchesStatus && matchesQuery;
    });
  }, [garages, query, statusFilter]);

  const applyUpdate = (updated: SuperAdminGarage) => {
    setResult((prev) =>
      prev && {
        ...prev,
        garages: prev.garages.map((g) => (g.id === updated.id ? updated : g)).filter((g) => showHidden || !g.hidden),
      },
    );
  };

  const runBlock = (garage: SuperAdminGarage, reason: string | null) => {
    const blocking = garage.status !== "blocked";
    setBusyId(garage.id);
    setGarageStatus(garage.id, blocking ? "blocked" : "active")
      .then((updated) => {
        applyUpdate(updated);
        notify(
          blocking
            ? withReason(`Đã chặn garage ${garage.name}.`, reason)
            : `Đã mở chặn garage ${garage.name}.`,
        );
      })
      .catch((err) => notify(err instanceof Error ? err.message : "Không cập nhật được trạng thái garage.", "error"))
      .finally(() => {
        setBusyId(null);
        setPending(null);
      });
  };

  const askBlock = (garage: SuperAdminGarage) => setPending({ kind: "block", garage });
  const askHidden = (garage: SuperAdminGarage) => setPending({ kind: "hide", garage });

  const confirmPending = (reason: string | null) => {
    if (!pending) return;
    if (pending.kind === "block") runBlock(pending.garage, reason);
    else runHidden(pending.garage, reason);
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

  const runHidden = (garage: SuperAdminGarage, reason: string | null) => {
    const hiding = !garage.hidden;
    setBusyId(garage.id);
    setGarageHidden(garage.id, hiding)
      .then((updated) => {
        applyUpdate(updated);
        notify(
          hiding
            ? withReason(`Đã ẩn garage ${garage.name}.`, reason)
            : `Đã bỏ ẩn garage ${garage.name}.`,
        );
      })
      .catch((err) => notify(err instanceof Error ? err.message : "Không cập nhật được trạng thái ẩn.", "error"))
      .finally(() => {
        setBusyId(null);
        setPending(null);
      });
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
        <div className="flex flex-wrap items-center gap-3">
          <input
            aria-label="Tìm garage hoặc Admin Garage"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm tên garage, Admin Garage"
            className="min-h-11 w-80 max-w-full rounded-xl border border-outline-variant bg-surface-container-lowest px-3.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          />
          <div role="group" aria-label="Lọc theo trạng thái" className="flex flex-wrap gap-2">
            <FilterChip active={statusFilter === "all"} onClick={() => setStatusFilter("all")}>
              Tất cả
            </FilterChip>
            <FilterChip active={statusFilter === "active"} onClick={() => setStatusFilter("active")}>
              Hoạt động
            </FilterChip>
            <FilterChip active={statusFilter === "blocked"} onClick={() => setStatusFilter("blocked")}>
              Bị chặn
            </FilterChip>
            <FilterChip active={showHidden} onClick={() => setShowHidden((current) => !current)}>
              <span aria-hidden="true" className="material-symbols-outlined text-lg">
                visibility_off
              </span>
              Hiện cả garage đã ẩn
            </FilterChip>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => openOwnerModal()}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border-[1.5px] border-primary bg-surface-container-lowest px-4 text-sm font-bold text-on-primary-fixed-variant hover:bg-primary-fixed/40"
          >
            <span aria-hidden="true" className="material-symbols-outlined text-xl">
              person_add
            </span>
            Tạo Admin Garage
          </button>
          <button
            type="button"
            onClick={() => setGarageOpen(true)}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-on-primary"
          >
            <span aria-hidden="true" className="material-symbols-outlined text-xl">
              add
            </span>
            Tạo garage
          </button>
        </div>
      </div>
      {!isLoading && !loadError && (
        <p className="mt-3 text-right text-xs text-on-surface-variant" aria-live="polite">
          Hiển thị {visibleGarages.length} / {garages.length} garage
        </p>
      )}

      {isLoading && <p className="mt-6 text-body-sm text-on-surface-variant">Đang tải danh sách garage...</p>}
      {!isLoading && loadError && <p className="mt-6 text-body-sm text-error">{loadError}</p>}

      {!isLoading && !loadError && (
        <div className="mt-2 overflow-x-auto rounded-2xl border border-outline-variant/50 bg-surface-container-lowest shadow-[0_10px_26px_-14px_rgba(25,28,29,0.28)]">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="bg-surface-container-low text-[11px] uppercase tracking-wider text-on-surface-variant">
              <tr>
                <th className="px-4 py-3 font-bold">Garage</th>
                <th className="px-4 py-3 font-bold">Admin Garage</th>
                <th className="px-4 py-3 font-bold">Nhân viên</th>
                <th className="px-4 py-3 font-bold">Lịch hẹn</th>
                <th className="px-4 py-3 font-bold">Hoa hồng</th>
                <th className="px-4 py-3 font-bold">Trạng thái</th>
                <th className="px-4 py-3 text-right font-bold">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/50">
              {visibleGarages.map((g) => (
                <tr key={g.id} className={`hover:bg-surface-container-low ${g.hidden ? "opacity-60" : ""}`}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span
                        aria-hidden="true"
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-fixed text-on-primary-fixed-variant"
                      >
                        <span className="material-symbols-outlined">storefront</span>
                      </span>
                      <div className="min-w-0">
                        <div className="font-bold">{g.name}</div>
                        <div className="text-xs text-on-surface-variant">{g.address || "—"}</div>
                        <div className="text-xs text-on-surface-variant">{g.phone || ""}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {g.ownerId !== null ? (
                      <>
                        <div>{g.ownerName || g.ownerUsername}</div>
                        <div className="text-xs text-on-surface-variant">{g.ownerUsername}</div>
                      </>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-[#fff1cc] px-2.5 py-1 text-xs font-semibold text-[#6b4200]">
                        <i className="h-[7px] w-[7px] rounded-full bg-[#c47f00]" />
                        Chưa có Admin
                      </span>
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
                    <StatusChips blocked={g.status === "blocked"} hidden={g.hidden} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      {g.ownerId === null && (
                        <button
                          type="button"
                          onClick={() => openOwnerModal(g.id)}
                          className="min-h-9 rounded-[10px] bg-primary px-3 text-xs font-bold text-on-primary"
                        >
                          Gán Admin
                        </button>
                      )}
                      <RowActionMenu
                        label={`Thêm thao tác với ${g.name}`}
                        disabled={busyId === g.id}
                        items={[
                          {
                            label: "Sửa hoa hồng",
                            icon: "percent",
                            onSelect: () => editCommission(g),
                          },
                          {
                            label: g.status === "blocked" ? "Mở chặn garage" : "Chặn garage",
                            icon: g.status === "blocked" ? "lock_open" : "block",
                            danger: g.status !== "blocked",
                            onSelect: () => askBlock(g),
                          },
                          {
                            label: g.hidden ? "Bỏ ẩn" : "Ẩn khỏi danh sách",
                            icon: g.hidden ? "visibility" : "visibility_off",
                            onSelect: () => askHidden(g),
                          },
                        ]}
                      />
                    </div>
                  </td>
                </tr>
              ))}
              {visibleGarages.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-on-surface-variant">
                    {garages.length === 0 ? "Chưa có garage nào." : "Không tìm thấy garage phù hợp."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {garageOpen && (
        <div
          ref={garageRef}
          role="dialog"
          aria-modal="true"
          aria-label="Tạo garage mới"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        >
          <div className="w-full max-w-[28rem] rounded-2xl border border-outline-variant bg-surface-container-lowest p-6 shadow-xl">
            <h3 className="font-headline-md text-lg font-bold">Tạo garage mới</h3>
            <div className="mt-4 space-y-3">
              <div>
                <label htmlFor="pages-superadmin-superadmingaragestab-field-1" className={labelClass}>Tên garage *</label>
                <input id="pages-superadmin-superadmingaragestab-field-1"
                  value={garageForm.name}
                  onChange={(e) => setGarageForm((f) => ({ ...f, name: e.target.value }))}
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="pages-superadmin-superadmingaragestab-field-2" className={labelClass}>Địa chỉ *</label>
                <input id="pages-superadmin-superadmingaragestab-field-2"
                  value={garageForm.address}
                  onChange={(e) => setGarageForm((f) => ({ ...f, address: e.target.value }))}
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="pages-superadmin-superadmingaragestab-field-3" className={labelClass}>Số điện thoại</label>
                <input id="pages-superadmin-superadmingaragestab-field-3"
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
        <div
          ref={ownerRef}
          role="dialog"
          aria-modal="true"
          aria-label="Tạo Admin Garage mới"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        >
          <div className="w-full max-w-[28rem] rounded-2xl border border-outline-variant bg-surface-container-lowest p-6 shadow-xl">
            <h3 className="font-headline-md text-lg font-bold">Tạo Admin Garage mới</h3>
            <div className="mt-4 space-y-3">
              <div>
                <label htmlFor="pages-superadmin-superadmingaragestab-field-4" className={labelClass}>Username *</label>
                <input id="pages-superadmin-superadmingaragestab-field-4"
                  value={ownerForm.username}
                  onChange={(e) => setOwnerForm((f) => ({ ...f, username: e.target.value }))}
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="pages-superadmin-superadmingaragestab-field-5" className={labelClass}>Password *</label>
                <input id="pages-superadmin-superadmingaragestab-field-5"
                  type="password"
                  value={ownerForm.password}
                  onChange={(e) => setOwnerForm((f) => ({ ...f, password: e.target.value }))}
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="pages-superadmin-superadmingaragestab-field-6" className={labelClass}>Họ tên</label>
                <input id="pages-superadmin-superadmingaragestab-field-6"
                  value={ownerForm.fullName}
                  onChange={(e) => setOwnerForm((f) => ({ ...f, fullName: e.target.value }))}
                  className={inputClass}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="pages-superadmin-superadmingaragestab-field-7" className={labelClass}>Email</label>
                  <input id="pages-superadmin-superadmingaragestab-field-7"
                    value={ownerForm.email}
                    onChange={(e) => setOwnerForm((f) => ({ ...f, email: e.target.value }))}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label htmlFor="pages-superadmin-superadmingaragestab-field-8" className={labelClass}>SĐT</label>
                  <input id="pages-superadmin-superadmingaragestab-field-8"
                    value={ownerForm.phone}
                    onChange={(e) => setOwnerForm((f) => ({ ...f, phone: e.target.value }))}
                    className={inputClass}
                  />
                </div>
              </div>
              <div>
                <label htmlFor="pages-superadmin-superadmingaragestab-field-9" className={labelClass}>Garage *</label>
                <select id="pages-superadmin-superadmingaragestab-field-9"
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

      {pending && (
        <ReasonConfirmDialog
          {...buildDialog(pending)}
          busy={busyId === pending.garage.id}
          onCancel={() => setPending(null)}
          onConfirm={confirmPending}
        />
      )}
    </div>
  );
}

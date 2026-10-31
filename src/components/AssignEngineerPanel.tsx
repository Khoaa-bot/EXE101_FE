import { useEffect, useState } from "react";
import {
  assignEngineerToAppointment,
  getAssignableEngineers,
  type AppointmentDto,
  type AssignableEngineer,
} from "../services/api";

type Props = {
  appointmentId: number;
  // pending: xác nhận kèm phân công; confirmed: đổi người (trước khi bắt đầu xử lý).
  status: "pending" | "confirmed";
  currentEngineerName: string | null;
  // Khách chưa thanh toán thì chưa xác nhận được.
  blockedReason?: string | null;
  onAssigned: (updated: AppointmentDto) => void;
};

type Loaded = { key: number; items: AssignableEngineer[]; error: string | null };

// Lễ tân chọn kỹ thuật viên phụ trách một lịch hẹn. Người đã có lịch trùng khung giờ bị mờ và không chọn được.
export default function AssignEngineerPanel({ appointmentId, status, currentEngineerName, blockedReason, onAssigned }: Props) {
  const isPending = status === "pending";
  const [open, setOpen] = useState(isPending);
  const [reloadKey, setReloadKey] = useState(0);
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const listOpen = open && !blockedReason;
  const isLoading = listOpen && loaded?.key !== reloadKey;
  const items = loaded?.key === reloadKey ? loaded.items : [];
  const loadError = loaded?.key === reloadKey ? loaded.error : null;

  useEffect(() => {
    if (!listOpen) return;
    let cancelled = false;
    getAssignableEngineers(appointmentId)
      .then((list) => {
        if (!cancelled) setLoaded({ key: reloadKey, items: list, error: null });
      })
      .catch((err) => {
        if (!cancelled) {
          setLoaded({
            key: reloadKey,
            items: [],
            error: err instanceof Error ? err.message : "Không tải được danh sách kỹ thuật viên.",
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [appointmentId, listOpen, reloadKey]);

  // Chọn sẵn người rảnh đầu danh sách (danh sách đã xếp: rảnh trước, ít lịch trong ngày trước).
  const effectiveSelected =
    selectedId ?? (isPending ? (items.find((e) => e.available)?.id ?? null) : null);

  const submit = () => {
    if (effectiveSelected === null) {
      setError("Vui lòng chọn kỹ thuật viên phụ trách.");
      return;
    }
    setBusy(true);
    setError(null);
    assignEngineerToAppointment(appointmentId, effectiveSelected)
      .then((updated) => {
        onAssigned(updated);
        setOpen(false);
        setSelectedId(null);
        setReloadKey((key) => key + 1);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Không phân công được kỹ thuật viên.");
        setReloadKey((key) => key + 1);
      })
      .finally(() => setBusy(false));
  };

  return (
    <section aria-labelledby="assign-engineer-title" className="rounded-2xl border border-outline-variant/60 bg-surface-container-low p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 id="assign-engineer-title" className="text-sm font-extrabold">
            {isPending ? "Chọn kỹ thuật viên phụ trách" : "Kỹ thuật viên phụ trách"}
          </h3>
          {!isPending && (
            <p className="mt-0.5 text-sm font-semibold">{currentEngineerName || "Chưa phân công"}</p>
          )}
        </div>
        {!isPending && !open && (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border-[1.5px] border-outline-variant bg-surface-container-lowest px-4 text-sm font-bold hover:bg-surface-container"
          >
            <span aria-hidden="true" className="material-symbols-outlined text-xl">
              swap_horiz
            </span>
            Đổi kỹ thuật viên
          </button>
        )}
      </div>

      {blockedReason && isPending && <p className="mt-2 text-sm text-on-surface-variant">{blockedReason}</p>}

      {listOpen && (
        <div className="mt-3 space-y-2">
          {isLoading && <p className="text-sm text-on-surface-variant">Đang tải kỹ thuật viên...</p>}
          {loadError && <p className="text-sm text-error">{loadError}</p>}
          {!isLoading && !loadError && items.length === 0 && (
            <p className="text-sm text-on-surface-variant">Garage chưa có kỹ thuật viên nào đang hoạt động.</p>
          )}

          <div role="radiogroup" aria-label="Kỹ thuật viên" className="space-y-2">
            {items.map((engineer) => {
              const selected = effectiveSelected === engineer.id;
              const disabled = !engineer.available;
              return (
                <button
                  key={engineer.id}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  aria-disabled={disabled}
                  disabled={disabled}
                  onClick={() => setSelectedId(engineer.id)}
                  className={`flex w-full items-center gap-3 rounded-2xl border-[1.5px] px-3.5 py-3 text-left ${
                    selected
                      ? "border-primary bg-primary-fixed/50"
                      : disabled
                        ? "cursor-not-allowed border-outline-variant/40 bg-surface-container opacity-80"
                        : "border-outline-variant/60 bg-surface-container-lowest hover:bg-surface-container"
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                      selected ? "border-primary" : "border-outline-variant"
                    }`}
                  >
                    {selected && <span className="h-2.5 w-2.5 rounded-full bg-primary" />}
                  </span>
                  <span
                    aria-hidden="true"
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-fixed font-extrabold text-on-primary-fixed-variant"
                  >
                    {engineer.fullName.charAt(0).toUpperCase()}
                  </span>
                  <span className="min-w-0 flex-1">
                    <b className="block">
                      {engineer.fullName}
                      {engineer.current ? " (đang phụ trách)" : ""}
                    </b>
                    <span className={`block text-xs ${disabled ? "text-error" : "text-on-surface-variant"}`}>
                      {disabled
                        ? `Đã có lịch #${engineer.conflictAppointmentId} trùng khung giờ này`
                        : `Hôm đó đã có ${engineer.jobsThatDay} lịch`}
                    </span>
                  </span>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                      disabled ? "bg-error-container text-on-error-container" : "bg-[#d9f7dd] text-[#00531a]"
                    }`}
                  >
                    {disabled ? "Bận" : "Rảnh"}
                  </span>
                </button>
              );
            })}
          </div>

          <p className="text-xs text-on-surface-variant">
            Sắp xếp: người rảnh trước, ít lịch trong ngày trước. Người bận không chọn được.
          </p>
          {error && (
            <p role="alert" className="text-sm text-error">
              {error}
            </p>
          )}

          <div className="flex flex-wrap gap-2 pt-1">
            <button
              type="button"
              onClick={submit}
              disabled={busy || effectiveSelected === null}
              className="inline-flex min-h-11 items-center gap-1.5 rounded-xl bg-gradient-to-br from-primary to-primary-container px-4 text-sm font-bold text-on-primary transition hover:opacity-90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span aria-hidden="true" className="material-symbols-outlined text-xl">
                how_to_reg
              </span>
              {busy ? "Đang lưu..." : isPending ? "Xác nhận & phân công" : "Lưu thay đổi"}
            </button>
            {!isPending && (
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  setSelectedId(null);
                  setError(null);
                }}
                disabled={busy}
                className="min-h-11 rounded-xl border-[1.5px] border-outline-variant px-4 text-sm font-bold hover:bg-surface-container disabled:opacity-60"
              >
                Hủy
              </button>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

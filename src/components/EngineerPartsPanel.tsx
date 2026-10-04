import { useEffect, useState } from "react";
import {
  addAppointmentPart,
  getEngineerGarageParts,
  removeAppointmentPart,
  type AppointmentPart,
  type GaragePart,
} from "../services/api";
import { formatVnd } from "../utils/format";

type EngineerPartsPanelProps = {
  appointmentId: number | string;
  parts: AppointmentPart[];
  editable: boolean;
  onChanged: () => void;
};

// Phụ tùng lấy từ kho garage: thêm sẽ trừ tồn kho và tính vào hoá đơn, gỡ sẽ hoàn lại kho.
export default function EngineerPartsPanel({
  appointmentId,
  parts,
  editable,
  onChanged,
}: EngineerPartsPanelProps) {
  const [catalog, setCatalog] = useState<GaragePart[]>([]);
  const [partId, setPartId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!editable) return;
    let cancelled = false;
    getEngineerGarageParts()
      .then((data) => {
        if (!cancelled) setCatalog(data);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Không tải được kho phụ tùng.");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [editable, parts.length]);

  const parsedQuantity = Number(quantity);
  const canAdd =
    editable && !isBusy && partId !== "" && Number.isInteger(parsedQuantity) && parsedQuantity >= 1;

  const add = async () => {
    if (!canAdd) return;
    setIsBusy(true);
    setError(null);
    try {
      await addAppointmentPart(appointmentId, { partId: Number(partId), quantity: parsedQuantity });
      setPartId("");
      setQuantity("1");
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thêm được phụ tùng.");
    } finally {
      setIsBusy(false);
    }
  };

  const remove = async (part: AppointmentPart) => {
    if (isBusy) return;
    setIsBusy(true);
    setError(null);
    try {
      await removeAppointmentPart(appointmentId, part.id);
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không gỡ được phụ tùng.");
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <div className="space-y-3">
      {parts.length === 0 && (
        <p className="text-sm text-on-surface-variant">Chưa dùng phụ tùng nào từ kho.</p>
      )}

      {parts.length > 0 && (
        <ul className="space-y-2">
          {parts.map((part) => (
            <li
              key={part.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-outline-variant bg-surface-container-low px-3 py-2 text-body-sm"
            >
              <span>
                {part.partName} × {part.quantity}
              </span>
              <span className="flex items-center gap-3">
                <span className="font-bold">{formatVnd(part.lineTotal)}</span>
                {editable && (
                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={() => void remove(part)}
                    aria-label={`Gỡ ${part.partName}`}
                    className="text-error disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                  </button>
                )}
              </span>
            </li>
          ))}
        </ul>
      )}

      {editable && (
        <form
          className="flex flex-col gap-2 sm:flex-row"
          onSubmit={(event) => {
            event.preventDefault();
            void add();
          }}
        >
          <select aria-label="Chọn linh kiện"
            value={partId}
            onChange={(event) => setPartId(event.target.value)}
            className="flex-1 rounded-lg border border-outline-variant bg-surface-container-low px-3 py-2 text-body-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          >
            <option value="">Chọn phụ tùng trong kho...</option>
            {catalog.map((part) => (
              <option key={part.id} value={part.id} disabled={part.quantity <= 0}>
                {part.partName} — còn {part.quantity}
                {part.price !== null ? ` — ${formatVnd(part.price)}` : ""}
              </option>
            ))}
          </select>
          <input
            value={quantity}
            onChange={(event) => setQuantity(event.target.value)}
            inputMode="numeric"
            aria-label="Số lượng"
            className="w-20 rounded-lg border border-outline-variant bg-surface-container-low px-3 py-2 text-body-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          />
          <button
            type="submit"
            disabled={!canAdd}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-on-primary transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Thêm
          </button>
        </form>
      )}

      {error && <p className="text-sm text-error">{error}</p>}
    </div>
  );
}

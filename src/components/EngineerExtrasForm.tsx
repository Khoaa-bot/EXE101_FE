import { useState } from "react";
import { proposeExtra, type MaintenanceService } from "../services/api";
import { formatVnd } from "../utils/format";

type EngineerExtrasFormProps = {
  appointmentId: number | string;
  services: MaintenanceService[];
  onProposed: () => void;
};

const CUSTOM = "custom";

// Form KTV đề xuất hạng mục phát sinh: chọn từ danh mục dịch vụ (giá cố định)
// hoặc nhập tên + giá tự do.
export default function EngineerExtrasForm({
  appointmentId,
  services,
  onProposed,
}: EngineerExtrasFormProps) {
  const [choice, setChoice] = useState("");
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isCustom = choice === CUSTOM;
  const parsedPrice = Number(price);
  const canSubmit =
    !isSubmitting &&
    choice !== "" &&
    (!isCustom || (name.trim().length > 0 && Number.isFinite(parsedPrice) && parsedPrice > 0));

  const submit = async () => {
    if (!canSubmit) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await proposeExtra(appointmentId, {
        serviceId: isCustom ? undefined : Number(choice),
        name: isCustom ? name.trim() : undefined,
        price: isCustom ? parsedPrice : undefined,
        reason: reason.trim() || undefined,
      });
      setChoice("");
      setName("");
      setPrice("");
      setReason("");
      onProposed();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không gửi được đề xuất.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      className="space-y-3"
      onSubmit={(event) => {
        event.preventDefault();
        void submit();
      }}
    >
      <div>
        <label htmlFor="components-engineerextrasform-field-1" className="mb-1 block text-xs font-semibold text-on-surface-variant">
          Hạng mục phát sinh
        </label>
        <select id="components-engineerextrasform-field-1"
          value={choice}
          onChange={(event) => setChoice(event.target.value)}
          className="w-full rounded-lg border border-outline-variant bg-surface-container-low px-3 py-2 text-body-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
        >
          <option value="">Chọn từ danh mục dịch vụ...</option>
          {services.map((service) => (
            <option key={service.id} value={service.id}>
              {service.name} — {formatVnd(service.price)}
            </option>
          ))}
          <option value={CUSTOM}>Khác (nhập tên và giá)</option>
        </select>
      </div>

      {isCustom && (
        <div className="grid gap-3 sm:grid-cols-2">
          <input aria-label="Tên hạng mục"
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength={150}
            placeholder="Tên hạng mục"
            className="rounded-lg border border-outline-variant bg-surface-container-low px-3 py-2 text-body-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          />
          <input aria-label="Giá (đ)"
            value={price}
            onChange={(event) => setPrice(event.target.value)}
            inputMode="numeric"
            placeholder="Giá (đ)"
            className="rounded-lg border border-outline-variant bg-surface-container-low px-3 py-2 text-body-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          />
        </div>
      )}

      <textarea aria-label="Lý do cần làm thêm (khách sẽ đọc phần này)..."
        rows={2}
        value={reason}
        onChange={(event) => setReason(event.target.value)}
        maxLength={500}
        placeholder="Lý do cần làm thêm (khách sẽ đọc phần này)..."
        className="w-full rounded-lg border border-outline-variant bg-surface-container-low px-3 py-2 text-body-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
      />

      {error && <p className="text-sm text-error">{error}</p>}

      <button
        type="submit"
        disabled={!canSubmit}
        className="w-full rounded-lg bg-primary py-2.5 font-label-md text-label-md text-on-primary transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isSubmitting ? "Đang gửi..." : "Gửi đề xuất cho khách"}
      </button>
    </form>
  );
}

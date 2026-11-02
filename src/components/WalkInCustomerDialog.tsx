import { useRef, useState } from "react";
import { useDialogA11y } from "../hooks/useDialogA11y";
import { createWalkInCustomer, type WalkInCustomerResult } from "../services/api";
import { MAX_ODOMETER_KM } from "../utils/maintenance";

type Props = {
  onClose: () => void;
  // Bấm "Tiếp tục đặt lịch" ở màn kết quả: trang đặt lịch tự chọn khách vừa tạo.
  onContinue: (result: WalkInCustomerResult) => void;
};

type FieldErrors = Partial<Record<"fullName" | "phone" | "email" | "password" | "model" | "plate" | "vin" | "odometer", string>>;

const MIN_PASSWORD = 6;
const EMAIL_PATTERN = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const PASSWORD_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";

function randomPassword() {
  const bytes = new Uint32Array(8);
  window.crypto.getRandomValues(bytes);
  return Array.from(bytes, (n) => PASSWORD_CHARS[n % PASSWORD_CHARS.length]).join("");
}

const inputClass =
  "w-full min-h-11 rounded-xl border bg-surface-container-lowest px-3.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary";

// Lễ tân tạo nhanh tài khoản và xe cho khách chưa có tài khoản. Gắn vào DOM chỉ khi đang mở.
export default function WalkInCustomerDialog({ onClose, onContinue }: Props) {
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [model, setModel] = useState("");
  const [plate, setPlate] = useState("");
  const [vin, setVin] = useState("");
  const [odometer, setOdometer] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [created, setCreated] = useState<WalkInCustomerResult | null>(null);
  const [copied, setCopied] = useState<"user" | "password" | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  useDialogA11y(true, dialogRef, onClose);

  const validate = (): FieldErrors => {
    const next: FieldErrors = {};
    if (fullName.trim().length < 2) next.fullName = "Vui lòng nhập họ tên khách.";
    if (!/^(\+?84|0)\d{9}$/.test(phone.replace(/[\s.-]/g, ""))) next.phone = "Số điện thoại cần 10 chữ số, ví dụ 0912345678.";
    if (email.trim() && !EMAIL_PATTERN.test(email.trim())) next.email = "Email không hợp lệ.";
    if (password.trim().length < MIN_PASSWORD) next.password = `Mật khẩu tạm cần tối thiểu ${MIN_PASSWORD} ký tự.`;
    if (!model.trim()) next.model = "Vui lòng nhập mẫu xe.";
    if (!plate.trim()) next.plate = "Vui lòng nhập biển số.";
    if (!vin.trim()) next.vin = "Vui lòng nhập số khung (VIN).";
    if (odometer.trim()) {
      const km = Number(odometer);
      if (!Number.isInteger(km) || km < 0 || km > MAX_ODOMETER_KM) {
        next.odometer = `Số km từ 0 đến ${MAX_ODOMETER_KM.toLocaleString("vi-VN")}.`;
      }
    }
    return next;
  };

  const submit = () => {
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    setBusy(true);
    setSubmitError(null);
    createWalkInCustomer({
      fullName: fullName.trim(),
      phone: phone.trim(),
      email: email.trim() || undefined,
      temporaryPassword: password.trim(),
      vehicle: {
        model: model.trim(),
        licensePlate: plate.trim(),
        vin: vin.trim(),
        odometer: odometer.trim() ? Number(odometer) : undefined,
      },
    })
      .then(setCreated)
      .catch((err) => setSubmitError(err instanceof Error ? err.message : "Không tạo được khách hàng."))
      .finally(() => setBusy(false));
  };

  const copy = (text: string, which: "user" | "password") => {
    void navigator.clipboard?.writeText(text).then(() => {
      setCopied(which);
      window.setTimeout(() => setCopied(null), 1500);
    });
  };

  const field = (
    id: string,
    label: string,
    value: string,
    onChange: (v: string) => void,
    error: string | undefined,
    opts: { required?: boolean; placeholder?: string; type?: string; maxLength?: number } = {},
  ) => (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-[13px] font-bold">
        {label}
        {opts.required && (
          <span aria-hidden="true" className="text-error">
            {" "}
            *
          </span>
        )}
      </label>
      <input
        id={id}
        type={opts.type ?? "text"}
        value={value}
        maxLength={opts.maxLength}
        placeholder={opts.placeholder}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={Boolean(error)}
        className={`${inputClass} ${error ? "border-2 border-error" : "border-outline-variant"}`}
      />
      {error && (
        <p role="alert" className="flex items-center gap-1 text-xs text-error">
          <span aria-hidden="true" className="material-symbols-outlined text-base">
            error
          </span>
          {error}
        </p>
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-4">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="walk-in-title"
        className="max-h-[92dvh] w-full max-w-[38rem] overflow-y-auto rounded-3xl bg-surface-container-lowest p-6 text-on-surface shadow-[0_30px_70px_-20px_rgba(0,0,0,0.55)] sm:p-7"
      >
        {created ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span
                aria-hidden="true"
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#d9f7dd] text-[#00531a]"
              >
                <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                  check_circle
                </span>
              </span>
              <div>
                <h2 id="walk-in-title" className="text-xl font-extrabold tracking-tight">
                  Đã tạo tài khoản cho {created.fullName}
                </h2>
                <p className="mt-0.5 text-[13px] text-on-surface-variant">
                  {created.vehicleModel} · {created.vehicleLicensePlate} đã được thêm vào hồ sơ.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-[13px] font-bold">Thông tin đăng nhập cho khách</p>
              {(
                [
                  ["user", "Tên đăng nhập", created.username],
                  ["password", "Mật khẩu tạm", created.temporaryPassword],
                ] as const
              ).map(([key, label, value]) => (
                <div key={key} className="flex items-center justify-between gap-3 rounded-2xl bg-surface-container-low px-3.5 py-3">
                  <div className="min-w-0">
                    <p className="text-xs text-on-surface-variant">{label}</p>
                    <b className="block truncate font-mono text-lg tracking-wide">{value}</b>
                  </div>
                  <button
                    type="button"
                    onClick={() => copy(value, key)}
                    className="inline-flex min-h-9 shrink-0 items-center gap-1 rounded-[10px] border-[1.5px] border-outline-variant bg-surface-container-lowest px-3 text-xs font-bold hover:bg-surface-container"
                  >
                    <span aria-hidden="true" className="material-symbols-outlined text-base">
                      {copied === key ? "check" : "content_copy"}
                    </span>
                    {copied === key ? "Đã chép" : "Sao chép"}
                  </button>
                </div>
              ))}
            </div>

            <p className="flex items-start gap-2.5 rounded-2xl bg-[#fff1cc] px-3.5 py-3 text-[13px] leading-snug text-[#6b4200]">
              <span aria-hidden="true" className="material-symbols-outlined text-xl">
                warning
              </span>
              Mật khẩu chỉ hiện ở đây, đóng hộp thoại là không xem lại được (hệ thống chỉ lưu bản mã hóa). Báo khách ghi
              nhớ và đổi mật khẩu sau khi đăng nhập.
            </p>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => onContinue(created)}
                className="inline-flex min-h-11 items-center gap-1.5 rounded-xl bg-primary px-5 text-sm font-bold text-on-primary hover:opacity-90"
              >
                <span aria-hidden="true" className="material-symbols-outlined text-xl">
                  arrow_forward
                </span>
                Tiếp tục đặt lịch
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 id="walk-in-title" className="text-xl font-extrabold tracking-tight">
                  Tạo khách mới tại quầy
                </h2>
                <p className="mt-1 text-[13px] text-on-surface-variant">
                  Dành cho khách chưa có tài khoản. Tạo xong lễ tân đặt lịch giúp luôn.
                </p>
              </div>
              <button
                type="button"
                aria-label="Đóng"
                onClick={onClose}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container-low"
              >
                <span aria-hidden="true" className="material-symbols-outlined">
                  close
                </span>
              </button>
            </div>

            <p className="mt-4 text-xs font-extrabold uppercase tracking-wider text-on-surface-variant">Khách hàng</p>
            <div className="mt-2 grid gap-3 sm:grid-cols-2">
              {field("walkin-name", "Họ và tên", fullName, setFullName, errors.fullName, { required: true, maxLength: 100 })}
              {field("walkin-phone", "Số điện thoại", phone, setPhone, errors.phone, {
                required: true,
                placeholder: "0912 345 678",
              })}
            </div>
            <div className="mt-3">
              {field("walkin-email", "Email (không bắt buộc)", email, setEmail, errors.email, {
                type: "email",
                placeholder: "khach@example.com",
              })}
            </div>
            <div className="mt-3 space-y-1.5">
              <label htmlFor="walkin-password" className="block text-[13px] font-bold">
                Mật khẩu tạm <span aria-hidden="true" className="text-error">*</span>
              </label>
              <div className="flex gap-2">
                <input
                  id="walkin-password"
                  value={password}
                  maxLength={50}
                  onChange={(e) => setPassword(e.target.value)}
                  aria-invalid={Boolean(errors.password)}
                  aria-describedby="walkin-password-hint"
                  className={`${inputClass} flex-1 ${errors.password ? "border-2 border-error" : "border-outline-variant"}`}
                />
                <button
                  type="button"
                  onClick={() => setPassword(randomPassword())}
                  className="inline-flex min-h-11 shrink-0 items-center gap-1 rounded-xl border-[1.5px] border-outline-variant bg-surface-container-lowest px-3 text-sm font-bold hover:bg-surface-container"
                >
                  <span aria-hidden="true" className="material-symbols-outlined text-lg">
                    casino
                  </span>
                  Gợi ý ngẫu nhiên
                </button>
              </div>
              {errors.password ? (
                <p id="walkin-password-hint" role="alert" className="flex items-center gap-1 text-xs text-error">
                  <span aria-hidden="true" className="material-symbols-outlined text-base">
                    error
                  </span>
                  {errors.password}
                </p>
              ) : (
                <p id="walkin-password-hint" className="text-xs leading-snug text-on-surface-variant">
                  Tên đăng nhập là số điện thoại của khách. Chọn mật khẩu dễ nhớ (tối thiểu {MIN_PASSWORD} ký tự), khách sẽ
                  đổi sau khi đăng nhập.
                </p>
              )}
            </div>

            <p className="mt-5 text-xs font-extrabold uppercase tracking-wider text-on-surface-variant">Xe của khách</p>
            <div className="mt-2 grid gap-3 sm:grid-cols-2">
              {field("walkin-model", "Mẫu xe", model, setModel, errors.model, { required: true, placeholder: "Honda Vision" })}
              {field("walkin-plate", "Biển số", plate, setPlate, errors.plate, { required: true, placeholder: "59X1-12345" })}
              {field("walkin-vin", "Số khung (VIN)", vin, setVin, errors.vin, { required: true })}
              {field("walkin-odo", "Số km hiện tại", odometer, setOdometer, errors.odometer, {
                type: "number",
                placeholder: "Ví dụ: 40250",
              })}
            </div>
            <p className="mt-3 flex items-start gap-2.5 rounded-2xl bg-primary-fixed/60 px-3.5 py-3 text-[12.5px] leading-snug text-on-primary-fixed-variant">
              <span aria-hidden="true" className="material-symbols-outlined text-xl">
                info
              </span>
              Số khung và biển số xem trên giấy đăng ký xe. Nếu số điện thoại đã có tài khoản, hãy tìm và chọn khách đó thay
              vì tạo mới.
            </p>

            {submitError && (
              <p role="alert" className="mt-3 text-sm text-error">
                {submitError}
              </p>
            )}

            <div className="mt-5 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                disabled={busy}
                className="min-h-11 rounded-xl border-[1.5px] border-outline-variant bg-surface-container-lowest px-5 text-sm font-bold hover:bg-surface-container-low disabled:opacity-60"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={submit}
                disabled={busy}
                className="inline-flex min-h-11 items-center gap-1.5 rounded-xl bg-primary px-5 text-sm font-bold text-on-primary disabled:opacity-60"
              >
                <span aria-hidden="true" className="material-symbols-outlined text-xl">
                  person_add
                </span>
                {busy ? "Đang tạo..." : "Tạo khách & xe"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

import { useId, useState, type ReactNode } from "react";
import { addVehicle, getStoredAuthSession, uploadVehicleImage } from "../../services/api";

type AddVehiclePageProps = {
  onBackClick: () => void;
};

const avatarImage =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBEXlrbfWbr4jhdKHV_ATfDttGJPuxCYnC3gEDNlmvKENFkNUVtMozBoZ4lhkCtuLuAKDuQH-gy3HuLFCZMYoPI2eta1p-AgY11y4afJ9nfgDxcWm2CAj7p6VsTqay0S5QkIWuk8D35Sxbui5UB9QHmyCHNkBoJnbzcU3Kq_qgAhtXpEmLKEuqN7Gph4Am90nd06Qn1SDcRDB1kgP_jZyaLVA5cpXasH9A1BPG1fY7_watoXtYCXoSAc8ZwxAKpUHjLb5HteXlCsgLi";

// Danh sách hãng xe và các mẫu xe tương ứng — khi khách chọn hãng khác, danh
// sách mẫu xe bên dưới sẽ tự đổi theo đúng hãng đó thay vì cố định một danh
// sách chung cho mọi hãng.
const carModelsByBrand: Record<string, string[]> = {
  "VinFast": ["VF e34", "VF 5", "VF 6", "VF 7", "VF 8", "VF 9", "Fadil", "Lux A2.0", "Lux SA2.0"],
  "Toyota": ["Vios", "Veloz", "Yaris Cross", "Corolla Cross", "Camry", "Innova", "Fortuner", "Raize"],
  "Honda": ["Brio", "City", "Civic", "HR-V", "CR-V", "Accord"],
  "Hyundai": ["Grand i10", "Accent", "Elantra", "Creta", "Tucson", "Santa Fe"],
  "Kia": ["Morning", "Soluto", "K3", "Seltos", "Sorento", "Carnival"],
  "Mazda": ["Mazda2", "Mazda3", "CX-30", "CX-5", "CX-8"],
  "Ford": ["EcoSport", "Territory", "Ranger", "Everest"],
  "Mitsubishi": ["Attrage", "Xpander", "Outlander", "Pajero Sport"],
};
const carBrands = Object.keys(carModelsByBrand);

// Dáng xe của từng mẫu — dùng để chọn icon minh hoạ phù hợp (không dùng ảnh
// thật của hãng vì đó là tài sản có bản quyền/thương hiệu).
type BodyType = "ev" | "sedan" | "suv" | "hatchback" | "mpv" | "pickup";

const modelBodyType: Record<string, BodyType> = {
  // VinFast — toàn bộ là xe điện
  "VF e34": "ev", "VF 5": "ev", "VF 6": "ev", "VF 7": "ev", "VF 8": "ev", "VF 9": "ev",
  "Fadil": "hatchback", "Lux A2.0": "sedan", "Lux SA2.0": "suv",
  // Toyota
  "Vios": "sedan", "Veloz": "mpv", "Yaris Cross": "suv", "Corolla Cross": "suv",
  "Camry": "sedan", "Innova": "mpv", "Fortuner": "suv", "Raize": "suv",
  // Honda
  "Brio": "hatchback", "City": "sedan", "Civic": "sedan", "HR-V": "suv", "CR-V": "suv", "Accord": "sedan",
  // Hyundai
  "Grand i10": "hatchback", "Accent": "sedan", "Elantra": "sedan", "Creta": "suv", "Tucson": "suv", "Santa Fe": "suv",
  // Kia
  "Morning": "hatchback", "Soluto": "sedan", "K3": "sedan", "Seltos": "suv", "Sorento": "suv", "Carnival": "mpv",
  // Mazda
  "Mazda2": "hatchback", "Mazda3": "sedan", "CX-30": "suv", "CX-5": "suv", "CX-8": "suv",
  // Ford
  "EcoSport": "suv", "Territory": "suv", "Ranger": "pickup", "Everest": "suv",
  // Mitsubishi
  "Attrage": "sedan", "Xpander": "mpv", "Outlander": "suv", "Pajero Sport": "suv",
};

const bodyTypeIcon: Record<BodyType, string> = {
  ev: "electric_car",
  pickup: "local_shipping",
  mpv: "airport_shuttle",
  sedan: "directions_car",
  suv: "directions_car",
  hatchback: "directions_car",
};

const getModelIcon = (model: string) => bodyTypeIcon[modelBodyType[model] ?? "sedan"];

// Danh sách màu phổ thông dùng chung cho mọi hãng (không gắn tên riêng của
// VinFast như trước) — chọn "Khác" nếu xe có màu/tên gọi đặc biệt không có
// trong danh sách.
const OTHER_COLOR = "__other__";
const carColors = [
  "Trắng",
  "Đen",
  "Bạc",
  "Xám",
  "Đỏ",
  "Xanh dương",
  "Xanh lá",
  "Vàng",
  "Cam",
  "Nâu",
];

const MIN_VEHICLE_YEAR = 2010;
const currentYear = new Date().getFullYear();
// Danh sách năm sản xuất cho phép chọn: từ MIN_VEHICLE_YEAR đến năm hiện tại,
// mới nhất hiển thị trước.
const vehicleYears = Array.from(
  { length: currentYear - MIN_VEHICLE_YEAR + 1 },
  (_, index) => currentYear - index,
);

// Khớp với validate phía backend (VehicleService) để báo lỗi ngay trên FE,
// không cần chờ round-trip lên server.
const VIN_PATTERN = /^[A-HJ-NPR-Z0-9]{17}$/;
const LICENSE_PLATE_PATTERN = /^\d{2}[A-Z]{1,2}-\d{3}\.?\d{2}$/;
const MAX_ODOMETER_KM = 500_000;

const cardClass =
  "rounded-3xl border border-outline-variant/40 bg-surface-container-lowest shadow-[0_10px_26px_-14px_rgba(25,28,29,0.28)]";
const inputBase =
  "min-h-12 w-full rounded-2xl border border-outline-variant bg-surface-container-lowest px-4 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/30";

export default function AddVehiclePage({ onBackClick }: AddVehiclePageProps) {
  const [brand, setBrand] = useState(carBrands[0]);
  const [selectedModel, setSelectedModel] = useState(carModelsByBrand[carBrands[0]][0]);
  const [vin, setVin] = useState("");
  const [licensePlate, setLicensePlate] = useState("");
  const [year, setYear] = useState(String(currentYear));
  const [color, setColor] = useState("");
  const [customColor, setCustomColor] = useState("");
  const [odometer, setOdometer] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [vinTouched, setVinTouched] = useState(false);
  const [plateTouched, setPlateTouched] = useState(false);

  const handleBrandChange = (nextBrand: string) => {
    setBrand(nextBrand);
    // Đổi hãng thì mẫu xe đang chọn có thể không còn hợp lệ, tự chọn lại mẫu
    // đầu tiên của hãng mới.
    setSelectedModel(carModelsByBrand[nextBrand]?.[0] ?? "");
  };

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setImageFile(file);
    setImagePreview((previous) => {
      if (previous) URL.revokeObjectURL(previous);
      return file ? URL.createObjectURL(file) : null;
    });
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;

    const session = getStoredAuthSession();
    if (!session) {
      setError("Bạn cần đăng nhập lại để thêm phương tiện.");
      return;
    }
    const normalizedVin = vin.trim().toUpperCase();
    if (!VIN_PATTERN.test(normalizedVin)) {
      setError(
        "Số khung (VIN) không hợp lệ — phải gồm đúng 17 ký tự chữ/số, không chứa I, O, Q.",
      );
      return;
    }

    const normalizedPlate = licensePlate.trim().toUpperCase();
    if (!LICENSE_PLATE_PATTERN.test(normalizedPlate)) {
      setError("Biển số xe không đúng định dạng (VD: 30A-123.45).");
      return;
    }

    if (odometer && (Number(odometer) < 0 || Number(odometer) > MAX_ODOMETER_KM)) {
      setError(`Số km đã đi không hợp lệ (0 - ${MAX_ODOMETER_KM.toLocaleString("vi-VN")} km).`);
      return;
    }

    if (color === OTHER_COLOR && !customColor.trim()) {
      setError("Vui lòng nhập tên màu xe.");
      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      // Backend (VehicleController/VehicleRequest) lưu vin / model / year /
      // licensePlate / color / odometer — tên thương hiệu được gộp chung vào
      // "model" (VD: "VinFast VF 8"), vì backend không có field brand riêng.
      const finalColor = color === OTHER_COLOR ? customColor.trim() : color;
      const createdVehicle = await addVehicle({
        customerId: session.id,
        vin: normalizedVin,
        model: `${brand.trim()} ${selectedModel}`.trim(),
        year: year ? Number(year) : undefined,
        licensePlate: normalizedPlate,
        color: finalColor,
        odometer: odometer ? Number(odometer) : undefined,
      });

      if (imageFile) {
        try {
          await uploadVehicleImage(createdVehicle.id, imageFile);
        } catch {
          // Xe đã tạo thành công, chỉ ảnh lỗi — không chặn người dùng, họ có
          // thể tải ảnh lại sau trong trang Cá nhân.
        }
      }

      onBackClick();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Thêm phương tiện không thành công.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-dvh overflow-x-hidden bg-background font-sans text-on-background">
      <aside className="fixed left-0 top-0 z-50 hidden h-full w-[240px] flex-col border-r border-outline-variant bg-surface-container-lowest py-xl md:flex">
        <div className="mb-10 flex items-center gap-3 px-lg">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
            <span
              className="material-symbols-outlined text-white"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              electric_car
            </span>
          </div>
          <div>
            <h1 className="font-headline-lg text-headline-lg font-bold leading-none tracking-tight text-primary">
              Servio
            </h1>
            <p className="font-label-sm text-label-sm text-secondary">
              EV Maintenance
            </p>
          </div>
        </div>

        <nav className="flex-1 space-y-1">
          {[
            ["home", "Trang chủ"],
            ["history", "Lịch sử"],
            ["electric_car", "Theo dõi"],
            ["notifications", "Thông báo"],
          ].map(([icon, label]) => (
            <button
              key={label}
              className="flex w-full items-center gap-3 px-lg py-3 text-secondary transition-colors hover:bg-surface-container"
              type="button"
            >
              <span className="material-symbols-outlined">{icon}</span>
              <span className="font-body-md text-body-md">{label}</span>
            </button>
          ))}
          <button
            className="flex w-full items-center gap-3 border-l-4 border-primary bg-secondary-container px-lg py-3 text-primary"
            type="button"
            onClick={onBackClick}
          >
            <span
              className="material-symbols-outlined"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              person
            </span>
            <span className="font-body-md text-body-md font-semibold">Cá nhân</span>
          </button>
        </nav>

        <div className="mt-4 border-t border-outline-variant px-lg pt-xl">
          <button className="flex items-center gap-3 py-2 font-label-md text-label-md text-secondary transition-colors hover:text-primary">
            <span className="material-symbols-outlined text-[20px]">help</span>
            Support
          </button>
          <button className="flex items-center gap-3 py-2 font-label-md text-label-md text-error transition-colors hover:opacity-80">
            <span className="material-symbols-outlined text-[20px]">logout</span>
            Sign Out
          </button>
        </div>
      </aside>

      <header className="fixed top-0 z-40 flex h-16 items-center justify-between border-b border-outline-variant bg-surface-container-lowest px-margin-mobile md:left-[240px] md:right-0 md:px-lg">
        <div className="flex flex-1 items-center gap-3 md:max-w-[560px]">
          <button
            className="-ml-2 rounded-full p-2 text-primary md:hidden"
            type="button"
            aria-label="Quay lại"
            onClick={onBackClick}
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <h1 className="font-headline-lg text-headline-lg font-bold text-primary md:hidden">
            Thêm phương tiện
          </h1>
        </div>

        <div className="flex items-center gap-4">
          <img
            className="h-10 w-10 rounded-full border-2 border-primary-fixed object-cover"
            src={avatarImage}
            alt="Ảnh đại diện"
          />
        </div>
      </header>

      <main className="px-margin-mobile pb-xl pt-24 md:ml-[240px] md:px-xl">
        <div className="mx-auto max-w-6xl space-y-5">
          <div>
            <button
              type="button"
              onClick={onBackClick}
              className="mb-3 inline-flex min-h-10 items-center gap-1 rounded-xl border-[1.5px] border-outline-variant bg-surface-container-lowest px-3.5 text-sm font-bold hover:bg-surface-container-low"
            >
              <span aria-hidden="true" className="material-symbols-outlined text-xl">
                arrow_back
              </span>
              Hồ sơ
            </button>
            <h2 className="text-3xl font-extrabold tracking-tight text-on-surface">Thêm xe mới</h2>
            <p className="mt-1 text-[15px] text-on-surface-variant">
              Điền thông tin xe để đặt lịch bảo dưỡng nhanh hơn.
            </p>
          </div>

          <form className="grid items-start gap-5 xl:grid-cols-[1fr_22.5rem]" onSubmit={handleSubmit} noValidate>
            <div className="space-y-5">
              <section aria-labelledby="addv-info-title" className={`${cardClass} p-[22px]`}>
                <h3 id="addv-info-title" className="mb-4 text-lg font-extrabold">
                  Thông tin xe
                </h3>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <SelectField label="Thương hiệu" value={brand} onChange={handleBrandChange}>
                    {carBrands.map((brandName) => (
                      <option key={brandName} value={brandName}>
                        {brandName}
                      </option>
                    ))}
                  </SelectField>
                  <SelectField label="Năm sản xuất" value={year} onChange={setYear}>
                    {vehicleYears.map((vehicleYear) => (
                      <option key={vehicleYear} value={vehicleYear}>
                        {vehicleYear}
                      </option>
                    ))}
                  </SelectField>
                  <TextField
                    label="Số khung (VIN)"
                    placeholder="17 ký tự, VD: RLZAB1234C5678901"
                    value={vin}
                    onChange={(value) => setVin(value.toUpperCase())}
                    onBlur={() => setVinTouched(true)}
                    error={vinTouched && vin.trim() !== "" && !VIN_PATTERN.test(vin.trim()) ? "VIN gồm đúng 17 ký tự chữ/số, không chứa I, O, Q." : undefined}
                    valid={VIN_PATTERN.test(vin.trim())}
                    hint="17 ký tự"
                    required
                  />
                  <TextField
                    label="Biển số xe"
                    placeholder="VD: 30A-123.45"
                    value={licensePlate}
                    onChange={(value) => setLicensePlate(value.toUpperCase())}
                    onBlur={() => setPlateTouched(true)}
                    error={plateTouched && licensePlate.trim() !== "" && !LICENSE_PLATE_PATTERN.test(licensePlate.trim()) ? "Biển số chưa đúng định dạng (VD: 30A-123.45)." : undefined}
                    valid={LICENSE_PLATE_PATTERN.test(licensePlate.trim())}
                    required
                  />
                  <div>
                    <SelectField label="Màu sắc" value={color} onChange={setColor}>
                      <option value="">Chọn màu sắc</option>
                      {carColors.map((colorName) => (
                        <option key={colorName} value={colorName}>
                          {colorName}
                        </option>
                      ))}
                      <option value={OTHER_COLOR}>Khác (tự nhập)</option>
                    </SelectField>
                    {color === OTHER_COLOR && (
                      <input
                        aria-label="Màu sắc khác"
                        className={`${inputBase} mt-2`}
                        type="text"
                        value={customColor}
                        onChange={(event) => setCustomColor(event.target.value)}
                        placeholder="VD: Trắng Ngọc Trai, Xanh Rêu..."
                      />
                    )}
                  </div>
                  <TextField
                    label="Số km đã đi (odometer)"
                    placeholder="VD: 12000"
                    value={odometer}
                    onChange={setOdometer}
                    type="number"
                    suffix="km"
                  />
                </div>
              </section>

              <section aria-labelledby="addv-model-title" className={`${cardClass} p-[22px]`}>
                <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
                  <h3 id="addv-model-title" className="text-lg font-extrabold">
                    Chọn mẫu xe
                  </h3>
                  <span className="text-[13px] text-on-surface-variant">{brand} Series</span>
                </div>
                <div role="radiogroup" aria-label="Mẫu xe" className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                  {(carModelsByBrand[brand] ?? []).map((model) => {
                    const active = selectedModel === model;
                    return (
                      <label key={model} className="group relative cursor-pointer">
                        <input
                          className="peer sr-only"
                          name="model"
                          type="radio"
                          value={model}
                          checked={active}
                          onChange={() => setSelectedModel(model)}
                        />
                        <div
                          className={`overflow-hidden rounded-[18px] border-[1.5px] bg-surface-container-lowest transition-all peer-focus-visible:ring-4 peer-focus-visible:ring-primary/30 ${
                            active
                              ? "border-primary shadow-[0_0_0_3px_rgba(0,89,187,0.15)]"
                              : "border-outline-variant/50 hover:border-primary/60"
                          }`}
                        >
                          <div className="flex h-[92px] items-center justify-center bg-primary-fixed/50 text-primary">
                            <span aria-hidden="true" className="material-symbols-outlined text-[40px]">
                              {getModelIcon(model)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between px-3 py-2.5">
                            <b className={`text-[13px] ${active ? "text-on-primary-fixed-variant" : ""}`}>{model}</b>
                            {active && (
                              <span aria-hidden="true" className="material-symbols-outlined text-xl text-primary">
                                check_circle
                              </span>
                            )}
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </section>
            </div>

            <aside className="space-y-5 xl:sticky xl:top-24">
              <section aria-labelledby="addv-photo-title" className={`${cardClass} p-[22px]`}>
                <h3 id="addv-photo-title" className="mb-3 text-lg font-extrabold">
                  Ảnh xe
                </h3>
                <label className="flex cursor-pointer flex-col items-center gap-2 rounded-[20px] border-2 border-dashed border-primary-fixed-dim bg-primary-fixed/30 p-6 text-center focus-within:ring-4 focus-within:ring-primary/30 hover:bg-primary-fixed/50">
                  {imagePreview ? (
                    <img src={imagePreview} alt="Ảnh xe xem trước" className="h-32 w-full rounded-2xl object-cover" />
                  ) : (
                    <span
                      aria-hidden="true"
                      className="flex h-[52px] w-[52px] items-center justify-center rounded-[18px] bg-surface-container-lowest text-on-primary-fixed-variant"
                    >
                      <span className="material-symbols-outlined">photo_camera</span>
                    </span>
                  )}
                  <b className="text-sm">{imageFile ? "Đổi ảnh khác" : "Bấm để chọn ảnh xe"}</b>
                  <span className="text-xs text-on-surface-variant">JPG, PNG hoặc WebP · không bắt buộc</span>
                  <input className="sr-only" type="file" accept="image/*" onChange={handleImageChange} />
                </label>
              </section>

              <section aria-label="Xem trước" className={`${cardClass} space-y-3 p-[22px]`}>
                <b className="text-[15px]">Xem trước thẻ xe</b>
                <div className="flex items-center gap-3 rounded-[20px] border-[1.5px] border-outline-variant/50 p-3.5">
                  <span
                    aria-hidden="true"
                    className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary-fixed text-on-primary-fixed-variant"
                  >
                    <span className="material-symbols-outlined text-[30px]">{getModelIcon(selectedModel)}</span>
                  </span>
                  <div className="min-w-0">
                    <b className="block truncate">{`${brand} ${selectedModel}`.trim()}</b>
                    <span className="block truncate text-[13px] text-on-surface-variant">
                      {[licensePlate.trim() || "Chưa có biển số", year, color === OTHER_COLOR ? customColor.trim() : color]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                  </div>
                </div>

                {error && (
                  <p className="rounded-2xl bg-error-container px-4 py-3 text-sm text-on-error-container" role="alert">
                    {error}
                  </p>
                )}

                <button
                  className="flex min-h-[50px] w-full items-center justify-center gap-1.5 rounded-2xl bg-gradient-to-br from-primary to-primary-container text-sm font-bold text-on-primary shadow-[0_12px_22px_-14px_rgba(0,89,187,0.9)] transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-70"
                  type="submit"
                  disabled={isSubmitting}
                >
                  <span aria-hidden="true" className="material-symbols-outlined text-xl">
                    check
                  </span>
                  {isSubmitting ? "Đang lưu..." : "Lưu xe"}
                </button>
                <button
                  className="min-h-12 w-full rounded-2xl border-[1.5px] border-outline-variant text-sm font-bold text-on-surface-variant transition-colors hover:bg-surface-container-low active:scale-95"
                  type="button"
                  onClick={onBackClick}
                >
                  Hủy
                </button>
              </section>
            </aside>
          </form>
        </div>
      </main>
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
}) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block px-0.5 text-xs font-bold text-on-surface-variant">
        {label}
      </label>
      <div className="relative">
        <select
          id={id}
          className={`${inputBase} appearance-none pr-10`}
          value={value}
          onChange={(event) => onChange(event.target.value)}
        >
          {children}
        </select>
        <span
          aria-hidden="true"
          className="material-symbols-outlined pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-outline"
        >
          expand_more
        </span>
      </div>
    </div>
  );
}

function TextField({
  label,
  placeholder,
  value,
  onChange,
  onBlur,
  type = "text",
  required = false,
  error,
  valid = false,
  hint,
  suffix,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  type?: string;
  required?: boolean;
  error?: string;
  valid?: boolean;
  hint?: string;
  suffix?: string;
}) {
  const id = useId();
  const errorId = useId();
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block px-0.5 text-xs font-bold text-on-surface-variant">
        {label}
      </label>
      <div
        className={`flex min-h-12 items-center gap-2 rounded-2xl border bg-surface-container-lowest px-4 transition-all focus-within:ring-2 focus-within:ring-primary/30 ${
          error ? "border-error" : "border-outline-variant focus-within:border-primary"
        }`}
      >
        <input
          id={id}
          className="min-w-0 flex-1 bg-transparent py-3 text-sm outline-none"
          placeholder={placeholder}
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onBlur={onBlur}
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
        />
        {suffix && <span className="text-[13px] text-on-surface-variant">{suffix}</span>}
        {valid && !error && (
          <span aria-hidden="true" className="material-symbols-outlined text-xl text-[#008730]">
            check_circle
          </span>
        )}
      </div>
      {error ? (
        <p id={errorId} role="alert" className="mt-1 px-0.5 text-xs font-semibold text-error">
          {error}
        </p>
      ) : (
        hint && <p className="mt-1 px-0.5 text-xs text-on-surface-variant">{hint}</p>
      )}
    </div>
  );
}

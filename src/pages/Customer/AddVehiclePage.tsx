import { useState } from "react";
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
        <nav className="mb-6 hidden items-center gap-2 font-label-md text-label-md text-secondary md:flex">
          <button className="transition-colors hover:text-primary" onClick={onBackClick}>
            Cá nhân
          </button>
          <span className="material-symbols-outlined text-[16px]">chevron_right</span>
          <span className="font-semibold text-on-surface">Thêm phương tiện mới</span>
        </nav>

        <div className="mx-auto max-w-5xl">
          <section className="overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest shadow-sm">
            <div className="border-b border-outline-variant bg-gradient-to-r from-surface-container-low to-transparent p-lg md:p-8">
              <h2 className="mb-2 font-headline-lg text-headline-lg font-bold text-on-background md:text-[24px] md:leading-8">
                Thêm phương tiện mới
              </h2>
              <p className="font-body-md text-body-md text-secondary">
                Cập nhật thông tin phương tiện mới của bạn vào hệ thống Servio để
                bắt đầu theo dõi bảo trì.
              </p>
            </div>

            <div className="p-lg md:p-8">
              <form className="space-y-10" onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="px-1 font-label-md text-label-md text-on-surface-variant">
                      Tên thương hiệu
                    </label>
                    <div className="relative">
                      <select
                        className="w-full appearance-none rounded-lg border border-outline-variant bg-white p-3 font-body-md text-body-md outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                        value={brand}
                        onChange={(event) => handleBrandChange(event.target.value)}
                      >
                        {carBrands.map((brandName) => (
                          <option key={brandName} value={brandName}>
                            {brandName}
                          </option>
                        ))}
                      </select>
                      <span className="material-symbols-outlined pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-secondary">
                        expand_more
                      </span>
                    </div>
                  </div>
                  <TextField
                    label="Số khung (VIN)"
                    placeholder="17 ký tự, VD: RLZAB1234C5678901"
                    value={vin}
                    onChange={(value) => setVin(value.toUpperCase())}
                    required
                  />
                  <TextField
                    label="Biển số xe"
                    placeholder="VD: 30A-123.45"
                    value={licensePlate}
                    onChange={(value) => setLicensePlate(value.toUpperCase())}
                    required
                  />
                  <div className="space-y-2">
                    <label className="px-1 font-label-md text-label-md text-on-surface-variant">
                      Năm sản xuất
                    </label>
                    <div className="relative">
                      <select
                        className="w-full appearance-none rounded-lg border border-outline-variant bg-white p-3 font-body-md text-body-md outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                        value={year}
                        onChange={(event) => setYear(event.target.value)}
                      >
                        {vehicleYears.map((vehicleYear) => (
                          <option key={vehicleYear} value={vehicleYear}>
                            {vehicleYear}
                          </option>
                        ))}
                      </select>
                      <span className="material-symbols-outlined pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-secondary">
                        expand_more
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="px-1 font-label-md text-label-md text-on-surface-variant">
                      Màu sắc
                    </label>
                    <div className="relative">
                      <select
                        className="w-full appearance-none rounded-lg border border-outline-variant bg-white p-3 font-body-md text-body-md outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                        value={color}
                        onChange={(event) => setColor(event.target.value)}
                      >
                        <option value="">Chọn màu sắc</option>
                        {carColors.map((colorName) => (
                          <option key={colorName} value={colorName}>
                            {colorName}
                          </option>
                        ))}
                        <option value={OTHER_COLOR}>Khác (tự nhập)</option>
                      </select>
                      <span className="material-symbols-outlined pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-secondary">
                        expand_more
                      </span>
                    </div>
                    {color === OTHER_COLOR && (
                      <input
                        className="w-full rounded-lg border border-outline-variant bg-white p-3 font-body-md text-body-md outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
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
                  />
                </div>

                <section className="space-y-4">
                  <h3 className="font-headline-md text-headline-md text-on-background">
                    Ảnh xe (không bắt buộc)
                  </h3>
                  <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
                    <div className="flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-dashed border-outline-variant bg-surface-container-low">
                      {imagePreview ? (
                        <img
                          src={imagePreview}
                          alt="Ảnh xe xem trước"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="material-symbols-outlined text-4xl text-secondary opacity-40">
                          directions_car
                        </span>
                      )}
                    </div>
                    <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-outline-variant bg-white px-4 py-2.5 font-label-md text-label-md text-on-surface transition-colors hover:bg-surface-container-low">
                      <span className="material-symbols-outlined text-[20px]">
                        upload
                      </span>
                      {imageFile ? "Đổi ảnh khác" : "Chọn ảnh xe"}
                      <input
                        className="sr-only"
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                      />
                    </label>
                  </div>
                </section>

                <section className="space-y-4">
                  <div className="flex items-end justify-between gap-md">
                    <h3 className="font-headline-md text-headline-md text-on-background">
                      Chọn mẫu xe
                    </h3>
                    <span className="font-label-sm text-label-sm text-secondary">
                      {brand} Series
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
                    {(carModelsByBrand[brand] ?? []).map((model) => (
                      <label key={model} className="group relative cursor-pointer">
                        <input
                          className="peer sr-only"
                          name="model"
                          type="radio"
                          value={model}
                          checked={selectedModel === model}
                          onChange={() => setSelectedModel(model)}
                        />
                        <div className="flex h-full flex-col items-center gap-3 rounded-xl border border-outline-variant bg-white p-4 transition-all hover:border-primary hover:bg-surface-container-low peer-checked:border-primary peer-checked:bg-surface-container-low peer-checked:shadow-[0_0_0_1px_var(--color-primary)]">
                          <div className="flex aspect-video w-full items-center justify-center overflow-hidden rounded-lg bg-surface-container p-2">
                            <span
                              className={`material-symbols-outlined text-4xl text-primary transition-opacity group-hover:opacity-100 ${
                                selectedModel === model ? "opacity-100" : "opacity-40"
                              }`}
                            >
                              {getModelIcon(model)}
                            </span>
                          </div>
                          <span
                            className={`font-label-md text-label-md ${
                              selectedModel === model ? "font-bold text-primary" : "text-on-surface"
                            }`}
                          >
                            {model}
                          </span>
                        </div>
                      </label>
                    ))}
                  </div>
                </section>

                {error && (
                  <p className="rounded-lg bg-error-container px-4 py-3 text-sm text-on-error-container" role="alert">
                    {error}
                  </p>
                )}

                <div className="flex flex-col items-center justify-end gap-4 border-t border-outline-variant pt-8 sm:flex-row">
                  <button
                    className="w-full rounded-lg border border-outline px-10 py-3 font-headline-md text-headline-md text-on-surface-variant transition-colors hover:bg-surface-container-low active:scale-95 sm:w-auto"
                    type="button"
                    onClick={onBackClick}
                  >
                    Hủy bỏ
                  </button>
                  <button
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-10 py-3 font-headline-md text-headline-md text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary-container active:scale-95 sm:w-auto disabled:cursor-not-allowed disabled:opacity-70"
                    type="submit"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Đang lưu..." : "Xác nhận thêm xe"}
                    <span className="material-symbols-outlined text-[20px]">
                      add_circle
                    </span>
                  </button>
                </div>
              </form>
            </div>
          </section>

          <section className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
            <HintCard
              icon="security"
              title="Dữ liệu an toàn"
              body="Thông tin số khung (VIN) của bạn được mã hóa và bảo mật tuyệt đối theo tiêu chuẩn quốc tế."
            />
            <HintCard
              icon="history"
              title="Tự động đồng bộ"
              body="Lịch sử bảo hành từ VinFast sẽ tự động được cập nhật sau khi bạn xác nhận phương tiện."
              tone="tertiary"
            />
            <HintCard
              icon="build"
              title="Hỗ trợ 24/7"
              body="Gặp khó khăn khi tìm số khung? Gọi ngay cho chúng tôi qua hotline 1900 6789."
              tone="secondary"
            />
          </section>
        </div>
      </main>
    </div>
  );
}

function TextField({
  label,
  placeholder,
  value,
  onChange,
  type = "text",
  required = false,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <div className="space-y-2">
      <label className="px-1 font-label-md text-label-md text-on-surface-variant">
        {label}
      </label>
      <input
        className="w-full rounded-lg border border-outline-variant bg-white p-3 font-body-md text-body-md outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
        placeholder={placeholder}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={required}
      />
    </div>
  );
}

function HintCard({
  icon,
  title,
  body,
  tone = "primary",
}: {
  icon: string;
  title: string;
  body: string;
  tone?: "primary" | "tertiary" | "secondary";
}) {
  const toneClass =
    tone === "tertiary"
      ? "bg-tertiary-container/10 text-on-tertiary-container"
      : tone === "secondary"
        ? "bg-secondary-container/50 text-on-secondary-container"
        : "bg-primary-container/10 text-primary";

  return (
    <article className="flex items-start gap-4 rounded-xl border border-outline-variant bg-surface-container-low p-4">
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${toneClass}`}>
        <span className="material-symbols-outlined">{icon}</span>
      </div>
      <div>
        <h4 className="mb-1 font-headline-md text-headline-md text-on-surface">
          {title}
        </h4>
        <p className="font-body-md text-body-md leading-relaxed text-secondary">
          {body}
        </p>
      </div>
    </article>
  );
}

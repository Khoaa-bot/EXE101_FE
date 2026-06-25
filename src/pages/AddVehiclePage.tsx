type AddVehiclePageProps = {
  onBackClick: () => void;
};

const vehicleHeroImage =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuB4P1m8a91Eg3K_0p8aX6Qy0grq_PJnF_4EB_GpJeaVzWVbwOIIniyXMEUhoCDKc0Oasd2aG8mZkLFpIpkRQle5BNnfjacV-XJP8gw0LXpGQ2shDYG7QRB7353yCA-R1cAL0jTtOHO2oDtBK2gwYj6L3x0ls4zIHU9xBEnkI-WSp6tRdY95U2wCXC_9V5F1uB0LbW1jcB5b7p1Mf9rIwzicOCCMHSFPciyvdszGLPF71UO1jsbjQAx_ITKbEd1gjUIilkzhBlcjdj_6";

const colors = [
  { name: "white", className: "bg-white" },
  { name: "black", className: "bg-slate-900" },
  { name: "blue", className: "bg-primary" },
  { name: "red", className: "bg-error" },
  { name: "silver", className: "bg-slate-300" },
];

export default function AddVehiclePage({ onBackClick }: AddVehiclePageProps) {
  return (
    <div className="flex min-h-dvh flex-col bg-background text-on-background font-sans">
      <header className="fixed top-0 z-50 flex h-16 w-full items-center border-b border-outline-variant bg-surface px-margin-mobile">
        <button
          className="flex h-10 w-10 items-center justify-center rounded-full transition-transform active:scale-95"
          type="button"
          aria-label="Quay lại"
          onClick={onBackClick}
        >
          <span className="material-symbols-outlined text-primary">arrow_back</span>
        </button>
        <h1 className="ml-2 font-headline-lg-mobile text-headline-lg-mobile font-bold text-primary">
          Thêm phương tiện
        </h1>
      </header>

      <main className="mx-auto flex w-full max-w-[448px] flex-1 flex-col items-center px-margin-mobile pb-24 pt-20">
        <section className="relative mb-lg mt-4 h-48 w-full overflow-hidden rounded-3xl bg-surface-container">
          <div className="absolute inset-0 flex items-center justify-center">
            <img
              className="h-auto w-4/5 object-contain drop-shadow-2xl transition-transform duration-700 hover:scale-105"
              src={vehicleHeroImage}
              alt="Xe điện trong showroom"
            />
          </div>
        </section>

        <section className="w-full rounded-[2rem] border border-surface-container-highest bg-white p-lg shadow-[0_4px_12px_rgba(0,50,125,0.04)]">
          <div className="mb-lg">
            <h2 className="font-headline-lg text-headline-lg text-on-surface">
              Thông tin phương tiện
            </h2>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Vui lòng điền chính xác thông tin để chúng tôi hỗ trợ tốt nhất.
            </p>
          </div>

          <form className="space-y-lg">
            <label className="block space-y-sm">
              <span className="flex items-center gap-2 font-label-md text-label-md text-on-surface-variant">
                <span className="material-symbols-outlined text-[18px]">
                  branding_watermark
                </span>
                Tên thương hiệu
              </span>
              <div className="relative">
                <select
                  className="h-14 w-full cursor-pointer appearance-none rounded-xl border border-outline-variant bg-surface-container-lowest pl-4 pr-10 font-body-md text-body-md transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  defaultValue=""
                >
                  <option disabled value="">
                    Chọn thương hiệu xe của bạn
                  </option>
                  <option value="vf8">VinFast VF8</option>
                  <option value="vfe34">VinFast VF e34</option>
                  <option value="vf9">VinFast VF9</option>
                  <option value="vf5">VinFast VF5 Plus</option>
                  <option value="other">Hãng khác</option>
                </select>
                <span className="material-symbols-outlined pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-outline">
                  expand_more
                </span>
              </div>
            </label>

            <TextField
              icon="pin"
              label="Biển số xe"
              placeholder="Ví dụ: 30A-123.45"
            />

            <div className="space-y-3">
              <span className="flex items-center gap-2 font-label-md text-label-md text-on-surface-variant">
                <span className="material-symbols-outlined text-[18px]">palette</span>
                Màu sắc
              </span>
              <div className="flex flex-wrap gap-3">
                {colors.map((color) => (
                  <label key={color.name} className="relative cursor-pointer">
                    <input
                      className="peer sr-only"
                      name="color"
                      type="radio"
                      value={color.name}
                    />
                    <div
                      className={`h-10 w-10 rounded-full border border-outline-variant transition-all peer-checked:border-primary peer-checked:ring-4 peer-checked:ring-primary/20 ${color.className}`}
                    />
                  </label>
                ))}
              </div>
            </div>

            <TextField
              icon="fingerprint"
              label="Số khung (VIN)"
              placeholder="Nhập 17 ký tự số khung"
            />

            <div className="flex items-start gap-md rounded-2xl bg-surface-container-low p-md">
              <span className="material-symbols-outlined text-primary-container">
                info
              </span>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                Thông tin này sẽ được dùng để đăng ký các dịch vụ cứu hộ, sạc pin
                và bảo dưỡng lưu động.
              </p>
            </div>

            <button
              className="mt-4 h-14 w-full rounded-full bg-primary font-headline-md text-headline-md text-white shadow-lg shadow-primary/20 transition-all active:scale-95"
              type="button"
            >
              Thêm phương tiện
            </button>
          </form>
        </section>

        <p className="mt-lg w-full max-w-[320px] text-center font-body-sm text-body-sm text-on-surface-variant">
          Bằng việc thêm phương tiện, bạn đồng ý với{" "}
          <a className="font-bold text-primary underline" href="#">
            Điều khoản sử dụng
          </a>{" "}
          của Servio.
        </p>
      </main>
    </div>
  );
}

function TextField({
  icon,
  label,
  placeholder,
}: {
  icon: string;
  label: string;
  placeholder: string;
}) {
  return (
    <label className="block space-y-sm">
      <span className="flex items-center gap-2 font-label-md text-label-md text-on-surface-variant">
        <span className="material-symbols-outlined text-[18px]">{icon}</span>
        {label}
      </span>
      <input
        className="h-14 w-full rounded-xl border border-outline-variant bg-surface-container-lowest px-4 font-body-md text-body-md transition-all placeholder:text-outline focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        placeholder={placeholder}
        type="text"
      />
    </label>
  );
}

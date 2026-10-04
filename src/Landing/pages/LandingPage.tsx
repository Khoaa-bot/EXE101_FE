import { useEffect, useState } from "react";

type LandingPageProps = {
  onLoginClick: () => void;
  onRegisterClick: () => void;
};

// Thông tin liên hệ hiển thị ở thanh trên cùng và chân trang — thay bằng thông tin thật.
const CONTACT = {
  email: "contact@servio.vn",
  address: "Địa chỉ văn phòng Servio",
  phone: "Hotline hỗ trợ",
};

const NAV_ITEMS = [
  { label: "Trang chủ", href: "#trang-chu" },
  { label: "Giới thiệu", href: "#gioi-thieu" },
  { label: "Dịch vụ", href: "#dich-vu" },
  { label: "Quy trình", href: "#quy-trinh" },
  { label: "Liên hệ", href: "#lien-he" },
];

const SLIDES = [
  {
    title: "Chăm sóc xe chuyên nghiệp,",
    highlight: "đặt lịch chỉ trong vài phút",
    text: "Chọn garage gần bạn, chọn khung giờ phù hợp và nhận xác nhận ngay trên điện thoại.",
    image: "/landing/hero-1.png",
    car: "#d62828",
    glow: "rgba(214, 40, 40, 0.35)",
  },
  {
    title: "Theo dõi tiến độ sửa xe",
    highlight: "rõ ràng từng bước",
    text: "Từ lúc nhận xe, kiểm tra, báo giá đến khi hoàn tất đều cập nhật trực tiếp cho bạn.",
    image: "/landing/hero-2.png",
    car: "#0a6fe0",
    glow: "rgba(10, 111, 224, 0.4)",
  },
  {
    title: "Báo giá minh bạch,",
    highlight: "thanh toán an tâm",
    text: "Mọi hạng mục và chi phí được liệt kê trước khi bạn đồng ý, không phát sinh bất ngờ.",
    image: "/landing/hero-3.png",
    car: "#e8eaed",
    glow: "rgba(200, 210, 230, 0.35)",
  },
];

const FEATURES = [
  {
    icon: "event_available",
    title: "Đặt lịch trực tuyến",
    text: "Chọn dịch vụ, garage và khung giờ chỉ với vài thao tác, không cần gọi điện chờ đợi.",
  },
  {
    icon: "location_on",
    title: "Theo dõi tiến độ",
    text: "Biết xe của bạn đang ở bước nào, ai đang xử lý và khi nào có thể nhận xe.",
  },
  {
    icon: "receipt_long",
    title: "Báo giá rõ ràng",
    text: "Xem chi tiết từng hạng mục, duyệt báo giá và thanh toán ngay trên ứng dụng.",
  },
];

const SERVICES = [
  { icon: "oil_barrel", name: "Thay nhớt" },
  { icon: "car_repair", name: "Kiểm tra phanh" },
  { icon: "build", name: "Bảo dưỡng định kỳ" },
  { icon: "electrical_services", name: "Sửa hệ thống điện" },
  { icon: "tire_repair", name: "Thay lốp" },
  { icon: "ac_unit", name: "Điều hòa" },
];

const STEPS = [
  { title: "Chọn garage", text: "Tìm garage gần bạn và xem dịch vụ, giá tham khảo." },
  { title: "Đặt lịch hẹn", text: "Chọn xe, dịch vụ và khung giờ còn trống." },
  { title: "Theo dõi sửa chữa", text: "Nhận thông báo mỗi khi trạng thái xe thay đổi." },
  { title: "Thanh toán, nhận xe", text: "Duyệt báo giá, thanh toán và nhận xe đã hoàn tất." },
];

function CarScene({ color, glow }: { color: string; glow: string }) {
  return (
    <div className="absolute inset-0 overflow-hidden bg-gradient-to-b from-[#2a3038] via-[#161a20] to-[#0b0d11]">
      {/* ceiling lights */}
      <div className="absolute left-[6%] top-[14%] h-1.5 w-28 rotate-90 rounded-full bg-white shadow-[0_0_30px_8px_rgba(255,255,255,0.55)]" />
      <div className="absolute right-[8%] top-[10%] h-1.5 w-56 -rotate-6 rounded-full bg-white shadow-[0_0_36px_10px_rgba(255,255,255,0.5)]" />
      <div className="absolute left-[38%] top-[26%] h-1 w-20 rounded-full bg-white/80 shadow-[0_0_20px_5px_rgba(255,255,255,0.4)]" />
      {/* pillars */}
      <div className="absolute right-[6%] top-[18%] h-[55%] w-16 bg-gradient-to-r from-[#232830] to-[#14181d]" />
      <div className="absolute left-[18%] top-[30%] h-[40%] w-10 bg-gradient-to-r from-[#1f242b] to-[#12151a]" />
      {/* floor */}
      <div className="absolute inset-x-0 bottom-0 h-[42%] bg-gradient-to-b from-[#1b2027] to-[#0a0c0f]" />
      <div
        className="absolute bottom-[8%] left-1/2 h-40 w-[70%] -translate-x-1/2 rounded-full blur-3xl"
        style={{ background: glow }}
      />
      {/* car */}
      <svg
        aria-hidden="true"
        viewBox="0 0 600 220"
        className="absolute bottom-[10%] left-1/2 w-[min(720px,82%)] -translate-x-1/2 lg:left-auto lg:right-[3%] lg:w-[min(640px,52%)] lg:translate-x-0 drop-shadow-[0_30px_30px_rgba(0,0,0,0.6)]"
      >
        <ellipse cx="300" cy="200" rx="270" ry="14" fill="rgba(0,0,0,0.55)" />
        <path
          d="M40 150 C40 130 70 125 110 118 L170 80 C190 66 220 60 260 60 L350 60 C390 60 420 72 445 100 L500 112 C545 118 565 132 565 152 L565 168 L40 168 Z"
          fill={color}
        />
        <path
          d="M185 98 L215 74 C230 68 245 67 262 67 L340 67 C362 67 380 76 395 100 Z"
          fill="#0d1218"
        />
        <path d="M60 140 L545 140" stroke="rgba(0,0,0,0.25)" strokeWidth="3" />
        <rect x="528" y="124" width="26" height="9" rx="4" fill="#fff6c9" />
        <rect x="46" y="128" width="22" height="9" rx="4" fill="#ff5a5a" />
        <circle cx="150" cy="170" r="34" fill="#0b0d10" />
        <circle cx="150" cy="170" r="19" fill="#cfd5de" />
        <circle cx="150" cy="170" r="6" fill="#0b0d10" />
        <circle cx="455" cy="170" r="34" fill="#0b0d10" />
        <circle cx="455" cy="170" r="19" fill="#cfd5de" />
        <circle cx="455" cy="170" r="6" fill="#0b0d10" />
      </svg>
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/40" />
    </div>
  );
}

export default function LandingPage({
  onLoginClick,
  onRegisterClick,
}: LandingPageProps) {
  const [index, setIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(
    () => !window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    if (!isPlaying) return;
    const timer = window.setInterval(
      () => setIndex((current) => (current + 1) % SLIDES.length),
      6000,
    );
    return () => window.clearInterval(timer);
  }, [isPlaying]);

  const goTo = (next: number) =>
    setIndex((next + SLIDES.length) % SLIDES.length);
  const slide = SLIDES[index];

  return (
    <div className="min-h-dvh bg-surface font-sans text-on-surface">
      <section
        id="trang-chu"
        aria-roledescription="carousel"
        aria-label="Giới thiệu Servio"
        className="relative h-[100svh] min-h-[560px] overflow-hidden text-white"
      >
        {SLIDES.map((item, i) => (
          <div
            key={item.highlight}
            aria-hidden={i !== index}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              i === index ? "opacity-100" : "opacity-0"
            }`}
          >
            <CarScene color={item.car} glow={item.glow} />
            {/* Ảnh thật đặt trong public/landing/; thiếu file thì giữ hình vẽ phía dưới. */}
            <img
              src={item.image}
              alt=""
              className="absolute inset-0 h-full w-full object-cover object-[center_62%]"
              onError={(event) => {
                event.currentTarget.style.display = "none";
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/30 to-black/10" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/40" />
          </div>
        ))}

        <div className="absolute inset-x-0 top-0 z-20">
          <div className="mx-auto hidden max-w-6xl items-center justify-between px-lg py-2 text-xs text-white/85 md:flex">
            <div className="flex items-center gap-lg">
              <span className="flex items-center gap-1.5">
                <span aria-hidden="true" className="material-symbols-outlined text-[16px]">
                  mail
                </span>
                {CONTACT.email}
              </span>
              <span className="flex items-center gap-1.5">
                <span aria-hidden="true" className="material-symbols-outlined text-[16px]">
                  location_on
                </span>
                {CONTACT.address}
              </span>
            </div>
            <span className="flex items-center gap-1.5">
              <span aria-hidden="true" className="material-symbols-outlined text-[16px]">
                call
              </span>
              {CONTACT.phone}
            </span>
          </div>

          <header className="mx-auto flex max-w-6xl items-center justify-between px-md py-3 md:px-lg">
            <a href="#trang-chu" className="flex items-center gap-sm">
              <span aria-hidden="true" className="material-symbols-outlined text-[32px]">
                electric_car
              </span>
              <span className="text-headline-lg font-extrabold tracking-tight">
                Servio
              </span>
            </a>

            <nav aria-label="Điều hướng chính" className="hidden items-center gap-lg lg:flex">
              {NAV_ITEMS.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="rounded-md px-2 py-2 text-sm font-semibold uppercase tracking-wide text-white/90 transition-colors hover:text-white"
                >
                  {item.label}
                </a>
              ))}
            </nav>

            <div className="flex items-center gap-sm">
              <button
                type="button"
                onClick={onLoginClick}
                className="hidden min-h-11 rounded-full border border-white/70 px-5 text-sm font-bold text-white transition-colors hover:bg-white/15 sm:block"
              >
                Đăng nhập
              </button>
              <button
                type="button"
                onClick={onRegisterClick}
                className="hidden min-h-11 rounded-full bg-primary px-5 text-sm font-bold text-on-primary sm:block"
              >
                Đăng ký
              </button>
              <button
                type="button"
                aria-label="Mở menu"
                aria-expanded={isMenuOpen}
                onClick={() => setIsMenuOpen((open) => !open)}
                className="flex h-11 w-11 items-center justify-center rounded-full bg-white/15 backdrop-blur lg:hidden"
              >
                <span aria-hidden="true" className="material-symbols-outlined">
                  {isMenuOpen ? "close" : "menu"}
                </span>
              </button>
            </div>
          </header>

          {isMenuOpen && (
            <nav
              aria-label="Menu di động"
              className="mx-md mt-1 flex flex-col gap-1 rounded-2xl bg-[#11151b]/95 p-md shadow-2xl backdrop-blur lg:hidden"
            >
              {NAV_ITEMS.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMenuOpen(false)}
                  className="rounded-xl px-md py-3 text-sm font-semibold uppercase tracking-wide text-white/90 hover:bg-white/10"
                >
                  {item.label}
                </a>
              ))}
              <div className="mt-2 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={onLoginClick}
                  className="min-h-11 rounded-full border border-white/70 text-sm font-bold"
                >
                  Đăng nhập
                </button>
                <button
                  type="button"
                  onClick={onRegisterClick}
                  className="min-h-11 rounded-full bg-primary text-sm font-bold text-on-primary"
                >
                  Đăng ký
                </button>
              </div>
            </nav>
          )}
        </div>

        <div className="relative z-10 mx-auto flex h-full max-w-6xl flex-col justify-center px-lg pb-24 pt-28">
          <div key={index} className="max-w-[36rem] animate-[page-in_0.6s_ease-out_both]">
            <p className="mb-3 inline-block rounded-full bg-white/15 px-3 py-1 text-xs font-bold uppercase tracking-widest backdrop-blur">
              Nền tảng chăm sóc xe
            </p>
            <h1 className="text-[34px] font-extrabold leading-tight tracking-tight drop-shadow md:text-[48px]">
              {slide.title}
              <span className="block text-[#9fc3ff]">{slide.highlight}</span>
            </h1>
            <p className="mt-4 max-w-[28rem] text-base leading-relaxed text-white/90">
              {slide.text}
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={onRegisterClick}
                className="min-h-12 rounded-full bg-primary px-7 text-sm font-bold text-on-primary"
              >
                Bắt đầu ngay
              </button>
              <a
                href="#gioi-thieu"
                className="flex min-h-12 items-center rounded-full border border-white/70 px-7 text-sm font-bold text-white transition-colors hover:bg-white/15"
              >
                Tìm hiểu thêm
              </a>
            </div>
          </div>
        </div>

        <button
          type="button"
          aria-label="Slide trước"
          onClick={() => goTo(index - 1)}
          className="absolute left-3 top-1/2 z-20 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-black/35 backdrop-blur hover:bg-black/55"
        >
          <span aria-hidden="true" className="material-symbols-outlined">
            chevron_left
          </span>
        </button>
        <button
          type="button"
          aria-label="Slide sau"
          onClick={() => goTo(index + 1)}
          className="absolute right-3 top-1/2 z-20 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-black/35 backdrop-blur hover:bg-black/55"
        >
          <span aria-hidden="true" className="material-symbols-outlined">
            chevron_right
          </span>
        </button>

        <div className="absolute inset-x-0 bottom-6 z-20 flex items-center justify-center gap-3">
          <button
            type="button"
            aria-label={isPlaying ? "Tạm dừng tự chuyển slide" : "Tiếp tục tự chuyển slide"}
            onClick={() => setIsPlaying((playing) => !playing)}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-black/35 backdrop-blur hover:bg-black/55"
          >
            <span aria-hidden="true" className="material-symbols-outlined">
              {isPlaying ? "pause" : "play_arrow"}
            </span>
          </button>
          <div className="flex items-center">
            {SLIDES.map((item, i) => (
              <button
                key={item.highlight}
                type="button"
                aria-label={`Chuyển tới slide ${i + 1}`}
                aria-current={i === index}
                onClick={() => goTo(i)}
                className="flex h-11 w-8 items-center justify-center"
              >
                <span
                  className={`h-2.5 rounded-full transition-all ${
                    i === index ? "w-8 bg-white" : "w-2.5 bg-white/50"
                  }`}
                />
              </button>
            ))}
          </div>
        </div>
      </section>

      <section id="gioi-thieu" className="mx-auto max-w-6xl scroll-mt-4 px-lg py-20">
        <div className="mx-auto max-w-[42rem] text-center">
          <p className="text-sm font-bold uppercase tracking-widest text-primary">Giới thiệu</p>
          <h2 className="mt-2 text-[30px] font-extrabold tracking-tight md:text-[36px]">
            Kết nối chủ xe với garage đáng tin cậy
          </h2>
          <p className="mt-3 text-body-lg text-on-surface-variant">
            Servio giúp bạn đặt lịch, theo dõi và thanh toán dịch vụ chăm sóc xe trên một ứng
            dụng duy nhất, còn garage quản lý lịch hẹn và công việc dễ dàng hơn.
          </p>
        </div>
        <div className="mt-12 grid gap-lg md:grid-cols-3">
          {FEATURES.map((feature) => (
            <div
              key={feature.title}
              className="rounded-3xl border border-outline-variant/50 bg-surface-container-lowest p-lg"
            >
              <span
                aria-hidden="true"
                className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-fixed to-secondary-fixed-dim text-on-primary-fixed-variant"
              >
                <span className="material-symbols-outlined text-[28px]">{feature.icon}</span>
              </span>
              <h3 className="mt-5 text-headline-md font-bold">{feature.title}</h3>
              <p className="mt-2 text-body-md text-on-surface-variant">{feature.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="dich-vu" className="scroll-mt-4 bg-primary-fixed/50 py-20">
        <div className="mx-auto max-w-6xl px-lg">
          <div className="mx-auto max-w-[42rem] text-center">
            <p className="text-sm font-bold uppercase tracking-widest text-primary">Dịch vụ</p>
            <h2 className="mt-2 text-[30px] font-extrabold tracking-tight md:text-[36px]">
              Mọi dịch vụ xe bạn cần
            </h2>
          </div>
          <ul className="mt-10 grid grid-cols-2 gap-md md:grid-cols-3 lg:grid-cols-6">
            {SERVICES.map((service) => (
              <li
                key={service.name}
                className="flex flex-col items-center gap-3 rounded-3xl bg-surface-container-lowest p-lg text-center"
              >
                <span
                  aria-hidden="true"
                  className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-on-primary"
                >
                  <span className="material-symbols-outlined text-[28px]">{service.icon}</span>
                </span>
                <span className="text-sm font-bold">{service.name}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section id="quy-trinh" className="mx-auto max-w-6xl scroll-mt-4 px-lg py-20">
        <div className="mx-auto max-w-[42rem] text-center">
          <p className="text-sm font-bold uppercase tracking-widest text-primary">Quy trình</p>
          <h2 className="mt-2 text-[30px] font-extrabold tracking-tight md:text-[36px]">
            Bốn bước đơn giản
          </h2>
        </div>
        <ol className="mt-12 grid gap-lg md:grid-cols-4">
          {STEPS.map((step, i) => (
            <li key={step.title} className="relative rounded-3xl bg-surface-container-lowest p-lg shadow-sm">
              <span
                aria-hidden="true"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-base font-extrabold text-on-primary"
              >
                {i + 1}
              </span>
              <h3 className="mt-4 text-body-lg font-bold">{step.title}</h3>
              <p className="mt-1 text-body-md text-on-surface-variant">{step.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section
        id="lien-he"
        className="scroll-mt-4 bg-gradient-to-br from-[#0b0d11] via-[#161a20] to-[#0a3a7a] py-20 text-white"
      >
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-lg text-center">
          <h2 className="text-[30px] font-extrabold tracking-tight md:text-[36px]">
            Sẵn sàng chăm sóc xe của bạn?
          </h2>
          <p className="max-w-[36rem] text-white/85">
            Tạo tài khoản miễn phí để đặt lịch với garage gần bạn, hoặc đăng nhập nếu bạn đã có
            tài khoản.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={onRegisterClick}
              className="min-h-12 rounded-full bg-white px-8 text-sm font-bold text-primary"
            >
              Đăng ký ngay
            </button>
            <button
              type="button"
              onClick={onLoginClick}
              className="min-h-12 rounded-full border border-white/70 px-8 text-sm font-bold hover:bg-white/15"
            >
              Đăng nhập
            </button>
          </div>
          <p className="mt-6 text-xs text-white/70">
            {CONTACT.email} · © Servio. Tất cả quyền được bảo lưu.
          </p>
        </div>
      </section>
    </div>
  );
}

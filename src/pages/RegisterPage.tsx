import { useState } from "react";

type RegisterPageProps = {
  onBackToLogin: () => void;
};

type SubmitState = "idle" | "loading" | "success";

export default function RegisterPage({ onBackToLogin }: RegisterPageProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [submitState, setSubmitState] = useState<SubmitState>("idle");

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (submitState !== "idle") {
      return;
    }

    setSubmitState("loading");
    window.setTimeout(() => {
      setSubmitState("success");
    }, 1500);
  };

  return (
    <div className="flex min-h-dvh flex-col bg-background text-on-surface font-sans">
      <header className="fixed top-0 z-50 flex h-16 w-full items-center justify-between border-b border-outline-variant bg-surface px-margin-mobile">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-2xl text-primary">
            electric_car
          </span>
          <h1 className="font-headline-lg-mobile text-headline-lg-mobile font-bold text-primary">
            Servio
          </h1>
        </div>

        <button
          className="flex h-10 w-10 items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-surface-container-low"
          type="button"
          aria-label="Trợ giúp"
        >
          <span className="material-symbols-outlined">help_outline</span>
        </button>
      </header>

      <main className="mx-auto w-full max-w-[448px] flex-grow px-margin-mobile pb-12 pt-24">
        <section className="mb-8">
          <h2 className="mb-2 font-display-lg text-display-lg text-on-surface">
            Tạo tài khoản
          </h2>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Tham gia cộng đồng Servio để quản lý bảo dưỡng xe của bạn một cách
            chuyên nghiệp.
          </p>
        </section>

        <section className="rounded-xl border border-[#EFEFEF] bg-surface-container-lowest p-6 shadow-[0_4px_20px_rgba(0,0,0,0.05)]">
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-1.5">
              <label
                className="ml-1 block font-label-md text-label-md text-on-surface-variant"
                htmlFor="full_name"
              >
                Họ và tên
              </label>
              <div className="relative flex items-center rounded-lg border border-outline-variant bg-white px-4 py-3 transition-all duration-200 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
                <span className="material-symbols-outlined mr-3 text-outline">
                  person
                </span>
                <input
                  className="w-full border-none bg-transparent p-0 font-body-md text-body-md placeholder:text-outline/50 focus:outline-none"
                  id="full_name"
                  name="full_name"
                  placeholder="Nguyễn Văn A"
                  type="text"
                  autoComplete="name"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label
                className="ml-1 block font-label-md text-label-md text-on-surface-variant"
                htmlFor="phone"
              >
                Số điện thoại
              </label>
              <div className="relative flex items-center rounded-lg border border-outline-variant bg-white px-4 py-3 transition-all duration-200 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
                <span className="material-symbols-outlined mr-3 text-outline">
                  call
                </span>
                <input
                  className="w-full border-none bg-transparent p-0 font-body-md text-body-md placeholder:text-outline/50 focus:outline-none"
                  id="phone"
                  name="phone"
                  placeholder="0901 234 567"
                  type="tel"
                  autoComplete="tel"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label
                className="ml-1 block font-label-md text-label-md text-on-surface-variant"
                htmlFor="email"
              >
                Email
              </label>
              <div className="relative flex items-center rounded-lg border border-outline-variant bg-white px-4 py-3 transition-all duration-200 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
                <span className="material-symbols-outlined mr-3 text-outline">
                  mail
                </span>
                <input
                  className="w-full border-none bg-transparent p-0 font-body-md text-body-md placeholder:text-outline/50 focus:outline-none"
                  id="email"
                  name="email"
                  placeholder="example@servio.vn"
                  type="email"
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label
                className="ml-1 block font-label-md text-label-md text-on-surface-variant"
                htmlFor="password"
              >
                Mật khẩu
              </label>
              <div className="relative flex items-center rounded-lg border border-outline-variant bg-white px-4 py-3 transition-all duration-200 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
                <span className="material-symbols-outlined mr-3 text-outline">
                  lock
                </span>
                <input
                  className="w-full border-none bg-transparent p-0 font-body-md text-body-md placeholder:text-outline/50 focus:outline-none"
                  id="password"
                  name="password"
                  placeholder="••••••••"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                />
                <button
                  className="ml-2 text-outline-variant transition-colors hover:text-primary"
                  type="button"
                  aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                  onClick={() => setShowPassword((current) => !current)}
                >
                  <span className="material-symbols-outlined">
                    {showPassword ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>
            </div>

            <div className="flex items-start gap-3 py-2">
              <div className="flex h-5 items-center">
                <input
                  className="h-5 w-5 rounded border-outline-variant text-primary accent-primary focus:ring-primary"
                  id="terms"
                  name="terms"
                  type="checkbox"
                />
              </div>
              <label
                className="font-label-md text-label-md text-on-surface-variant"
                htmlFor="terms"
              >
                Tôi đồng ý với{" "}
                <a className="font-bold text-primary" href="#">
                  Điều khoản &amp; Điều kiện
                </a>{" "}
                của Servio và chính sách bảo mật dữ liệu.
              </label>
            </div>

            <button
              className={`flex w-full items-center justify-center gap-2 rounded-lg py-4 font-headline-md text-headline-md text-on-primary shadow-sm transition-transform duration-150 active:scale-[0.98] ${
                submitState === "success" ? "bg-tertiary" : "bg-primary"
              }`}
              type="submit"
              disabled={submitState !== "idle"}
            >
              {submitState === "loading" && (
                <>
                  <span className="material-symbols-outlined animate-spin">
                    sync
                  </span>
                  <span>Đang xử lý...</span>
                </>
              )}
              {submitState === "success" && (
                <>
                  <span className="material-symbols-outlined">
                    check_circle
                  </span>
                  <span>Thành công!</span>
                </>
              )}
              {submitState === "idle" && (
                <>
                  <span>Đăng ký</span>
                  <span className="material-symbols-outlined">
                    arrow_forward
                  </span>
                </>
              )}
            </button>
          </form>
        </section>

        <section className="mt-8 text-center">
          <p className="font-body-md text-body-md text-on-surface-variant">
            Đã có tài khoản?
            <button
              className="ml-1 font-bold text-primary hover:underline"
              type="button"
              onClick={onBackToLogin}
            >
              Đăng nhập
            </button>
          </p>
        </section>
      </main>

      <footer className="mt-auto px-margin-mobile py-8 text-center">
        <div className="mb-2 flex items-center justify-center gap-2">
          <div className="h-2 w-2 rounded-full bg-tertiary" />
          <span className="font-label-sm text-label-sm italic text-on-surface-variant">
            Hệ thống bảo mật bởi Servio Cloud
          </span>
        </div>
        <p className="font-label-sm text-label-sm text-outline">
          © 2024 Servio Solutions. Version 2.4.0
        </p>
      </footer>
    </div>
  );
}

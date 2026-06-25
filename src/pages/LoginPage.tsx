import { useState } from "react";

type LoginPageProps = {
  onLogin: () => void;
  onRegisterClick: () => void;
};

export default function LoginPage({
  onLogin,
  onRegisterClick,
}: LoginPageProps) {
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onLogin();
  };

  return (
    <div className="flex min-h-dvh flex-col bg-background font-sans text-on-background">
      <header className="fixed top-0 z-50 flex h-16 w-full items-center justify-between border-b border-outline-variant bg-surface px-margin-mobile md:px-margin-desktop">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-3xl text-primary">
            electric_car
          </span>
          <span className="font-headline-lg text-headline-lg font-bold text-primary">
            Servio
          </span>
        </div>
      </header>

      <main className="relative flex flex-1 items-center justify-center overflow-hidden px-margin-mobile pb-12 pt-24 md:px-margin-desktop">
        <div className="pointer-events-none absolute inset-0 opacity-40" />

        <section className="relative z-10 w-full max-w-[480px] rounded-xl border border-[#EFEFEF] bg-surface-container-lowest p-8 shadow-[0_4px_20px_rgba(0,0,0,0.05)] md:p-10">
          <div className="mb-8 text-center">
            <div className="mb-4 flex items-center justify-center gap-2">
              <span
                className="material-symbols-outlined text-4xl text-primary"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                electric_car
              </span>
              <span className="font-headline-lg text-headline-lg font-bold text-primary">
                Servio
              </span>
            </div>
            <h1 className="mb-2 font-display-lg text-display-lg text-on-surface">
              Chào mừng trở lại
            </h1>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Đăng nhập để tiếp tục quản lý và chăm sóc xe của bạn
            </p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-1.5">
              <label
                className="ml-1 font-label-md text-label-md text-on-surface-variant"
                htmlFor="login-account"
              >
                Số điện thoại hoặc Email
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-xl text-outline">
                  person
                </span>
                <input
                  className="w-full rounded-lg border border-outline-variant bg-surface-container-low py-3 pl-12 pr-4 font-body-md text-body-md text-on-surface placeholder:text-outline transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  id="login-account"
                  placeholder="name@email.com"
                  type="text"
                  autoComplete="username"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label
                className="ml-1 font-label-md text-label-md text-on-surface-variant"
                htmlFor="login-password"
              >
                Mật khẩu
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-xl text-outline">
                  lock
                </span>
                <input
                  className="w-full rounded-lg border border-outline-variant bg-surface-container-low py-3 pl-12 pr-12 font-body-md text-body-md text-on-surface placeholder:text-outline transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  id="login-password"
                  placeholder="••••••••"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                />
                <button
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-outline transition-colors hover:text-primary"
                  type="button"
                  aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                  onClick={() => setShowPassword((current) => !current)}
                >
                  <span className="material-symbols-outlined text-xl">
                    {showPassword ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>
            </div>

            <div className="flex justify-end">
              <a
                className="font-label-md text-label-md font-semibold text-primary hover:underline"
                href="#"
              >
                Quên mật khẩu?
              </a>
            </div>

            <button
              className="w-full rounded-lg bg-primary py-4 font-headline-md text-headline-md text-on-primary shadow-md transition-all hover:bg-surface-tint active:scale-[0.98]"
              type="submit"
            >
              ĐĂNG NHẬP
            </button>
          </form>

          <div className="mt-8 border-t border-outline-variant pt-6 text-center">
            <p className="font-body-md text-body-md text-on-surface-variant">
              Chưa có tài khoản?
              <button
                className="ml-1 font-bold text-primary hover:underline"
                type="button"
                onClick={onRegisterClick}
              >
                Đăng ký ngay
              </button>
            </p>
          </div>
        </section>

        <div className="pointer-events-none absolute right-[10%] top-1/2 hidden h-96 w-96 -translate-y-1/2 rounded-full bg-primary-fixed opacity-20 blur-3xl xl:block" />
        <div className="pointer-events-none absolute left-[8%] top-32 hidden h-40 w-40 rounded-full bg-secondary-fixed opacity-30 blur-3xl lg:block" />
      </main>

      <footer className="flex h-12 items-center justify-center border-t border-outline-variant bg-surface-container-lowest px-margin-mobile text-center md:px-margin-desktop">
        <p className="font-label-sm text-label-sm text-outline">
          © 2024 Servio Automotive Management. Tất cả quyền được bảo lưu.
        </p>
      </footer>
    </div>
  );
}

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
    <div className="relative flex min-h-dvh items-center justify-center bg-background text-on-surface font-sans">
      <main className="flex min-h-dvh w-full max-w-[448px] flex-col justify-between px-margin-mobile py-12 lg:py-16">
        <div className="flex flex-col items-center space-y-6 text-center">
          <div className="flex items-center space-x-2">
            <span
              className="material-symbols-outlined text-4xl text-primary"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              electric_car
            </span>
            <h1 className="font-headline-lg-mobile text-headline-lg-mobile font-bold tracking-tight text-primary">
              Servio
            </h1>
          </div>

          <div className="space-y-1">
            <h2 className="font-headline-md text-headline-md text-on-surface">
              Chào mừng trở lại
            </h2>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Vui lòng đăng nhập để quản lý xe của bạn
            </p>
          </div>
        </div>

        <div className="flex flex-1 flex-col justify-center py-8">
          <form className="space-y-md" onSubmit={handleSubmit}>
            <div className="space-y-xs">
              <label className="px-1 font-label-md text-label-md text-on-surface-variant">
                Số điện thoại hoặc Email
              </label>
              <div className="group relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline transition-colors group-focus-within:text-primary">
                  person
                </span>
                <input
                  className="w-full rounded-lg border border-outline-variant bg-white py-4 pl-12 pr-4 font-body-md text-body-md placeholder:text-outline-variant transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="name@email.com"
                  type="text"
                  autoComplete="username"
                />
              </div>
            </div>

            <div className="space-y-xs">
              <label className="px-1 font-label-md text-label-md text-on-surface-variant">
                Mật khẩu
              </label>
              <div className="group relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline transition-colors group-focus-within:text-primary">
                  lock
                </span>
                <input
                  className="w-full rounded-lg border border-outline-variant bg-white py-4 pl-12 pr-12 font-body-md text-body-md placeholder:text-outline-variant transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="••••••••"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                />
                <button
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-outline transition-colors hover:text-on-surface"
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

            <div className="flex justify-end">
              <a
                className="font-label-md text-label-md font-semibold text-primary hover:underline"
                href="#"
              >
                Quên mật khẩu?
              </a>
            </div>

            <button
              className="mt-4 w-full rounded-lg bg-primary py-4 font-headline-md text-headline-md text-white shadow-sm transition-transform duration-150 active:scale-[0.98]"
              type="submit"
            >
              Đăng nhập
            </button>
          </form>
        </div>

        <div className="pb-4 text-center">
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
      </main>

      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-primary-fixed/20 via-transparent to-transparent opacity-50" />
    </div>
  );
}

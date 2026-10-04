import { useState } from "react";
import { login, type AuthSession } from "../../services/api";

type LoginPageProps = {
  onLogin: (session: AuthSession) => void;
  onRegisterClick: () => void;
  onForgotPasswordClick: () => void;
};

export default function LoginPage({
  onLogin,
  onRegisterClick,
  onForgotPasswordClick,
}: LoginPageProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;

    const formData = new FormData(event.currentTarget);
    setError("");
    setIsSubmitting(true);

    try {
      const session = await login({
        username: String(formData.get("username") || "").trim(),
        password: String(formData.get("password") || ""),
      });
      localStorage.setItem("auth_session", JSON.stringify(session));
      onLogin(session);
    } catch (requestError) {
      setError(
        requestError instanceof Error ? requestError.message : "Đăng nhập không thành công.",
      );
    } finally {
      setIsSubmitting(false);
    }
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

      <main className="grid flex-1 pt-16 lg:grid-cols-2">
        <div className="relative hidden overflow-hidden bg-[#0b1f3f] lg:block">
          <img
            src="/landing/hero-1.jpg"
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
            style={{ objectPosition: "center 55%" }}
            onError={(event) => {
              event.currentTarget.style.display = "none";
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/30" />
          <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-transparent to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-xl text-white xl:p-12">
            <p className="mb-3 inline-block rounded-full bg-white/15 px-3 py-1 text-xs font-bold uppercase tracking-widest backdrop-blur">
              Nền tảng chăm sóc xe
            </p>
            <h2 className="max-w-[28rem] text-[34px] font-extrabold leading-tight tracking-tight">
              Chăm sóc xe, dễ như vài cú chạm
            </h2>
            <ul className="mt-6 space-y-3">
              {[
                ["event_available", "Đặt lịch với garage gần bạn"],
                ["location_on", "Theo dõi tiến độ sửa xe theo thời gian thực"],
                ["receipt_long", "Báo giá rõ ràng, thanh toán an tâm"],
              ].map(([icon, text]) => (
                <li key={text} className="flex items-center gap-3 text-sm font-medium text-white/95">
                  <span
                    aria-hidden="true"
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/15 backdrop-blur"
                  >
                    <span className="material-symbols-outlined text-[20px]">{icon}</span>
                  </span>
                  {text}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="relative flex items-center justify-center overflow-hidden bg-gradient-to-br from-surface via-surface to-primary-fixed/50 px-margin-mobile py-12 md:px-margin-desktop">
        <section className="relative z-10 w-full max-w-[480px] rounded-3xl border border-outline-variant/40 bg-surface-container-lowest p-8 shadow-[0_24px_60px_-24px_rgba(0,89,187,0.35)] md:p-10">
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
                Tên đăng nhập
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-xl text-outline">
                  person
                </span>
                <input
                  className="w-full rounded-lg border border-outline-variant bg-surface-container-low py-3 pl-12 pr-4 font-body-md text-body-md text-on-surface placeholder:text-outline transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  id="login-account"
                  name="username"
                  placeholder="Nhập tên đăng nhập"
                  type="text"
                  autoComplete="username"
                  required
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
                  name="password"
                  placeholder="••••••••"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
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
              <button
                className="font-label-md text-label-md font-semibold text-primary hover:underline"
                type="button"
                onClick={onForgotPasswordClick}
              >
                Quên mật khẩu?
              </button>
            </div>

            {error && (
              <p className="rounded-lg bg-error-container px-3 py-2 font-body-sm text-body-sm text-on-error-container" role="alert">
                {error}
              </p>
            )}

            <button
              className="w-full rounded-lg bg-primary py-4 font-headline-md text-headline-md text-on-primary shadow-md transition-all hover:bg-surface-tint active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? "ĐANG ĐĂNG NHẬP..." : "ĐĂNG NHẬP"}
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

        <div className="pointer-events-none absolute -right-24 top-1/3 h-80 w-80 rounded-full bg-primary-fixed opacity-40 blur-3xl" />
        <div className="pointer-events-none absolute -left-16 bottom-10 h-48 w-48 rounded-full bg-tertiary-fixed opacity-20 blur-3xl" />
        </div>
      </main>

      <footer className="flex h-12 items-center justify-center border-t border-outline-variant bg-surface-container-lowest px-margin-mobile text-center md:px-margin-desktop">
        <p className="font-label-sm text-label-sm text-outline">
          © 2024 Servio Automotive Management. Tất cả quyền được bảo lưu.
        </p>
      </footer>
    </div>
  );
}

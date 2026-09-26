import { useState } from "react";
import { resetPassword, sendForgotPasswordOtp } from "../../services/api";

type ForgotPasswordPageProps = {
  onBackToLogin: () => void;
};

type SubmitState = "idle" | "loading" | "success" | "error";

export default function ForgotPasswordPage({ onBackToLogin }: ForgotPasswordPageProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [email, setEmail] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");

  const handleRequestOtp = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitState === "loading") return;

    setError("");
    setNotice("");
    setSubmitState("loading");

    try {
      await sendForgotPasswordOtp(email.trim());
      setOtpSent(true);
      setNotice(`Đã gửi mã OTP đặt lại mật khẩu đến ${email.trim()}. Vui lòng kiểm tra email.`);
      setSubmitState("idle");
    } catch (requestError) {
      setError(
        requestError instanceof Error ? requestError.message : "Gửi mã OTP không thành công.",
      );
      setSubmitState("error");
    }
  };

  const handleResetPassword = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitState === "loading") return;

    const formData = new FormData(event.currentTarget);
    const newPassword = String(formData.get("newPassword") || "");

    setError("");
    setSubmitState("loading");

    try {
      await resetPassword(email.trim(), otpCode.trim(), newPassword);
      setSubmitState("success");
    } catch (requestError) {
      setError(
        requestError instanceof Error ? requestError.message : "Đặt lại mật khẩu không thành công.",
      );
      setSubmitState("error");
    }
  };

  const handleBackToForm = () => {
    setOtpSent(false);
    setOtpCode("");
    setError("");
    setNotice("");
    setSubmitState("idle");
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
        <section className="relative z-10 w-full max-w-[480px] rounded-xl border border-[#EFEFEF] bg-surface-container-lowest p-8 shadow-[0_4px_20px_rgba(0,0,0,0.05)] md:p-10">
          <div className="mb-8 text-center">
            <div className="mb-4 flex items-center justify-center gap-2">
              <span
                className="material-symbols-outlined text-4xl text-primary"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                lock_reset
              </span>
            </div>
            <h1 className="mb-2 font-display-lg text-display-lg text-on-surface">
              Quên mật khẩu
            </h1>
            <p className="font-body-md text-body-md text-on-surface-variant">
              {otpSent
                ? "Nhập mã OTP đã gửi đến email và mật khẩu mới."
                : "Nhập email tài khoản khách hàng để nhận mã OTP đặt lại mật khẩu."}
            </p>
          </div>

          {notice && !error && (
            <p className="mb-6 rounded-lg bg-tertiary-container/20 px-3 py-2 font-body-sm text-body-sm text-on-surface" role="status">
              {notice}
            </p>
          )}

          {submitState === "success" ? (
            <div className="flex flex-col items-center gap-3 rounded-lg bg-tertiary-container/20 px-4 py-6 text-center">
              <span className="material-symbols-outlined text-4xl text-tertiary">
                check_circle
              </span>
              <p className="font-body-md text-body-md text-on-surface">
                Đặt lại mật khẩu thành công! Bạn có thể đăng nhập bằng mật khẩu mới.
              </p>
            </div>
          ) : !otpSent ? (
            <form className="space-y-6" onSubmit={handleRequestOtp}>
              <div className="space-y-1.5">
                <label
                  className="ml-1 font-label-md text-label-md text-on-surface-variant"
                  htmlFor="forgot-email"
                >
                  Email
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-xl text-outline">
                    mail
                  </span>
                  <input
                    className="w-full rounded-lg border border-outline-variant bg-surface-container-low py-3 pl-12 pr-4 font-body-md text-body-md text-on-surface placeholder:text-outline transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    id="forgot-email"
                    type="email"
                    placeholder="example@servio.vn"
                    autoComplete="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                  />
                </div>
              </div>

              {error && (
                <p className="rounded-lg bg-error-container px-3 py-2 font-body-sm text-body-sm text-on-error-container" role="alert">
                  {error}
                </p>
              )}

              <button
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-4 font-headline-md text-headline-md text-on-primary shadow-md transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
                type="submit"
                disabled={submitState === "loading"}
              >
                {submitState === "loading" ? "ĐANG GỬI MÃ OTP..." : "GỬI MÃ OTP"}
              </button>
            </form>
          ) : (
            <form className="space-y-6" onSubmit={handleResetPassword}>
              <div className="space-y-1.5">
                <label
                  className="ml-1 font-label-md text-label-md text-on-surface-variant"
                  htmlFor="reset-otp"
                >
                  Mã OTP
                </label>
                <input
                  className="w-full rounded-lg border border-outline-variant bg-surface-container-low px-4 py-3 text-center font-body-md text-body-md tracking-[0.5em] text-on-surface outline-none transition-all placeholder:tracking-normal placeholder:text-outline focus:border-primary focus:ring-2 focus:ring-primary/20"
                  id="reset-otp"
                  placeholder="000000"
                  inputMode="numeric"
                  maxLength={6}
                  value={otpCode}
                  onChange={(event) => setOtpCode(event.target.value.replace(/\D/g, ""))}
                  autoFocus
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label
                  className="ml-1 font-label-md text-label-md text-on-surface-variant"
                  htmlFor="reset-new-password"
                >
                  Mật khẩu mới
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-xl text-outline">
                    lock
                  </span>
                  <input
                    className="w-full rounded-lg border border-outline-variant bg-surface-container-low py-3 pl-12 pr-12 font-body-md text-body-md text-on-surface placeholder:text-outline transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    id="reset-new-password"
                    name="newPassword"
                    placeholder="••••••••"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    minLength={6}
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

              {error && (
                <p className="rounded-lg bg-error-container px-3 py-2 font-body-sm text-body-sm text-on-error-container" role="alert">
                  {error}
                </p>
              )}

              <button
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-4 font-headline-md text-headline-md text-on-primary shadow-md transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
                type="submit"
                disabled={submitState === "loading" || otpCode.length !== 6}
              >
                {submitState === "loading" ? "ĐANG XỬ LÝ..." : "ĐẶT LẠI MẬT KHẨU"}
              </button>

              <button
                className="w-full text-center font-label-md text-label-md text-on-surface-variant hover:text-primary"
                type="button"
                onClick={handleBackToForm}
              >
                ← Nhập lại email
              </button>
            </form>
          )}

          <div className="mt-8 border-t border-outline-variant pt-6 text-center">
            <button
              className="font-label-md text-label-md font-bold text-primary hover:underline"
              type="button"
              onClick={onBackToLogin}
            >
              ← Quay lại đăng nhập
            </button>
          </div>
        </section>
      </main>

      <footer className="flex h-12 items-center justify-center border-t border-outline-variant bg-surface-container-lowest px-margin-mobile text-center md:px-margin-desktop">
        <p className="font-label-sm text-label-sm text-outline">
          © 2024 Servio Automotive Management. Tất cả quyền được bảo lưu.
        </p>
      </footer>
    </div>
  );
}

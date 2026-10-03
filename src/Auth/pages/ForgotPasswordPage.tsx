import { useEffect, useMemo, useState } from "react";
import { resetPassword, sendForgotPasswordOtp } from "../../services/api";
import { isValidEmail } from "../../utils/validators";
import { evaluatePasswordStrength } from "../../utils/passwordStrength";

type ForgotPasswordPageProps = {
  onBackToLogin: () => void;
};

type SubmitState = "idle" | "loading" | "success" | "error";
type Step = "email" | "otp" | "password";

const RESEND_COOLDOWN_SECONDS = 60;

export default function ForgotPasswordPage({ onBackToLogin }: ForgotPasswordPageProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [step, setStep] = useState<Step>("email");

  const [email, setEmail] = useState("");
  const [emailTouched, setEmailTouched] = useState(false);
  const emailError = !email.trim()
    ? "Vui lòng nhập email."
    : !isValidEmail(email)
      ? "Email không hợp lệ."
      : "";

  const [otpCode, setOtpCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const passwordStrength = useMemo(() => evaluatePasswordStrength(password), [password]);
  const passwordsMatch = password.length > 0 && password === confirmPassword;

  const [resendCooldown, setResendCooldown] = useState(0);
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timerId = window.setInterval(() => {
      setResendCooldown((current) => Math.max(0, current - 1));
    }, 1000);
    return () => window.clearInterval(timerId);
  }, [resendCooldown > 0]);

  const handleRequestOtp = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setEmailTouched(true);
    if (emailError) return;
    if (submitState === "loading") return;

    setError("");
    setNotice("");
    setSubmitState("loading");

    try {
      await sendForgotPasswordOtp(email.trim());
      setNotice(`Đã gửi mã OTP đặt lại mật khẩu đến ${email.trim()}. Vui lòng kiểm tra email.`);
      setStep("otp");
      setResendCooldown(RESEND_COOLDOWN_SECONDS);
      setSubmitState("idle");
    } catch (requestError) {
      setError(
        requestError instanceof Error ? requestError.message : "Gửi mã OTP không thành công.",
      );
      setSubmitState("error");
    }
  };

  const handleResendOtp = async () => {
    if (submitState === "loading" || resendCooldown > 0) return;
    setError("");
    setNotice("");
    setSubmitState("loading");
    try {
      await sendForgotPasswordOtp(email.trim());
      setOtpCode("");
      setNotice(`Đã gửi lại mã OTP mới đến ${email.trim()}. Vui lòng kiểm tra email.`);
      setResendCooldown(RESEND_COOLDOWN_SECONDS);
      setSubmitState("idle");
    } catch (requestError) {
      setError(
        requestError instanceof Error ? requestError.message : "Gửi lại mã OTP không thành công.",
      );
      setSubmitState("error");
    }
  };

  const handleSubmitOtp = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (otpCode.trim().length !== 6) return;
    setError("");
    setStep("password");
  };

  const handleResetPassword = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitState === "loading") return;

    if (password.length < 8) {
      setError("Mật khẩu phải có ít nhất 8 ký tự.");
      return;
    }
    if (!passwordsMatch) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }

    setError("");
    setSubmitState("loading");

    try {
      await resetPassword(email.trim(), otpCode.trim(), password);
      setSubmitState("success");
    } catch (requestError) {
      setError(
        requestError instanceof Error ? requestError.message : "Đặt lại mật khẩu không thành công.",
      );
      setSubmitState("error");
    }
  };

  const handleBackToEmail = () => {
    setStep("email");
    setError("");
    setNotice("");
    setSubmitState("idle");
    setResendCooldown(0);
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
              {step === "email" && "Nhập email tài khoản khách hàng để nhận mã OTP đặt lại mật khẩu."}
              {step === "otp" && (
                <>
                  Nhập mã OTP 6 số đã gửi tới <strong>{email.trim()}</strong>.
                </>
              )}
              {step === "password" && "Tạo mật khẩu mới cho tài khoản của bạn."}
            </p>
          </div>

          {notice && !error && step !== "email" && (
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
          ) : step === "email" ? (
            <form className="space-y-6" onSubmit={handleRequestOtp} noValidate>
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
                    onChange={(event) => setEmail(event.target.value.trim())}
                    onBlur={() => setEmailTouched(true)}
                  />
                </div>
                {emailTouched && emailError && (
                  <p className="ml-1 text-xs text-error">{emailError}</p>
                )}
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
          ) : step === "otp" ? (
            <form className="space-y-6" onSubmit={handleSubmitOtp}>
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

              {error && (
                <p className="rounded-lg bg-error-container px-3 py-2 font-body-sm text-body-sm text-on-error-container" role="alert">
                  {error}
                </p>
              )}

              <button
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-4 font-headline-md text-headline-md text-on-primary shadow-md transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
                type="submit"
                disabled={otpCode.length !== 6}
              >
                TIẾP TỤC
              </button>

              <button
                className="w-full text-center font-label-md text-label-md text-primary hover:underline disabled:cursor-not-allowed disabled:text-on-surface-variant disabled:no-underline disabled:opacity-60"
                type="button"
                onClick={() => void handleResendOtp()}
                disabled={submitState === "loading" || resendCooldown > 0}
              >
                {resendCooldown > 0
                  ? `Gửi lại mã sau ${resendCooldown}s`
                  : "Không nhận được mã? Gửi lại mã OTP"}
              </button>

              <button
                className="w-full text-center font-label-md text-label-md text-on-surface-variant hover:text-primary"
                type="button"
                onClick={handleBackToEmail}
              >
                ← Nhập lại email
              </button>
            </form>
          ) : (
            <form className="space-y-6" onSubmit={handleResetPassword}>
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
                    placeholder="••••••••"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
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

                {password.length > 0 && (
                  <div className="mt-1 space-y-1">
                    <div className="flex gap-1">
                      {[0, 1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className={`h-1.5 flex-1 rounded-full transition-colors ${
                            i < passwordStrength.score ? passwordStrength.colorClass : "bg-outline-variant"
                          }`}
                        />
                      ))}
                    </div>
                    <p className="ml-1 text-xs text-on-surface-variant">
                      Độ mạnh mật khẩu: <span className="font-semibold">{passwordStrength.label}</span>
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <label
                  className="ml-1 font-label-md text-label-md text-on-surface-variant"
                  htmlFor="reset-confirm-password"
                >
                  Xác nhận mật khẩu mới
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-xl text-outline">
                    lock
                  </span>
                  <input
                    className="w-full rounded-lg border border-outline-variant bg-surface-container-low py-3 pl-12 pr-12 font-body-md text-body-md text-on-surface placeholder:text-outline transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    id="reset-confirm-password"
                    placeholder="••••••••"
                    type={showConfirmPassword ? "text" : "password"}
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    required
                  />
                  <button
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-outline transition-colors hover:text-primary"
                    type="button"
                    aria-label={showConfirmPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                    onClick={() => setShowConfirmPassword((current) => !current)}
                  >
                    <span className="material-symbols-outlined text-xl">
                      {showConfirmPassword ? "visibility_off" : "visibility"}
                    </span>
                  </button>
                </div>
                {confirmPassword.length > 0 && !passwordsMatch && (
                  <p className="ml-1 text-xs text-error">Mật khẩu xác nhận không khớp.</p>
                )}
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
                {submitState === "loading" ? "ĐANG XỬ LÝ..." : "ĐẶT LẠI MẬT KHẨU"}
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

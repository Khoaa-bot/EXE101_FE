import { useState } from "react";
import { register, sendRegisterOtp, type RegisterPayload } from "../../services/api";

type RegisterPageProps = {
  onBackToLogin: () => void;
};

type SubmitState = "idle" | "loading" | "success" | "error";

export default function RegisterPage({ onBackToLogin }: RegisterPageProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  // Đăng ký cần xác minh email bằng OTP trước — bước 1 gửi mã và giữ lại
  // thông tin đã điền, bước 2 mới thật sự tạo tài khoản kèm mã OTP.
  const [pendingInfo, setPendingInfo] = useState<Omit<RegisterPayload, "otp"> | null>(
    null,
  );
  const [otpCode, setOtpCode] = useState("");

  const handleRequestOtp = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitState === "loading") return;

    const formData = new FormData(event.currentTarget);
    const info: Omit<RegisterPayload, "otp"> = {
      username: String(formData.get("username") || "").trim(),
      password: String(formData.get("password") || ""),
      phone: String(formData.get("phone") || "").trim(),
      email: String(formData.get("email") || "").trim(),
      dob: String(formData.get("dob") || ""),
    };

    setError("");
    setNotice("");
    setSubmitState("loading");

    try {
      await sendRegisterOtp(info.email);
      setPendingInfo(info);
      setNotice(`Đã gửi mã OTP xác minh đến ${info.email}. Vui lòng kiểm tra email.`);
      setSubmitState("idle");
    } catch (requestError) {
      setError(
        requestError instanceof Error ? requestError.message : "Gửi mã OTP không thành công.",
      );
      setSubmitState("error");
    }
  };

  const handleConfirmRegister = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!pendingInfo || submitState === "loading") return;

    setError("");
    setSubmitState("loading");

    try {
      await register({ ...pendingInfo, otp: otpCode.trim() });
      setSubmitState("success");
    } catch (requestError) {
      setError(
        requestError instanceof Error ? requestError.message : "Đăng ký không thành công.",
      );
      setSubmitState("error");
    }
  };

  const handleBackToForm = () => {
    setPendingInfo(null);
    setOtpCode("");
    setError("");
    setNotice("");
    setSubmitState("idle");
  };

  return (
    <div className="flex min-h-dvh flex-col bg-background bg-[radial-gradient(#d1d5db_0.5px,transparent_0.5px)] [background-size:24px_24px] font-sans text-on-surface">
      <header className="fixed top-0 z-50 flex h-16 w-full items-center justify-between border-b border-outline-variant bg-surface/80 px-margin-mobile backdrop-blur-md md:px-margin-desktop">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-3xl text-primary">
            electric_car
          </span>
          <h1 className="font-headline-lg text-headline-lg font-bold text-primary">
            Servio
          </h1>
        </div>

        <button
          className="font-label-md text-label-md text-on-surface-variant transition-colors hover:text-primary"
          type="button"
          aria-label="Trợ giúp"
        >
          Cần trợ giúp?
        </button>
      </header>

      <main className="flex flex-1 items-center justify-center px-margin-mobile pb-12 pt-24">
        <section className="grid w-full max-w-[1100px] overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest shadow-xl md:grid-cols-2">
          <div className="relative hidden min-h-[640px] overflow-hidden md:block">
            <div className="absolute inset-0 z-10 bg-primary/30" />
            <div className="absolute inset-0 z-20 flex flex-col justify-end p-xl text-white">
              <h2 className="mb-md font-display-lg text-display-lg leading-tight">
                Bắt đầu quản lý phương tiện thông minh hơn cùng Servio.
              </h2>
              <p className="max-w-[420px] font-body-lg text-body-lg opacity-90">
                Theo dõi lịch sử bảo dưỡng, đặt lịch dịch vụ và chăm sóc xe của bạn
                trong một nền tảng thống nhất.
              </p>
            </div>
            <div
              className="absolute inset-0 bg-cover bg-center transition-transform duration-[10000ms] hover:scale-105"
              style={{
                backgroundImage:
                  "url('https://lh3.googleusercontent.com/aida-public/AB6AXuBU3ITACOKvU92hRSYSe6hcxKsSLNlu6UjQ1c4H8lhEBagRLAbgNrrckPfRSPlw9I6J6Nl-VytecQtsVl9cV34Cox5xt77ydf1iMUctKaS3yJuwkqV1BA8_WwkZ_xMxd6eBE0-Qsp84tdCM7JkZLwWrMgdABfw-awDAjRWOf13LSq-DELqSSx95olOcxqHpEcO0pEhNOVyaLNBM8ARw26ymMhgEJx9iPk0j93imFlvOqzR4ILAwasDvPmtuxXMqIxJ5l5OnBwTMhbGQ')",
              }}
            />
          </div>

          <div className="flex flex-col justify-center p-lg md:p-xl">
            <div className="mx-auto w-full max-w-[448px]">
              <div className="mb-xl">
                <h1 className="mb-xs font-headline-lg text-headline-lg text-on-surface">
                  Tạo tài khoản
                </h1>
                <p className="font-body-md text-body-md text-on-surface-variant">
                  Tham gia Servio để quản lý bảo dưỡng xe của bạn một cách chuyên
                  nghiệp.
                </p>
              </div>

              {notice && !error && (
                <p className="mb-lg rounded-lg bg-tertiary-container/20 px-3 py-2 font-body-sm text-body-sm text-on-surface" role="status">
                  {notice}
                </p>
              )}

              {!pendingInfo && (
              <form className="space-y-lg" onSubmit={handleRequestOtp}>
                <div className="space-y-xs">
              <label
                className="ml-1 block font-label-md text-label-md text-on-surface-variant"
                htmlFor="username"
              >
                Tên đăng nhập
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-lg text-outline">
                  person
                </span>
                <input
                  className="w-full rounded-lg border border-outline-variant bg-surface py-3 pl-10 pr-4 font-body-md text-body-md text-on-surface outline-none transition-all placeholder:text-outline focus:border-transparent focus:ring-2 focus:ring-primary"
                  id="username"
                  name="username"
                  placeholder="Nhập tên đăng nhập"
                  type="text"
                  autoComplete="name"
                  required
                />
              </div>
            </div>

            <div className="space-y-xs">
              <label className="ml-1 block font-label-md text-label-md text-on-surface-variant" htmlFor="dob">
                Ngày sinh
              </label>
              <input
                className="w-full rounded-lg border border-outline-variant bg-surface px-4 py-3 font-body-md text-body-md text-on-surface outline-none transition-all focus:border-transparent focus:ring-2 focus:ring-primary"
                id="dob"
                name="dob"
                type="date"
                autoComplete="bday"
                required
              />
            </div>

            <div className="space-y-xs">
              <label
                className="ml-1 block font-label-md text-label-md text-on-surface-variant"
                htmlFor="phone"
              >
                Số điện thoại
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-lg text-outline">
                  call
                </span>
                <input
                  className="w-full rounded-lg border border-outline-variant bg-surface py-3 pl-10 pr-4 font-body-md text-body-md text-on-surface outline-none transition-all placeholder:text-outline focus:border-transparent focus:ring-2 focus:ring-primary"
                  id="phone"
                  name="phone"
                  placeholder="0901 234 567"
                  type="tel"
                  autoComplete="tel"
                  required
                />
              </div>
            </div>

            <div className="space-y-xs">
              <label
                className="ml-1 block font-label-md text-label-md text-on-surface-variant"
                htmlFor="email"
              >
                Email
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-lg text-outline">
                  mail
                </span>
                <input
                  className="w-full rounded-lg border border-outline-variant bg-surface py-3 pl-10 pr-4 font-body-md text-body-md text-on-surface outline-none transition-all placeholder:text-outline focus:border-transparent focus:ring-2 focus:ring-primary"
                  id="email"
                  name="email"
                  placeholder="example@servio.vn"
                  type="email"
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            <div className="space-y-xs">
              <label
                className="ml-1 block font-label-md text-label-md text-on-surface-variant"
                htmlFor="password"
              >
                Mật khẩu
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-lg text-outline">
                  lock
                </span>
                <input
                  className="w-full rounded-lg border border-outline-variant bg-surface py-3 pl-10 pr-10 font-body-md text-body-md text-on-surface outline-none transition-all placeholder:text-outline focus:border-transparent focus:ring-2 focus:ring-primary"
                  id="password"
                  name="password"
                  placeholder="••••••••"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                />
                <button
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-outline transition-colors hover:text-on-surface"
                  type="button"
                  aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                  onClick={() => setShowPassword((current) => !current)}
                >
                  <span className="material-symbols-outlined text-lg">
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

            <div className="flex items-start gap-3 px-1">
              <div className="flex h-5 items-center">
                <input
                  className="h-4 w-4 rounded border-outline-variant text-primary accent-primary focus:ring-primary"
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
                <a className="font-bold text-primary hover:underline" href="#">
                  Điều khoản sử dụng
                </a>{" "}
                và{" "}
                <a className="font-bold text-primary hover:underline" href="#">
                  Chính sách bảo mật
                </a>{" "}
                của Servio.
              </label>
            </div>

            <button
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-3.5 font-label-md text-label-md text-on-primary shadow-md transition-all active:scale-[0.98] disabled:opacity-60"
              type="submit"
              disabled={submitState === "loading"}
            >
              {submitState === "loading" ? (
                <>
                  <span className="material-symbols-outlined animate-spin">
                    sync
                  </span>
                  <span>Đang gửi mã OTP...</span>
                </>
              ) : (
                <>
                  <span>Gửi mã OTP xác minh</span>
                  <span className="material-symbols-outlined">
                    arrow_forward
                  </span>
                </>
              )}
            </button>
              </form>
              )}

              {pendingInfo && submitState !== "success" && (
                <form className="space-y-lg" onSubmit={handleConfirmRegister}>
                  <p className="font-body-md text-body-md text-on-surface-variant">
                    Nhập mã OTP 6 số đã gửi tới <strong>{pendingInfo.email}</strong>.
                  </p>

                  <div className="space-y-xs">
                    <label
                      className="ml-1 block font-label-md text-label-md text-on-surface-variant"
                      htmlFor="otp"
                    >
                      Mã OTP
                    </label>
                    <input
                      className="w-full rounded-lg border border-outline-variant bg-surface px-4 py-3 text-center font-body-md text-body-md tracking-[0.5em] text-on-surface outline-none transition-all placeholder:tracking-normal placeholder:text-outline focus:border-transparent focus:ring-2 focus:ring-primary"
                      id="otp"
                      name="otp"
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
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-3.5 font-label-md text-label-md text-on-primary shadow-md transition-all active:scale-[0.98] disabled:opacity-60"
                    type="submit"
                    disabled={submitState === "loading" || otpCode.length !== 6}
                  >
                    {submitState === "loading" ? (
                      <>
                        <span className="material-symbols-outlined animate-spin">
                          sync
                        </span>
                        <span>Đang xử lý...</span>
                      </>
                    ) : (
                      <>
                        <span>Xác nhận đăng ký</span>
                        <span className="material-symbols-outlined">
                          arrow_forward
                        </span>
                      </>
                    )}
                  </button>

                  <button
                    className="w-full text-center font-label-md text-label-md text-on-surface-variant hover:text-primary"
                    type="button"
                    onClick={handleBackToForm}
                  >
                    ← Quay lại chỉnh sửa thông tin
                  </button>
                </form>
              )}

              {submitState === "success" && (
                <div className="flex flex-col items-center gap-3 rounded-lg bg-tertiary-container/20 px-4 py-6 text-center">
                  <span className="material-symbols-outlined text-4xl text-tertiary">
                    check_circle
                  </span>
                  <p className="font-body-md text-body-md text-on-surface">
                    Đăng ký thành công! Bạn có thể đăng nhập ngay bây giờ.
                  </p>
                </div>
              )}

              <div className="mt-xl text-center">
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
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="mt-auto border-t border-outline-variant bg-surface px-margin-mobile py-lg text-center md:px-margin-desktop">
        <p className="font-label-sm text-label-sm text-on-surface-variant">
          © 2024 Servio Technology. Tất cả quyền được bảo lưu.
          <span className="mx-2">|</span>
          <a className="hover:text-primary" href="#">
            Chính sách bảo mật
          </a>
          <span className="mx-2">|</span>
          <a className="hover:text-primary" href="#">
            Điều khoản sử dụng
          </a>
        </p>
      </footer>
    </div>
  );
}

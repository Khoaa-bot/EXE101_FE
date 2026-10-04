import { useEffect, useMemo, useState } from "react";
import { register, sendRegisterOtp, type RegisterPayload } from "../../services/api";
import { EMAIL_REGEX, NAME_REGEX, PHONE_REGEX, USERNAME_REGEX } from "../../utils/validators";
import { evaluatePasswordStrength } from "../../utils/passwordStrength";

type RegisterPageProps = {
  onBackToLogin: () => void;
};

type SubmitState = "idle" | "loading" | "success" | "error";
type Step = "info" | "otp" | "password";

const STEP_LABELS: Array<[Step, string]> = [
  ["info", "Thông tin"],
  ["otp", "Xác minh"],
  ["password", "Mật khẩu"],
];

type InfoForm = {
  fullName: string;
  username: string;
  dob: string;
  phone: string;
  email: string;
};

function validateInfo(info: InfoForm): Partial<Record<keyof InfoForm, string>> {
  const errors: Partial<Record<keyof InfoForm, string>> = {};

  const fullName = info.fullName.trim();
  if (!fullName) errors.fullName = "Vui lòng nhập họ tên.";
  else if (fullName.length < 2) errors.fullName = "Họ tên quá ngắn.";
  else if (!NAME_REGEX.test(fullName)) errors.fullName = "Họ tên chỉ được chứa chữ cái và khoảng trắng.";

  const username = info.username.trim();
  if (!username) errors.username = "Vui lòng nhập tên đăng nhập.";
  else if (!USERNAME_REGEX.test(username))
    errors.username = "3-20 ký tự, bắt đầu bằng chữ cái, chỉ gồm chữ/số/gạch dưới, không dấu.";

  if (!info.dob) errors.dob = "Vui lòng chọn ngày sinh.";
  else {
    const dobDate = new Date(info.dob);
    const age = (Date.now() - dobDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
    if (Number.isNaN(dobDate.getTime())) errors.dob = "Ngày sinh không hợp lệ.";
    else if (age < 16) errors.dob = "Bạn phải từ 16 tuổi trở lên để đăng ký.";
    else if (age > 120) errors.dob = "Ngày sinh không hợp lệ.";
  }

  const phone = info.phone.trim();
  if (!phone) errors.phone = "Vui lòng nhập số điện thoại.";
  else if (!PHONE_REGEX.test(phone))
    errors.phone = "Số điện thoại di động Việt Nam không hợp lệ (VD: 0901234567).";

  const email = info.email.trim();
  if (!email) errors.email = "Vui lòng nhập email.";
  else if (!EMAIL_REGEX.test(email)) errors.email = "Email không hợp lệ.";

  return errors;
}

export default function RegisterPage({ onBackToLogin }: RegisterPageProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [step, setStep] = useState<Step>("info");

  const [info, setInfo] = useState<InfoForm>({
    fullName: "",
    username: "",
    dob: "",
    phone: "",
    email: "",
  });
  const [touched, setTouched] = useState<Partial<Record<keyof InfoForm, boolean>>>({});
  const fieldErrors = useMemo(() => validateInfo(info), [info]);

  const [otpCode, setOtpCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  // Đếm ngược trước khi cho gửi lại OTP lần nữa — tránh spam gửi email liên tục.
  const RESEND_COOLDOWN_SECONDS = 60;
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timerId = window.setInterval(() => {
      setResendCooldown((current) => Math.max(0, current - 1));
    }, 1000);
    return () => window.clearInterval(timerId);
  }, [resendCooldown > 0]);

  const passwordStrength = useMemo(() => evaluatePasswordStrength(password), [password]);
  const passwordsMatch = password.length > 0 && password === confirmPassword;

  const updateInfoField = (field: keyof InfoForm, value: string) => {
    setInfo((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmitInfo = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setTouched({ fullName: true, username: true, dob: true, phone: true, email: true });
    const errors = validateInfo(info);
    if (Object.keys(errors).length > 0) return;
    if (submitState === "loading") return;

    setError("");
    setNotice("");
    setSubmitState("loading");

    try {
      await sendRegisterOtp(info.email.trim());
      setNotice(`Đã gửi mã OTP xác minh đến ${info.email.trim()}. Vui lòng kiểm tra email.`);
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

  const handleSubmitOtp = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (otpCode.trim().length !== 6) return;
    setError("");
    setStep("password");
  };

  const handleSubmitPassword = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitState === "loading") return;

    if (!agreedToTerms) {
      setError("Vui lòng đồng ý với Điều khoản sử dụng và Chính sách bảo mật.");
      return;
    }
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

    const payload: RegisterPayload = {
      username: info.username.trim(),
      password,
      fullName: info.fullName.trim(),
      phone: info.phone.trim(),
      email: info.email.trim(),
      dob: info.dob,
      otp: otpCode.trim(),
    };

    try {
      await register(payload);
      setSubmitState("success");
    } catch (requestError) {
      setError(
        requestError instanceof Error ? requestError.message : "Đăng ký không thành công.",
      );
      setSubmitState("error");
    }
  };

  const handleBackToInfo = () => {
    setStep("info");
    setError("");
    setNotice("");
    setSubmitState("idle");
    setResendCooldown(0);
  };

  const handleResendOtp = async () => {
    if (submitState === "loading" || resendCooldown > 0) return;
    setError("");
    setNotice("");
    setSubmitState("loading");
    try {
      await sendRegisterOtp(info.email.trim());
      setOtpCode("");
      setNotice(`Đã gửi lại mã OTP mới đến ${info.email.trim()}. Vui lòng kiểm tra email.`);
      setResendCooldown(RESEND_COOLDOWN_SECONDS);
      setSubmitState("idle");
    } catch (requestError) {
      setError(
        requestError instanceof Error ? requestError.message : "Gửi lại mã OTP không thành công.",
      );
      setSubmitState("error");
    }
  };

  const showFieldError = (field: keyof InfoForm) => touched[field] && fieldErrors[field];

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

      <main className="grid flex-1 pt-16 md:grid-cols-2">
        <section className="contents">
          <div className="relative hidden overflow-hidden bg-[#0b1f3f] md:block">
            <img
              src="/landing/hero-2.jpg"
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
              style={{ objectPosition: "center 52%" }}
              onError={(event) => {
                event.currentTarget.style.display = "none";
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/30" />
            <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-transparent to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-xl text-white xl:p-12">
              <p className="mb-3 inline-block rounded-full bg-white/15 px-3 py-1 text-xs font-bold uppercase tracking-widest backdrop-blur">
                Miễn phí tạo tài khoản
              </p>
              <h2 className="max-w-[28rem] text-[34px] font-extrabold leading-tight tracking-tight">
                Bắt đầu quản lý phương tiện thông minh hơn
              </h2>
              <ul className="mt-6 space-y-3">
                {[
                  ["history", "Theo dõi lịch sử bảo dưỡng của từng xe"],
                  ["event_available", "Đặt lịch dịch vụ chỉ vài thao tác"],
                  ["notifications_active", "Nhận thông báo mỗi khi xe có cập nhật"],
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

          <div className="relative flex items-center justify-center overflow-hidden bg-gradient-to-br from-surface via-surface to-primary-fixed/50 px-margin-mobile py-10 md:px-margin-desktop">
            <div className="pointer-events-none absolute -right-24 top-1/3 h-80 w-80 rounded-full bg-primary-fixed opacity-40 blur-3xl" />
            <div className="relative mx-auto w-full max-w-[480px] rounded-3xl border border-outline-variant/40 bg-surface-container-lowest p-8 shadow-[0_24px_60px_-24px_rgba(0,89,187,0.35)]">
              <ol className="mb-6 flex items-center gap-2" aria-label="Các bước đăng ký">
                {STEP_LABELS.map(([key, label], i) => {
                  const currentIndex = STEP_LABELS.findIndex(([k]) => k === step);
                  const isDone = submitState === "success" || i < currentIndex;
                  const isCurrent = !isDone && i === currentIndex;
                  return (
                    <li
                      key={key}
                      className={`flex items-center gap-2 ${i === 1 ? "flex-1 justify-center" : i === 2 ? "flex-1 justify-end" : "flex-1"}`}
                      aria-current={isCurrent ? "step" : undefined}
                    >
                      <span
                        className={`flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                          isDone
                            ? "bg-tertiary-container text-on-primary"
                            : isCurrent
                              ? "bg-primary text-on-primary"
                              : "bg-surface-container text-on-surface-variant"
                        }`}
                      >
                        {isDone ? (
                          <span aria-hidden="true" className="material-symbols-outlined text-[16px]">
                            check
                          </span>
                        ) : (
                          i + 1
                        )}
                      </span>
                      <span
                        className={`text-xs ${
                          isDone
                            ? "font-semibold text-on-tertiary-fixed-variant"
                            : isCurrent
                              ? "font-bold text-on-primary-fixed-variant"
                              : "font-semibold text-on-surface-variant"
                        }`}
                      >
                        {label}
                      </span>
                    </li>
                  );
                })}
              </ol>
            <div className="mx-auto w-full">
              <div className="mb-xl">
                <h1 className="mb-xs font-headline-lg text-headline-lg text-on-surface">
                  Tạo tài khoản
                </h1>
                <p className="font-body-md text-body-md text-on-surface-variant">
                  {step === "info" &&
                    "Tham gia Servio để quản lý bảo dưỡng xe của bạn một cách chuyên nghiệp."}
                  {step === "otp" && (
                    <>
                      Nhập mã OTP 6 số đã gửi tới <strong>{info.email.trim()}</strong>.
                    </>
                  )}
                  {step === "password" && "Cuối cùng, tạo mật khẩu cho tài khoản của bạn."}
                </p>
              </div>

              {notice && !error && step !== "info" && (
                <p className="mb-lg rounded-lg bg-tertiary-container/20 px-3 py-2 font-body-sm text-body-sm text-on-surface" role="status">
                  {notice}
                </p>
              )}

              {step === "info" && (
                <form className="space-y-lg" onSubmit={handleSubmitInfo} noValidate>
                  <div className="space-y-xs">
                    <label
                      className="ml-1 block font-label-md text-label-md text-on-surface-variant"
                      htmlFor="fullName"
                    >
                      Họ và tên
                    </label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-lg text-outline">
                        badge
                      </span>
                      <input
                        className="w-full rounded-lg border border-outline-variant bg-surface py-3 pl-10 pr-4 font-body-md text-body-md text-on-surface outline-none transition-all placeholder:text-outline focus:border-transparent focus:ring-2 focus:ring-primary"
                        id="fullName"
                        placeholder="Nguyễn Văn A"
                        type="text"
                        autoComplete="name"
                        value={info.fullName}
                        onChange={(e) => updateInfoField("fullName", e.target.value)}
                        onBlur={() => setTouched((t) => ({ ...t, fullName: true }))}
                      />
                    </div>
                    {showFieldError("fullName") && (
                      <p className="ml-1 text-xs text-error">{fieldErrors.fullName}</p>
                    )}
                  </div>

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
                        placeholder="nguyenvana"
                        type="text"
                        autoComplete="username"
                        value={info.username}
                        onChange={(e) => updateInfoField("username", e.target.value.trim())}
                        onBlur={() => setTouched((t) => ({ ...t, username: true }))}
                      />
                    </div>
                    {showFieldError("username") ? (
                      <p className="ml-1 text-xs text-error">{fieldErrors.username}</p>
                    ) : (
                      <p className="ml-1 text-xs text-on-surface-variant">
                        3-20 ký tự, bắt đầu bằng chữ, không dấu, không khoảng trắng.
                      </p>
                    )}
                  </div>

                  <div className="space-y-xs">
                    <label className="ml-1 block font-label-md text-label-md text-on-surface-variant" htmlFor="dob">
                      Ngày sinh
                    </label>
                    <input
                      className="w-full rounded-lg border border-outline-variant bg-surface px-4 py-3 font-body-md text-body-md text-on-surface outline-none transition-all focus:border-transparent focus:ring-2 focus:ring-primary"
                      id="dob"
                      type="date"
                      autoComplete="bday"
                      value={info.dob}
                      onChange={(e) => updateInfoField("dob", e.target.value)}
                      onBlur={() => setTouched((t) => ({ ...t, dob: true }))}
                    />
                    {showFieldError("dob") && (
                      <p className="ml-1 text-xs text-error">{fieldErrors.dob}</p>
                    )}
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
                        placeholder="0901234567"
                        type="tel"
                        autoComplete="tel"
                        value={info.phone}
                        onChange={(e) =>
                          updateInfoField("phone", e.target.value.replace(/[^\d]/g, "").slice(0, 10))
                        }
                        onBlur={() => setTouched((t) => ({ ...t, phone: true }))}
                      />
                    </div>
                    {showFieldError("phone") && (
                      <p className="ml-1 text-xs text-error">{fieldErrors.phone}</p>
                    )}
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
                        placeholder="example@servio.vn"
                        type="email"
                        autoComplete="email"
                        value={info.email}
                        onChange={(e) => updateInfoField("email", e.target.value.trim())}
                        onBlur={() => setTouched((t) => ({ ...t, email: true }))}
                      />
                    </div>
                    {showFieldError("email") && (
                      <p className="ml-1 text-xs text-error">{fieldErrors.email}</p>
                    )}
                  </div>

                  {error && (
                    <p className="rounded-lg bg-error-container px-3 py-2 font-body-sm text-body-sm text-on-error-container" role="alert">
                      {error}
                    </p>
                  )}

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

              {step === "otp" && (
                <form className="space-y-lg" onSubmit={handleSubmitOtp}>
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
                    disabled={otpCode.length !== 6}
                  >
                    <span>Tiếp tục</span>
                    <span className="material-symbols-outlined">arrow_forward</span>
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
                    onClick={handleBackToInfo}
                  >
                    ← Quay lại chỉnh sửa thông tin
                  </button>
                </form>
              )}

              {step === "password" && submitState !== "success" && (
                <form className="space-y-lg" onSubmit={handleSubmitPassword}>
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
                        placeholder="••••••••"
                        type={showPassword ? "text" : "password"}
                        autoComplete="new-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
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

                    {password.length > 0 && (
                      <div className="mt-1 space-y-1">
                        <div className="flex gap-1">
                          {[0, 1, 2, 3].map((i) => (
                            <div
                              key={i}
                              className={`h-1.5 flex-1 rounded-full transition-colors ${
                                i < passwordStrength.score
                                  ? passwordStrength.colorClass
                                  : "bg-outline-variant"
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

                  <div className="space-y-xs">
                    <label
                      className="ml-1 block font-label-md text-label-md text-on-surface-variant"
                      htmlFor="confirmPassword"
                    >
                      Xác nhận mật khẩu
                    </label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-lg text-outline">
                        lock
                      </span>
                      <input
                        className="w-full rounded-lg border border-outline-variant bg-surface py-3 pl-10 pr-10 font-body-md text-body-md text-on-surface outline-none transition-all placeholder:text-outline focus:border-transparent focus:ring-2 focus:ring-primary"
                        id="confirmPassword"
                        placeholder="••••••••"
                        type={showConfirmPassword ? "text" : "password"}
                        autoComplete="new-password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                      />
                      <button
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-outline transition-colors hover:text-on-surface"
                        type="button"
                        aria-label={showConfirmPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                        onClick={() => setShowConfirmPassword((current) => !current)}
                      >
                        <span className="material-symbols-outlined text-lg">
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

                  <div className="flex items-start gap-3 px-1">
                    <div className="flex h-5 items-center">
                      <input
                        className="h-4 w-4 rounded border-outline-variant text-primary accent-primary focus:ring-primary"
                        id="terms"
                        type="checkbox"
                        checked={agreedToTerms}
                        onChange={(e) => setAgreedToTerms(e.target.checked)}
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

import { useRef, useState } from "react";
import { useDialogA11y } from "../hooks/useDialogA11y";
import {
  submitWebFeedback,
  type WebFeedback,
  type WebFeedbackCategory,
} from "../services/api";
import { COMMENT_LIMIT, TITLE_LIMIT, WEB_FEEDBACK_CATEGORIES } from "../utils/webFeedback";

const NAME_LIMIT = 100;
const EMAIL_PATTERN = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

const RATING_LABELS = ["", "Rất tệ", "Chưa tốt", "Bình thường", "Hài lòng", "Rất hài lòng"];

type Props = {
  // Tên hiển thị của khách đã đăng nhập; không có nghĩa là khách vãng lai (cần nhập tên và email).
  accountName?: string | null;
  onClose: () => void;
  onSubmitted: (feedback: WebFeedback) => void;
  onLoginClick?: () => void;
};

type FieldErrors = Partial<Record<"rating" | "comment" | "title" | "name" | "email", string>>;

const inputClass =
  "w-full rounded-xl border bg-surface-container-lowest px-3.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary";

// Hộp thoại gửi đánh giá website. Gắn vào DOM chỉ khi đang mở nên mỗi lần mở là một biểu mẫu mới.
export default function WebFeedbackDialog({ accountName, onClose, onSubmitted, onLoginClick }: Props) {
  const isGuest = !accountName;
  const [rating, setRating] = useState(0);
  const [category, setCategory] = useState<WebFeedbackCategory>("GENERAL");
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  useDialogA11y(true, dialogRef, onClose);

  const validate = (): FieldErrors => {
    const next: FieldErrors = {};
    if (rating < 1) next.rating = "Vui lòng chọn số sao.";
    if (!comment.trim()) next.comment = "Vui lòng nhập nội dung đánh giá.";
    if (isGuest) {
      if (!name.trim()) next.name = "Vui lòng nhập tên của bạn.";
      if (!EMAIL_PATTERN.test(email.trim())) next.email = "Vui lòng nhập email hợp lệ.";
    }
    return next;
  };

  const submit = () => {
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    setBusy(true);
    setSubmitError(null);
    submitWebFeedback({
      rating,
      category,
      title: title.trim() || undefined,
      comment: comment.trim(),
      fullName: isGuest ? name.trim() : undefined,
      email: isGuest ? email.trim() : undefined,
    })
      .then(onSubmitted)
      .catch((err) => setSubmitError(err instanceof Error ? err.message : "Không gửi được đánh giá."))
      .finally(() => setBusy(false));
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-4">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="web-feedback-title"
        className="max-h-[92dvh] w-full max-w-[36rem] overflow-y-auto rounded-3xl bg-surface-container-lowest p-6 text-on-surface shadow-[0_30px_70px_-20px_rgba(0,0,0,0.55)] sm:p-7"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id="web-feedback-title" className="text-xl font-extrabold tracking-tight">
              Đánh giá Servio
            </h2>
            <p className="mt-1 text-[13px] text-on-surface-variant">
              {isGuest ? (
                <>
                  Bạn chưa đăng nhập.{" "}
                  {onLoginClick && (
                    <button type="button" onClick={onLoginClick} className="font-bold text-primary underline">
                      Đăng nhập
                    </button>
                  )}{" "}
                  để xem lại và xóa đánh giá của mình.
                </>
              ) : (
                <>
                  Gửi với tên <b>{accountName}</b>. Servio đọc mọi góp ý của bạn.
                </>
              )}
            </p>
          </div>
          <button
            type="button"
            aria-label="Đóng"
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container-low"
          >
            <span aria-hidden="true" className="material-symbols-outlined">
              close
            </span>
          </button>
        </div>

        <div className="mt-4 space-y-1">
          <span className="block text-[13px] font-bold" id="web-feedback-stars">
            Bạn chấm mấy sao?
          </span>
          <div role="radiogroup" aria-labelledby="web-feedback-stars" className="-ml-2 flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                role="radio"
                aria-checked={rating === star}
                aria-label={`${star} sao`}
                onClick={() => setRating(star)}
                className={`flex h-11 w-11 items-center justify-center rounded-xl ${
                  star <= rating ? "text-[#9a5b00]" : "text-[#c1c6d7]"
                }`}
              >
                <span
                  aria-hidden="true"
                  className="material-symbols-outlined text-[32px]"
                  style={{ fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}
                >
                  star
                </span>
              </button>
            ))}
          </div>
          <span className="block text-[13px] text-on-surface-variant" aria-live="polite">
            {rating > 0 ? `${RATING_LABELS[rating]} (${rating}/5)` : "Chạm vào sao để chọn"}
          </span>
          {errors.rating && <FieldError>{errors.rating}</FieldError>}
        </div>

        <div className="mt-4 space-y-1.5">
          <span className="block text-[13px] font-bold" id="web-feedback-category">
            Bạn muốn góp ý về
          </span>
          <div role="radiogroup" aria-labelledby="web-feedback-category" className="flex flex-wrap gap-2">
            {WEB_FEEDBACK_CATEGORIES.map((option) => (
              <button
                key={option.value}
                type="button"
                role="radio"
                aria-checked={category === option.value}
                onClick={() => setCategory(option.value)}
                className={`min-h-9 rounded-full border px-3.5 text-[13px] font-semibold ${
                  category === option.value
                    ? "border-primary bg-primary-fixed text-on-primary-fixed-variant"
                    : "border-outline-variant bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container-low"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {isGuest && (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label htmlFor="web-feedback-name" className="block text-[13px] font-bold">
                Tên của bạn <span aria-hidden="true" className="text-error">*</span>
              </label>
              <input
                id="web-feedback-name"
                value={name}
                maxLength={NAME_LIMIT}
                onChange={(e) => setName(e.target.value)}
                aria-invalid={Boolean(errors.name)}
                className={`${inputClass} min-h-11 ${errors.name ? "border-2 border-error" : "border-outline-variant"}`}
              />
              {errors.name && <FieldError>{errors.name}</FieldError>}
            </div>
            <div className="space-y-1.5">
              <label htmlFor="web-feedback-email" className="block text-[13px] font-bold">
                Email <span aria-hidden="true" className="text-error">*</span>
              </label>
              <input
                id="web-feedback-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-invalid={Boolean(errors.email)}
                className={`${inputClass} min-h-11 ${errors.email ? "border-2 border-error" : "border-outline-variant"}`}
              />
              {errors.email && <FieldError>{errors.email}</FieldError>}
            </div>
          </div>
        )}

        <div className="mt-4 space-y-1.5">
          <label htmlFor="web-feedback-title-input" className="block text-[13px] font-bold">
            Tiêu đề (không bắt buộc)
          </label>
          <input
            id="web-feedback-title-input"
            value={title}
            maxLength={TITLE_LIMIT}
            onChange={(e) => setTitle(e.target.value)}
            className={`${inputClass} min-h-11 border-outline-variant`}
          />
          <div className="flex justify-end text-xs text-on-surface-variant">
            {title.length} / {TITLE_LIMIT}
          </div>
        </div>

        <div className="mt-2 space-y-1.5">
          <label htmlFor="web-feedback-comment" className="block text-[13px] font-bold">
            Nội dung <span aria-hidden="true" className="text-error">*</span>
          </label>
          <textarea
            id="web-feedback-comment"
            rows={4}
            maxLength={COMMENT_LIMIT}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            aria-invalid={Boolean(errors.comment)}
            className={`${inputClass} resize-none py-3 leading-relaxed ${
              errors.comment ? "border-2 border-error" : "border-outline-variant"
            }`}
          />
          <div className="flex justify-between text-xs text-on-surface-variant">
            <span>Tối đa {COMMENT_LIMIT.toLocaleString("vi-VN")} ký tự.</span>
            <span aria-live="polite">
              {comment.length} / {COMMENT_LIMIT.toLocaleString("vi-VN")}
            </span>
          </div>
          {errors.comment && <FieldError>{errors.comment}</FieldError>}
        </div>

        <p className="mt-3 flex items-start gap-2.5 rounded-2xl bg-primary-fixed/60 px-3.5 py-3 text-[12.5px] leading-snug text-on-primary-fixed-variant">
          <span aria-hidden="true" className="material-symbols-outlined text-xl">
            {isGuest ? "lock" : "info"}
          </span>
          {isGuest
            ? "Email chỉ dùng để giới hạn số lần gửi (tối đa 3 đánh giá mỗi 24 giờ) và liên hệ lại khi cần, không hiển thị công khai."
            : "Đánh giá hiển thị công khai với tên được che bớt. Mỗi tài khoản gửi tối đa 3 đánh giá mỗi 24 giờ."}
        </p>

        {submitError && (
          <p role="alert" className="mt-3 text-sm text-error">
            {submitError}
          </p>
        )}

        <div className="mt-5 flex justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="min-h-11 rounded-xl border-[1.5px] border-outline-variant bg-surface-container-lowest px-5 text-sm font-bold hover:bg-surface-container-low disabled:opacity-60"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={busy}
            className="min-h-11 rounded-xl bg-primary px-5 text-sm font-bold text-on-primary disabled:opacity-60"
          >
            {busy ? "Đang gửi..." : "Gửi đánh giá"}
          </button>
        </div>
      </div>
    </div>
  );
}

function FieldError({ children }: { children: string }) {
  return (
    <p role="alert" className="flex items-center gap-1 text-xs text-error">
      <span aria-hidden="true" className="material-symbols-outlined text-base">
        error
      </span>
      {children}
    </p>
  );
}

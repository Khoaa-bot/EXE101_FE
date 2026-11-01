import { useState } from "react";
import { useSubscription } from "../../hooks/useSubscription";
import { formatVnd } from "../../utils/format";
import { PREMIUM_BENEFITS } from "./premiumPlans";

const BASIC_BENEFITS = [
  "Đặt lịch trực tuyến 24/7",
  "Theo dõi tiến độ bảo dưỡng",
  "Lịch sử dịch vụ và hoá đơn",
];

const FAQS = [
  {
    question: "Tôi gia hạn gói Premium như thế nào?",
    answer:
      "Bấm \"Gia hạn\" khi gói còn hạn. Thời hạn mới được cộng nối tiếp vào ngày hết hạn hiện tại nên bạn không mất ngày nào đã trả. Gói không tự động gia hạn.",
  },
  {
    question: "Dịch vụ cứu hộ 24/7 hoạt động ở những khu vực nào?",
    answer:
      "Mạng lưới cứu hộ của Servio phủ 63 tỉnh thành, với thời gian tiếp cận trung bình dưới 35 phút tại các đô thị lớn và tuyến quốc lộ chính.",
  },
  {
    question: "Chính sách hoàn tiền trong 7 ngày áp dụng như thế nào?",
    answer:
      "Trong 7 ngày đầu sau khi kích hoạt, nếu bạn chưa dùng quyền lợi cứu hộ khẩn cấp, bạn có thể liên hệ CSKH để được hoàn 100% phí gói.",
  },
  {
    question: "Một gói hội viên có áp dụng cho nhiều xe cùng lúc không?",
    answer:
      "Mỗi gói tiêu chuẩn gắn với một biển số xe. Với đội xe từ 3 chiếc trở lên, liên hệ Servio Fleet để nhận báo giá doanh nghiệp riêng.",
  },
];

type PremiumMemberPageProps = {
  onCheckoutClick: () => void;
};

export default function PremiumMemberPage({
  onCheckoutClick,
}: PremiumMemberPageProps) {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const { plan, status, isLoading, error } = useSubscription(false);
  const isActive = status?.isActive ?? false;
  const isExpired = status !== null && !isActive && status.subscriptionType !== "FREE";
  const expiryDate = status?.formattedExpiresAt?.split(" ")[0] ?? "";

  return (
    <div className="font-sans text-on-surface">
      <div className="mx-auto max-w-[1200px] space-y-5 p-margin-mobile pb-16 md:p-xl">
        <h2 className="pt-2 text-center text-2xl font-extrabold tracking-tight md:text-3xl">
          Nâng cấp gói của bạn
        </h2>
        {/* Hai gói, không dùng lưới ba thẻ bằng nhau */}
        <section
          id="premium-plans"
          aria-labelledby="premium-plans-title"
          className="scroll-mt-24"
        >
          <div className="mt-4 grid grid-cols-1 items-stretch gap-5 md:grid-cols-2">
            <article className="flex flex-col rounded-3xl border border-outline-variant/40 bg-surface-container-lowest p-5 md:p-6">
              <div className="flex items-start justify-between gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-container text-secondary">
                  <span
                    aria-hidden="true"
                    className="material-symbols-outlined text-[26px]"
                  >
                    commute
                  </span>
                </span>
                {!isActive && (
                  <span className="rounded-full bg-surface-container-high px-3 py-1 text-[11px] font-bold text-on-surface-variant">
                    Gói hiện tại
                  </span>
                )}
              </div>
              <h3 className="mt-4 text-xl font-extrabold">Gói Cơ bản</h3>
              <p className="mt-1 text-sm leading-relaxed text-on-surface-variant">
                Đủ cho nhu cầu đặt lịch và theo dõi xe hằng ngày.
              </p>
              <div className="mt-5 rounded-2xl bg-surface-container-low p-4">
                <p className="flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold tracking-tight">
                    0đ
                  </span>
                  <span className="text-sm text-outline">/tháng</span>
                </p>
                <p className="mt-1 text-xs text-outline">
                  Miễn phí trọn đời tài khoản
                </p>
              </div>
              <ul className="mt-5 space-y-2.5">
                {BASIC_BENEFITS.map((benefit) => (
                  <li
                    key={benefit}
                    className="flex items-start gap-2.5 text-sm"
                  >
                    <span
                      aria-hidden="true"
                      className="material-symbols-outlined mt-0.5 text-[18px] text-primary"
                    >
                      check_circle
                    </span>
                    {benefit}
                  </li>
                ))}
              </ul>
              <div className="mt-auto pt-6">
                <button
                  type="button"
                  disabled
                  className="min-h-12 w-full rounded-2xl border border-outline-variant bg-surface-container-low text-sm font-bold text-on-surface-variant disabled:cursor-not-allowed"
                >
                  {isActive ? "Gói miễn phí" : "Đang sử dụng"}
                </button>
              </div>
            </article>

            <article className="relative flex flex-col overflow-hidden rounded-3xl border-2 border-primary/60 bg-surface-container-lowest p-5 shadow-[0_22px_40px_-26px_rgba(0,89,187,0.55)] md:p-6">
              <span
                aria-hidden="true"
                className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-primary-fixed/60 blur-2xl"
              />
              <div className="relative flex items-start justify-between gap-3">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary-fixed text-primary">
                  <span
                    aria-hidden="true"
                    className="material-symbols-outlined text-[26px]"
                  >
                    workspace_premium
                  </span>
                </span>
                <span
                  className={`rounded-full px-3 py-1 text-[11px] font-bold ${
                    isActive
                      ? "bg-tertiary-fixed text-on-tertiary-fixed"
                      : "bg-primary-fixed text-primary"
                  }`}
                >
                  {isActive ? "Đang dùng" : isExpired ? "Đã hết hạn" : "Đề xuất"}
                </span>
              </div>
              <h3 className="relative mt-4 text-xl font-extrabold">Gói Premium</h3>
              <p className="relative mt-1 text-sm leading-relaxed text-on-surface-variant">
                Ưu tiên mọi dịch vụ, an tâm trên mọi cung đường.
              </p>
              {isActive && status && (
                <p
                  role="status"
                  className="relative mt-4 flex items-start gap-2 rounded-2xl bg-tertiary-fixed/40 px-3.5 py-3 text-sm font-semibold text-on-tertiary-fixed"
                >
                  <span
                    aria-hidden="true"
                    className="material-symbols-outlined text-[18px]"
                  >
                    check_circle
                  </span>
                  Đang dùng Premium · còn {status.subscriptionDaysRemaining} ngày,
                  hết hạn {status.formattedExpiresAt}
                </p>
              )}
              {isExpired && (
                <p
                  role="status"
                  className="relative mt-4 flex items-start gap-2 rounded-2xl bg-[#fff1cc] px-3.5 py-3 text-sm font-semibold text-[#6b4200]"
                >
                  <span
                    aria-hidden="true"
                    className="material-symbols-outlined text-[18px]"
                  >
                    schedule
                  </span>
                  Gói Premium đã hết hạn ngày {expiryDate}
                </p>
              )}
              <div className="relative mt-5 rounded-2xl bg-primary-fixed/30 p-4">
                {plan ? (
                  <>
                    <p className="flex flex-wrap items-baseline gap-1">
                      <span className="text-3xl font-extrabold tracking-tight text-primary">
                        {formatVnd(plan.effectivePrice)}
                      </span>
                      <span className="text-sm text-on-surface-variant">
                        / {plan.durationDays} ngày
                      </span>
                    </p>
                    <p className="mt-1 text-xs text-on-surface-variant">
                      Thanh toán một lần qua PayOS, không tự động gia hạn
                    </p>
                  </>
                ) : (
                  <p className={`text-sm ${error ? "text-error" : "text-on-surface-variant"}`}>
                    {isLoading ? "Đang tải giá gói..." : error ?? "Hiện chưa có gói để đăng ký."}
                  </p>
                )}
              </div>
              <ul className="relative mt-5 space-y-2.5">
                {PREMIUM_BENEFITS.map((benefit) => (
                  <li
                    key={benefit}
                    className="flex items-start gap-2.5 text-sm"
                  >
                    <span
                      aria-hidden="true"
                      className="material-symbols-outlined mt-0.5 text-[18px] text-primary"
                    >
                      check_circle
                    </span>
                    {benefit}
                  </li>
                ))}
              </ul>
              <div className="relative mt-auto pt-6">
                <button
                  type="button"
                  onClick={onCheckoutClick}
                  disabled={!plan}
                  className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-primary text-sm font-bold text-on-primary transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isActive
                    ? `Gia hạn thêm ${plan?.durationDays ?? 30} ngày`
                    : isExpired
                      ? "Đăng ký lại Premium"
                      : "Chọn gói Premium"}
                  <span
                    aria-hidden="true"
                    className="material-symbols-outlined text-[18px]"
                  >
                    arrow_forward
                  </span>
                </button>
                {isActive && (
                  <p className="mt-2 text-center text-[11px] text-outline">
                    Ngày gia hạn được cộng nối tiếp vào thời hạn hiện tại.
                  </p>
                )}
              </div>
            </article>
          </div>
        </section>

        {/* FAQ */}
        <section
          id="premium-faq"
          aria-labelledby="premium-faq-title"
          className="scroll-mt-24 rounded-3xl border border-outline-variant/40 bg-surface-container-lowest p-5 md:p-7"
        >
          <div className="max-w-2xl">
            <h2
              id="premium-faq-title"
              className="text-lg font-extrabold md:text-xl"
            >
              Câu hỏi thường gặp
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-on-surface-variant">
              Những điều cần biết trước khi nâng cấp gói hội viên.
            </p>
          </div>
          <div className="mt-5 space-y-2.5">
            {FAQS.map((faq, index) => {
              const isOpen = openFaq === index;
              const panelId = `premium-faq-panel-${index}`;
              return (
                <div
                  key={faq.question}
                  className={`overflow-hidden rounded-2xl transition-colors ${
                    isOpen ? "bg-primary-fixed/20" : "bg-surface-container-low"
                  }`}
                >
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    onClick={() => setOpenFaq(isOpen ? null : index)}
                    className="flex w-full items-center justify-between gap-4 px-4 py-3.5 text-left"
                  >
                    <span className="text-sm font-bold">{faq.question}</span>
                    <span
                      aria-hidden="true"
                      className={`material-symbols-outlined shrink-0 text-outline transition-transform duration-200 ${
                        isOpen ? "rotate-180" : ""
                      }`}
                    >
                      expand_more
                    </span>
                  </button>
                  <div id={panelId} hidden={!isOpen} className="px-4 pb-4">
                    <p className="text-sm leading-relaxed text-on-surface-variant">
                      {faq.answer}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}

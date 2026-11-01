import { useState } from "react";
import { useSubscription } from "../../hooks/useSubscription";
import { formatVnd } from "../../utils/format";
import { PREMIUM_BENEFITS } from "./premiumPlans";

const FAQS = [
  {
    question: "Dùng thử 7 ngày hoạt động thế nào?",
    answer:
      "Khi tài khoản Admin Garage được tạo, garage được dùng thử 7 ngày với đủ tính năng. Hết hạn dùng thử mà chưa mua gói thì garage ngừng nhận lịch mới và ẩn khỏi danh sách tìm garage; lịch đã có vẫn được xử lý. Mua gói lúc nào garage hoạt động lại lúc đó.",
  },
  {
    question: "Tôi gia hạn gói như thế nào?",
    answer:
      "Bấm \"Gia hạn\" khi gói còn hạn. Thời hạn mới được cộng nối tiếp vào ngày hết hạn hiện tại nên bạn không mất ngày nào đã trả, kể cả khi mua trong lúc còn dùng thử. Gói không tự động gia hạn.",
  },
  {
    question: "Chính sách hoàn tiền trong 7 ngày được áp dụng như thế nào?",
    answer:
      "Trong 7 ngày đầu sau khi đăng ký gói, nếu bạn chưa hài lòng với tính năng dịch vụ, bạn có thể liên hệ đội ngũ hỗ trợ đối tác của Servio để được hoàn 100% phí đăng ký.",
  },
  {
    question: "Gói này có áp dụng cho garage có nhiều chi nhánh không?",
    answer:
      "Mỗi gói tiêu chuẩn áp dụng cho một địa điểm garage. Với chuỗi garage từ 3 chi nhánh trở lên, vui lòng liên hệ đội ngũ Servio Partner để nhận chính sách và chiết khấu doanh nghiệp.",
  },
];

export type AdminPremiumMemberPageProps = {
  onCheckoutClick: () => void;
};

export default function AdminPremiumMemberPage({
  onCheckoutClick,
}: AdminPremiumMemberPageProps) {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const { plan, status, isLoading, error } = useSubscription(true);
  const isActive = status?.isActive ?? false;
  const isTrial = isActive && (status?.isTrial ?? false);
  const hasEverHadPlan = status !== null && status.subscriptionExpiresAt !== null;

  let badge = "Cần đăng ký";
  let badgeClass = "bg-primary-fixed text-primary";
  if (isTrial) {
    badge = "Đang dùng thử";
    badgeClass = "bg-[#fff1cc] text-[#6b4200]";
  } else if (isActive) {
    badge = "Đang dùng";
    badgeClass = "bg-tertiary-fixed text-on-tertiary-fixed";
  } else if (hasEverHadPlan) {
    badge = "Đã hết hạn";
    badgeClass = "bg-error-container text-error";
  }

  return (
    <div className="font-sans text-on-surface">
      <div className="mx-auto max-w-3xl space-y-5 p-margin-mobile pb-16 md:p-xl">
        <section id="premium-plans" aria-labelledby="premium-plans-title" className="scroll-mt-24">
          <article className="relative flex flex-col overflow-hidden rounded-3xl border-2 border-primary/60 bg-surface-container-lowest p-5 shadow-[0_22px_40px_-26px_rgba(0,89,187,0.55)] md:p-6">
            <span
              aria-hidden="true"
              className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-primary-fixed/60 blur-2xl"
            />
            <div className="relative flex items-start justify-between gap-3">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary-fixed text-primary">
                <span aria-hidden="true" className="material-symbols-outlined text-[26px]">
                  workspace_premium
                </span>
              </span>
              <span className={`rounded-full px-3 py-1 text-[11px] font-bold ${badgeClass}`}>{badge}</span>
            </div>
            <h2 id="premium-plans-title" className="relative mt-4 text-xl font-extrabold">
              Gói Garage
            </h2>
            <p className="relative mt-1 text-sm leading-relaxed text-on-surface-variant">
              Phí duy trì để garage hoạt động và nhận lịch trên Servio. Dùng thử 7 ngày khi mới tạo.
            </p>

            <div className="relative mt-5 rounded-2xl bg-primary-fixed/30 p-4">
              {plan ? (
                <>
                  <p className="flex flex-wrap items-baseline gap-1">
                    <span className="text-3xl font-extrabold tracking-tight text-primary">
                      {formatVnd(plan.effectivePrice)}
                    </span>
                    <span className="text-sm text-on-surface-variant">/ {plan.durationDays} ngày</span>
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
              {PREMIUM_BENEFITS.map((benefit: string) => (
                <li key={benefit} className="flex items-start gap-2.5 text-sm">
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

            {isActive && status?.partnerHotline && (
              <div className="relative mt-5 flex items-center gap-3 rounded-2xl bg-primary-fixed/40 px-4 py-3">
                <span
                  aria-hidden="true"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-on-primary"
                >
                  <span className="material-symbols-outlined text-[20px]">phone_in_talk</span>
                </span>
                <div>
                  <p className="text-xs text-on-surface-variant">Đường dây nóng đối tác</p>
                  <p className="text-lg font-extrabold text-primary">{status.partnerHotline}</p>
                </div>
              </div>
            )}

            <div className="relative mt-6">
              <button
                type="button"
                onClick={onCheckoutClick}
                disabled={!plan}
                className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-primary text-sm font-bold text-on-primary transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isActive && !isTrial
                  ? `Gia hạn thêm ${plan?.durationDays ?? 30} ngày`
                  : `Đăng ký gói ${plan ? formatVnd(plan.effectivePrice) : ""}`.trim()}
                <span aria-hidden="true" className="material-symbols-outlined text-[18px]">
                  arrow_forward
                </span>
              </button>
              {isActive && (
                <p className="mt-2 text-center text-[11px] text-outline">
                  Ngày đăng ký được cộng nối tiếp vào thời hạn hiện tại.
                </p>
              )}
            </div>
          </article>
        </section>

        {/* FAQ */}
        <section
          id="premium-faq"
          aria-labelledby="premium-faq-title"
          className="scroll-mt-24 rounded-3xl border border-outline-variant/40 bg-surface-container-lowest p-5 md:p-7"
        >
          <div className="max-w-2xl">
            <h2 id="premium-faq-title" className="text-lg font-extrabold md:text-xl">
              Câu hỏi thường gặp
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-on-surface-variant">
              Những điều cần biết về gói của garage.
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
                    <p className="text-sm leading-relaxed text-on-surface-variant">{faq.answer}</p>
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

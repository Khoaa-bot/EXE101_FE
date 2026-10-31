import { useState } from "react";
import { formatVnd } from "../../utils/format";
import {
  PREMIUM_BENEFITS,
  getPremiumPricing,
  type BillingCycle,
} from "./premiumPlans";

const BASIC_BENEFITS = [
  "Quản lý lịch hẹn và khách hàng cơ bản",
  "Hồ sơ garage trên bản đồ tìm kiếm Servio",
  "Quản lý kỹ thuật viên và tiếp nhận dịch vụ",
];

const FAQS = [
  {
    question: "Gói Premium Garage mang lại những quyền lợi nổi bật nào?",
    answer:
      "Garage của bạn sẽ được ưu tiên xuất hiện vị trí hàng đầu khi khách tìm kiếm trong khu vực, nhận huy hiệu xác thực Premium, mở rộng số lượng kỹ thuật viên điều phối không giới hạn, cùng các báo cáo tài chính và công cụ quản trị nâng cao.",
  },
  {
    question:
      "Tôi có thể nâng cấp hoặc chuyển đổi chu kỳ thanh toán bất kỳ lúc nào không?",
    answer:
      "Có. Khi chuyển đổi từ gói tháng sang gói năm, bạn sẽ được áp dụng ngay mức ưu đãi giảm 20% cho chu kỳ tiếp theo.",
  },
  {
    question: "Chính sách hoàn tiền trong 7 ngày được áp dụng như thế nào?",
    answer:
      "Trong 7 ngày đầu sau khi đăng ký gói Premium, nếu bạn chưa hài lòng với tính năng dịch vụ, bạn có thể liên hệ đội ngũ hỗ trợ đối tác của Servio để được hoàn 100% phí đăng ký.",
  },
  {
    question: "Gói này có áp dụng cho garage có nhiều chi nhánh không?",
    answer:
      "Mỗi gói tiêu chuẩn áp dụng cho một địa điểm garage. Với chuỗi garage từ 3 chi nhánh trở lên, vui lòng liên hệ đội ngũ Servio Partner để nhận chính sách và chiết khấu doanh nghiệp.",
  },
];

export type AdminPremiumMemberPageProps = {
  billingCycle: BillingCycle;
  onBillingCycleChange: (cycle: BillingCycle) => void;
  onCheckoutClick: () => void;
};

export default function AdminPremiumMemberPage({
  billingCycle,
  onBillingCycleChange,
  onCheckoutClick,
}: AdminPremiumMemberPageProps) {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const pricing = getPremiumPricing(billingCycle);

  return (
    <div className="font-sans text-on-surface">
      <div className="mx-auto max-w-[1200px] space-y-5 p-margin-mobile pb-16 md:p-xl">
        <h2 className="pt-2 text-center text-2xl font-extrabold tracking-tight md:text-3xl">
          Nâng cấp gói hội viên Garage
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
                    storefront
                  </span>
                </span>
                <span className="rounded-full bg-surface-container-high px-3 py-1 text-[11px] font-bold text-on-surface-variant">
                  Gói hiện tại
                </span>
              </div>
              <h3 className="mt-4 text-xl font-extrabold">Gói Cơ bản</h3>
              <p className="mt-1 text-sm leading-relaxed text-on-surface-variant">
                Đủ cho nhu cầu tiếp nhận lịch hẹn và quản lý garage thường nhật.
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
                  Đang sử dụng
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
                <div className="flex flex-col items-end gap-1">
                  <span className="text-[10px] font-semibold text-outline">
                    Chu kỳ thanh toán
                  </span>
                  <div
                    role="group"
                    aria-label="Chu kỳ thanh toán"
                    className="inline-flex rounded-full bg-surface-container p-0.5"
                  >
                    <button
                      type="button"
                      aria-pressed={billingCycle === "monthly"}
                      onClick={() => onBillingCycleChange("monthly")}
                      className={`min-h-9 rounded-full px-2.5 text-[11px] font-bold transition-colors ${
                        billingCycle === "monthly"
                          ? "bg-primary text-on-primary shadow-sm"
                          : "text-on-surface-variant hover:text-on-surface"
                      }`}
                    >
                      Tháng
                    </button>
                    <button
                      type="button"
                      aria-pressed={billingCycle === "yearly"}
                      onClick={() => onBillingCycleChange("yearly")}
                      className={`inline-flex min-h-9 items-center gap-1 rounded-full px-2.5 text-[11px] font-bold transition-colors ${
                        billingCycle === "yearly"
                          ? "bg-primary text-on-primary shadow-sm"
                          : "text-on-surface-variant hover:text-on-surface"
                      }`}
                    >
                      Năm
                      <span
                        className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold ${
                          billingCycle === "yearly"
                            ? "bg-white/20 text-on-primary"
                            : "bg-tertiary-fixed text-on-tertiary-fixed"
                        }`}
                      >
                        -20%
                      </span>
                    </button>
                  </div>
                </div>
              </div>
              <h3 className="relative mt-4 flex flex-wrap items-center gap-2 text-xl font-extrabold">
                Gói Premium Garage
                <span className="rounded-full bg-primary px-2.5 py-0.5 text-[10px] font-bold text-on-primary">
                  Đề xuất
                </span>
              </h3>
              <p className="relative mt-1 text-sm leading-relaxed text-on-surface-variant">
                Tối ưu vận hành, nâng cao doanh thu và tiếp cận tối đa khách hàng.
              </p>
              <div className="relative mt-5 rounded-2xl bg-primary-fixed/30 p-4">
                <p className="flex flex-wrap items-baseline gap-1">
                  <span className="text-3xl font-extrabold tracking-tight text-primary">
                    {formatVnd(pricing.monthlyEquivalent)}
                  </span>
                  <span className="text-sm text-on-surface-variant">
                    /tháng
                  </span>
                </p>
                <p className="mt-1 text-xs text-on-surface-variant">
                  {billingCycle === "yearly"
                    ? `Thanh toán ${formatVnd(pricing.total)} mỗi năm, tiết kiệm ${formatVnd(pricing.saving)}`
                    : "Thanh toán hằng tháng, huỷ bất cứ lúc nào"}
                </p>
              </div>
              <ul className="relative mt-5 space-y-2.5">
                {PREMIUM_BENEFITS.map((benefit: string) => (
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
                  className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-primary text-sm font-bold text-on-primary transition active:scale-[0.98]"
                >
                  Chọn gói Premium
                  <span
                    aria-hidden="true"
                    className="material-symbols-outlined text-[18px]"
                  >
                    arrow_forward
                  </span>
                </button>
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
              Những điều cần biết trước khi nâng cấp gói hội viên Garage.
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

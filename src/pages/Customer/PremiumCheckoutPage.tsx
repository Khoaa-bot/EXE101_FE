import { useState } from "react";
import { formatVnd } from "../../utils/format";
import {
  COMPARISON_GROUPS,
  PREMIUM_BENEFITS,
  getPremiumPricing,
  type BillingCycle,
} from "./premiumPlans";

type PremiumCheckoutPageProps = {
  billingCycle: BillingCycle;
  onBackClick: () => void;
};

export default function PremiumCheckoutPage({
  billingCycle,
  onBackClick,
}: PremiumCheckoutPageProps) {
  const [submittedSummary, setSubmittedSummary] = useState<string | null>(
    null,
  );
  const pricing = getPremiumPricing(billingCycle);
  const cycleLabel = billingCycle === "yearly" ? "12 tháng" : "1 tháng";
  const cycleNote =
    billingCycle === "yearly"
      ? `Thanh toán ${formatVnd(pricing.total)} mỗi năm, tiết kiệm ${formatVnd(pricing.saving)}`
      : "Thanh toán hằng tháng, huỷ bất cứ lúc nào";

  return (
    <div className="font-sans text-on-surface">
      <div className="mx-auto max-w-[1200px] space-y-5 p-margin-mobile pb-16 md:p-xl">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-2xl">
            <button
              type="button"
              onClick={onBackClick}
              className="inline-flex min-h-10 items-center gap-1.5 rounded-full pr-3 text-sm font-bold text-on-surface-variant transition-colors hover:text-primary"
            >
              <span
                aria-hidden="true"
                className="material-symbols-outlined text-[20px]"
              >
                arrow_back
              </span>
              Quay lại gói hội viên
            </button>
            <h2 className="mt-2 text-xl font-extrabold tracking-tight md:text-2xl">
              Hoàn tất đăng ký Premium
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-on-surface-variant">
              Kiểm tra quyền lợi và xác nhận chu kỳ thanh toán trước khi hoàn
              tất.
            </p>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full bg-primary-fixed px-3 py-1 text-[11px] font-bold text-primary">
            <span
              aria-hidden="true"
              className="material-symbols-outlined text-[16px] leading-none"
            >
              workspace_premium
            </span>
            Premium
          </span>
        </div>

        {/* Xác nhận và thanh toán */}
        <div className="grid grid-cols-1 items-stretch gap-5 lg:grid-cols-12">
          <section
  aria-labelledby="premium-confirm-title"
  className="flex flex-col rounded-3xl border border-outline-variant/40 bg-surface-container-lowest p-5 md:p-7 lg:col-span-7"
>
            <h3
              id="premium-confirm-title"
              className="text-lg font-extrabold md:text-xl"
            >
              Quyền lợi gói Premium
            </h3>
            <p className="mt-1 text-sm leading-relaxed text-on-surface-variant">
              {cycleNote}. Gói được kích hoạt sau khi Servio xác nhận.
            </p>

            <ul className="mt-5 grid grid-cols-1 gap-x-6 gap-y-2.5 sm:grid-cols-2">
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

            <div className="mt-auto grid grid-cols-1 gap-4 rounded-2xl bg-surface-container-low p-4 pt-4 sm:grid-cols-2">
              <div className="flex items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-tertiary-fixed text-on-tertiary-fixed">
                  <span
                    aria-hidden="true"
                    className="material-symbols-outlined text-[20px]"
                  >
                    security
                  </span>
                </span>
                <div>
                  <p className="text-sm font-bold">Bảo mật chuẩn PCI-DSS</p>
                  <p className="text-xs leading-relaxed text-on-surface-variant">
                    Thông tin giao dịch được mã hoá 256-bit.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-fixed text-primary">
                  <span
                    aria-hidden="true"
                    className="material-symbols-outlined text-[20px]"
                  >
                    published_with_changes
                  </span>
                </span>
                <div>
                  <p className="text-sm font-bold">Hoàn tiền trong 7 ngày</p>
                  <p className="text-xs leading-relaxed text-on-surface-variant">
                    Hoàn phí không điều kiện trong tuần đầu.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <aside
            aria-labelledby="premium-summary-title"
            className="rounded-3xl border border-outline-variant/40 bg-surface-container-lowest p-5 md:p-6 lg:sticky lg:top-24 lg:col-span-5"
          >
            <h3
              id="premium-summary-title"
              className="text-lg font-extrabold"
            >
              Tóm tắt đơn hàng
            </h3>

            <div className="mt-4 space-y-3 rounded-2xl bg-surface-container-low p-4 text-sm">
              <div className="flex items-start justify-between gap-3">
                <span className="text-on-surface-variant">Gói dịch vụ</span>
                <span className="text-right font-bold">Premium</span>
              </div>
              <div className="flex items-start justify-between gap-3">
                <span className="text-on-surface-variant">Chu kỳ</span>
                <span className="flex items-center gap-2 text-right">
                  {cycleLabel}
                  <button
                    type="button"
                    onClick={onBackClick}
                    className="text-[11px] font-bold text-primary underline underline-offset-2"
                  >
                    Đổi
                  </button>
                </span>
              </div>
              <div className="flex items-start justify-between gap-3">
                <span className="text-on-surface-variant">Đơn giá gốc</span>
                <span className="text-right text-on-surface-variant line-through opacity-70">
                  {formatVnd(pricing.original)}
                </span>
              </div>
              <div className="flex items-start justify-between gap-3 text-tertiary">
                <span>Ưu đãi</span>
                <span className="text-right font-bold">
                  {pricing.saving > 0
                    ? `-${formatVnd(pricing.saving)}`
                    : "0đ"}
                </span>
              </div>
              <div className="h-px bg-outline-variant/50" />
              <div className="flex items-baseline justify-between gap-3">
                <span className="font-bold">Tổng thanh toán</span>
                <span className="text-right text-2xl font-extrabold tracking-tight text-primary">
                  {formatVnd(pricing.total)}
                </span>
              </div>
            </div>

            {submittedSummary ? (
              <div
                role="status"
                className="mt-4 rounded-2xl bg-tertiary-fixed/40 p-4"
              >
                <p className="flex items-center gap-2 text-sm font-bold text-on-tertiary-fixed">
                  <span
                    aria-hidden="true"
                    className="material-symbols-outlined text-[20px]"
                  >
                    task_alt
                  </span>
                  Đã ghi nhận yêu cầu
                </p>
                <p className="mt-1 text-xs leading-relaxed text-on-surface-variant">
                  Gói Premium {submittedSummary}. Servio sẽ liên hệ xác nhận
                  trước khi kích hoạt.
                </p>
                <button
                  type="button"
                  onClick={() => setSubmittedSummary(null)}
                  className="mt-3 min-h-10 w-full rounded-xl border border-outline-variant bg-surface-container-lowest text-xs font-bold text-primary transition hover:bg-surface-container-low"
                >
                  Chọn lại
                </button>
              </div>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() =>
                    setSubmittedSummary(
                      `${cycleLabel.toLowerCase()} (${formatVnd(pricing.total)})`,
                    )
                  }
                  className="mt-4 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-primary text-sm font-bold text-on-primary transition active:scale-[0.98]"
                >
                  <span
                    aria-hidden="true"
                    className="material-symbols-outlined text-[18px]"
                  >
                    lock
                  </span>
                  Tiến hành thanh toán
                </button>
                <p className="mt-3 text-center text-[11px] leading-relaxed text-outline">
                  Khi tiếp tục, bạn đồng ý với Điều khoản dịch vụ và Chính sách
                  hội viên của Servio.
                </p>
              </>
            )}
          </aside>
        </div>

        {/* Bảng so sánh: nhóm nội dung, không kẻ viền từng dòng */}
        <section
          aria-labelledby="premium-compare-title"
          className="rounded-3xl border border-outline-variant/40 bg-surface-container-lowest p-5 md:p-7"
        >
          <div className="max-w-2xl">
            <h3
              id="premium-compare-title"
              className="text-lg font-extrabold md:text-xl"
            >
              So sánh quyền lợi
            </h3>
            <p className="mt-1 text-sm leading-relaxed text-on-surface-variant">
              Khác biệt rõ nhất giữa hai gói nằm ở quyền ưu tiên và hỗ trợ khẩn
              cấp.
            </p>
          </div>
          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[600px] border-collapse text-left text-sm">
              <caption className="sr-only">
                So sánh quyền lợi gói Cơ bản và Premium
              </caption>
              <thead>
                <tr className="text-xs font-bold uppercase tracking-wide text-on-surface-variant">
                  <th
                    scope="col"
                    className="w-1/2 rounded-l-2xl bg-surface-container-low px-4 py-3"
                  >
                    Quyền lợi
                  </th>
                  <th
                    scope="col"
                    className="w-1/4 bg-surface-container-low px-4 py-3 text-center"
                  >
                    Cơ bản
                  </th>
                  <th
                    scope="col"
                    className="w-1/4 rounded-r-2xl bg-primary-fixed/50 px-4 py-3 text-center text-primary"
                  >
                    Premium
                  </th>
                </tr>
              </thead>
              {COMPARISON_GROUPS.map((group) => (
                <tbody key={group.title}>
                  <tr>
                    <th
                      colSpan={3}
                      scope="colgroup"
                      className="rounded-2xl bg-surface-container-low/70 px-4 py-2.5 text-xs font-bold text-primary"
                    >
                      {group.title}
                    </th>
                  </tr>
                  {group.rows.map((row) => (
                    <tr
                      key={row.label}
                      className="transition-colors hover:bg-surface-container-low/50"
                    >
                      <td className="px-4 py-3 text-on-surface">{row.label}</td>
                      <td className="px-4 py-3 text-center">
                        {row.basic ? (
                          <span
                            aria-label="Có"
                            className="material-symbols-outlined text-[20px] text-primary"
                          >
                            check
                          </span>
                        ) : (
                          <span
                            aria-label="Không"
                            className="material-symbols-outlined text-[20px] text-outline"
                          >
                            remove
                          </span>
                        )}
                      </td>
                      <td className="bg-primary-fixed/15 px-4 py-3 text-center">
                        {row.premium ? (
                          <span
                            aria-label="Có"
                            className="material-symbols-outlined text-[20px] text-primary"
                          >
                            check
                          </span>
                        ) : (
                          <span
                            aria-label="Không"
                            className="material-symbols-outlined text-[20px] text-outline"
                          >
                            remove
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              ))}
            </table>
          </div>
        </section>

        
      </div>
    </div>
  );
}

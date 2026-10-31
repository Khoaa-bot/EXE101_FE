export type BillingCycle = "monthly" | "yearly";

export const PREMIUM_MONTHLY = 499000;
export const YEARLY_MONTHS = 12;
export const YEARLY_DISCOUNT = 0.2;

export type PremiumPricing = {
  original: number;
  total: number;
  saving: number;
  monthlyEquivalent: number;
};

export function getPremiumPricing(cycle: BillingCycle): PremiumPricing {
  const original =
    cycle === "yearly" ? PREMIUM_MONTHLY * YEARLY_MONTHS : PREMIUM_MONTHLY;
  const total =
    cycle === "yearly"
      ? Math.round(original * (1 - YEARLY_DISCOUNT))
      : original;

  return {
    original,
    total,
    saving: original - total,
    monthlyEquivalent: Math.round(
      total / (cycle === "yearly" ? YEARLY_MONTHS : 1),
    ),
  };
}

export const PREMIUM_BENEFITS = [
  "Ưu tiên hiển thị top tìm kiếm garage trong khu vực",
  "Huy hiệu Garage Premium xác thực tăng độ uy tín",
  "Tiếp nhận đặt lịch và điều phối nhân sự không giới hạn",
  "Báo cáo phân tích doanh thu và hiệu suất nâng cao",
  "Hỗ trợ tiếp thị và quảng bá chiến dịch khuyến mãi",
  "Hỗ trợ kỹ thuật 24/7 và đường dây nóng đối tác",
];

export const COMPARISON_GROUPS = [
  {
    title: "Hiển thị và tiếp cận khách hàng",
    rows: [
      { label: "Xuất hiện trên bản đồ tìm kiếm", basic: true, premium: true },
      {
        label: "Ưu tiên hiển thị top tìm kiếm khu vực",
        basic: false,
        premium: true,
      },
      {
        label: "Huy hiệu Garage Premium được xác thực",
        basic: false,
        premium: true,
      },
      {
        label: "Quảng bá chiến dịch khuyến mãi đến khách hàng",
        basic: false,
        premium: true,
      },
    ],
  },
  {
    title: "Vận hành và quản lý garage",
    rows: [
      { label: "Tiếp nhận và quản lý lịch hẹn trực tuyến", basic: true, premium: true },
      { label: "Điều phối kỹ thuật viên không giới hạn", basic: false, premium: true },
      { label: "Quản lý kho phụ tùng và xuất nhập tồn nâng cao", basic: false, premium: true },
      { label: "Báo cáo doanh thu và phân tích hiệu suất chuyên sâu", basic: false, premium: true },
    ],
  },
  {
    title: "Hỗ trợ và chi phí",
    rows: [
      { label: "Phí dịch vụ ưu đãi cho garage", basic: false, premium: true },
      { label: "Hỗ trợ kỹ thuật ưu tiên 24/7", basic: false, premium: true },
      { label: "Hoàn tiền gói trong 7 ngày dùng thử", basic: false, premium: true },
    ],
  },
];

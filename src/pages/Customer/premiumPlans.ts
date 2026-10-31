export type BillingCycle = "monthly" | "yearly";

export const PREMIUM_MONTHLY = 79000;
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
  "Khoang tiếp nhận ưu tiên FastTrack",
  "Cứu hộ đường bộ 24/7 toàn quốc",
  "Nhắc hẹn và chẩn đoán từ xa",
  "Giảm 10% phụ tùng chính hãng",
  "Miễn phí kiểm tra 30 điểm mỗi tháng",
  "Ưu tiên đặt lịch khung giờ cao điểm",
];

export const COMPARISON_GROUPS = [
  {
    title: "Đặt lịch và bảo dưỡng",
    rows: [
      { label: "Đặt lịch trực tuyến 24/7", basic: true, premium: true },
      {
        label: "Khoang tiếp nhận ưu tiên FastTrack",
        basic: false,
        premium: true,
      },
      { label: "Nhắc hẹn bảo dưỡng thông minh", basic: false, premium: true },
      { label: "Kiểm tra 30 điểm định kỳ", basic: false, premium: true },
    ],
  },
  {
    title: "Cứu hộ và hỗ trợ kỹ thuật",
    rows: [
      { label: "Tư vấn kỹ thuật qua chat", basic: true, premium: true },
      { label: "Cứu hộ đường bộ 24/7", basic: false, premium: true },
      { label: "Chẩn đoán lỗi từ xa", basic: false, premium: true },
    ],
  },
  {
    title: "Chi phí và ưu đãi",
    rows: [
      { label: "Ưu đãi phụ tùng chính hãng", basic: false, premium: true },
      { label: "Miễn phí huỷ lịch trong 2 giờ", basic: false, premium: true },
      { label: "Hoàn tiền gói trong 7 ngày", basic: false, premium: true },
    ],
  },
];

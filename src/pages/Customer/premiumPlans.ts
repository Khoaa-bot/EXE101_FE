// Hạn mức tin nhắn AI chẩn đoán mỗi ngày; khớp mặc định BE (servio.ai.daily-message-limit và
// servio.ai.premium-daily-message-limit). Đổi ở BE thì đổi ở đây.
export const AI_MESSAGES_FREE = 10;
export const AI_MESSAGES_PREMIUM = 100;

export const PREMIUM_BENEFITS = [
  `Trợ lý AI chẩn đoán lỗi xe: ${AI_MESSAGES_PREMIUM} tin nhắn mỗi ngày (gói miễn phí ${AI_MESSAGES_FREE})`,
];

export type ComparisonRow = {
  label: string;
  basic: boolean | string;
  premium: boolean | string;
};

export const COMPARISON_GROUPS: { title: string; rows: ComparisonRow[] }[] = [
  {
    title: "Đặt lịch và theo dõi",
    rows: [
      { label: "Đặt lịch trực tuyến 24/7", basic: true, premium: true },
      { label: "Nhắc hẹn bảo dưỡng định kỳ", basic: true, premium: true },
      { label: "Theo dõi tiến độ sửa chữa", basic: true, premium: true },
    ],
  },
  {
    title: "Chẩn đoán và hỗ trợ",
    rows: [
      { label: "Tư vấn kỹ thuật qua chat", basic: true, premium: true },
      {
        label: "Tin nhắn AI chẩn đoán mỗi ngày",
        basic: `${AI_MESSAGES_FREE} tin`,
        premium: `${AI_MESSAGES_PREMIUM} tin`,
      },
    ],
  },
  {
    title: "Chính sách",
    rows: [{ label: "Hoàn tiền gói trong 7 ngày", basic: false, premium: true }],
  },
];

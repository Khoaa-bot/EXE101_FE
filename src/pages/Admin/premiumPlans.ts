export const PREMIUM_BENEFITS = [
  "Huy hiệu Garage Pro trên danh sách và trang chi tiết garage",
  "Luôn xếp đầu danh sách tìm garage khi gói còn hạn",
];

export const COMPARISON_GROUPS = [
  {
    title: "Hiển thị với khách hàng",
    rows: [
      { label: "Xuất hiện trong danh sách tìm garage", basic: true, premium: true },
      { label: "Huy hiệu Garage Pro", basic: false, premium: true },
      { label: "Xếp đầu danh sách tìm garage", basic: false, premium: true },
    ],
  },
  {
    title: "Vận hành garage",
    rows: [
      { label: "Tiếp nhận và quản lý lịch hẹn trực tuyến", basic: true, premium: true },
      { label: "Tự tạo dịch vụ và các bước thực hiện", basic: true, premium: true },
    ],
  },
  {
    title: "Chính sách",
    rows: [
      { label: "Hoàn tiền gói trong 7 ngày dùng thử", basic: false, premium: true },
    ],
  },
];

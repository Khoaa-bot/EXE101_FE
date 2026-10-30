import type { WebFeedbackCategory } from "../services/api";

export const WEB_FEEDBACK_CATEGORIES: Array<{ value: WebFeedbackCategory; label: string }> = [
  { value: "GENERAL", label: "Chung" },
  { value: "BOOKING", label: "Đặt lịch" },
  { value: "UI_UX", label: "Giao diện" },
  { value: "PAYMENT", label: "Thanh toán" },
  { value: "SERVICE", label: "Dịch vụ garage" },
];

export function webFeedbackCategoryLabel(value: string | null | undefined) {
  return WEB_FEEDBACK_CATEGORIES.find((category) => category.value === value)?.label ?? "Chung";
}

// Khớp giới hạn của BE (WebFeedbackService).
export const COMMENT_LIMIT = 1000;
export const TITLE_LIMIT = 100;

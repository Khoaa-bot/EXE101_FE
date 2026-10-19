// Super Admin review history is deliberately isolated from api.ts for now.
// When the backend is ready, replace `getSuperAdminReviewHistory` with:
// GET /api/admin/reviews?q=&garageId=&rating=&fromDate=&toDate=&page=&size=
// and retain the exported types so the page does not need to change.

export type SuperAdminReview = {
  id: number;
  appointmentId: number;
  customerName: string;
  customerInitials: string;
  garageId: number;
  garageName: string;
  serviceName: string;
  rating: 1 | 2 | 3 | 4 | 5;
  comment: string;
  createdAt: string;
  reply?: string;
};

export type SuperAdminReviewFilters = {
  q?: string;
  garageId?: number;
  rating?: number;
  fromDate?: string;
  toDate?: string;
  page?: number;
  size?: number;
};

export type SuperAdminReviewHistoryPage = {
  items: SuperAdminReview[];
  total: number;
  page: number;
  size: number;
  averageRating: number;
  ratingCounts: Record<1 | 2 | 3 | 4 | 5, number>;
  source: "placeholder" | "api";
};

// Temporary representative data: remove once the API supplies live records.
const PLACEHOLDER_REVIEWS: SuperAdminReview[] = [
  { id: 1, appointmentId: 2184, customerName: "Nguyễn Minh Anh", customerInitials: "MA", garageId: 1, garageName: "Garage Thành Công", serviceName: "Bảo dưỡng định kỳ", rating: 5, comment: "Nhân viên tư vấn rõ ràng, xe làm xong đúng hẹn. Sẽ quay lại lần sau.", createdAt: "2026-10-17T09:40:00+07:00", reply: "Cảm ơn anh/chị đã tin tưởng Garage Thành Công." },
  { id: 2, appointmentId: 2180, customerName: "Trần Quốc Bảo", customerInitials: "TB", garageId: 2, garageName: "AutoCare Quận 7", serviceName: "Thay dầu & lọc nhớt", rating: 4, comment: "Dịch vụ ổn, chờ nhận xe hơi lâu vào giờ cao điểm.", createdAt: "2026-10-16T16:15:00+07:00" },
  { id: 3, appointmentId: 2177, customerName: "Lê Hoài Nam", customerInitials: "LN", garageId: 1, garageName: "Garage Thành Công", serviceName: "Kiểm tra hệ thống phanh", rating: 5, comment: "Kỹ thuật viên kiểm tra kỹ và giải thích dễ hiểu.", createdAt: "2026-10-15T14:10:00+07:00", reply: "Garage rất vui vì đã hỗ trợ được anh/chị." },
  { id: 4, appointmentId: 2172, customerName: "Phạm Thảo Vy", customerInitials: "PV", garageId: 3, garageName: "Garage Đức Phát", serviceName: "Sửa điều hòa", rating: 3, comment: "Xe hết lỗi nhưng thời gian báo giá ban đầu chưa sát.", createdAt: "2026-10-14T10:25:00+07:00" },
  { id: 5, appointmentId: 2165, customerName: "Đỗ Anh Khoa", customerInitials: "DK", garageId: 2, garageName: "AutoCare Quận 7", serviceName: "Cân chỉnh thước lái", rating: 4, comment: "Không gian chờ sạch sẽ, nhân viên thân thiện.", createdAt: "2026-10-12T11:55:00+07:00" },
];

export async function getSuperAdminReviewHistory(
  filters: SuperAdminReviewFilters = {},
): Promise<SuperAdminReviewHistoryPage> {
  const query = filters.q?.trim().toLocaleLowerCase("vi-VN") ?? "";
  const filtered = PLACEHOLDER_REVIEWS.filter((review) => {
    const searchable = `${review.customerName} ${review.garageName} ${review.serviceName} ${review.comment}`.toLocaleLowerCase("vi-VN");
    const reviewDate = review.createdAt.slice(0, 10);
    return (
      (!query || searchable.includes(query)) &&
      (!filters.garageId || review.garageId === filters.garageId) &&
      (!filters.rating || review.rating === filters.rating) &&
      (!filters.fromDate || reviewDate >= filters.fromDate) &&
      (!filters.toDate || reviewDate <= filters.toDate)
    );
  });
  const size = filters.size ?? 10;
  const page = filters.page ?? 0;
  const ratingCounts: Record<1 | 2 | 3 | 4 | 5, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  filtered.forEach((review) => { ratingCounts[review.rating] += 1; });
  const averageRating = filtered.length
    ? filtered.reduce((sum, review) => sum + review.rating, 0) / filtered.length
    : 0;

  return {
    items: filtered.slice(page * size, page * size + size),
    total: filtered.length,
    page,
    size,
    averageRating,
    ratingCounts,
    source: "placeholder",
  };
}

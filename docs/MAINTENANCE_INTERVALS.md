# Chu kỳ bảo dưỡng theo dịch vụ (đề xuất)

Dùng cho tính năng nhắc bảo dưỡng (bước 1 trong `AI_FEATURES_PLAN.md`).
Cột `interval_km` và `interval_months` sẽ được thêm vào bảng `services`. Để trống nghĩa là dịch vụ đó không nhắc theo mốc đó.
Nhắc khi xe đến hạn **km hoặc tháng, cái nào đến trước**.

## 1. Bảng đề xuất cho 5 dịch vụ hiện có

Các dịch vụ này đang được seed theo ID trong `DatabaseMigrationRunner.seedServiceSteps()`. Con số là mức phổ biến cho xe ô tô du lịch, **cần nhóm xác nhận**.

| ID | Dịch vụ | interval_km | interval_months | Ghi chú |
|---|---|---|---|---|
| 1 | Bảo dưỡng động cơ cơ bản (thay dầu, lọc dầu...) | 5.000 | 6 | Dầu tổng hợp hoàn toàn có thể kéo dài tới 10.000 km |
| 2 | Chăm sóc và cân bằng lốp | 10.000 | 6 | Đảo lốp định kỳ |
| 3 | Kiểm tra và bảo dưỡng phanh | 20.000 | 12 | Dầu phanh thường thay mỗi 24 tháng |
| 4 | Vệ sinh và chăm sóc toàn diện | (trống) | 3 | Chỉ theo thời gian, không theo km |
| 5 | Vệ sinh và bảo dưỡng điều hòa | 10.000 | 12 | Có thể rút còn 6 tháng ở nơi nhiều bụi |

## 2. Ngưỡng cảnh báo (đề xuất)

| Mức | Điều kiện |
|---|---|
| Sắp đến hạn | Còn ≤ 500 km hoặc ≤ 14 ngày |
| Quá hạn | Đã vượt km hoặc vượt ngày |

## 3. Nhóm cần cung cấp / xác nhận

- [ ] Xác nhận hoặc sửa các con số ở bảng mục 1.
- [ ] Danh sách dịch vụ chính thức trong DB (ID và tên). Dịch vụ nào do admin thêm sau đó thì mặc định không nhắc, cho đến khi điền chu kỳ.
- [ ] Có dịch vụ nào cần chu kỳ khác theo loại xe (xăng, dầu, xe điện) không? Bản đầu dùng chung một chu kỳ cho mọi xe.
- [ ] Ngưỡng cảnh báo ở mục 2 có hợp lý không.
- [ ] Xe chưa có lịch sử bảo dưỡng: cho khách tự nhập "lần bảo dưỡng gần nhất" khi thêm xe, hay chỉ nhắc sau lần đầu đến garage?
- [ ] Gửi email nhắc, hay chỉ thông báo trong app?

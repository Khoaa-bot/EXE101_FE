# Kế hoạch tích hợp AI cho Servio

Tài liệu này mô tả 3 tính năng mới: nhắc bảo dưỡng, AI chẩn đoán xe, AI gợi ý mua xe.
Chu kỳ bảo dưỡng cụ thể nằm ở `MAINTENANCE_INTERVALS.md`.

## 1. Hiện trạng

**Backend (Spring Boot)**
- `Vehicle` đã có model, năm, `odometer`, `lastCheck`. Chưa có hạn bảo dưỡng. `lastCheck` hiện chưa được gán ở đâu.
- `MaintenanceRecord` chỉ có `engineerNotes` và `partsUsed`. Chưa ghi số km hay loại dịch vụ.
- `Service` chỉ có `serviceName`, `duration`, `description`, `price`. Chưa có chu kỳ.
- `Notification` đã có loại `VEHICLE`. `EmailService` và `@Scheduled` (trong `AutoScheduleTask`) đã có sẵn.
- Chưa có tích hợp LLM nào.

**Frontend (React + TypeScript)**
- Đã có `ProfilePage` (có `VehicleCard`), `AddVehiclePage`, `NotificationsPage`, `HomePage`, `BookingPage`.
- `api.ts` đã có `getMyFleet`, `updateVehicle`, type `Vehicle`.

## 2. Ba tính năng

### 2.1. Nhắc bảo dưỡng (làm trước, chi tiết ở mục 5)
Không cần AI, chỉ cần quy tắc và scheduler.

### 2.2. AI chẩn đoán xe
**Đầu vào:** mô tả triệu chứng, ảnh tùy chọn (đèn báo lỗi, rò rỉ), dữ liệu xe (model, năm, km, lịch sử bảo dưỡng).

**Đầu ra (JSON có cấu trúc)**
- Các nguyên nhân khả dĩ, kèm mức độ (Thấp, Trung bình, Khẩn).
- Có nên dừng xe hay không.
- Dịch vụ gợi ý lấy từ catalog `Service` của hệ thống.
- Nút đặt lịch với dịch vụ đã chọn sẵn.

Luôn hiển thị cảnh báo: "Chỉ mang tính tham khảo, cần kỹ thuật viên kiểm tra."

**Giao diện FE:** trang `/diagnose` dạng chat, hoặc nút "Chẩn đoán AI" trong chi tiết xe.

### 2.3. AI gợi ý mua xe
**Đầu vào:** ngân sách, nhu cầu (đi phố, đi xa, gia đình), nhiên liệu, số chỗ, xe đang dùng.

**Đầu ra:** 3 đến 5 mẫu xe kèm lý do và chi phí bảo dưỡng ước tính.

LLM dễ bịa giá và thông số. Vì vậy AI chỉ được chọn từ bảng `car_catalog` do nhóm nhập (dữ liệu thật), không tự nghĩ ra xe.

## 3. Phương án kỹ thuật cho phần AI

| | A. LLM API từ backend (đề xuất) | B. Rule-based | C. Model tự host |
|---|---|---|---|
| Cách làm | Spring gọi Claude API, trả JSON qua `/api/ai/*` | Cây quyết định triệu chứng → lỗi | Ollama hoặc model mã nguồn mở |
| Ưu điểm | Nhanh, chất lượng cao, hiểu tiếng Việt và ảnh | Miễn phí, dễ đoán | Không tốn phí API |
| Nhược điểm | Tốn tiền theo lượt, cần quản lý key | Cứng nhắc | Cần GPU, chất lượng thấp hơn |

**Chọn A.** Lưu ý khi làm:
- API key chỉ nằm ở backend, không để lộ ở FE.
- Giới hạn số lượt gọi mỗi người dùng.
- Ép đầu ra theo JSON schema.
- Lưu lịch sử vào bảng `ai_diagnoses` để tra cứu và kiểm soát chi phí.

## 4. API đề xuất

| Method | Endpoint | Mô tả |
|---|---|---|
| GET | `/api/vehicles/my-fleet/maintenance-status` | Trạng thái bảo dưỡng của mọi xe của tôi |
| GET | `/api/vehicles/{id}/maintenance-status` | Trạng thái bảo dưỡng của một xe |
| POST | `/api/ai/diagnose` | Chẩn đoán từ triệu chứng (và ảnh) |
| POST | `/api/ai/recommend-car` | Gợi ý xe theo nhu cầu |

Cập nhật số km dùng lại `PUT /api/vehicles/{id}` đã có.

## 5. Chi tiết bước 1: Nhắc bảo dưỡng

### Phát hiện khi đọc code
- Hoàn thành lịch hẹn có hai chỗ trong `EngineerService`: `completeJob` (khoảng dòng 200) và hàm cập nhật trạng thái (khoảng dòng 301-335). Hook ghi nhận bảo dưỡng phải gọi từ cả hai, nên gom vào một method.
- Hệ thống đang lẫn các trạng thái `completed`, `successed`, `successful`.
- Km của xe chỉ đổi khi khách gõ tay (`VehicleService`).

### Mô hình dữ liệu
- **`services`** thêm `interval_km INT NULL`, `interval_months INT NULL`. Để trống nghĩa là không nhắc.
- **`vehicle_service_reminders`** (bảng mới, duy nhất theo cặp xe và dịch vụ): `vehicle_id`, `service_id`, `last_service_km`, `last_service_date`, `next_due_km`, `next_due_date`, `notified_stage` (`NONE`, `SOON`, `OVERDUE`), `updated_at`.
- **`maintenance_records`** thêm `odometer_at_service INT NULL`. Nếu thợ không nhập thì lấy `Vehicle.odometer` lúc hoàn thành.

Bản đầu chưa ước tính km theo tháng. Dùng `odometer` khách nhập cộng với mốc theo ngày.

### Backend

| # | Việc |
|---|---|
| B1 | Migration cột mới trong `DatabaseMigrationRunner`. Xác nhận `ddl-auto` để biết bảng mới tự tạo hay phải viết `CREATE TABLE`. Seed chu kỳ theo `MAINTENANCE_INTERVALS.md`. |
| B2 | Entity `VehicleServiceReminder` và repository. |
| B3 | `MaintenanceReminderService.recordService(appointment, km)`: tính `next_due`, upsert, đặt `notified_stage = NONE`. |
| B4 | Gọi B3 từ hai chỗ hoàn thành lịch hẹn trong `EngineerService`, đồng thời cập nhật `Vehicle.lastCheck` và `odometer`. |
| B5 | Scheduler `@Scheduled` chạy 8h sáng giờ Asia/Ho_Chi_Minh trong lớp mới `MaintenanceReminderTask`. |
| B6 | Hai endpoint `maintenance-status` ở mục 4, có kiểm tra quyền sở hữu xe. |

**Quy tắc scheduler**
- `SOON`: còn ≤ 500 km hoặc ≤ 14 ngày. Gửi thông báo (và email nếu bật).
- `OVERDUE`: đã quá hạn km hoặc ngày. Gửi lại một lần khi chuyển từ `SOON`.
- Mỗi mức chỉ gửi một lần nhờ `notified_stage`. Đặt lại `NONE` khi xe bảo dưỡng xong.
- Thông báo dùng `NotificationService.notify(..., NotificationType.VEHICLE)`.

### Frontend

| # | Việc |
|---|---|
| F0 | Mockup giao diện, duyệt trước khi sửa `src/`. |
| F1 | Type `MaintenanceStatus` và hàm `getFleetMaintenanceStatus()` trong `api.ts`. |
| F2 | Badge trạng thái (Tốt, Sắp đến hạn, Quá hạn) và "còn X km / Y ngày" trên `VehicleCard` (`ProfilePage`). |
| F3 | Banner nhắc ở `HomePage` kèm nút "Đặt lịch ngay" dẫn sang `BookingPage`. |
| F4 | `NotificationsPage` hiển thị thông báo loại `VEHICLE` đúng icon, có link đặt lịch. |
| F5 | Cho khách cập nhật số km nhanh, dùng lại `updateVehicle`. |

### Thứ tự làm
1. Duyệt mockup (F0) và chốt các câu hỏi ở mục 7.
2. BE: B1 → B2 → B3 → B4 → B6 → B5, rồi kiểm thử.
3. FE: F1 → F2 → F3 → F4 → F5, rồi chạy thử tay toàn luồng.

### Kiểm thử
- Unit: tính `next_due`, ranh giới `SOON`/`OVERDUE` (đúng 500 km, đúng 14 ngày), không gửi lặp, đặt lại sau khi bảo dưỡng, dịch vụ có chu kỳ trống thì bỏ qua.
- Tích hợp: hoàn thành lịch hẹn bằng cả hai đường đều tạo hoặc cập nhật reminder.
- Quyền: khách A không xem được trạng thái xe của khách B.
- Thủ công: tạo xe, hoàn thành lịch hẹn, chỉnh ngày hoặc km trong DB, chạy scheduler, kiểm tra thông báo và email.

### Rủi ro
- Xe chưa có lịch sử sẽ không có nhắc nhở cho đến lần bảo dưỡng đầu.
- Hook B4 phải bắt đúng trạng thái hoàn thành.
- Nếu chạy nhiều instance backend thì scheduler gửi trùng.

## 6. Thứ tự toàn bộ

1. **Nhắc bảo dưỡng** (mục 5).
2. **AI chẩn đoán**: endpoint, prompt, trang chat.
3. **Gợi ý mua xe**: bảng `car_catalog`, AI chọn từ bảng đó.
4. **Hoàn thiện**: giới hạn lượt, log, nút feedback "Chẩn đoán có đúng không?".

## 7. Cần nhóm thống nhất

- Chu kỳ bảo dưỡng từng dịch vụ (xem `MAINTENANCE_INTERVALS.md`).
- Xe chưa có lịch sử: cho khách tự nhập lần bảo dưỡng gần nhất, hay chỉ nhắc sau lần đầu đến garage?
- Gửi email nhắc, hay chỉ thông báo trong app?
- Dùng phương án A (Claude API) không, và ai giữ API key?
- Dữ liệu `car_catalog`: ai chuẩn bị, hay tạo bộ dữ liệu mẫu?
- Ngân sách tối đa cho chi phí API mỗi tháng?

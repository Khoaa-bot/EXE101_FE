const API_BASE_URL =
  import.meta.env.VITE_API_URL || "https://exe101-be.onrender.com/api";

export type LoginPayload = {
  username: string;
  password: string;
};

export type RegisterPayload = LoginPayload & {
  phone: string;
  email: string;
  dob: string;
};

export type AuthSession = {
  token: string;
  username: string;
  role: string;
  id: number;
};

export function getStoredAuthSession(): AuthSession | null {
  try {
    const storedSession = localStorage.getItem("auth_session");
    return storedSession ? (JSON.parse(storedSession) as AuthSession) : null;
  } catch {
    return null;
  }
}

type ApiErrorBody = {
  message?: string;
  error?: string;
  errors?: Record<string, string>;
};

async function request<T>(path: string, body: LoginPayload | RegisterPayload) {
  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error("Không thể kết nối đến máy chủ. Vui lòng thử lại.");
  }

  const data = (await response.json().catch(() => null)) as
    | T
    | ApiErrorBody
    | null;

  if (!response.ok) {
    const error = data as ApiErrorBody | null;
    throw new Error(error?.message || error?.error || "Yêu cầu không thành công.");
  }

  return data as T;
}

export function login(payload: LoginPayload) {
  return request<AuthSession>("/auth/login", payload);
}

export function register(payload: RegisterPayload) {
  return request("/auth/register", payload);
}

export async function checkDbConnection() {
  try {
    const response = await fetch(`${API_BASE_URL}/db-check`);
    return await response.json();
  } catch (error) {
    console.error('API connection error:', error);
    return { success: false, error: 'Could not connect to backend server' };
  }
}

// ---------------------------------------------------------------------------
// Vehicles — VehicleController (@RequestMapping("/api/vehicles")) bên backend
// Spring Boot (repo EXE101_BE). Các endpoint ghi (POST/PUT/DELETE) và hầu hết
// endpoint đọc đều cần đăng nhập, nên hàm dưới đây tự đính kèm
// Authorization: Bearer từ session đã lưu.
// Lưu ý: backend chỉ lưu vin / model / color / odometer, KHÔNG có field
// "biển số xe" riêng — tên thương hiệu (brand) được gộp chung vào "model".
// ---------------------------------------------------------------------------

export type Vehicle = {
  id: number;
  customerId: number;
  vin: string;
  model: string;
  color: string;
  odometer: number;
  lastCheck: string | null;
  createdAt: string;
};

export type NewVehiclePayload = {
  customerId: number;
  vin: string;
  model: string;
  color: string;
  odometer?: number;
};

export type UpdateVehiclePayload = {
  color?: string;
  odometer?: number;
};

type VehicleRequestOptions = {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: unknown;
  query?: Record<string, string | number | undefined>;
};

async function vehicleRequest<T>(
  path: string,
  { method = "GET", body, query }: VehicleRequestOptions = {},
): Promise<T> {
  const session = getStoredAuthSession();
  const headers: Record<string, string> = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (session?.token) headers["Authorization"] = `Bearer ${session.token}`;

  const url = new URL(`${API_BASE_URL}/vehicles${path}`);
  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined) url.searchParams.set(key, String(value));
    });
  }

  let response: Response;
  try {
    response = await fetch(url.toString(), {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error("Không thể kết nối đến máy chủ. Vui lòng thử lại.");
  }

  if (response.status === 204) return undefined as T;

  const data = (await response.json().catch(() => null)) as T | ApiErrorBody | null;

  if (!response.ok) {
    const error = data as ApiErrorBody | null;
    throw new Error(error?.message || error?.error || "Yêu cầu không thành công.");
  }

  return data as T;
}

// POST /api/vehicles — thêm xe mới (customer/reception).
export function addVehicle(payload: NewVehiclePayload) {
  return vehicleRequest<Vehicle>("", { method: "POST", body: payload });
}

// PUT /api/vehicles/{id} — sửa màu sắc / số km của một xe.
export function updateVehicle(vehicleId: number | string, payload: UpdateVehiclePayload) {
  return vehicleRequest<Vehicle>(`/${vehicleId}`, { method: "PUT", body: payload });
}

// DELETE /api/vehicles/{id} — xoá một xe (chủ xe hoặc admin).
export function deleteVehicle(vehicleId: number | string) {
  return vehicleRequest<string>(`/${vehicleId}`, { method: "DELETE" });
}

// GET /api/vehicles/my-fleet — danh sách xe của khách hàng đang đăng nhập.
export function getMyFleet() {
  return vehicleRequest<Vehicle[]>("/my-fleet");
}

// GET /api/vehicles/{id} — chi tiết một xe.
export function getVehicleDetail(vehicleId: number | string) {
  return vehicleRequest<Vehicle>(`/${vehicleId}`);
}

// GET /api/vehicles/customer/{customerId} — danh sách xe của một khách hàng
// cụ thể (dùng cho lễ tân/kỹ thuật viên tra cứu).
export function getCustomerVehicles(customerId: number | string) {
  return vehicleRequest<Vehicle[]>(`/customer/${customerId}`);
}

// GET /api/vehicles — nếu truyền customerId thì trả về xe của khách đó; nếu
// không truyền, backend tự suy ra theo role đang đăng nhập (customer -> xe
// của chính mình, reception/admin/engineer -> toàn bộ xe).
export function getVehicles(customerId?: number | string) {
  return vehicleRequest<Vehicle[]>("", { query: { customerId } });
}

// ---------------------------------------------------------------------------
// Appointments & Reviews — CustomerController (@RequestMapping("/api")) bên
// backend. Tất cả endpoint này đều cần đăng nhập (role customer) và backend
// tự xác định khách hàng qua principal, không cần truyền customerId.
// ---------------------------------------------------------------------------

export type AppointmentStatus =
  | "PENDING"
  | "CONFIRMED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED"
  | string;

export type AppointmentRequest = {
  vehicleId: number;
  serviceId: number;
  scheduleId: number;
  notes?: string;
};

export type AppointmentDto = {
  id: number;
  customerId: number;
  customerName: string;
  vehicleId: number;
  vehicleModel: string;
  vehicleVin: string;
  serviceId: number;
  serviceName: string;
  servicePrice: number;
  scheduleId: number;
  scheduleDate: string;
  timeFrame: string;
  garageId: number;
  garageName: string;
  engineerName: string | null;
  status: AppointmentStatus;
  notes: string | null;
  engineerNotes: string | null;
  partsUsed: string | null;
  createdAt: string;
};

export type ReviewRequest = {
  appointmentId: number;
  rating: number;
  comment?: string;
};

export type Review = {
  id: number;
  appointmentId: number;
  rating: number;
  comment: string | null;
  createdAt: string;
};

type ApiRequestOptions = {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: unknown;
  query?: Record<string, string | number | undefined>;
};

// Helper dùng chung cho các route nằm trực tiếp dưới /api (không có tiền tố
// như /vehicles), ví dụ /api/appointments, /api/reviews.
async function apiRequest<T>(
  path: string,
  { method = "GET", body, query }: ApiRequestOptions = {},
): Promise<T> {
  const session = getStoredAuthSession();
  const headers: Record<string, string> = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (session?.token) headers["Authorization"] = `Bearer ${session.token}`;

  const url = new URL(`${API_BASE_URL}${path}`);
  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined) url.searchParams.set(key, String(value));
    });
  }

  let response: Response;
  try {
    response = await fetch(url.toString(), {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error("Không thể kết nối đến máy chủ. Vui lòng thử lại.");
  }

  if (response.status === 204) return undefined as T;

  const data = (await response.json().catch(() => null)) as T | ApiErrorBody | null;

  if (!response.ok) {
    const error = data as ApiErrorBody | null;
    throw new Error(error?.message || error?.error || "Yêu cầu không thành công.");
  }

  return data as T;
}

// POST /api/appointments — đặt lịch hẹn mới (cần vehicleId/serviceId/scheduleId).
export function createAppointment(payload: AppointmentRequest) {
  return apiRequest<AppointmentDto>("/appointments", { method: "POST", body: payload });
}

// GET /api/appointments/status — các lịch hẹn đang hoạt động của khách hàng
// đang đăng nhập (dùng cho trang Tracking).
export function getActiveAppointments() {
  return apiRequest<AppointmentDto[]>("/appointments/status");
}

// GET /api/appointments/history — lịch sử lịch hẹn của khách hàng đang đăng
// nhập (dùng cho trang History).
export function getAppointmentHistory() {
  return apiRequest<AppointmentDto[]>("/appointments/history");
}

// POST /api/reviews — đánh giá một lịch hẹn đã hoàn thành.
export function createReview(payload: ReviewRequest) {
  return apiRequest<Review>("/reviews", { method: "POST", body: payload });
}

// ---------------------------------------------------------------------------
// Garages — GarageController (@RequestMapping("/api/garages")).
// GET là public, POST cần role admin/reception (backend tự kiểm tra).
// ---------------------------------------------------------------------------

export type Garage = {
  id: number;
  name: string;
  address: string;
  phone?: string;
  description?: string;
  rating?: number;
};

export type NewGaragePayload = {
  name: string;
  address: string;
  phone?: string;
  description?: string;
};

// POST /api/garages — tạo garage mới.
export function createGarage(payload: NewGaragePayload) {
  return apiRequest<Garage>("/garages", { method: "POST", body: payload });
}

// GET /api/garages — danh sách toàn bộ garage.
export function getGarages() {
  return apiRequest<Garage[]>("/garages");
}

// GET /api/garages/{id} — chi tiết một garage.
export function getGarageById(garageId: number | string) {
  return apiRequest<Garage>(`/garages/${garageId}`);
}

// ---------------------------------------------------------------------------
// Services — ServiceController (@RequestMapping("/api/services")).
// ---------------------------------------------------------------------------

export type MaintenanceService = {
  id: number;
  name: string;
  price: number;
  description?: string;
  duration?: number;
};

export type NewServicePayload = {
  name: string;
  price: number;
  description?: string;
};

// POST /api/services — thêm dịch vụ mới.
export function addService(payload: NewServicePayload) {
  return apiRequest<MaintenanceService>("/services", { method: "POST", body: payload });
}

// GET /api/services — danh sách toàn bộ dịch vụ (dùng để chọn khi đặt lịch).
export function getAllServices() {
  return apiRequest<MaintenanceService[]>("/services");
}

// ---------------------------------------------------------------------------
// Schedules & TimeFrames — ScheduleController (@RequestMapping("/api/schedules")).
// Thêm lịch (POST) cần đăng nhập admin/lễ tân của garage (backend tự lấy
// garageId từ principal). Xem lịch (GET) không bắt buộc garageId.
// ---------------------------------------------------------------------------

export type TimeFrame = {
  id: number;
  startTime: string;
  endTime: string;
  garageId?: number;
};

export type NewTimeFramePayload = {
  startTime: string;
  endTime: string;
};

export type Schedule = {
  id: number;
  date: string;
  timeFrame: string;
  garageId: number;
  garageName?: string;
  available?: boolean;
};

export type NewSchedulePayload = {
  date: string;
  timeFrameId: number;
};

// POST /api/schedules — tạo lịch làm việc mới cho garage.
export function addSchedule(payload: NewSchedulePayload) {
  return apiRequest<Schedule>("/schedules", { method: "POST", body: payload });
}

// POST /api/schedules/time-frames — tạo khung giờ mới cho garage.
export function addTimeFrame(payload: NewTimeFramePayload) {
  return apiRequest<TimeFrame>("/schedules/time-frames", { method: "POST", body: payload });
}

// GET /api/schedules — danh sách lịch (lọc theo garageId nếu có).
export function getSchedules(garageId?: number | string) {
  return apiRequest<Schedule[]>("/schedules", { query: { garageId } });
}

// GET /api/schedules/available — danh sách lịch còn trống (dùng khi đặt lịch).
export function getAvailableSchedules(garageId?: number | string) {
  return apiRequest<Schedule[]>("/schedules/available", { query: { garageId } });
}

// GET /api/schedules/time-frames — danh sách khung giờ (lọc theo garageId nếu có).
export function getTimeFrames(garageId?: number | string) {
  return apiRequest<TimeFrame[]>("/schedules/time-frames", { query: { garageId } });
}

export default {
  checkDbConnection,
};

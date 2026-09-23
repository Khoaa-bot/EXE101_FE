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
  year: number | null;
  licensePlate: string | null;
  color: string;
  odometer: number;
  imageUrl: string | null;
  lastCheck: string | null;
  createdAt: string;
};

export type NewVehiclePayload = {
  customerId: number;
  vin: string;
  model: string;
  year?: number;
  licensePlate: string;
  color: string;
  odometer?: number;
};

export type UpdateVehiclePayload = {
  year?: number;
  licensePlate?: string;
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

// POST /api/vehicles/{id}/image — tải lên / thay ảnh xe (multipart/form-data).
// Backend lưu ảnh trên Cloudinary rồi trả về Vehicle với imageUrl đã cập nhật.
export async function uploadVehicleImage(
  vehicleId: number | string,
  file: File,
): Promise<Vehicle> {
  const session = getStoredAuthSession();
  const headers: Record<string, string> = {};
  if (session?.token) headers["Authorization"] = `Bearer ${session.token}`;

  const formData = new FormData();
  formData.append("file", file);

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/vehicles/${vehicleId}/image`, {
      method: "POST",
      headers,
      body: formData,
    });
  } catch {
    throw new Error("Không thể kết nối đến máy chủ. Vui lòng thử lại.");
  }

  const data = (await response.json().catch(() => null)) as Vehicle | ApiErrorBody | null;

  if (!response.ok) {
    const error = data as ApiErrorBody | null;
    throw new Error(error?.message || error?.error || "Tải ảnh lên không thành công.");
  }

  return data as Vehicle;
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
  customerPhone: string | null;
  customerEmail: string | null;
  vehicleId: number;
  vehicleModel: string;
  vehicleVin: string;
  vehicleLicensePlate: string | null;
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

// ---------------------------------------------------------------------------
// Engineer — EngineerController (@RequestMapping("/api/engineer")).
// ---------------------------------------------------------------------------

export type EngineerDashboard = {
  engineerId: number;
  engineerName: string;
  appointments: AppointmentDto[];
};

export type EngineerAppointmentUpdatePayload = {
  status?: string;
  notes?: string;
  engineerNotes?: string;
  partsUsed?: string;
};

// GET /api/engineer/dashboard — danh sách công việc của kỹ thuật viên đang
// đăng nhập.
export function getEngineerDashboard() {
  return apiRequest<EngineerDashboard>("/engineer/dashboard");
}

// GET /api/engineer/appointments/{id} — chi tiết một lịch hẹn.
export function getEngineerAppointmentDetail(appointmentId: number | string) {
  return apiRequest<AppointmentDto>(`/engineer/appointments/${appointmentId}`);
}

// PUT /api/engineer/appointments/{id} — cập nhật trạng thái/ghi chú công
// việc (chỉ kỹ thuật viên được giao mới cập nhật được).
export function updateEngineerAppointment(
  appointmentId: number | string,
  payload: EngineerAppointmentUpdatePayload,
) {
  return apiRequest<AppointmentDto>(`/engineer/appointments/${appointmentId}`, {
    method: "PUT",
    body: payload,
  });
}

// POST /api/reviews — đánh giá một lịch hẹn đã hoàn thành.
export function createReview(payload: ReviewRequest) {
  return apiRequest<Review>("/reviews", { method: "POST", body: payload });
}

// ---------------------------------------------------------------------------
// Reception — ReceptionController (@RequestMapping("/api/reception")).
// ---------------------------------------------------------------------------

export type ReceptionDashboard = {
  receptionistId: number;
  receptionistName: string;
  garageId: number;
  garageName: string;
  totalAppointments: number;
  pendingCount: number;
  confirmedCount: number;
  inProgressCount: number;
  completedCount: number;
  cancelledCount: number;
  noShowCount: number;
  appointments: AppointmentDto[];
};

// GET /api/reception/dashboard — thống kê + lịch hẹn của lễ tân đang đăng nhập.
export function getReceptionDashboard() {
  return apiRequest<ReceptionDashboard>("/reception/dashboard");
}

// GET /api/reception/appointments/{id} — chi tiết một lịch hẹn (role reception).
export function getReceptionAppointment(appointmentId: number | string) {
  return apiRequest<AppointmentDto>(`/reception/appointments/${appointmentId}`);
}

export type ReceptionAppointmentRequest = {
  customerId: number;
  vehicleId: number;
  serviceId: number;
  scheduleId: number;
  notes?: string;
};

// POST /api/reception/appointments — tạo lịch hẹn mới (role reception).
export function createReceptionAppointment(payload: ReceptionAppointmentRequest) {
  return apiRequest<AppointmentDto>("/reception/appointments", {
    method: "POST",
    body: payload,
  });
}

export type ReceptionAppointmentStatusPayload = {
  status:
    | "pending"
    | "confirmed"
    | "in_progress"
    | "completed"
    | "cancelled"
    | "no_show";
  notes?: string;
};

// PUT /api/reception/appointments/{id}/status — cập nhật trạng thái lịch hẹn.
export function updateReceptionAppointmentStatus(
  appointmentId: number | string,
  payload: ReceptionAppointmentStatusPayload,
) {
  return apiRequest<AppointmentDto>(`/reception/appointments/${appointmentId}/status`, {
    method: "PUT",
    body: payload,
  });
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
  imageUrl?: string;
  rating?: number;
};

export type NewGaragePayload = {
  name: string;
  address: string;
  phone?: string;
  description?: string;
};

export type GarageUpdatePayload = {
  name?: string;
  address?: string;
  phone?: string;
  description?: string;
  imageUrl?: string;
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

// PUT /api/garages/me — admin cập nhật thông tin garage của chính mình
// (tên, địa chỉ, sđt, mô tả, ảnh đại diện).
export function updateMyGarage(payload: GarageUpdatePayload) {
  return apiRequest<Garage>("/garages/me", { method: "PUT", body: payload });
}

// POST /api/garages/me/image — admin tải ảnh garage lên (multipart/form-data).
// Backend lưu ảnh trên Cloudinary rồi trả về Garage với imageUrl đã cập nhật.
export async function uploadGarageImage(file: File): Promise<Garage> {
  const session = getStoredAuthSession();
  const headers: Record<string, string> = {};
  if (session?.token) headers["Authorization"] = `Bearer ${session.token}`;

  const formData = new FormData();
  formData.append("file", file);

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/garages/me/image`, {
      method: "POST",
      headers,
      body: formData,
    });
  } catch {
    throw new Error("Không thể kết nối đến máy chủ. Vui lòng thử lại.");
  }

  const data = (await response.json().catch(() => null)) as Garage | ApiErrorBody | null;

  if (!response.ok) {
    const error = data as ApiErrorBody | null;
    throw new Error(error?.message || error?.error || "Tải ảnh lên không thành công.");
  }

  return data as Garage;
}

// ---------------------------------------------------------------------------
// Services — ServiceController (@RequestMapping("/api/services")).
// ---------------------------------------------------------------------------

type RawService = {
  id: number;
  serviceName: string;
  price: number;
  duration?: string;
};

export type MaintenanceService = {
  id: number;
  name: string;
  price: number;
  description?: string;
  duration?: string;
};

export type NewServicePayload = {
  name: string;
  price: number;
  description?: string;
};

function mapService(raw: RawService): MaintenanceService {
  return {
    id: raw.id,
    name: raw.serviceName,
    price: raw.price,
    duration: raw.duration,
  };
}

// POST /api/services — thêm dịch vụ mới.
export async function addService(payload: NewServicePayload) {
  const raw = await apiRequest<RawService>("/services", {
    method: "POST",
    body: { serviceName: payload.name, price: payload.price },
  });
  return mapService(raw);
}

// GET /api/services — danh sách toàn bộ dịch vụ (dùng để chọn khi đặt lịch).
export async function getAllServices() {
  const raw = await apiRequest<RawService[]>("/services");
  return raw.map(mapService);
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

type RawSchedule = {
  id: number;
  timeFrameId: number;
  timeFrameHour: string;
  atDate: string;
  available: boolean;
  garageId: number;
  garageName?: string;
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
  atDate: string;
  timeFrameId: number;
  garageId?: number;
};

function mapSchedule(raw: RawSchedule): Schedule {
  return {
    id: raw.id,
    date: raw.atDate,
    timeFrame: raw.timeFrameHour,
    garageId: raw.garageId,
    garageName: raw.garageName,
    available: raw.available,
  };
}

// POST /api/schedules — tạo lịch làm việc mới cho garage.
export async function addSchedule(payload: NewSchedulePayload) {
  const raw = await apiRequest<RawSchedule>("/schedules", { method: "POST", body: payload });
  return mapSchedule(raw);
}

// POST /api/schedules/time-frames — tạo khung giờ mới cho garage.
export function addTimeFrame(payload: NewTimeFramePayload) {
  return apiRequest<TimeFrame>("/schedules/time-frames", { method: "POST", body: payload });
}

// GET /api/schedules — danh sách lịch (lọc theo garageId nếu có).
export async function getSchedules(garageId?: number | string) {
  const raw = await apiRequest<RawSchedule[]>("/schedules", { query: { garageId } });
  return raw.map(mapSchedule);
}

// GET /api/schedules/available — danh sách lịch còn trống (dùng khi đặt lịch).
export async function getAvailableSchedules(garageId?: number | string) {
  const raw = await apiRequest<RawSchedule[]>("/schedules/available", { query: { garageId } });
  return raw.map(mapSchedule);
}

// GET /api/schedules/time-frames — danh sách khung giờ (lọc theo garageId nếu có).
export function getTimeFrames(garageId?: number | string) {
  return apiRequest<TimeFrame[]>("/schedules/time-frames", { query: { garageId } });
}

// GET /api/garage-owner/parts — danh sách linh kiện của garage đang quản lý.
export type AdminPart = {
  id: number;
  partName: string;
  category: string;
  sku: string;
  location: string;
  quantity: number;
  maxQuantity: number;
  price: number;
  status: string;
  garageId: number;
  garageName: string;
  createdAt: string;
};

export type CreatePartPayload = {
  partName: string;
  category: string;
  sku: string;
  location: string;
  quantity: number;
  maxQuantity: number;
  price: number;
};

export function getAdminParts() {
  return apiRequest<AdminPart[]>("/garage-owner/parts");
}

// Backend tự gán garage của admin đang đăng nhập, không cần truyền garageId.
export function createAdminPart(payload: CreatePartPayload) {
  return apiRequest<AdminPart>("/garage-owner/parts", {
    method: "POST",
    body: payload,
  });
}

// GET /api/garage-owner/customers — danh sách khách hàng của garage đang quản lý.
export type AdminCustomer = {
  id: number;
  username: string;
  email: string;
  phone: string;
  dob: string;
  noShow: number;
  status: string;
  isBanned: boolean;
  vehicleCount: number;
  appointmentCount: number;
  createdAt: string;
};

export function getAdminCustomers() {
  return apiRequest<AdminCustomer[]>("/garage-owner/customers");
}

// GET & POST /api/garage-owner/employees — quản lý nhân viên của garage đang quản lý.
export type AdminEmployee = {
  id: number;
  username: string;
  fullName?: string;
  avatarUrl?: string;
  phone: string;
  email: string;
  dob?: string;
  role: string;
  noShow?: number;
  createdAt: string;
  garageName?: string;
  garageId: number;
};

export type CreateEmployeePayload = {
  username: string;
  password: string;
  phone: string;
  email: string;
  dob: string;
  role: string;
  garageId: number;
};

export function getAdminEmployees() {
  return apiRequest<AdminEmployee[]>("/garage-owner/employees");
}

export function createAdminEmployee(payload: CreateEmployeePayload) {
  return apiRequest<AdminEmployee>("/garage-owner/employees", {
    method: "POST",
    body: payload,
  });
}

// ---------------------------------------------------------------------------
// Super Admin — AdminController (@RequestMapping("/api/admin")), các endpoint
// chỉ role "admin" (Super Admin toàn hệ thống) mới gọi được. Khác với
// "garage_owner" (admin của 1 garage) — 2 role này tách biệt hoàn toàn sau
// khi backend đổi tên "admin" cũ thành "garage_owner".
// ---------------------------------------------------------------------------

export type SuperAdminUser = {
  id: number;
  username: string;
  fullName: string | null;
  email: string | null;
  phone: string | null;
  dob: string | null;
  role: string;
  garageId: number | null;
  garageName: string | null;
  balance: number;
  noShow: number | null;
  avatarUrl: string | null;
  createdAt: string;
};

export type CreateGarageOwnerPayload = {
  username: string;
  password: string;
  fullName?: string;
  email?: string;
  phone?: string;
  garageId: number;
};

export type ChangeUserRolePayload = {
  role: "viewer" | "customer" | "garage_owner" | "reception" | "engineer" | "admin";
  garageId?: number;
};

// GET /api/admin/users — danh sách toàn bộ user, lọc theo role/garageId.
export function getAllUsers(filters?: { role?: string; garageId?: number }) {
  return apiRequest<SuperAdminUser[]>("/admin/users", {
    query: { role: filters?.role, garageId: filters?.garageId },
  });
}

// GET /api/admin/viewers — danh sách viewer.
export function getAllViewers() {
  return apiRequest<SuperAdminUser[]>("/admin/viewers");
}

// GET /api/admin/users/{id} — chi tiết 1 user.
export function getUserById(userId: number | string) {
  return apiRequest<SuperAdminUser>(`/admin/users/${userId}`);
}

// PUT /api/admin/users/{id}/role — đổi role của 1 user.
export function changeUserRole(userId: number | string, payload: ChangeUserRolePayload) {
  return apiRequest<SuperAdminUser>(`/admin/users/${userId}/role`, {
    method: "PUT",
    body: payload,
  });
}

// POST /api/admin/garage-owners — tạo tài khoản admin cho 1 garage.
export function createGarageOwner(payload: CreateGarageOwnerPayload) {
  return apiRequest<SuperAdminUser>("/admin/garage-owners", {
    method: "POST",
    body: payload,
  });
}

// ---------------------------------------------------------------------------
// Users / hồ sơ cá nhân — UserController (@RequestMapping("/api/users")) bên
// backend. Áp dụng cho người dùng đang đăng nhập, không phân biệt role.
// ---------------------------------------------------------------------------

export type UserProfile = {
  id: number;
  username: string;
  fullName: string | null;
  email: string;
  phone: string | null;
  role: string;
  garageId: number | null;
  garageName: string | null;
  avatarUrl: string | null;
  createdAt: string;
};

export type UpdateProfilePayload = {
  fullName: string;
};

// GET /api/users/me — hồ sơ của người dùng đang đăng nhập.
export function getMyProfile() {
  return apiRequest<UserProfile>("/users/me");
}

// PUT /api/users/me — sửa tên hiển thị.
export function updateMyProfile(payload: UpdateProfilePayload) {
  return apiRequest<UserProfile>("/users/me", { method: "PUT", body: payload });
}

// POST /api/users/me/avatar — tải lên / thay ảnh đại diện (multipart/form-data).
export async function uploadMyAvatar(file: File): Promise<UserProfile> {
  const session = getStoredAuthSession();
  const headers: Record<string, string> = {};
  if (session?.token) headers["Authorization"] = `Bearer ${session.token}`;

  const formData = new FormData();
  formData.append("file", file);

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/users/me/avatar`, {
      method: "POST",
      headers,
      body: formData,
    });
  } catch {
    throw new Error("Không thể kết nối đến máy chủ. Vui lòng thử lại.");
  }

  const data = (await response.json().catch(() => null)) as UserProfile | ApiErrorBody | null;

  if (!response.ok) {
    const error = data as ApiErrorBody | null;
    throw new Error(error?.message || error?.error || "Tải ảnh lên không thành công.");
  }

  return data as UserProfile;
}

// ---------------------------------------------------------------------------
// Notifications — NotificationController (@RequestMapping("/api/notifications"))
// bên backend. Thông báo được backend tự tạo mỗi khi có thay đổi liên quan đến
// xe (thêm xe / sửa thông tin xe / đổi ảnh xe) hoặc hồ sơ cá nhân (đổi tên /
// đổi ảnh đại diện) của chính người dùng đang đăng nhập.
// ---------------------------------------------------------------------------

export type NotificationType =
  | "VEHICLE"
  | "PROFILE"
  | "APPOINTMENT"
  | "PROMOTION"
  | "SYSTEM";

export type AppNotification = {
  id: number;
  userId: number;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  createdAt: string;
};

// GET /api/payment/wallet-balance — số dư ví Servio Pay của người dùng đang
// đăng nhập.
export async function getWalletBalance() {
  const result = await apiRequest<{ userId: number; balance: number }>(
    "/payment/wallet-balance",
  );
  return result.balance;
}

// GET /api/notifications/me — danh sách thông báo của người dùng đang đăng
// nhập, mới nhất trước.
export function getMyNotifications() {
  return apiRequest<AppNotification[]>("/notifications/me");
}

// GET /api/notifications/me/unread-count — số thông báo chưa đọc.
export async function getUnreadNotificationCount() {
  const result = await apiRequest<{ count: number }>("/notifications/me/unread-count");
  return result.count;
}

// PUT /api/notifications/{id}/read — đánh dấu 1 thông báo đã đọc.
export function markNotificationAsRead(notificationId: number | string) {
  return apiRequest<AppNotification>(`/notifications/${notificationId}/read`, { method: "PUT" });
}

// PUT /api/notifications/me/read-all — đánh dấu tất cả thông báo đã đọc.
export function markAllNotificationsAsRead() {
  return apiRequest<void>("/notifications/me/read-all", { method: "PUT" });
}

export default {
  checkDbConnection,
};

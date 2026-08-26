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

export default {
  checkDbConnection,
};

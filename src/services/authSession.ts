// Lưu phiên đăng nhập trong sessionStorage: đóng tab là phải đăng nhập lại. "Ghi nhớ đăng nhập" chỉ nhớ TÊN đăng nhập
// để điền sẵn vào form (không nhớ mật khẩu: để trình quản lý mật khẩu của trình duyệt lo). Token (JWT) của BE có hạn
// nên luôn kiểm tra hạn ở FE. Phiên cũ còn trong localStorage (bản trước) vẫn được đọc cho tới khi hết hạn.
const KEY = "auth_session";
const REMEMBERED_USERNAME_KEY = "remembered_username";

export const AUTH_EXPIRED_EVENT = "auth:expired";

function safe<T>(action: () => T, fallback: T): T {
  try {
    return action();
  } catch {
    return fallback;
  }
}

export function readStoredSessionJson(): string | null {
  return safe(() => sessionStorage.getItem(KEY), null) ?? safe(() => localStorage.getItem(KEY), null);
}

export function saveSession(session: unknown) {
  clearSession();
  const json = JSON.stringify(session);
  safe(() => sessionStorage.setItem(KEY, json), undefined);
}

export function getRememberedUsername(): string {
  return safe(() => localStorage.getItem(REMEMBERED_USERNAME_KEY), null) ?? "";
}

// Tick "Ghi nhớ" thì lưu tên đăng nhập, bỏ tick thì xóa.
export function setRememberedUsername(username: string | null) {
  safe(() => {
    if (username) localStorage.setItem(REMEMBERED_USERNAME_KEY, username);
    else localStorage.removeItem(REMEMBERED_USERNAME_KEY);
  }, undefined);
}

export function clearSession() {
  safe(() => sessionStorage.removeItem(KEY), undefined);
  safe(() => localStorage.removeItem(KEY), undefined);
}

// Thời điểm hết hạn (ms) đọc từ trường exp của JWT; null nếu không đọc được.
export function tokenExpiryMs(token: string | undefined): number | null {
  if (!token) return null;
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    const exp = (JSON.parse(json) as { exp?: number }).exp;
    return typeof exp === "number" ? exp * 1000 : null;
  } catch {
    return null;
  }
}

export function isTokenExpired(token: string | undefined, now = Date.now()) {
  const expiry = tokenExpiryMs(token);
  return expiry !== null && expiry <= now;
}

// Phiên hết hạn: xóa phiên và báo cho App đưa về trang đăng nhập.
export function expireSession() {
  clearSession();
  window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT));
}

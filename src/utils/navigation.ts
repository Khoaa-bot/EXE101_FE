// Mở trang thông báo từ các khung dùng chung (StaffShell, AdminShell) mà không cần truyền callback qua từng trang.
// App lắng nghe popstate để đổi route.
export function openNotifications() {
  if (window.location.pathname !== "/notifications") {
    window.history.pushState(null, "", "/notifications");
  }
  window.dispatchEvent(new PopStateEvent("popstate"));
}

import { useEffect, useMemo, useState } from "react";
import {
  getAllUsers,
  setUserHidden,
  setUserStatus,
  type SuperAdminUser,
} from "../../services/api";

const NO_USERS: SuperAdminUser[] = [];

type Props = {
  notify: (message: string, type?: "success" | "error") => void;
  onViewAppointments: (user: SuperAdminUser) => void;
};

export default function SuperAdminCustomersTab({ notify, onViewAppointments }: Props) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "blocked">("all");
  const [showHidden, setShowHidden] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [result, setResult] = useState<{
    key: string;
    users: SuperAdminUser[];
    error: string | null;
  } | null>(null);

  const requestKey = String(showHidden);
  const isLoading = result?.key !== requestKey;
  const users = result?.users ?? NO_USERS;
  const loadError = result?.key === requestKey ? result.error : null;

  useEffect(() => {
    let cancelled = false;
    getAllUsers({ role: "customer", includeHidden: showHidden })
      .then((data) => {
        if (!cancelled) setResult({ key: requestKey, users: data, error: null });
      })
      .catch((err) => {
        if (!cancelled) {
          setResult({
            key: requestKey,
            users: [],
            error: err instanceof Error ? err.message : "Không tải được danh sách khách hàng.",
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [showHidden, requestKey]);

  const visibleUsers = useMemo(() => {
    const q = query.trim().toLowerCase();
    return users.filter((u) => {
      const matchesStatus = statusFilter === "all" || u.status === statusFilter;
      const matchesQuery =
        !q ||
        u.username.toLowerCase().includes(q) ||
        (u.fullName ?? "").toLowerCase().includes(q) ||
        (u.email ?? "").toLowerCase().includes(q) ||
        (u.phone ?? "").includes(q);
      return matchesStatus && matchesQuery;
    });
  }, [users, query, statusFilter]);

  const applyUpdate = (updated: SuperAdminUser) => {
    setResult((prev) =>
      prev && {
        ...prev,
        users: prev.users
          .map((u) => (u.id === updated.id ? { ...u, ...updated, appointmentCount: u.appointmentCount } : u))
          .filter((u) => showHidden || !u.hidden),
      },
    );
  };

  const toggleBlock = (user: SuperAdminUser) => {
    const blocking = user.status !== "blocked";
    const confirmed = window.confirm(
      blocking
        ? `Chặn tài khoản "${user.username}"? Khách sẽ không đăng nhập được cho đến khi mở chặn.`
        : `Mở chặn tài khoản "${user.username}"?`,
    );
    if (!confirmed) return;
    setBusyId(user.id);
    setUserStatus(user.id, blocking ? "blocked" : "active")
      .then((updated) => {
        applyUpdate(updated);
        notify(blocking ? `Đã chặn ${user.username}.` : `Đã mở chặn ${user.username}.`);
      })
      .catch((err) => notify(err instanceof Error ? err.message : "Không cập nhật được trạng thái.", "error"))
      .finally(() => setBusyId(null));
  };

  const toggleHidden = (user: SuperAdminUser) => {
    const hiding = !user.hidden;
    const confirmed = window.confirm(
      hiding
        ? `Ẩn "${user.username}" khỏi danh sách quản lý? Có thể bỏ ẩn lại bất cứ lúc nào.`
        : `Bỏ ẩn "${user.username}"?`,
    );
    if (!confirmed) return;
    setBusyId(user.id);
    setUserHidden(user.id, hiding)
      .then((updated) => {
        applyUpdate(updated);
        notify(hiding ? `Đã ẩn ${user.username}.` : `Đã bỏ ẩn ${user.username}.`);
      })
      .catch((err) => notify(err instanceof Error ? err.message : "Không cập nhật được trạng thái ẩn.", "error"))
      .finally(() => setBusyId(null));
  };

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Tìm theo username, tên, email, SĐT..."
          className="w-72 rounded-lg border border-outline-variant bg-surface-container-low px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
          className="rounded-lg border border-outline-variant bg-surface-container-low px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
        >
          <option value="all">Tất cả trạng thái</option>
          <option value="active">Đang hoạt động</option>
          <option value="blocked">Đã bị chặn</option>
        </select>
        <label className="flex items-center gap-2 text-sm text-on-surface-variant">
          <input
            type="checkbox"
            checked={showHidden}
            onChange={(e) => setShowHidden(e.target.checked)}
          />
          Hiện cả khách đã ẩn
        </label>
        <span className="text-xs text-on-surface-variant">
          {visibleUsers.length} / {users.length} khách hàng
        </span>
      </div>

      {isLoading && <p className="mt-6 text-body-sm text-on-surface-variant">Đang tải danh sách khách hàng...</p>}
      {!isLoading && loadError && <p className="mt-6 text-body-sm text-error">{loadError}</p>}

      {!isLoading && !loadError && (
        <div className="mt-6 overflow-x-auto rounded-xl border border-outline-variant bg-surface-container-lowest">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead className="border-b border-outline-variant bg-surface-container-low text-xs uppercase text-on-surface-variant">
              <tr>
                <th className="px-4 py-3 font-medium">Tên đăng nhập</th>
                <th className="px-4 py-3 font-medium">Họ tên</th>
                <th className="px-4 py-3 font-medium">Liên hệ</th>
                <th className="px-4 py-3 font-medium">Lịch hẹn</th>
                <th className="px-4 py-3 font-medium">Không đến</th>
                <th className="px-4 py-3 font-medium">Trạng thái</th>
                <th className="px-4 py-3 text-right font-medium">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {visibleUsers.map((u) => (
                <tr key={u.id} className={`hover:bg-surface-container-low ${u.hidden ? "opacity-60" : ""}`}>
                  <td className="px-4 py-3 font-semibold">{u.username}</td>
                  <td className="px-4 py-3">{u.fullName || "—"}</td>
                  <td className="px-4 py-3 text-xs text-on-surface-variant">
                    <div>{u.email || "—"}</div>
                    <div>{u.phone || ""}</div>
                  </td>
                  <td className="px-4 py-3">{u.appointmentCount ?? 0}</td>
                  <td className="px-4 py-3">{u.noShow ?? 0}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        u.status === "blocked"
                          ? "bg-error-container/40 text-on-error-container"
                          : "bg-tertiary-container/20 text-tertiary"
                      }`}
                    >
                      {u.status === "blocked" ? "Đã chặn" : "Hoạt động"}
                    </span>
                    {u.hidden && (
                      <span className="ml-2 rounded-full bg-surface-container-high px-2.5 py-0.5 text-xs font-semibold text-on-surface-variant">
                        Đã ẩn
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => onViewAppointments(u)}
                        className="text-xs font-semibold text-primary hover:underline"
                      >
                        Xem lịch hẹn
                      </button>
                      <button
                        type="button"
                        disabled={busyId === u.id}
                        onClick={() => toggleBlock(u)}
                        className="text-xs font-semibold text-error hover:underline disabled:opacity-50"
                      >
                        {u.status === "blocked" ? "Mở chặn" : "Chặn"}
                      </button>
                      <button
                        type="button"
                        disabled={busyId === u.id}
                        onClick={() => toggleHidden(u)}
                        className="text-xs font-semibold text-on-surface-variant hover:underline disabled:opacity-50"
                      >
                        {u.hidden ? "Bỏ ẩn" : "Ẩn"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {visibleUsers.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-on-surface-variant">
                    Không tìm thấy khách hàng phù hợp.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

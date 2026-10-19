import { useEffect, useMemo, useState, type ComponentProps } from "react";
import {
  getAllUsers,
  setUserHidden,
  setUserStatus,
  type SuperAdminUser,
} from "../../services/api";
import { formatVnd } from "../../utils/format";
import ReasonConfirmDialog from "./ReasonConfirmDialog";
import RowActionMenu from "./RowActionMenu";
import { FilterChip, StatusChips } from "./SuperAdminChips";

const NO_USERS: SuperAdminUser[] = [];

const BLOCK_REASONS = [
  "Không đến lịch hẹn nhiều lần",
  "Có dấu hiệu gian lận hoặc lạm dụng",
  "Thông tin tài khoản không hợp lệ",
  "Theo yêu cầu của khách",
];
const HIDE_REASONS = [
  "Tài khoản không còn hoạt động",
  "Tài khoản thử nghiệm hoặc trùng lặp",
  "Theo yêu cầu của khách",
];

type StatusFilter = "all" | "active" | "blocked";
type Pending = { kind: "block" | "hide"; user: SuperAdminUser };
type DialogConfig = Omit<ComponentProps<typeof ReasonConfirmDialog>, "busy" | "onCancel" | "onConfirm">;

type Props = {
  notify: (message: string, type?: "success" | "error") => void;
  onViewAppointments: (user: SuperAdminUser) => void;
};

function formatDate(value: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString("vi-VN");
}

function withReason(message: string, reason: string | null) {
  return reason ? `${message} Lý do: ${reason}.` : message;
}

function buildDialog({ kind, user }: Pending): DialogConfig {
  const name = user.username;
  const summary = `${user.fullName || name} · ${user.appointmentCount ?? 0} lịch hẹn · ${user.noShow ?? 0} lần không đến`;

  if (kind === "block") {
    if (user.status === "blocked") {
      return {
        tone: "warning",
        icon: "lock_open",
        confirmTitle: `Mở chặn tài khoản “${name}”?`,
        confirmLabel: "Mở chặn",
        confirmIcon: "lock_open",
      };
    }
    return {
      tone: "danger",
      icon: "block",
      reasonTitle: `Vì sao chặn “${name}”?`,
      reasonSubtitle: summary,
      reasons: BLOCK_REASONS,
      confirmTitle: `Chặn tài khoản “${name}”?`,
      confirmDescription: "Khách sẽ không đăng nhập được cho đến khi mở chặn.",
      confirmLabel: "Chặn tài khoản",
      confirmIcon: "block",
    };
  }

  if (user.hidden) {
    return {
      tone: "warning",
      icon: "visibility",
      confirmTitle: `Bỏ ẩn “${name}”?`,
      confirmLabel: "Bỏ ẩn",
      confirmIcon: "visibility",
    };
  }
  return {
    tone: "warning",
    icon: "visibility_off",
    reasonTitle: `Vì sao ẩn “${name}”?`,
    reasonSubtitle: summary,
    reasons: HIDE_REASONS,
    confirmTitle: `Ẩn “${name}” khỏi danh sách quản lý?`,
    confirmDescription: "Có thể bỏ ẩn lại bất cứ lúc nào.",
    confirmLabel: "Ẩn khách hàng",
    confirmIcon: "visibility_off",
  };
}

export default function SuperAdminCustomersTab({ notify, onViewAppointments }: Props) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [showHidden, setShowHidden] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [pending, setPending] = useState<Pending | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
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

  const selectedUser = users.find((u) => u.id === selectedId) ?? null;

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

  const runBlock = (user: SuperAdminUser, reason: string | null) => {
    const blocking = user.status !== "blocked";
    setBusyId(user.id);
    setUserStatus(user.id, blocking ? "blocked" : "active")
      .then((updated) => {
        applyUpdate(updated);
        notify(
          blocking ? withReason(`Đã chặn ${user.username}.`, reason) : `Đã mở chặn ${user.username}.`,
        );
      })
      .catch((err) => notify(err instanceof Error ? err.message : "Không cập nhật được trạng thái.", "error"))
      .finally(() => {
        setBusyId(null);
        setPending(null);
      });
  };

  const runHidden = (user: SuperAdminUser, reason: string | null) => {
    const hiding = !user.hidden;
    setBusyId(user.id);
    setUserHidden(user.id, hiding)
      .then((updated) => {
        applyUpdate(updated);
        notify(hiding ? withReason(`Đã ẩn ${user.username}.`, reason) : `Đã bỏ ẩn ${user.username}.`);
      })
      .catch((err) => notify(err instanceof Error ? err.message : "Không cập nhật được trạng thái ẩn.", "error"))
      .finally(() => {
        setBusyId(null);
        setPending(null);
      });
  };

  const confirmPending = (reason: string | null) => {
    if (!pending) return;
    if (pending.kind === "block") runBlock(pending.user, reason);
    else runHidden(pending.user, reason);
  };

  const askBlock = (user: SuperAdminUser) => setPending({ kind: "block", user });
  const askHidden = (user: SuperAdminUser) => setPending({ kind: "hide", user });

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <input
          aria-label="Tìm theo username, tên, email, SĐT..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Tìm theo username, tên, email, SĐT..."
          className="min-h-11 w-80 max-w-full rounded-xl border border-outline-variant bg-surface-container-lowest px-3.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
        />
        <div role="group" aria-label="Lọc theo trạng thái" className="flex flex-wrap gap-2">
          <FilterChip active={statusFilter === "all"} onClick={() => setStatusFilter("all")}>
            Tất cả
          </FilterChip>
          <FilterChip active={statusFilter === "active"} onClick={() => setStatusFilter("active")}>
            Hoạt động
          </FilterChip>
          <FilterChip active={statusFilter === "blocked"} onClick={() => setStatusFilter("blocked")}>
            Bị chặn
          </FilterChip>
          <FilterChip active={showHidden} onClick={() => setShowHidden((current) => !current)}>
            <span aria-hidden="true" className="material-symbols-outlined text-lg">
              visibility_off
            </span>
            Hiện cả khách đã ẩn
          </FilterChip>
        </div>
        <span className="ml-auto text-xs text-on-surface-variant" aria-live="polite">
          Hiển thị {visibleUsers.length} / {users.length} khách hàng
        </span>
      </div>

      {isLoading && <p className="mt-6 text-body-sm text-on-surface-variant">Đang tải danh sách khách hàng...</p>}
      {!isLoading && loadError && <p className="mt-6 text-body-sm text-error">{loadError}</p>}

      {!isLoading && !loadError && (
        <div className="mt-5 flex flex-col gap-4 lg:flex-row lg:items-start">
          <div className="min-w-0 flex-1 overflow-x-auto rounded-2xl border border-outline-variant/50 bg-surface-container-lowest shadow-[0_10px_26px_-14px_rgba(25,28,29,0.28)]">
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead className="bg-surface-container-low text-[11px] uppercase tracking-wider text-on-surface-variant">
                <tr>
                  <th className="px-4 py-3 font-bold">Tên đăng nhập</th>
                  <th className="px-4 py-3 font-bold">Họ tên</th>
                  <th className="px-4 py-3 font-bold">Liên hệ</th>
                  <th className="px-4 py-3 font-bold">Lịch hẹn</th>
                  <th className="px-4 py-3 font-bold">Không đến</th>
                  <th className="px-4 py-3 font-bold">Trạng thái</th>
                  <th className="px-4 py-3 text-right font-bold">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/50">
                {visibleUsers.map((u) => (
                  <tr
                    key={u.id}
                    className={`${u.hidden ? "opacity-60" : ""} ${
                      u.id === selectedId ? "bg-primary-fixed/30" : "hover:bg-surface-container-low"
                    }`}
                  >
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => setSelectedId(u.id)}
                        aria-label={`Xem chi tiết ${u.username}`}
                        className="min-h-6 rounded font-bold text-on-surface hover:text-primary hover:underline"
                      >
                        {u.username}
                      </button>
                    </td>
                    <td className="px-4 py-3">{u.fullName || "—"}</td>
                    <td className="px-4 py-3 text-xs text-on-surface-variant">
                      <div className="text-sm text-on-surface">{u.email || "—"}</div>
                      <div>{u.phone || ""}</div>
                    </td>
                    <td className="px-4 py-3">{u.appointmentCount ?? 0}</td>
                    <td className="px-4 py-3">{u.noShow ?? 0}</td>
                    <td className="px-4 py-3">
                      <StatusChips blocked={u.status === "blocked"} hidden={u.hidden} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => onViewAppointments(u)}
                          className="min-h-9 rounded-[10px] border-[1.5px] border-primary bg-surface-container-lowest px-3 text-xs font-bold text-on-primary-fixed-variant hover:bg-primary-fixed/40"
                        >
                          Xem lịch hẹn
                        </button>
                        <RowActionMenu
                          label={`Thêm thao tác với ${u.username}`}
                          disabled={busyId === u.id}
                          items={[
                            {
                              label: u.status === "blocked" ? "Mở chặn tài khoản" : "Chặn tài khoản",
                              icon: u.status === "blocked" ? "lock_open" : "block",
                              danger: u.status !== "blocked",
                              onSelect: () => askBlock(u),
                            },
                            {
                              label: u.hidden ? "Bỏ ẩn" : "Ẩn khỏi danh sách",
                              icon: u.hidden ? "visibility" : "visibility_off",
                              onSelect: () => askHidden(u),
                            },
                          ]}
                        />
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

          {selectedUser && (
            <aside
              aria-label="Chi tiết khách hàng"
              className="flex w-full shrink-0 flex-col gap-4 rounded-2xl border border-outline-variant/50 bg-surface-container-lowest p-5 shadow-[0_10px_26px_-14px_rgba(25,28,29,0.28)] lg:w-80"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-base font-extrabold">Chi tiết khách hàng</h2>
                <button
                  type="button"
                  aria-label="Đóng chi tiết"
                  onClick={() => setSelectedId(null)}
                  className="flex h-9 w-9 items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container-low"
                >
                  <span aria-hidden="true" className="material-symbols-outlined">
                    close
                  </span>
                </button>
              </div>
              <div className="flex items-center gap-3">
                <span
                  aria-hidden="true"
                  className="flex h-[52px] w-[52px] items-center justify-center rounded-full bg-primary text-xl font-extrabold text-on-primary"
                >
                  {(selectedUser.fullName || selectedUser.username).charAt(0).toUpperCase()}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-base font-bold">{selectedUser.fullName || selectedUser.username}</p>
                  <p className="text-xs text-on-surface-variant">@{selectedUser.username}</p>
                </div>
              </div>
              <StatusChips blocked={selectedUser.status === "blocked"} hidden={selectedUser.hidden} />
              <dl className="grid grid-cols-[auto_1fr] gap-x-3.5 gap-y-2 text-[13px]">
                <dt className="text-on-surface-variant">Email</dt>
                <dd className="break-all">{selectedUser.email || "—"}</dd>
                <dt className="text-on-surface-variant">Điện thoại</dt>
                <dd>{selectedUser.phone || "—"}</dd>
                <dt className="text-on-surface-variant">Ngày sinh</dt>
                <dd>{formatDate(selectedUser.dob)}</dd>
                <dt className="text-on-surface-variant">Số dư ví</dt>
                <dd className="font-bold">{formatVnd(selectedUser.balance)}</dd>
                <dt className="text-on-surface-variant">Lịch hẹn</dt>
                <dd>{selectedUser.appointmentCount ?? 0}</dd>
                <dt className="text-on-surface-variant">Không đến</dt>
                <dd>{selectedUser.noShow ?? 0}</dd>
                <dt className="text-on-surface-variant">Tham gia</dt>
                <dd>{formatDate(selectedUser.createdAt)}</dd>
              </dl>
              <button
                type="button"
                onClick={() => onViewAppointments(selectedUser)}
                className="min-h-11 rounded-xl bg-primary px-4 text-sm font-bold text-on-primary"
              >
                Xem lịch hẹn của khách
              </button>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  disabled={busyId === selectedUser.id}
                  onClick={() => askBlock(selectedUser)}
                  className="min-h-10 rounded-[10px] border-[1.5px] border-outline-variant px-3 text-xs font-bold hover:bg-surface-container-low disabled:opacity-50"
                >
                  {selectedUser.status === "blocked" ? "Mở chặn" : "Chặn"}
                </button>
                <button
                  type="button"
                  disabled={busyId === selectedUser.id}
                  onClick={() => askHidden(selectedUser)}
                  className="min-h-10 rounded-[10px] border-[1.5px] border-outline-variant px-3 text-xs font-bold hover:bg-surface-container-low disabled:opacity-50"
                >
                  {selectedUser.hidden ? "Bỏ ẩn" : "Ẩn"}
                </button>
              </div>
            </aside>
          )}
        </div>
      )}

      {pending && (
        <ReasonConfirmDialog
          {...buildDialog(pending)}
          busy={busyId === pending.user.id}
          onCancel={() => setPending(null)}
          onConfirm={confirmPending}
        />
      )}
    </div>
  );
}

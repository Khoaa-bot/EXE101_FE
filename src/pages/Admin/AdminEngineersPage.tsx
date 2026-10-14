import { useEffect, useMemo, useState } from "react";
import {
  getAdminEmployees,
  createAdminEmployee,
  deleteAdminEmployee,
  getGarages,
  getMyProfile,
  type AdminEmployee,
  type Garage,
} from "../../services/api";
import AdminShell, { FilterChip, StatusPill, type AdminNavProps } from "./AdminShell";

export type EngineerRole =
  | "ENGINEER"
  | "RECEPTIONIST"
  | "GARAGE_OWNER"
  | "lead"
  | "battery"
  | "mechanical"
  | "software"
  | "reception"
  | string;

export type Engineer = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: EngineerRole;
  roleTitle: string;
  garageName?: string;
  joined: string;
};

export function mapApiEmployee(e: AdminEmployee): Engineer {
  return {
    id: String(e.id),
    name: e.fullName || e.username,
    email: e.email,
    phone: e.phone,
    role: e.role,
    roleTitle: e.role,
    garageName: e.garageName,
    joined: e.createdAt
      ? new Date(e.createdAt).toLocaleDateString("vi-VN")
      : new Date().toLocaleDateString("vi-VN"),
  };
}

const ROLE_OPTIONS: { value: string; label: string }[] = [
  { value: "engineer", label: "Kỹ thuật viên" },
  { value: "reception", label: "Tiếp tân" },
];

export interface AdminEngineersPageProps extends AdminNavProps {
  onEmployeeDetailClick?: (id: string) => void;
}

export default function AdminEngineersPage({
  onEmployeeDetailClick,
  ...navProps
}: AdminEngineersPageProps) {
  const [list, setList] = useState<Engineer[]>([]);
  const [garages, setGarages] = useState<Garage[]>([]);
  const [myGarageId, setMyGarageId] = useState<number | null>(null);
  const [garageName, setGarageName] = useState("");
  const [query, setQuery] = useState("");
  const [filterRole, setFilterRole] = useState<"all" | "engineer" | "reception">("all");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [form, setForm] = useState({
    username: "",
    email: "",
    phone: "",
    dob: "2000-01-01",
    role: "engineer",
    garageId: 1,
    password: "",
  });
  const [showPw, setShowPw] = useState(false);

  const showNotice = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 3000);
  };

  useEffect(() => {
    Promise.all([
      getAdminEmployees()
        .then((data) => {
          const arr: AdminEmployee[] = Array.isArray(data)
            ? data
            : (Object.values(data) as AdminEmployee[]);
          setList(arr.map(mapApiEmployee));
        })
        .catch((err) => {
          setNotice(
            err instanceof Error ? err.message : "Không thể tải danh sách nhân viên",
          );
        }),
      Promise.all([getGarages(), getMyProfile()])
        .then(([data, profile]) => {
          const arr: Garage[] = Array.isArray(data)
            ? data
            : (Object.values(data) as Garage[]);
          setGarages(arr);
          const defaultGarageId = profile.garageId ?? arr[0]?.id;
          if (defaultGarageId) {
            setMyGarageId(defaultGarageId);
            setForm((prev) => ({ ...prev, garageId: defaultGarageId }));
          }
          setGarageName(profile.garageName ?? "");
        })
        .catch(() => {}),
    ]).finally(() => setLoading(false));
  }, []);

  const stats = useMemo(() => {
    return {
      total: list.length,
      engineers: list.filter((e) => e.role.toLowerCase() === "engineer").length,
      reception: list.filter((e) => e.role.toLowerCase().startsWith("recep")).length,
    };
  }, [list]);

  const visibleEngineers = useMemo(() => {
    return list.filter((item) => {
      const role = item.role.toLowerCase();
      const matchesRole =
        filterRole === "all" ||
        (filterRole === "engineer" && role === "engineer") ||
        (filterRole === "reception" && role.startsWith("recep"));
      const matchesQuery =
        item.name.toLowerCase().includes(query.toLowerCase()) ||
        item.email.toLowerCase().includes(query.toLowerCase()) ||
        item.phone.includes(query) ||
        item.id.toLowerCase().includes(query.toLowerCase());
      return matchesRole && matchesQuery;
    });
  }, [list, filterRole, query]);

  const submitNewEngineer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !form.username.trim() ||
      !form.email.trim() ||
      !form.password.trim() ||
      !form.phone.trim()
    ) {
      showNotice("Vui lòng nhập đầy đủ tên tài khoản, email, số điện thoại và mật khẩu!");
      return;
    }

    try {
      setSubmitting(true);
      const created = await createAdminEmployee({
        username: form.username.trim(),
        password: form.password,
        phone: form.phone.trim(),
        email: form.email.trim(),
        dob: form.dob || "2000-01-01",
        role: form.role,
        garageId: myGarageId ?? garages[0]?.id ?? 1,
      });

      const newEmp = mapApiEmployee(created);
      setList((prev) => [newEmp, ...prev]);
      setForm({
        username: "",
        email: "",
        phone: "",
        dob: "2000-01-01",
        role: "engineer",
        garageId: myGarageId ?? garages[0]?.id ?? 1,
        password: "",
      });
      showNotice(`Đã tạo thành công tài khoản nhân viên: ${created.username}`);
    } catch (err) {
      showNotice(
        err instanceof Error ? err.message : "Không thể tạo tài khoản nhân viên. Vui lòng thử lại.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const removeEmployee = async (emp: Engineer) => {
    if (deletingId) return;
    if (!window.confirm(`Xoá nhân viên "${emp.name}"? Hành động không hoàn tác.`)) {
      return;
    }
    setDeletingId(emp.id);
    try {
      await deleteAdminEmployee(emp.id);
      setList((prev) => prev.filter((item) => item.id !== emp.id));
      showNotice(`Đã xoá nhân viên ${emp.name}`);
    } catch (err) {
      showNotice(
        err instanceof Error ? err.message : "Không thể xoá nhân viên.",
      );
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <AdminShell
      activeTab="engineers"
      title="Quản lý Nhân viên"
      description="Cập nhật và quản lý hồ sơ nhân sự kỹ thuật và lễ tân của garage."
      garageName={garageName}
      notice={notice}
      maxWidthClass="max-w-7xl"
      {...navProps}
    >
      {/* Top Metric Cards */}
      <section className="mb-6 grid gap-4 sm:grid-cols-3">
        <EmployeeMetric
          icon="groups"
          tone="bg-primary-fixed text-on-primary-fixed-variant"
          label="Tổng nhân sự"
          value={String(stats.total)}
          hint="Toàn bộ nhân viên tại garage"
        />
        <EmployeeMetric
          icon="engineering"
          tone="bg-[#d9f7dd] text-[#00531a]"
          label="Kỹ thuật viên"
          value={String(stats.engineers)}
          hint="Đảm nhận công tác sửa chữa, bảo dưỡng"
        />
        <EmployeeMetric
          icon="support_agent"
          tone="bg-[#fff1cc] text-[#6b4200]"
          label="Nhân viên Lễ tân"
          value={String(stats.reception)}
          hint="Tiếp đón khách hàng và điều phối lịch"
        />
      </section>

      {/* Two Column Grid */}
      <section className="grid gap-6 lg:grid-cols-3">
        {/* Form Column */}
        <article className="rounded-2xl border border-outline-variant/40 bg-surface-container-lowest p-6 shadow-[0_10px_26px_-14px_rgba(25,28,29,0.28)] lg:col-span-1">
          <div className="mb-5 flex items-center gap-3 border-b border-outline-variant/40 pb-4">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-on-primary">
              <span className="material-symbols-outlined">person_add</span>
            </span>
            <div>
              <h2 className="text-base font-bold text-on-surface">Tạo tài khoản mới</h2>
              <p className="text-xs text-on-surface-variant">Thêm nhân viên cho garage của bạn</p>
            </div>
          </div>

          <form onSubmit={submitNewEngineer} className="space-y-4">
            <div>
              <label
                htmlFor="admin-engineer-username"
                className="mb-1 block text-xs font-semibold text-on-surface-variant"
              >
                Tên tài khoản / Họ tên *
              </label>
              <input
                id="admin-engineer-username"
                type="text"
                required
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                placeholder="VD: nguyenvana hoặc Nguyễn Văn A"
                className="w-full rounded-xl border border-outline-variant bg-surface-container-low px-3.5 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>

            <div>
              <label
                htmlFor="admin-engineer-email"
                className="mb-1 block text-xs font-semibold text-on-surface-variant"
              >
                Email *
              </label>
              <input
                id="admin-engineer-email"
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="example@servio.vn"
                className="w-full rounded-xl border border-outline-variant bg-surface-container-low px-3.5 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>

            <div>
              <label
                htmlFor="admin-engineer-phone"
                className="mb-1 block text-xs font-semibold text-on-surface-variant"
              >
                Số điện thoại *
              </label>
              <input
                id="admin-engineer-phone"
                type="tel"
                required
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="090 123 4567"
                className="w-full rounded-xl border border-outline-variant bg-surface-container-low px-3.5 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>

            <div>
              <label
                htmlFor="admin-engineer-dob"
                className="mb-1 block text-xs font-semibold text-on-surface-variant"
              >
                Ngày sinh (DOB) *
              </label>
              <input
                id="admin-engineer-dob"
                type="date"
                required
                value={form.dob}
                onChange={(e) => setForm({ ...form, dob: e.target.value })}
                className="w-full rounded-xl border border-outline-variant bg-surface-container-low px-3.5 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-on-surface-variant">
                Garage trực thuộc
              </label>
              <div className="w-full rounded-xl border border-outline-variant bg-surface-container px-3.5 py-2.5 text-sm text-on-surface-variant font-medium">
                {garageName || "Garage của bạn"}
              </div>
            </div>

            <div>
              <label
                htmlFor="admin-engineer-role"
                className="mb-1 block text-xs font-semibold text-on-surface-variant"
              >
                Vai trò / Chức vụ *
              </label>
              <select
                id="admin-engineer-role"
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="w-full rounded-xl border border-outline-variant bg-surface-container-low px-3.5 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              >
                {ROLE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-on-surface-variant">
                Mật khẩu *
              </label>
              <div className="relative">
                <input
                  aria-label="Mật khẩu"
                  type={showPw ? "text" : "password"}
                  required
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-outline-variant bg-surface-container-low px-3.5 py-2.5 pr-10 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface"
                  aria-label="Hiện/ẩn mật khẩu"
                >
                  <span className="material-symbols-outlined text-lg">
                    {showPw ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-semibold text-on-primary transition hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-lg">
                {submitting ? "sync" : "person_add"}
              </span>
              {submitting ? "Đang tạo tài khoản..." : "Xác nhận tạo tài khoản"}
            </button>
          </form>
        </article>

        {/* Table Column */}
        <div className="space-y-4 lg:col-span-2">
          {/* Search & Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <input
              aria-label="Tìm kiếm nhân viên..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tìm theo tên, email, SĐT..."
              className="min-h-11 w-72 max-w-full rounded-xl border border-outline-variant bg-surface-container-lowest px-3.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
            <div role="group" aria-label="Lọc vai trò" className="flex flex-wrap gap-2">
              <FilterChip active={filterRole === "all"} onClick={() => setFilterRole("all")}>
                Tất cả
              </FilterChip>
              <FilterChip active={filterRole === "engineer"} onClick={() => setFilterRole("engineer")}>
                Kỹ thuật viên
              </FilterChip>
              <FilterChip active={filterRole === "reception"} onClick={() => setFilterRole("reception")}>
                Lễ tân
              </FilterChip>
            </div>
            <span className="ml-auto text-xs text-on-surface-variant">
              Hiển thị {visibleEngineers.length} / {list.length} nhân viên
            </span>
          </div>

          <article className="overflow-hidden rounded-2xl border border-outline-variant/50 bg-surface-container-lowest shadow-[0_10px_26px_-14px_rgba(25,28,29,0.28)]">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[620px] text-left text-sm">
                <thead className="bg-surface-container-low text-[11px] uppercase tracking-wider text-on-surface-variant">
                  <tr>
                    <th className="px-5 py-3 font-bold">Nhân viên</th>
                    <th className="px-5 py-3 font-bold">Vai trò</th>
                    <th className="px-5 py-3 font-bold">Ngày tham gia</th>
                    <th className="px-5 py-3 text-right font-bold">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/50">
                  {visibleEngineers.map((emp, index) => {
                    const initials = emp.name
                      .split(" ")
                      .map((s) => s[0])
                      .slice(-2)
                      .join("");

                    const isEngineer = emp.role.toLowerCase() === "engineer";

                    return (
                      <tr
                        key={emp.id}
                        className="transition-colors hover:bg-surface-container-low"
                      >
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div
                              className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold ${
                                index % 2
                                  ? "bg-secondary-fixed text-on-secondary-fixed-variant"
                                  : "bg-primary-fixed text-on-primary-fixed-variant"
                              }`}
                            >
                              {initials}
                            </div>
                            <div>
                              <p className="font-semibold text-on-surface">{emp.name}</p>
                              <p className="text-xs text-on-surface-variant">{emp.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <StatusPill tone={isEngineer ? "primary" : "warning"}>
                            {emp.roleTitle}
                          </StatusPill>
                        </td>
                        <td className="px-5 py-3.5 text-xs text-on-surface-variant">
                          {emp.joined}
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => onEmployeeDetailClick?.(emp.id)}
                              className="inline-flex items-center gap-1 rounded-xl border border-outline-variant px-3 py-1.5 text-xs font-semibold text-on-surface transition-colors hover:border-primary hover:text-primary"
                            >
                              Chi tiết
                            </button>
                            <button
                              type="button"
                              onClick={() => void removeEmployee(emp)}
                              disabled={deletingId === emp.id}
                              className="inline-flex items-center gap-1 rounded-xl bg-error-container/80 px-2.5 py-1.5 text-xs font-semibold text-on-error-container transition-colors hover:bg-error-container disabled:opacity-50"
                            >
                              {deletingId === emp.id ? "Đang xoá..." : "Xoá"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {loading && (
                    <tr>
                      <td colSpan={4} className="px-5 py-8 text-center text-sm text-on-surface-variant">
                        <div className="flex items-center justify-center gap-2">
                          <span className="material-symbols-outlined animate-spin text-primary">sync</span>
                          <span>Đang tải danh sách nhân viên...</span>
                        </div>
                      </td>
                    </tr>
                  )}

                  {!loading && visibleEngineers.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-5 py-8 text-center text-sm text-on-surface-variant">
                        Không tìm thấy kỹ thuật viên hoặc nhân viên nào phù hợp.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </article>
        </div>
      </section>
    </AdminShell>
  );
}

function EmployeeMetric({
  icon,
  tone,
  label,
  value,
  hint,
}: {
  icon: string;
  tone: string;
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <article className="flex items-center gap-3.5 rounded-2xl border border-outline-variant/40 bg-surface-container-lowest p-4 shadow-[0_10px_26px_-14px_rgba(25,28,29,0.28)]">
      <span
        aria-hidden="true"
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] ${tone}`}
      >
        <span className="material-symbols-outlined">{icon}</span>
      </span>
      <div className="min-w-0">
        <p className="text-xs text-on-surface-variant">{label}</p>
        <p className="text-xl font-extrabold text-on-surface">{value}</p>
        <p className="truncate text-[11px] text-on-surface-variant">{hint}</p>
      </div>
    </article>
  );
}

import { useEffect, useMemo, useState } from "react";
import {
  getAdminEmployees,
  createAdminEmployee,
  getGarages,
  type AdminEmployee,
  type Garage,
} from "../../services/api";

export type EngineerRole =
  | "ENGINEER"
  | "RECEPTIONIST"
  | "ADMIN"
  | "lead"
  | "battery"
  | "mechanical"
  | "software"
  | "reception"
  | string;

export type EngineerStatus = "active" | "locked";

export type Engineer = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: EngineerRole;
  roleTitle: string;
  garageName?: string;
  status: EngineerStatus;
  joined: string;
  proficiency: number;
  rating: number;
  vehiclesWorked: number;
};

function mapApiEmployee(e: AdminEmployee): Engineer {
  return {
    id: String(e.id),
    name: e.fullName || e.username,
    email: e.email,
    phone: e.phone,
    role: e.role,
    roleTitle: e.role,
    garageName: e.garageName,
    status: "active",
    joined: e.createdAt
      ? new Date(e.createdAt).toLocaleDateString("vi-VN")
      : new Date().toLocaleDateString("vi-VN"),
    proficiency: 85,
    rating: 5.0,
    vehiclesWorked: 0,
  };
}

const navItems = [
  ["dashboard", "Dashboard"],
  ["engineering", "Nhân viên"],
  ["groups", "Khách hàng"],
  ["inventory_2", "Kho linh kiện"],
  ["payments", "Bảng giá"],
];

const ROLE_OPTIONS: { value: string; label: string }[] = [
  { value: "ENGINEER", label: "Kỹ thuật viên (ENGINEER)" },
  { value: "RECEPTIONIST", label: "Tiếp tân (RECEPTIONIST)" },
  { value: "ADMIN", label: "Quản trị viên (ADMIN)" },
  { value: "lead", label: "Kỹ thuật viên trưởng" },
  { value: "battery", label: "Chuyên viên Pin EV" },
  { value: "mechanical", label: "Thợ máy gầm" },
  { value: "software", label: "Kỹ thuật viên Phần mềm" },
];

type AdminEngineersPageProps = {
  onDashboardClick?: () => void;
  onCustomersClick?: () => void;
  onEngineersClick?: () => void;
  onInventoryClick?: () => void;
  onPricingClick?: () => void;
  onEmployeeDetailClick?: (id: string) => void;
  onLogout?: () => void;
};

export default function AdminEngineersPage({
  onDashboardClick,
  onCustomersClick,
  onEngineersClick,
  onInventoryClick,
  onPricingClick,
  onEmployeeDetailClick,
  onLogout,
}: AdminEngineersPageProps) {
  const [list, setList] = useState<Engineer[]>([]);
  const [garages, setGarages] = useState<Garage[]>([]);
  const [query, setQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "locked">(
    "all",
  );
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

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
          setNotice(err instanceof Error ? err.message : "Không thể tải danh sách nhân viên");
        }),
      getGarages()
        .then((data) => {
          const arr: Garage[] = Array.isArray(data)
            ? data
            : (Object.values(data) as Garage[]);
          setGarages(arr);
          if (arr.length > 0) {
            setForm((prev) => ({ ...prev, garageId: arr[0].id }));
          }
        })
        .catch(() => {
          // ignore optional garage error
        }),
    ]).finally(() => setLoading(false));
  }, []);

  const [form, setForm] = useState({
    username: "",
    email: "",
    phone: "",
    dob: "2000-01-01",
    role: "ENGINEER",
    garageId: 1,
    password: "",
  });
  const [showPw, setShowPw] = useState(false);

  const showNotice = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 3000);
  };

  const stats = useMemo(() => {
    return {
      total: list.length,
      active: list.filter((e) => e.status === "active").length,
      locked: list.filter((e) => e.status === "locked").length,
    };
  }, [list]);

  const visibleEngineers = useMemo(() => {
    return list.filter((item) => {
      const matchesStatus =
        filterStatus === "all" || item.status === filterStatus;
      const matchesQuery =
        item.name.toLowerCase().includes(query.toLowerCase()) ||
        item.email.toLowerCase().includes(query.toLowerCase()) ||
        item.phone.includes(query) ||
        item.id.toLowerCase().includes(query.toLowerCase());
      return matchesStatus && matchesQuery;
    });
  }, [list, filterStatus, query]);

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
        garageId: Number(form.garageId) || (garages[0]?.id ?? 1),
      });

      const newEmp = mapApiEmployee(created);
      setList((prev) => [newEmp, ...prev]);
      setForm({
        username: "",
        email: "",
        phone: "",
        dob: "2000-01-01",
        role: "ENGINEER",
        garageId: garages[0]?.id ?? 1,
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

  const toggleStatus = (id: string) => {
    setList((prev) =>
      prev.map((emp) => {
        if (emp.id === id) {
          const nextStatus: EngineerStatus =
            emp.status === "active" ? "locked" : "active";
          showNotice(
            `Đã ${nextStatus === "active" ? "mở khóa" : "khóa"} tài khoản ${emp.name}`,
          );
          return { ...emp, status: nextStatus };
        }
        return emp;
      }),
    );
  };

  return (
    <div className="min-h-[100dvh] bg-background font-sans text-on-surface">
      {/* Sidebar Navigation */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-outline-variant bg-surface-container-lowest p-lg md:flex">
        <div className="mb-xl">
          <div className="flex items-center gap-2 text-primary">
            <span className="material-symbols-outlined text-3xl">
              electric_car
            </span>
            <span className="font-headline-lg text-headline-lg font-bold">
              Servio
            </span>
          </div>
          <p className="mt-1 text-xs text-on-surface-variant">
            Quản trị garage
          </p>
        </div>
        <nav className="space-y-1">
          {navItems.map(([icon, label]) => {
            const isCurrent = label === "Nhân viên";
            return (
              <button
                key={label}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left font-body-md text-body-md transition-colors active:scale-[0.98] ${
                  isCurrent
                    ? "bg-primary-container/15 font-semibold text-primary"
                    : "text-on-surface-variant hover:bg-surface-container-low"
                }`}
                type="button"
                onClick={() => {
                  if (label === "Dashboard") onDashboardClick?.();
                  else if (label === "Nhân viên") onEngineersClick?.();
                  else if (label === "Khách hàng") onCustomersClick?.();
                  else if (label === "Kho linh kiện") onInventoryClick?.();
                  else if (label === "Bảng giá") onPricingClick?.();
                }}
              >
                <span className="material-symbols-outlined">{icon}</span>
                {label}
              </button>
            );
          })}
        </nav>
        {onLogout && (
          <button
            onClick={onLogout}
            className="mt-auto flex items-center gap-3 rounded-lg px-3 py-2.5 text-error hover:bg-error-container/10 transition-colors"
            type="button"
          >
            <span className="material-symbols-outlined">logout</span>
            Đăng xuất
          </button>
        )}
      </aside>

      {/* Main Content Area */}
      <main className="min-h-[100dvh] md:ml-60">
        {/* Header */}
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-outline-variant bg-surface/95 px-margin-mobile backdrop-blur md:px-margin-desktop">
          <button
            className="rounded-full p-2 text-on-surface-variant md:hidden"
            type="button"
            aria-label="Mở menu"
          >
            <span className="material-symbols-outlined">menu</span>
          </button>
          <label className="relative hidden w-full max-w-md md:block">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">
              search
            </span>
            <input
              className="w-full rounded-full border border-outline-variant bg-surface-container-low px-4 py-2 pl-10 text-body-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
              placeholder="Tìm kiếm kỹ thuật viên..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
          <div className="ml-auto flex items-center gap-2">
            <button
              className="rounded-full p-2 text-on-surface-variant hover:bg-surface-container"
              type="button"
              aria-label="Thông báo"
            >
              <span className="material-symbols-outlined">notifications</span>
            </button>
            <div className="ml-2 flex items-center gap-2 border-l border-outline-variant pl-3">
              <div className="hidden text-right sm:block">
                <p className="font-label-md text-label-md">Quản trị viên</p>
                <p className="text-[11px] text-on-surface-variant">
                  Garage ABC
                </p>
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-fixed font-bold text-on-primary-fixed">
                A
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="mx-auto max-w-[1440px] p-margin-mobile md:p-margin-desktop">
          {/* Header Banner */}
          <section className="mb-xl flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="font-headline-lg text-headline-lg font-bold">
                Quản lý Kỹ thuật viên
              </h1>
              <p className="mt-1 font-body-md text-body-md text-on-surface-variant">
                Cập nhật và quản lý hồ sơ nhân sự kỹ thuật của trung tâm dịch
                vụ.
              </p>
            </div>
            <button
              className="inline-flex items-center gap-2 rounded-lg border border-outline-variant bg-surface-container-lowest px-4 py-2.5 font-label-md text-label-md hover:bg-surface-container-low active:scale-[0.98]"
              type="button"
              onClick={() => showNotice("Đang xuất báo cáo kỹ thuật viên...")}
            >
              <span className="material-symbols-outlined text-lg">
                file_download
              </span>
              Xuất báo cáo
            </button>
          </section>

          {/* Stats Section */}
          <section className="mb-xl grid gap-4 sm:grid-cols-3">
            <article className="rounded-xl border border-outline-variant bg-surface-container-lowest p-5">
              <div className="flex items-center justify-between">
                <p className="font-label-md text-label-md text-outline">
                  TỔNG KỸ THUẬT VIÊN
                </p>
                <span className="material-symbols-outlined rounded-lg bg-primary-container/10 p-2 text-primary">
                  engineering
                </span>
              </div>
              <p className="mt-2 font-headline-lg text-3xl font-bold">
                {stats.total}
              </p>
            </article>

            <article className="rounded-xl border border-outline-variant bg-surface-container-lowest p-5">
              <div className="flex items-center justify-between">
                <p className="font-label-md text-label-md text-outline">
                  ĐANG HOẠT ĐỘNG
                </p>
                <span className="material-symbols-outlined rounded-lg bg-tertiary-container/10 p-2 text-tertiary">
                  check_circle
                </span>
              </div>
              <p className="mt-2 font-headline-lg text-3xl font-bold text-tertiary">
                {stats.active}
              </p>
            </article>

            <article className="rounded-xl border border-outline-variant bg-surface-container-lowest p-5">
              <div className="flex items-center justify-between">
                <p className="font-label-md text-label-md text-outline">
                  ĐANG BỊ KHÓA
                </p>
                <span className="material-symbols-outlined rounded-lg bg-error-container p-2 text-on-error-container">
                  block
                </span>
              </div>
              <p className="mt-2 font-headline-lg text-3xl font-bold text-error">
                {stats.locked}
              </p>
            </article>
          </section>

          {/* Main Form & Table Layout */}
          <section className="grid gap-6 lg:grid-cols-3">
            {/* Form Column */}
            <article className="rounded-xl border border-outline-variant bg-surface-container-lowest p-lg lg:col-span-1">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-on-primary">
                  <span className="material-symbols-outlined">person_add</span>
                </div>
                <h2 className="font-headline-md text-headline-md">
                  Tạo tài khoản mới
                </h2>
              </div>
              <form onSubmit={submitNewEngineer} className="space-y-4">
                <div>
                  <label className="mb-1 block font-label-md text-body-sm text-on-surface-variant">
                    Tên tài khoản / Họ tên *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.username}
                    onChange={(e) =>
                      setForm({ ...form, username: e.target.value })
                    }
                    placeholder="VD: nguyenvana hoặc Nguyễn Văn A"
                    className="w-full rounded-lg border border-outline-variant bg-surface-container-low px-3 py-2 text-body-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="mb-1 block font-label-md text-body-sm text-on-surface-variant">
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) =>
                      setForm({ ...form, email: e.target.value })
                    }
                    placeholder="example@servio.vn"
                    className="w-full rounded-lg border border-outline-variant bg-surface-container-low px-3 py-2 text-body-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="mb-1 block font-label-md text-body-sm text-on-surface-variant">
                    Số điện thoại *
                  </label>
                  <input
                    type="tel"
                    required
                    value={form.phone}
                    onChange={(e) =>
                      setForm({ ...form, phone: e.target.value })
                    }
                    placeholder="090 123 4567"
                    className="w-full rounded-lg border border-outline-variant bg-surface-container-low px-3 py-2 text-body-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="mb-1 block font-label-md text-body-sm text-on-surface-variant">
                    Ngày sinh (DOB) *
                  </label>
                  <input
                    type="date"
                    required
                    value={form.dob}
                    onChange={(e) =>
                      setForm({ ...form, dob: e.target.value })
                    }
                    className="w-full rounded-lg border border-outline-variant bg-surface-container-low px-3 py-2 text-body-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="mb-1 block font-label-md text-body-sm text-on-surface-variant">
                    Garage trực thuộc *
                  </label>
                  <select
                    value={form.garageId}
                    onChange={(e) =>
                      setForm({ ...form, garageId: Number(e.target.value) })
                    }
                    className="w-full rounded-lg border border-outline-variant bg-surface-container-low px-3 py-2 text-body-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  >
                    {garages.length > 0 ? (
                      garages.map((g) => (
                        <option key={g.id} value={g.id}>
                          {g.name}
                        </option>
                      ))
                    ) : (
                      <option value={1}>Garage Mặc định (ID: 1)</option>
                    )}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block font-label-md text-body-sm text-on-surface-variant">
                    Vai trò / Chức vụ *
                  </label>
                  <select
                    value={form.role}
                    onChange={(e) =>
                      setForm({ ...form, role: e.target.value })
                    }
                    className="w-full rounded-lg border border-outline-variant bg-surface-container-low px-3 py-2 text-body-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  >
                    {ROLE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block font-label-md text-body-sm text-on-surface-variant">
                    Mật khẩu *
                  </label>
                  <div className="relative">
                    <input
                      type={showPw ? "text" : "password"}
                      required
                      value={form.password}
                      onChange={(e) =>
                        setForm({ ...form, password: e.target.value })
                      }
                      placeholder="••••••••"
                      className="w-full rounded-lg border border-outline-variant bg-surface-container-low px-3 py-2 pr-10 text-body-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw(!showPw)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface"
                      aria-label="Hiện mật khẩu"
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
                  className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-2.5 font-label-md text-label-md text-on-primary transition hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-lg">
                    {submitting ? "sync" : "person_add"}
                  </span>
                  {submitting ? "Đang tạo tài khoản..." : "Xác nhận tạo tài khoản"}
                </button>
              </form>
            </article>

            {/* Table Column */}
            <article className="overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest lg:col-span-2">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-outline-variant p-lg">
                <h2 className="font-headline-md text-headline-md">
                  Danh sách nhân viên ({list.length})
                </h2>
                <div className="flex rounded-lg border border-outline-variant bg-surface-container-low p-1">
                  {(
                    [
                      ["all", "Tất cả"],
                      ["active", "Hoạt động"],
                      ["locked", "Đang khóa"],
                    ] as const
                  ).map(([val, label]) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setFilterStatus(val)}
                      className={`rounded-md px-3 py-1 font-label-md text-xs transition ${
                        filterStatus === val
                          ? "bg-surface-container-lowest font-semibold text-primary shadow-sm"
                          : "text-on-surface-variant hover:text-primary"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[650px] text-left text-body-sm">
                  <thead className="bg-surface-container-low text-xs text-outline">
                    <tr>
                      <th className="px-5 py-3 font-semibold">
                        Tên kỹ thuật viên
                      </th>
                      <th className="px-5 py-3 font-semibold">Vai trò</th>
                      <th className="px-5 py-3 font-semibold">Ngày tạo</th>
                      <th className="px-5 py-3 font-semibold">Trạng thái</th>
                      <th className="px-5 py-3 font-semibold text-right">
                        Thao tác
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleEngineers.map((emp, index) => {
                      const initials = emp.name
                        .split(" ")
                        .map((s) => s[0])
                        .slice(-2)
                        .join("");
                      const isActive = emp.status === "active";

                      return (
                        <tr
                          key={emp.id}
                          className="border-t border-outline-variant transition-colors hover:bg-surface-container-low"
                        >
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div
                                className={`flex h-9 w-9 items-center justify-center rounded-full font-bold text-xs ${
                                  index % 2
                                    ? "bg-secondary-fixed text-secondary"
                                    : "bg-primary-fixed text-primary"
                                }`}
                              >
                                {initials}
                              </div>
                              <div>
                                <p className="font-label-md text-label-md">
                                  {emp.name}
                                </p>
                                <p className="text-xs text-outline">
                                  {emp.email}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <span className="inline-flex items-center rounded-full bg-primary-container/15 px-2.5 py-1 text-xs font-medium text-primary">
                              {emp.roleTitle}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-on-surface-variant">
                            {emp.joined}
                          </td>
                          <td className="px-5 py-4">
                            <span
                              className={`inline-flex items-center gap-1.5 text-xs font-semibold ${
                                isActive ? "text-tertiary" : "text-error"
                              }`}
                            >
                              <span
                                className={`h-2 w-2 rounded-full ${
                                  isActive ? "bg-tertiary" : "bg-error"
                                }`}
                              />
                              {isActive ? "Hoạt động" : "Đang khóa"}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => onEmployeeDetailClick?.(emp.id)}
                                className="rounded-lg border border-outline-variant px-3 py-1 text-xs font-medium text-on-surface-variant hover:border-primary hover:text-primary"
                              >
                                Chi tiết
                              </button>
                              <button
                                type="button"
                                onClick={() => toggleStatus(emp.id)}
                                className={`rounded-lg px-2.5 py-1 text-xs font-medium ${
                                  isActive
                                    ? "bg-error-container text-on-error-container hover:bg-error/20"
                                    : "bg-tertiary-container/15 text-tertiary hover:bg-tertiary/20"
                                }`}
                              >
                                {isActive ? "Khóa" : "Mở khóa"}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}

                    {loading && (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-5 py-8 text-center text-on-surface-variant"
                        >
                          <div className="flex items-center justify-center gap-2">
                            <span className="material-symbols-outlined animate-spin text-primary">sync</span>
                            <span>Đang tải danh sách nhân viên...</span>
                          </div>
                        </td>
                      </tr>
                    )}

                    {!loading && visibleEngineers.length === 0 && (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-5 py-8 text-center text-on-surface-variant"
                        >
                          Không tìm thấy kỹ thuật viên nào phù hợp.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </article>
          </section>
        </div>
      </main>

      {/* Floating Notice Toast */}
      {notice && (
        <div
          className="fixed bottom-5 right-5 z-50 rounded-lg bg-inverse-surface px-4 py-3 text-body-sm text-inverse-on-surface shadow-lg"
          role="status"
        >
          {notice}
        </div>
      )}
    </div>
  );
}

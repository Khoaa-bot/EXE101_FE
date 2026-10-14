import { useEffect, useMemo, useState } from "react";
import {
  getAdminCustomers,
  getMyProfile,
  type AdminCustomer,
} from "../../services/api";
import AdminShell, { FilterChip, StatusPill, type AdminNavProps } from "./AdminShell";

export type Customer = {
  id: string;
  name: string;
  initials: string;
  phone: string;
  email: string;
  vehicle: string;
  vehicleCount: number;
  plate: string;
  servicedAt: string;
  createdAtRaw: string;
  state: "all" | "repair" | "vip";
  noShow: number;
  isBanned: boolean;
};

export function mapApiCustomer(c: AdminCustomer): Customer {
  const initials = c.username
    .split(" ")
    .map((s) => s[0])
    .slice(-2)
    .join("");
  return {
    id: String(c.id),
    name: c.username,
    initials: initials || c.username.slice(0, 2).toUpperCase(),
    phone: c.phone,
    email: c.email,
    vehicle: `${c.vehicleCount} xe`,
    vehicleCount: c.vehicleCount,
    plate: "—",
    servicedAt: c.createdAt
      ? new Date(c.createdAt).toLocaleDateString("vi-VN")
      : "—",
    createdAtRaw: c.createdAt,
    state: c.isBanned ? "repair" : "all",
    noShow: c.noShow,
    isBanned: c.isBanned,
  };
}

export interface AdminCustomersPageProps extends AdminNavProps {
  onCustomerDetailClick?: (customer: Customer) => void;
}

export default function AdminCustomersPage({
  onCustomerDetailClick,
  ...navProps
}: AdminCustomersPageProps) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filter, setFilter] = useState<Customer["state"]>("all");
  const [query, setQuery] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);
  const [garageName, setGarageName] = useState("");

  useEffect(() => {
    getMyProfile()
      .then((profile) => setGarageName(profile.garageName ?? ""))
      .catch(() => {});
  }, []);

  useEffect(() => {
    getAdminCustomers()
      .then((data) => {
        const list: AdminCustomer[] = Array.isArray(data)
          ? data
          : (Object.values(data) as AdminCustomer[]);
        setCustomers(list.map(mapApiCustomer));
        setLoading(false);
      })
      .catch((err) => {
        setNotice(
          err instanceof Error
            ? err.message
            : "Không thể tải danh sách khách hàng",
        );
        setLoading(false);
      });
  }, []);

  const stats = useMemo(() => {
    const now = new Date();
    const newThisMonth = customers.filter((c) => {
      const d = new Date(c.createdAtRaw);
      return (
        !isNaN(d.getTime()) &&
        d.getFullYear() === now.getFullYear() &&
        d.getMonth() === now.getMonth()
      );
    }).length;
    return {
      total: customers.length,
      totalVehicles: customers.reduce((sum, c) => sum + c.vehicleCount, 0),
      newThisMonth,
      banned: customers.filter((c) => c.isBanned).length,
    };
  }, [customers]);

  const visibleCustomers = useMemo(
    () =>
      customers.filter(
        (customer) =>
          (filter === "all" || customer.state === filter) &&
          `${customer.name} ${customer.plate} ${customer.phone} ${customer.email}`
            .toLowerCase()
            .includes(query.trim().toLowerCase()),
      ),
    [filter, query, customers],
  );

  return (
    <AdminShell
      activeTab="customers"
      title="Quản lý khách hàng"
      description="Xem và quản lý danh sách khách hàng và phương tiện tại garage."
      garageName={garageName}
      notice={notice}
      maxWidthClass="max-w-7xl"
      {...navProps}
    >
      {/* Top Metric Cards */}
      <section className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <CustomerMetric
          icon="groups"
          tone="bg-primary-fixed text-on-primary-fixed-variant"
          label="Tổng khách hàng"
          value={String(stats.total)}
          hint="Đã tạo tài khoản hoặc sử dụng dịch vụ"
        />
        <CustomerMetric
          icon="directions_car"
          tone="bg-[#d9f7dd] text-[#00531a]"
          label="Xe đang đăng ký"
          value={String(stats.totalVehicles)}
          hint="Phương tiện trong hồ sơ khách"
        />
        <CustomerMetric
          icon="person_add"
          tone="bg-[#fff1cc] text-[#6b4200]"
          label="Khách mới tháng này"
          value={String(stats.newThisMonth)}
          hint="Gia nhập trong tháng hiện tại"
        />
        <CustomerMetric
          icon="block"
          tone="bg-[#ffe4d6] text-[#7a2e00]"
          label="Đang bị chặn"
          value={String(stats.banned)}
          hint="Tài khoản bị hạn chế"
        />
      </section>

      {/* Filter and Search Bar */}
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <input
          aria-label="Tìm kiếm khách hàng..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Tìm theo tên, biển số, SĐT, email..."
          className="min-h-11 w-80 max-w-full rounded-xl border border-outline-variant bg-surface-container-lowest px-3.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
        />

        <div role="group" aria-label="Lọc theo trạng thái" className="flex flex-wrap gap-2">
          <FilterChip active={filter === "all"} onClick={() => setFilter("all")}>
            Tất cả
          </FilterChip>
          <FilterChip active={filter === "repair"} onClick={() => setFilter("repair")}>
            <span aria-hidden="true" className="material-symbols-outlined text-base">
              block
            </span>
            Đang bị chặn
          </FilterChip>
        </div>

        <span className="ml-auto text-xs text-on-surface-variant">
          {loading
            ? "Đang tải dữ liệu..."
            : `Hiển thị ${visibleCustomers.length} / ${customers.length} khách hàng`}
        </span>
      </div>

      {/* Customers Table */}
      <div className="overflow-hidden rounded-2xl border border-outline-variant/50 bg-surface-container-lowest shadow-[0_10px_26px_-14px_rgba(25,28,29,0.28)]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="bg-surface-container-low text-[11px] uppercase tracking-wider text-on-surface-variant">
              <tr>
                <th className="px-5 py-3 font-bold">Khách hàng</th>
                <th className="px-5 py-3 font-bold">Liên hệ</th>
                <th className="px-5 py-3 font-bold">Phương tiện</th>
                <th className="px-5 py-3 font-bold">Trạng thái</th>
                <th className="px-5 py-3 font-bold">Ngày tham gia</th>
                <th className="px-5 py-3 text-right font-bold">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/50">
              {visibleCustomers.map((customer, index) => (
                <tr
                  key={customer.id}
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
                        {customer.initials}
                      </div>
                      <div>
                        <p className="font-semibold text-on-surface">
                          {customer.name}
                        </p>
                        <p className="text-xs text-on-surface-variant">
                          ID: #{customer.id}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-xs text-on-surface-variant leading-5">
                    <p className="font-medium text-on-surface">{customer.phone}</p>
                    <p>{customer.email}</p>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-on-surface">
                      <span className="material-symbols-outlined text-base text-primary">
                        electric_car
                      </span>
                      {customer.vehicle}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    {customer.isBanned ? (
                      <StatusPill tone="error">Bị chặn</StatusPill>
                    ) : (
                      <StatusPill tone="success">Hoạt động</StatusPill>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-xs text-on-surface-variant">
                    {customer.servicedAt}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <button
                      className="inline-flex items-center gap-1 rounded-xl border border-outline-variant px-3 py-1.5 text-xs font-semibold text-on-surface transition-colors hover:border-primary hover:bg-primary-fixed/20 hover:text-primary"
                      type="button"
                      onClick={() => onCustomerDetailClick?.(customer)}
                    >
                      <span className="material-symbols-outlined text-base">visibility</span>
                      Chi tiết
                    </button>
                  </td>
                </tr>
              ))}

              {loading && (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-sm text-on-surface-variant">
                    <div className="flex items-center justify-center gap-2">
                      <span className="material-symbols-outlined animate-spin text-primary">sync</span>
                      <span>Đang tải danh sách khách hàng...</span>
                    </div>
                  </td>
                </tr>
              )}

              {!loading && visibleCustomers.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-sm text-on-surface-variant">
                    Không tìm thấy khách hàng nào phù hợp với bộ lọc.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminShell>
  );
}

function CustomerMetric({
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

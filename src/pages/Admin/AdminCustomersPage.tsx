import { useEffect, useMemo, useState } from "react";
import { getAdminCustomers, type AdminCustomer } from "../../services/api";

export type Customer = {
  id: string;
  name: string;
  initials: string;
  phone: string;
  email: string;
  vehicle: string;
  plate: string;
  servicedAt: string;
  state: "all" | "repair" | "vip";
};

function mapApiCustomer(c: AdminCustomer): Customer {
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
    plate: "—",
    servicedAt: c.createdAt
      ? new Date(c.createdAt).toLocaleDateString("vi-VN")
      : "—",
    state: c.isBanned ? "repair" : "all",
  };
}

const navItems = [
  ["dashboard", "Dashboard"],
  ["engineering", "Nhân viên"],
  ["groups", "Khách hàng"],
  ["inventory_2", "Kho linh kiện"],
  ["payments", "Bảng giá"],
];

type AdminCustomersPageProps = {
  onDashboardClick?: () => void;
  onEngineersClick?: () => void;
  onCustomersClick?: () => void;
  onInventoryClick?: () => void;
  onPricingClick?: () => void;
  onCustomerDetailClick?: (customer: Customer) => void;
  onLogout?: () => void;
};

export default function AdminCustomersPage({
  onDashboardClick,
  onEngineersClick,
  onCustomersClick,
  onInventoryClick,
  onPricingClick,
  onCustomerDetailClick,
  onLogout,
}: AdminCustomersPageProps) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filter, setFilter] = useState<Customer["state"]>("all");
  const [query, setQuery] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);

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
        setNotice(err instanceof Error ? err.message : "Không thể tải danh sách khách hàng");
        setLoading(false);
      });
  }, []);

  const visibleCustomers = useMemo(
    () =>
      customers.filter(
        (customer) =>
          (filter === "all" || customer.state === filter) &&
          `${customer.name} ${customer.plate}`
            .toLocaleLowerCase()
            .includes(query.toLocaleLowerCase()),
      ),
    [filter, query, customers],
  );
  const showNotice = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 3000);
  };

  return (
    <div className="min-h-[100dvh] bg-background font-sans text-on-surface">
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
          {navItems.map(([icon, label]) => (
            <button
              key={label}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left font-body-md text-body-md transition-colors active:scale-[0.98] ${label === "Khách hàng" ? "bg-primary-container/15 font-semibold text-primary" : "text-on-surface-variant hover:bg-surface-container-low"}`}
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
          ))}
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
      <main className="min-h-[100dvh] md:ml-60">
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
              placeholder="Tìm kiếm khách hàng hoặc biển số..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
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
        <div className="mx-auto max-w-[1440px] p-margin-mobile md:p-margin-desktop">
          <section className="mb-xl flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="font-headline-lg text-headline-lg font-bold">
                Quản lý khách hàng
              </h1>
              <p className="mt-1 font-body-md text-body-md text-on-surface-variant">
                Xem và quản lý danh sách khách hàng và phương tiện tại hệ thống.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 font-label-md text-label-md text-on-primary active:scale-[0.98]"
                type="button"
                onClick={() => showNotice("Mở biểu mẫu thêm khách hàng")}
              >
                <span className="material-symbols-outlined text-lg">
                  person_add
                </span>
                Thêm khách hàng
              </button>
              <button
                className="inline-flex items-center gap-2 rounded-lg border border-primary px-4 py-2.5 font-label-md text-label-md text-primary hover:bg-surface-container-low"
                type="button"
                onClick={() => showNotice("Đang xuất báo cáo khách hàng...")}
              >
                <span className="material-symbols-outlined text-lg">
                  file_download
                </span>
                Xuất báo cáo
              </button>
            </div>
          </section>
          <section className="mb-xl grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Metric
              icon="groups"
              label="Tổng khách hàng"
              value="1,284"
              detail="+12%"
            />
            <Metric
              icon="directions_car"
              label="Xe đang đăng ký"
              value="1,452"
              detail="+5.4%"
            />
            <Metric
              icon="handyman"
              label="Khách mới"
              value="86"
              detail="Tháng này"
              neutral
            />
            <Metric
              icon="star"
              label="Đánh giá TB"
              value="98%"
              detail="4.9 / 5"
            />
          </section>
          <section className="overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-outline-variant p-lg">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex rounded-lg border border-outline-variant bg-surface-container-low p-1">
                  {(
                    [
                      ["all", "Tất cả"],
                      ["repair", "Đang sửa"],
                      ["vip", "VIP"],
                    ] as const
                  ).map(([value, label]) => (
                    <button
                      key={value}
                      className={`rounded-md px-4 py-1.5 font-label-md text-label-md ${filter === value ? "bg-surface-container-lowest text-primary shadow-sm" : "text-on-surface-variant hover:text-primary"}`}
                      type="button"
                      onClick={() => setFilter(value)}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <button
                  className="inline-flex items-center gap-2 rounded-lg border border-outline-variant px-3 py-2 font-label-md text-label-md text-on-surface-variant hover:bg-surface-container-low"
                  type="button"
                >
                  <span className="material-symbols-outlined text-lg">
                    filter_list
                  </span>
                  Lọc thêm
                </button>
              </div>
              <p className="text-xs text-outline">
                {loading ? "Đang tải..." : `Hiển thị ${visibleCustomers.length} khách hàng`}
              </p>
            </div>
            <CustomerTable
              customers={visibleCustomers}
              showNotice={showNotice}
              onCustomerDetailClick={onCustomerDetailClick}
            />
            <Pagination />
          </section>
          <section className="mt-xl grid gap-xl xl:grid-cols-3">
            {/* <RecentActivity /> */}
            {/* <SystemStatus /> */}
          </section>
        </div>
      </main>
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

function Metric({
  icon,
  label,
  value,
  detail,
  neutral = false,
}: {
  icon: string;
  label: string;
  value: string;
  detail: string;
  neutral?: boolean;
}) {
  return (
    <article className="rounded-xl border border-outline-variant bg-surface-container-lowest p-lg">
      <div className="flex items-start justify-between">
        <span className="material-symbols-outlined rounded-lg bg-surface-container-high p-2 text-primary">
          {icon}
        </span>
        <span
          className={`text-xs font-semibold ${neutral ? "text-on-surface-variant" : "text-tertiary"}`}
        >
          {detail}
        </span>
      </div>
      <p className="mt-3 font-label-md text-label-md text-outline">{label}</p>
      <p className="mt-1 font-headline-lg text-headline-lg">{value}</p>
    </article>
  );
}
function CustomerTable({
  customers,
  showNotice,
  onCustomerDetailClick,
}: {
  customers: Customer[];
  showNotice: (message: string) => void;
  onCustomerDetailClick?: (customer: Customer) => void;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1000px] text-left text-body-sm">
        <thead className="bg-surface-container-low text-xs text-outline">
          <tr>
            {[
              "Khách hàng",
              "Liên hệ",
              "Phương tiện",
              "Biển số",
              "Lần bảo dưỡng cuối",
              "Thao tác",
            ].map((label) => (
              <th
                key={label}
                className={`px-lg py-4 font-semibold ${label === "Thao tác" ? "text-right" : ""}`}
              >
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {customers.map((customer, index) => (
            <tr
              key={customer.id}
              className="border-t border-outline-variant transition-colors hover:bg-surface-container-low"
            >
              <td className="px-lg py-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full font-bold ${index % 2 ? "bg-secondary-fixed text-secondary" : "bg-primary-fixed text-primary"}`}
                  >
                    {customer.initials}
                  </div>
                  <div>
                    <p className="font-label-md text-label-md">
                      {customer.name}
                    </p>
                    <p className="text-xs text-outline">ID: #{customer.id}</p>
                  </div>
                </div>
              </td>
              <td className="px-lg py-4 leading-5 text-on-surface-variant">
                {customer.phone}
                <br />
                {customer.email}
              </td>
              <td className="px-lg py-4">
                <span className="inline-flex items-center gap-2">
                  <span className="material-symbols-outlined text-lg text-outline">
                    electric_car
                  </span>
                  {customer.vehicle}
                </span>
              </td>
              <td className="px-lg py-4 font-label-md text-label-md text-primary">
                {customer.plate}
              </td>
              <td className="px-lg py-4 text-on-surface-variant">
                {customer.servicedAt}
              </td>
              <td className="px-lg py-4 text-right">
                <div className="flex justify-end gap-2">
                  <button
                    className="rounded-full p-2 text-primary hover:bg-surface-container-high"
                    type="button"
                    aria-label={`Nhắn tin với ${customer.name}`}
                    onClick={() =>
                      showNotice(`Mở tin nhắn với ${customer.name}`)
                    }
                  >
                    <span className="material-symbols-outlined">
                      chat_bubble
                    </span>
                  </button>
                  <button
                    className="rounded-lg border border-outline-variant px-3 py-1.5 font-label-md text-label-md text-on-surface-variant hover:border-primary hover:bg-primary hover:text-on-primary"
                    type="button"
                    onClick={() => onCustomerDetailClick?.(customer)}
                  >
                    Chi tiết
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
function Pagination() {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-outline-variant bg-surface-container-low p-4">
      <label className="flex items-center gap-2 text-xs text-outline">
        Hàng mỗi trang:
        <select className="bg-transparent text-xs text-on-surface-variant">
          <option>10</option>
          <option>20</option>
          <option>50</option>
        </select>
      </label>
      <div className="flex items-center gap-2">
        <button
          className="rounded p-1 text-outline opacity-40"
          type="button"
          disabled
        >
          <span className="material-symbols-outlined">chevron_left</span>
        </button>
        {["1", "2", "3", "...", "129"].map((page) => (
          <button
            key={page}
            className={`flex h-8 min-w-8 items-center justify-center rounded-lg text-xs ${page === "1" ? "bg-primary text-on-primary" : "text-on-surface-variant hover:bg-surface-container-highest"}`}
            type="button"
          >
            {page}
          </button>
        ))}
        <button
          className="rounded p-1 text-outline hover:bg-surface-container-highest"
          type="button"
        >
          <span className="material-symbols-outlined">chevron_right</span>
        </button>
      </div>
    </div>
  );
}
// function RecentActivity() {
//   const events = [
//     [
//       "build",
//       "Bảo dưỡng định kỳ hoàn tất",
//       "Xe 51H-12345 (Nguyễn Văn Minh) đã hoàn thành quy trình bảo dưỡng 10.000km.",
//       "2 giờ trước",
//     ],
//     [
//       "person_add",
//       "Khách hàng mới đăng ký",
//       "Trần Thị Mai (xe VinFast VF9) đã đăng ký thành công trên ứng dụng Servio.",
//       "5 giờ trước",
//     ],
//     [
//       "rate_review",
//       "Đánh giá 5 sao mới",
//       "Khách hàng Lê Văn Cường để lại phản hồi tốt về dịch vụ sửa chữa điều hòa.",
//       "1 ngày trước",
//     ],
//   ];
//   return (
//     <article className="rounded-xl border border-outline-variant bg-surface-container-lowest p-lg xl:col-span-2">
//       <h2 className="font-headline-md text-headline-md">Hoạt động gần đây</h2>
//       <div className="mt-lg space-y-lg">
//         {events.map(([icon, title, description, time]) => (
//           <div key={title} className="flex gap-3">
//             <span className="material-symbols-outlined flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-container/15 text-primary">
//               {icon}
//             </span>
//             <div>
//               <p className="font-label-md text-label-md">{title}</p>
//               <p className="mt-1 text-body-sm text-on-surface-variant">
//                 {description}
//               </p>
//               <p className="mt-1 text-xs text-outline">{time}</p>
//             </div>
//           </div>
//         ))}
//       </div>
//     </article>
//   );
// }
// function SystemStatus() {
//   return (
//     <article className="flex min-h-64 flex-col items-center justify-center overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest p-lg text-center">
//       <span className="material-symbols-outlined text-5xl text-tertiary">
//         electric_bolt
//       </span>
//       <h2 className="mt-3 font-headline-md text-headline-md">
//         Tình trạng hệ thống
//       </h2>
//       <div className="my-4 flex h-24 w-24 items-center justify-center rounded-full border-4 border-tertiary font-headline-lg text-headline-lg text-tertiary">
//         99%
//       </div>
//       <p className="max-w-xs text-body-sm text-on-surface-variant">
//         Mọi hệ thống đang hoạt động ổn định. Không có cảnh báo lỗi mới.
//       </p>
//       <button
//         className="mt-4 inline-flex items-center gap-1 font-label-md text-label-md text-primary hover:underline"
//         type="button"
//       >
//         Xem chi tiết
//         <span className="material-symbols-outlined text-base">
//           arrow_forward
//         </span>
//       </button>
//     </article>
//   );
// }

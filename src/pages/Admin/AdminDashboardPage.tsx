import { useEffect, useMemo, useState } from "react";
import StarRating from "../../components/StarRating";
import {
  getAdminEmployees,
  getMyGarageReviews,
  getReceptionDashboard,
  getWalletSummary,
  type AdminEmployee,
  type AppointmentDto,
  type GarageOwnerReviews,
  type ReceptionDashboard,
  type WalletSummary,
} from "../../services/api";
import AdminShell, { type AdminNavProps, StatusPill } from "./AdminShell";

export type AdminDashboardPageProps = AdminNavProps;

const NO_EMPLOYEES: AdminEmployee[] = [];
const NO_APPOINTMENTS: AppointmentDto[] = [];

const formatPrice = (n: number) => `${n.toLocaleString("vi-VN")}đ`;

const STATUS_LABEL: Record<string, string> = {
  pending: "Chờ xác nhận",
  confirmed: "Đã xác nhận",
  in_progress: "Đang xử lý",
  completed: "Hoàn thành",
  cancelled: "Đã hủy",
  no_show: "Không đến",
};

export default function AdminDashboardPage(props: AdminDashboardPageProps) {
  const [notice, setNotice] = useState("");
  const [wallet, setWallet] = useState<WalletSummary | null>(null);
  const [reviews, setReviews] = useState<GarageOwnerReviews | null>(null);
  // null = đang tải; có giá trị = đã tải xong (thành công hoặc lỗi).
  const [loaded, setLoaded] = useState<{
    dashboard: ReceptionDashboard | null;
    employees: AdminEmployee[];
    error: string | null;
  } | null>(null);

  const isLoading = loaded === null;
  const dashboard = loaded?.dashboard ?? null;
  const employees = loaded?.employees ?? NO_EMPLOYEES;
  const loadError = loaded?.error ?? null;

  const showNotice = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 3000);
  };

  useEffect(() => {
    let cancelled = false;
    Promise.all([getReceptionDashboard(), getAdminEmployees()])
      .then(([dash, emp]) => {
        if (!cancelled) setLoaded({ dashboard: dash, employees: emp, error: null });
      })
      .catch((err) => {
        if (cancelled) return;
        setLoaded({
          dashboard: null,
          employees: NO_EMPLOYEES,
          error: err instanceof Error ? err.message : "Không tải được dữ liệu dashboard.",
        });
      });

    // Ví không chặn dashboard: lỗi thì chỉ ẩn thẻ số dư.
    getWalletSummary()
      .then((data) => {
        if (!cancelled) setWallet(data);
      })
      .catch(() => undefined);

    // Đánh giá cũng không chặn dashboard: lỗi thì chỉ ẩn thẻ đánh giá.
    getMyGarageReviews({ mode: "all", page: 0, size: 3 })
      .then((data) => {
        if (!cancelled) setReviews(data);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  const appointments = dashboard?.appointments ?? NO_APPOINTMENTS;

  const totalRevenue = useMemo(
    () =>
      appointments
        .filter((a) => a.status === "completed" || a.status === "successful")
        .reduce((sum, a) => sum + (a.servicePrice ?? 0), 0),
    [appointments],
  );

  const inProgress = useMemo(
    () => appointments.filter((a) => a.status === "in_progress"),
    [appointments],
  );

  const today = new Date().toISOString().slice(0, 10);
  const todayAppointments = useMemo(
    () => appointments.filter((a) => a.scheduleDate === today),
    [appointments, today],
  );

  const technicians = useMemo(
    () => employees.filter((e) => e.role?.toLowerCase() === "engineer"),
    [employees],
  );

  return (
    <AdminShell
      activeTab="dashboard"
      title="Tổng quan hệ thống"
      description={`Tình hình hoạt động của ${dashboard?.garageName ?? "garage"} hôm nay.`}
      garageName={dashboard?.garageName}
      notice={notice}
      maxWidthClass="max-w-7xl"
      {...props}
    >
      {isLoading && (
        <div className="flex items-center gap-2 py-8 text-body-sm text-on-surface-variant">
          <span className="material-symbols-outlined animate-spin text-primary">sync</span>
          <span>Đang tải dữ liệu dashboard...</span>
        </div>
      )}

      {!isLoading && loadError && (
        <div className="rounded-xl border border-error/30 bg-error-container/10 p-4 text-body-sm text-error">
          {loadError}
        </div>
      )}

      {!isLoading && !loadError && dashboard && (
        <>
          {/* Hàng 1: Tài chính (doanh thu + ví) */}
          <section className="mb-4 grid gap-4 md:grid-cols-2">
            <RevenueCard total={totalRevenue} />
            <WalletCard wallet={wallet} onWalletClick={props.onWalletClick} />
          </section>

          {/* Hàng 2: Trạng thái lịch hẹn theo thứ tự quy trình */}
          <section className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              icon="event_available"
              label="Tổng lịch hẹn"
              value={String(dashboard.totalAppointments)}
              detail="tất cả lịch hẹn"
              tone="primary"
            />
            <StatCard
              icon="hourglass_empty"
              label="Chờ xác nhận"
              value={String(dashboard.pendingCount)}
              detail="cần xử lý ngay"
              tone="accent"
            />
            <StatCard
              icon="build"
              label="Đang xử lý"
              value={String(dashboard.inProgressCount)}
              detail="đang sửa chữa"
              tone="warning"
            />
            <StatCard
              icon="check_circle"
              label="Hoàn thành"
              value={String(dashboard.completedCount)}
              detail="tổng hoàn thành"
              tone="success"
            />
          </section>

          {reviews && (
            <section className="mb-6">
              <ReviewsCard reviews={reviews} onViewAll={props.onReviewsClick} />
            </section>
          )}

          {/* Lưới chính: Lịch hôm nay + Đang xử lý | Kỹ thuật viên */}
          <section className="grid gap-6 xl:grid-cols-3">
            <div className="min-w-0 space-y-6 xl:col-span-2">
              <AppointmentCard appointments={todayAppointments} />
              <RepairsTable repairs={inProgress} showNotice={showNotice} />
            </div>
            <div className="min-w-0 space-y-6">
              <TechnicianCard
                technicians={technicians}
                onAddClick={() => props.onEngineersClick?.()}
              />
            </div>
          </section>
        </>
      )}
    </AdminShell>
  );
}

function formatReviewDate(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleDateString("vi-VN");
}

const REVIEW_AVATAR_TONES = [
  "bg-primary-fixed text-on-primary-fixed-variant",
  "bg-[#d9f7dd] text-[#00531a]",
  "bg-[#ffe4d6] text-[#7a2e00]",
];

function ReviewsCard({
  reviews,
  onViewAll,
}: {
  reviews: GarageOwnerReviews;
  onViewAll?: () => void;
}) {
  const average = reviews.summary.average;

  return (
    <article
      aria-label="Đánh giá của khách"
      className="overflow-hidden rounded-2xl border border-outline-variant/50 bg-surface-container-lowest shadow-[0_10px_26px_-14px_rgba(25,28,29,0.28)]"
    >
      <div className="flex items-center justify-between gap-2 border-b border-outline-variant/50 px-5 py-4">
        <div className="flex items-center gap-2">
          <span aria-hidden="true" className="material-symbols-outlined text-primary">
            reviews
          </span>
          <h2 className="font-headline-md text-base font-bold">Đánh giá của khách</h2>
        </div>
        {onViewAll && (
          <button
            type="button"
            onClick={onViewAll}
            className="inline-flex min-h-9 items-center gap-1 text-xs font-bold text-primary hover:underline"
          >
            Xem tất cả đánh giá
            <span aria-hidden="true" className="material-symbols-outlined text-lg">
              arrow_forward
            </span>
          </button>
        )}
      </div>

      <div className="grid md:grid-cols-[300px_minmax(0,1fr)]">
        <div className="flex flex-col gap-4 border-b border-outline-variant/50 p-5 md:border-b-0 md:border-r">
          <div className="flex items-center gap-3.5">
            <span className="text-5xl font-extrabold leading-none tracking-tight">
              {average !== null
                ? average.toLocaleString("vi-VN", { minimumFractionDigits: 1 })
                : "—"}
            </span>
            <div className="flex flex-col gap-1">
              {average !== null && <StarRating value={average} size={18} />}
              <span className="text-xs text-on-surface-variant">
                {reviews.summary.count.toLocaleString("vi-VN")} đánh giá
              </span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2 rounded-[14px] bg-[#ffe4d6] px-3 py-2.5 text-[#7a2e00]">
              <span className="flex items-center gap-2 text-[13px]">
                <span aria-hidden="true" className="material-symbols-outlined text-xl">
                  mark_chat_unread
                </span>
                Chưa phản hồi
              </span>
              <b className="text-lg">{reviews.unreplied}</b>
            </div>
            <div className="flex items-center justify-between gap-2 rounded-[14px] bg-error-container px-3 py-2.5 text-on-error-container">
              <span className="flex items-center gap-2 text-[13px]">
                <span aria-hidden="true" className="material-symbols-outlined text-xl">
                  thumb_down
                </span>
                Từ 2 sao trở xuống (30 ngày)
              </span>
              <b className="text-lg">{reviews.lowLast30Days}</b>
            </div>
          </div>
        </div>

        <ul>
          {reviews.items.map((review, index) => (
            <li
              key={review.id}
              className={`space-y-2 border-t border-outline-variant/40 px-5 py-3.5 first:border-t-0 ${
                review.hidden ? "opacity-70" : ""
              }`}
            >
              <div className="flex flex-wrap items-center gap-3">
                <span
                  aria-hidden="true"
                  className={`flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full font-extrabold ${
                    REVIEW_AVATAR_TONES[index % REVIEW_AVATAR_TONES.length]
                  }`}
                >
                  {review.customerName.charAt(0).toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <b className="text-sm">{review.customerName}</b>
                  <div className="text-xs text-on-surface-variant">
                    <StarRating value={review.rating} size={16} /> · {formatReviewDate(review.createdAt)}
                  </div>
                </div>
                {review.serviceName && (
                  <span className="rounded-full bg-surface-container px-2.5 py-1 text-xs font-semibold text-on-surface-variant">
                    {review.serviceName}
                  </span>
                )}
                {review.hidden ? (
                  <StatusPill tone="neutral">Quản trị viên đã ẩn</StatusPill>
                ) : review.reply ? (
                  <StatusPill tone="success">Đã phản hồi</StatusPill>
                ) : (
                  <StatusPill tone="warning">Chưa phản hồi</StatusPill>
                )}
              </div>
              {!review.hidden && review.comment && (
                <p className="ml-[50px] line-clamp-2 text-sm leading-relaxed">{review.comment}</p>
              )}
            </li>
          ))}
          {reviews.items.length === 0 && (
            <li className="px-5 py-8 text-center text-body-sm text-on-surface-variant">
              Chưa có đánh giá nào.
            </li>
          )}
        </ul>
      </div>
    </article>
  );
}

function WalletCard({
  wallet,
  onWalletClick,
}: {
  wallet: WalletSummary | null;
  onWalletClick?: () => void;
}) {
  return (
    <article className="flex flex-col justify-between rounded-2xl border border-outline-variant/40 bg-surface-container-lowest p-5 shadow-[0_10px_26px_-14px_rgba(25,28,29,0.28)]">
      <div className="flex items-center gap-3.5">
        <span
          aria-hidden="true"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-[#e6defa] text-[#3b2a7a]"
        >
          <span className="material-symbols-outlined">account_balance_wallet</span>
        </span>
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
            Số dư ví garage
          </p>
          <p
            className="mt-0.5 text-2xl font-extrabold text-on-surface"
            data-testid="garage-wallet-balance"
          >
            {wallet ? formatPrice(wallet.balance) : "..."}
          </p>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-outline-variant/40 pt-3">
        <p className="text-xs text-on-surface-variant">
          Tổng nhận: {formatPrice(wallet?.totalEarned ?? 0)}
        </p>
        {onWalletClick && (
          <button
            type="button"
            onClick={onWalletClick}
            className="inline-flex items-center gap-1.5 rounded-xl border border-primary/50 bg-primary-fixed/20 px-3 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary hover:text-on-primary"
          >
            <span className="material-symbols-outlined text-[16px]">account_balance_wallet</span>
            Xem ví &amp; rút tiền
          </button>
        )}
      </div>
    </article>
  );
}

function RevenueCard({ total }: { total: number }) {
  return (
    <article className="flex flex-col justify-between rounded-2xl border border-outline-variant/40 bg-surface-container-lowest p-5 shadow-[0_10px_26px_-14px_rgba(25,28,29,0.28)]">
      <div className="flex items-center gap-3.5">
        <span
          aria-hidden="true"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-[#d9f7dd] text-[#00531a]"
        >
          <span className="material-symbols-outlined">payments</span>
        </span>
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
            Doanh thu dịch vụ hoàn thành
          </p>
          <p className="mt-0.5 text-2xl font-extrabold text-on-surface">
            {formatPrice(total)}
          </p>
        </div>
      </div>
      <p className="mt-4 border-t border-outline-variant/40 pt-3 text-xs text-on-surface-variant">
        Tổng đơn giá của các lịch hẹn đã hoàn thành và thanh toán
      </p>
    </article>
  );
}

function StatCard({
  icon,
  label,
  value,
  detail,
  tone,
}: {
  icon: string;
  label: string;
  value: string;
  detail: string;
  tone: "primary" | "warning" | "success" | "accent";
}) {
  const tones = {
    primary: "bg-primary-fixed text-on-primary-fixed-variant",
    warning: "bg-[#ffe4d6] text-[#7a2e00]",
    success: "bg-[#d9f7dd] text-[#00531a]",
    accent: "bg-[#fff1cc] text-[#6b4200]",
  };

  return (
    <article className="flex items-center gap-3.5 rounded-2xl border border-outline-variant/40 bg-surface-container-lowest p-4 shadow-[0_10px_26px_-14px_rgba(25,28,29,0.28)]">
      <span
        aria-hidden="true"
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] ${tones[tone]}`}
      >
        <span className="material-symbols-outlined">{icon}</span>
      </span>
      <div className="min-w-0">
        <p className="text-xs text-on-surface-variant">{label}</p>
        <p className="text-xl font-extrabold text-on-surface">{value}</p>
        <p className="text-[11px] text-on-surface-variant">{detail}</p>
      </div>
    </article>
  );
}

function RepairsTable({
  repairs,
  showNotice,
}: {
  repairs: AppointmentDto[];
  showNotice: (message: string) => void;
}) {
  return (
    <article className="overflow-hidden rounded-2xl border border-outline-variant/50 bg-surface-container-lowest shadow-[0_10px_26px_-14px_rgba(25,28,29,0.28)]">
      <div className="flex items-center justify-between border-b border-outline-variant/50 px-5 py-4">
        <div>
          <h2 className="font-headline-md text-base font-bold">
            Đang xử lý ({repairs.length})
          </h2>
          <p className="text-xs text-on-surface-variant">
            Phương tiện đang được bảo dưỡng / sửa chữa tại xưởng
          </p>
        </div>
        <button
          className="text-xs font-semibold text-primary hover:underline"
          type="button"
          onClick={() => showNotice("Xem chi tiết ở trang Lịch hẹn / Kỹ thuật viên")}
        >
          Xem tất cả
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[680px] text-left text-sm">
          <thead className="bg-surface-container-low text-[11px] uppercase tracking-wider text-on-surface-variant">
            <tr>
              {["Biển số", "Khách hàng", "Dịch vụ", "Kỹ thuật viên", "Thời gian"].map(
                (label, idx) => (
                  <th
                    key={label}
                    className={`px-4 py-3 font-bold ${idx === 4 ? "text-right" : ""}`}
                  >
                    {label}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/50">
            {repairs.map((repair) => (
              <tr
                key={repair.id}
                className="transition-colors hover:bg-surface-container-low"
              >
                <td className="px-4 py-3.5 font-bold text-primary">
                  {repair.vehicleLicensePlate ?? "—"}
                </td>
                <td className="px-4 py-3.5 font-medium">{repair.customerName}</td>
                <td className="px-4 py-3.5 text-on-surface-variant">
                  {repair.serviceName}
                </td>
                <td className="px-4 py-3.5 text-on-surface-variant">
                  {repair.engineerName ?? (
                    <span className="italic text-outline">Chưa gán</span>
                  )}
                </td>
                <td className="px-4 py-3.5 text-right">
                  <p className="font-semibold">{repair.timeFrame}</p>
                  <p className="text-xs text-on-surface-variant">
                    {repair.scheduleDate}
                  </p>
                </td>
              </tr>
            ))}
            {repairs.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-8 text-center text-sm text-on-surface-variant"
                >
                  Hiện không có lịch hẹn nào đang xử lý.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </article>
  );
}

function AppointmentCard({ appointments }: { appointments: AppointmentDto[] }) {
  return (
    <article className="overflow-hidden rounded-2xl border border-outline-variant/50 bg-surface-container-lowest shadow-[0_10px_26px_-14px_rgba(25,28,29,0.28)]">
      <div className="flex items-center justify-between gap-2 border-b border-outline-variant/50 px-5 py-4">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">
            calendar_month
          </span>
          <h2 className="font-headline-md text-base font-bold">Lịch hẹn hôm nay</h2>
        </div>
        <span className="text-xs text-on-surface-variant">
          {appointments.length} lịch hẹn
        </span>
      </div>
      <div className="grid gap-3 p-5 md:grid-cols-2">
        {appointments.map((appointment) => (
          <div
            key={appointment.id}
            className="rounded-xl border border-outline-variant/60 p-3 transition-colors hover:border-primary/50 hover:bg-surface-container-low/40"
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-semibold text-primary">
                {appointment.timeFrame}
              </p>
              <StatusBadge status={appointment.status} />
            </div>
            <p className="mt-1.5 truncate text-sm font-bold">
              {appointment.customerName}
            </p>
            <p className="mt-0.5 truncate text-xs text-on-surface-variant">
              {appointment.serviceName}
            </p>
          </div>
        ))}
        {appointments.length === 0 && (
          <p className="py-4 text-center text-body-sm text-on-surface-variant md:col-span-2">
            Không có lịch hẹn nào hôm nay.
          </p>
        )}
      </div>
    </article>
  );
}

function TechnicianCard({
  technicians,
  onAddClick,
}: {
  technicians: AdminEmployee[];
  onAddClick: () => void;
}) {
  return (
    <article className="overflow-hidden rounded-2xl border border-outline-variant/50 bg-surface-container-lowest shadow-[0_10px_26px_-14px_rgba(25,28,29,0.28)]">
      <div className="flex items-center justify-between border-b border-outline-variant/50 px-5 py-4">
        <h2 className="font-headline-md text-base font-bold">Kỹ thuật viên</h2>
        <span className="text-xs text-on-surface-variant">
          {technicians.length} người
        </span>
      </div>
      <div className="space-y-3 p-5">
        {technicians.map((technician) => (
          <div key={technician.id} className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-fixed text-xs font-bold text-on-primary-fixed-variant">
              {(technician.fullName ?? technician.username)[0]?.toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">
                {technician.fullName ?? technician.username}
              </p>
              <p className="truncate text-xs text-on-surface-variant">
                {technician.email}
              </p>
            </div>
          </div>
        ))}
        {technicians.length === 0 && (
          <p className="py-2 text-center text-body-sm text-on-surface-variant">
            Chưa có kỹ thuật viên nào.
          </p>
        )}
        <button
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-outline-variant py-2.5 text-xs font-bold text-on-surface transition-colors hover:bg-surface-container-low"
          type="button"
          onClick={onAddClick}
        >
          <span className="material-symbols-outlined text-lg">person_add</span>
          Thêm kỹ thuật viên
        </button>
      </div>
    </article>
  );
}

function StatusBadge({ status }: { status: string }) {
  const isDone = status === "completed" || status === "confirmed";
  const tone = isDone ? "success" : status === "in_progress" ? "warning" : "error";
  const text = STATUS_LABEL[status] ?? status;
  return <StatusPill tone={tone}>{text}</StatusPill>;
}
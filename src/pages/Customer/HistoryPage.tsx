import { Fragment, useEffect, useState, useRef } from "react";
import { useDialogA11y } from "../../hooks/useDialogA11y";
import AppSidebar, { type AppSection } from "../../components/AppSidebar";
import StarRating from "../../components/StarRating";
import { useUnreadNotificationCount } from "../../hooks/useUnreadNotificationCount";
import {
  createReview,
  getAppointmentHistory,
  requestInvoicePayment,
  updateReview,
  type AppointmentDto,
  type Review,
} from "../../services/api";

const REVIEW_COMMENT_LIMIT = 1000;

type HistoryPageProps = {
  onHomeClick: () => void;
  onNotificationsClick: () => void;
  onProfileClick: () => void;
  onTrackingClick: () => void;
};

const filters = [
  { value: "all", label: "Tất cả" },
  { value: "completed", label: "Hoàn thành" },
  { value: "cancelled", label: "Đã huỷ" },
  { value: "no_show", label: "Không đến" },
];

function statusLabel(status: string) {
  switch (status.toLowerCase()) {
    case "completed":
      return "Hoàn thành";
    case "cancelled":
      return "Đã huỷ";
    case "no_show":
      return "Không đến";
    case "in_progress":
      return "Đang xử lý";
    case "confirmed":
      return "Đã xác nhận";
    case "pending":
      return "Chờ xác nhận";
    default:
      return status;
  }
}

function statusTone(status: string) {
  const s = status.toLowerCase();
  if (s === "cancelled" || s === "no_show") return "bg-error-container/30 text-on-error-container";
  if (s === "completed") return "bg-secondary-container/30 text-on-secondary-container";
  return "bg-primary-container/20 text-primary";
}

function statusIcon(status: string) {
  const s = status.toLowerCase();
  if (s === "cancelled" || s === "no_show") return "cancel";
  if (s === "completed") return "task_alt";
  return "build";
}

function formatCurrency(value: number | null | undefined) {
  if (value === null || value === undefined) return "—";
  return `${value.toLocaleString("vi-VN")}đ`;
}

export default function HistoryPage({
  onHomeClick,
  onNotificationsClick,
  onProfileClick,
  onTrackingClick,
}: HistoryPageProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const unreadNotificationCount = useUnreadNotificationCount();
  const [activeFilter, setActiveFilter] = useState(filters[0].value);
  const [appointments, setAppointments] = useState<AppointmentDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reviewingRecord, setReviewingRecord] = useState<AppointmentDto | null>(null);
  const reviewRef = useRef<HTMLDivElement>(null);
  useDialogA11y(reviewingRecord !== null, reviewRef, () => setReviewingRecord(null));
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [notice, setNotice] = useState("");

  const showNotice = (msg: string) => {
    setNotice(msg);
    window.setTimeout(() => setNotice(""), 3000);
  };

  // Mở hộp thoại: lịch hẹn đã có đánh giá thì điền sẵn nội dung cũ để sửa.
  const openReview = (record: AppointmentDto) => {
    setReviewingRecord(record);
    setReviewRating(record.reviewId ? (record.reviewRating ?? 5) : 5);
    setReviewComment(record.reviewId ? (record.reviewComment ?? "") : "");
    setReviewError(null);
  };

  const applyReview = (record: AppointmentDto, review: Review) => {
    setAppointments((prev) =>
      prev.map((item) =>
        item.id !== record.id
          ? item
          : {
              ...item,
              reviewId: review.id,
              reviewRating: review.rating,
              reviewComment: review.comment,
              reviewCreatedAt: review.createdAt,
              reviewHidden: review.hidden ?? false,
              reviewReply: review.reply ?? null,
              reviewCanEdit: item.reviewId ? (item.reviewCanEdit ?? true) : true,
              reviewEditDaysLeft: item.reviewId ? (item.reviewEditDaysLeft ?? 7) : 7,
            },
      ),
    );
  };

  const [payingInvoiceId, setPayingInvoiceId] = useState<number | null>(null);

  const payInvoice = (record: AppointmentDto) => {
    if (!record.invoiceId) return;
    setPayingInvoiceId(record.invoiceId);
    requestInvoicePayment(record.invoiceId)
      .then((res) => {
        window.location.href = res.paymentUrl;
      })
      .catch((err) => {
        showNotice(
          err instanceof Error ? err.message : "Không tạo được link thanh toán.",
        );
        setPayingInvoiceId(null);
      });
  };

  const submitReview = () => {
    if (!reviewingRecord) return;
    const record = reviewingRecord;
    const payload = { rating: reviewRating, comment: reviewComment.trim() || undefined };
    const isEditing = Boolean(record.reviewId);
    setIsSubmittingReview(true);
    setReviewError(null);
    (isEditing
      ? updateReview(record.reviewId as number, payload)
      : createReview({ appointmentId: record.id, ...payload })
    )
      .then((review) => {
        applyReview(record, review);
        showNotice(isEditing ? "Đã cập nhật đánh giá của bạn." : "Cảm ơn bạn đã đánh giá dịch vụ!");
        setReviewingRecord(null);
      })
      .catch((err) => {
        const message =
          err instanceof Error ? err.message : "Không thể gửi đánh giá.";
        if (message.toLowerCase().includes("already been reviewed")) {
          // Đã có đánh giá từ trước (ví dụ gửi từ thiết bị khác): tải lại để hiện đúng nội dung.
          getAppointmentHistory()
            .then(setAppointments)
            .catch(() => undefined);
          setReviewingRecord(null);
          showNotice("Lịch hẹn này đã được đánh giá trước đó.");
        } else {
          setReviewError(message);
        }
      })
      .finally(() => setIsSubmittingReview(false));
  };

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    getAppointmentHistory()
      .then((data) => {
        if (!cancelled) setAppointments(data);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Không tải được lịch sử dịch vụ.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const handleNavigate = (section: AppSection) => {
    if (section === "home") onHomeClick();
    if (section === "notifications") onNotificationsClick();
    if (section === "tracking") onTrackingClick();
    if (section === "profile") onProfileClick();
  };

  const visibleRecords =
    activeFilter === "all"
      ? appointments
      : appointments.filter((record) => record.status.toLowerCase() === activeFilter);

  const totalCost = appointments
    .filter((record) => record.status.toLowerCase() === "completed")
    .reduce((sum, record) => sum + (record.servicePrice || 0), 0);

  return (
    <div className="min-h-dvh bg-surface font-sans text-on-surface">
      <AppSidebar
        active="history"
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onNavigate={handleNavigate}
      />

      <aside className="fixed left-0 top-0 z-50 hidden h-full w-60 flex-col border-r border-outline-variant bg-surface-container-lowest md:flex">
        <div className="flex items-center gap-sm p-lg">
          <span
            className="material-symbols-outlined text-3xl text-primary"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            electric_car
          </span>
          <span className="font-headline-lg text-headline-lg font-bold tracking-tight text-primary">
            Servio
          </span>
        </div>

        <nav className="mt-md flex-1 space-y-xs px-md">
          <button
            className="flex w-full items-center gap-md rounded-lg p-md text-on-surface-variant transition-colors hover:bg-surface-container"
            type="button"
            onClick={onHomeClick}
          >
            <span className="material-symbols-outlined">home</span>
            <span className="font-label-md text-label-md">Trang chủ</span>
          </button>
          <button
            className="relative flex w-full items-center gap-md rounded-lg bg-secondary-container/20 p-md text-primary transition-colors"
            type="button"
          >
            <span className="absolute left-0 top-[15%] h-[70%] w-1 rounded-r bg-primary" />
            <span
              className="material-symbols-outlined"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              history
            </span>
            <span className="font-label-md text-label-md">Lịch sử</span>
          </button>
          <button
            className="flex w-full items-center gap-md rounded-lg p-md text-on-surface-variant transition-colors hover:bg-surface-container"
            type="button"
            onClick={onTrackingClick}
          >
            <span className="material-symbols-outlined">location_on</span>
            <span className="font-label-md text-label-md">Theo dõi</span>
          </button>
          <button
            className="flex w-full items-center gap-md rounded-lg p-md text-on-surface-variant transition-colors hover:bg-surface-container"
            type="button"
            onClick={onNotificationsClick}
          >
            <span className="material-symbols-outlined">notifications</span>
            <span className="font-label-md text-label-md">Thông báo</span>
            {unreadNotificationCount > 0 && (
              <span className="ml-auto h-2 w-2 rounded-full bg-error" />
            )}
          </button>
          <div className="my-md border-t border-outline-variant opacity-50" />
          <button
            className="flex w-full items-center gap-md rounded-lg p-md text-on-surface-variant transition-colors hover:bg-surface-container"
            type="button"
            onClick={onProfileClick}
          >
            <span className="material-symbols-outlined">person</span>
            <span className="font-label-md text-label-md">Cá nhân</span>
          </button>
        </nav>
      </aside>

      <main className="min-h-screen bg-surface md:ml-60">
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-outline-variant bg-surface px-margin-mobile md:px-xl">
          <div className="flex items-center gap-sm">
            <button
              className="-ml-2 rounded-full p-2 text-on-surface-variant transition-colors hover:bg-surface-container md:hidden"
              type="button"
              aria-label="Mở menu"
              onClick={() => setIsSidebarOpen(true)}
            >
              <span className="material-symbols-outlined">menu</span>
            </button>
            <h1 className="font-headline-md text-headline-md text-on-surface">
              Lịch sử dịch vụ
            </h1>
          </div>

          <div className="flex items-center gap-md">
            <button aria-label="Thông báo"
              className="rounded-full p-2 transition-colors hover:bg-surface-container-high"
              type="button"
              onClick={onNotificationsClick}
            >
              <span className="material-symbols-outlined">notifications</span>
            </button>
          </div>
        </header>

        <div className="mx-auto max-w-6xl space-y-lg p-margin-mobile pb-28 md:p-xl">
          <section className="grid grid-cols-1 gap-lg md:grid-cols-3">
            <div className="flex flex-col gap-xs rounded-xl border border-outline-variant bg-surface-container-lowest p-lg">
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">
                Tổng chi phí đã hoàn thành
              </span>
              <span className="font-display-lg text-display-lg text-primary">
                {formatCurrency(totalCost)}
              </span>
            </div>

            <div className="flex flex-col gap-xs rounded-xl border border-outline-variant bg-surface-container-lowest p-lg">
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">
                Số lần dịch vụ
              </span>
              <span className="font-display-lg text-display-lg text-on-surface">
                {appointments.length.toString().padStart(2, "0")}
              </span>
            </div>

            <div className="flex items-center justify-between rounded-xl bg-primary-container p-lg text-on-primary-container shadow-lg shadow-primary-container/20">
              <div className="flex flex-col gap-xs">
                <span className="font-label-sm text-label-sm uppercase tracking-wider opacity-90">
                  Đã huỷ / Không đến
                </span>
                <span className="font-headline-md text-headline-md">
                  {
                    appointments.filter((a) =>
                      ["cancelled", "no_show"].includes(a.status.toLowerCase()),
                    ).length
                  }{" "}
                  lịch hẹn
                </span>
              </div>
              <span className="material-symbols-outlined text-4xl opacity-50">
                cancel
              </span>
            </div>
          </section>

          <section className="flex flex-col items-center justify-between gap-md rounded-xl border border-outline-variant bg-surface-container-lowest p-md sm:flex-row">
            <div className="flex w-full rounded-lg bg-surface-container-high p-1 sm:w-auto">
              {filters.map((filter) => (
                <button
                  key={filter.value}
                  className={`flex-1 rounded-md px-lg py-2 font-label-md text-label-md transition-all sm:flex-none ${
                    activeFilter === filter.value
                      ? "bg-primary text-on-primary shadow-sm"
                      : "text-on-surface-variant hover:text-primary"
                  }`}
                  type="button"
                  onClick={() => setActiveFilter(filter.value)}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </section>

          {isLoading && (
            <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-xl text-center font-body-md text-body-md text-on-surface-variant">
              Đang tải lịch sử dịch vụ...
            </div>
          )}

          {!isLoading && error && (
            <div className="rounded-xl border border-error/30 bg-error-container/10 p-xl text-center font-body-md text-body-md text-error">
              {error}
            </div>
          )}

          {!isLoading && !error && visibleRecords.length === 0 && (
            <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-xl text-center font-body-md text-body-md text-on-surface-variant">
              Chưa có lịch sử dịch vụ nào.
            </div>
          )}

          {!isLoading && !error && visibleRecords.length > 0 && (
            <section className="overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest">
              <div className="hidden overflow-x-auto lg:block">
                <table className="w-full border-collapse text-left">
                  <thead className="border-b border-outline-variant bg-surface-container-low">
                    <tr>
                      {["DỊCH VỤ", "TRẠNG THÁI", "NGÀY HẸN", "GARAGE", "CHI PHÍ", ""].map(
                        (heading) => (
                          <th
                            key={heading}
                            className="px-xl py-md font-label-md text-label-md text-on-surface-variant"
                          >
                            {heading}
                          </th>
                        ),
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant">
                    {visibleRecords.map((record) => (
                      <Fragment key={record.id}>
                      <tr
                        className="group transition-colors hover:bg-surface-container-low"
                      >
                        <td className="px-xl py-lg">
                          <div className="flex items-center gap-md">
                            <div
                              className={`flex h-10 w-10 items-center justify-center rounded-lg ${statusTone(record.status)}`}
                            >
                              <span className="material-symbols-outlined">
                                {statusIcon(record.status)}
                              </span>
                            </div>
                            <div>
                              <p className="font-body-lg text-body-lg font-semibold text-on-surface">
                                {record.serviceName}
                              </p>
                              <p className="font-label-sm text-label-sm text-on-surface-variant">
                                {record.vehicleModel} · {record.vehicleVin}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-xl py-lg">
                          <span
                            className={`rounded-full px-sm py-xs font-label-sm text-label-sm ${statusTone(record.status)}`}
                          >
                            {statusLabel(record.status)}
                          </span>
                        </td>
                        <td className="px-xl py-lg">
                          <p className="font-body-md text-body-md text-on-surface">
                            {record.scheduleDate}
                          </p>
                          <p className="font-label-sm text-label-sm text-on-surface-variant">
                            {record.timeFrame}
                          </p>
                        </td>
                        <td className="px-xl py-lg">
                          <div className="flex items-center gap-xs">
                            <span className="material-symbols-outlined text-sm text-on-surface-variant">
                              location_on
                            </span>
                            <span className="font-body-md text-body-md text-on-surface">
                              {record.garageName}
                            </span>
                          </div>
                        </td>
                        <td className="px-xl py-lg">
                          <span className="font-body-lg text-body-lg font-bold text-on-surface">
                            {formatCurrency(record.servicePrice)}
                          </span>
                        </td>
                        <td className="px-xl py-lg text-right">
                          <div className="flex flex-col items-end gap-xs">
                            {record.invoicePaymentStatus === "unpaid" && (
                              <button
                                type="button"
                                onClick={() => payInvoice(record)}
                                disabled={payingInvoiceId === record.invoiceId}
                                className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 font-label-sm text-label-sm text-on-primary hover:opacity-90 disabled:opacity-60"
                              >
                                <span className="material-symbols-outlined text-sm">
                                  payments
                                </span>
                                {payingInvoiceId === record.invoiceId ? "Đang tạo link..." : "Thanh toán"}
                              </button>
                            )}
                            {record.invoicePaymentStatus === "paid" && (
                              <span className="font-label-sm text-label-sm text-tertiary">
                                Đã thanh toán
                              </span>
                            )}
                            {record.status.toLowerCase() === "completed" &&
                              (record.reviewId ? (
                                <span className="font-label-sm text-label-sm text-tertiary">
                                  Đã đánh giá
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => openReview(record)}
                                  className="inline-flex items-center gap-1 rounded-lg border border-primary px-3 py-1.5 font-label-sm text-label-sm text-primary hover:bg-primary hover:text-on-primary"
                                >
                                  <span className="material-symbols-outlined text-sm">
                                    star
                                  </span>
                                  Đánh giá
                                </button>
                              ))}
                          </div>
                        </td>
                      </tr>
                      {record.reviewId ? (
                        <tr>
                          <td colSpan={6} className="px-xl pb-lg pt-0">
                            <ReviewBlock record={record} onEdit={() => openReview(record)} />
                          </td>
                        </tr>
                      ) : null}
                      </Fragment>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="divide-y divide-outline-variant lg:hidden">
                {visibleRecords.map((record) => (
                  <article key={`${record.id}-mobile`} className="p-lg">
                    <div className="mb-md flex items-start gap-md">
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${statusTone(record.status)}`}
                      >
                        <span className="material-symbols-outlined">
                          {statusIcon(record.status)}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-body-lg text-body-lg font-semibold">
                          {record.serviceName}
                        </h3>
                        <p className="font-label-sm text-label-sm text-on-surface-variant">
                          {record.vehicleModel} · {record.vehicleVin}
                        </p>
                      </div>
                      <span
                        className={`rounded-full px-sm py-xs font-label-sm text-label-sm ${statusTone(record.status)}`}
                      >
                        {statusLabel(record.status)}
                      </span>
                    </div>
                    <div className="grid gap-sm font-body-md text-body-md text-on-surface-variant">
                      <p>
                        {record.scheduleDate} - {record.timeFrame}
                      </p>
                      <p>{record.garageName}</p>
                    </div>
                    <div className="mt-md flex items-center justify-between border-t border-outline-variant pt-md">
                      <span className="font-label-md text-label-md text-outline">
                        Chi phí
                      </span>
                      <span className="font-headline-md text-headline-md text-primary">
                        {formatCurrency(record.servicePrice)}
                      </span>
                    </div>
                    {record.invoicePaymentStatus === "unpaid" && (
                      <div className="mt-md">
                        <button
                          type="button"
                          onClick={() => payInvoice(record)}
                          disabled={payingInvoiceId === record.invoiceId}
                          className="inline-flex w-full items-center justify-center gap-1 rounded-lg bg-primary px-3 py-2 font-label-sm text-label-sm text-on-primary disabled:opacity-60"
                        >
                          <span className="material-symbols-outlined text-sm">
                            payments
                          </span>
                          {payingInvoiceId === record.invoiceId ? "Đang tạo link..." : "Thanh toán"}
                        </button>
                      </div>
                    )}
                    {record.invoicePaymentStatus === "paid" && (
                      <div className="mt-md">
                        <span className="font-label-sm text-label-sm text-tertiary">
                          Đã thanh toán
                        </span>
                      </div>
                    )}
                    {record.status.toLowerCase() === "completed" && (
                      <div className="mt-md">
                        {record.reviewId ? (
                          <ReviewBlock record={record} onEdit={() => openReview(record)} />
                        ) : (
                          <button
                            type="button"
                            onClick={() => openReview(record)}
                            className="inline-flex items-center gap-1 rounded-lg border border-primary px-3 py-1.5 font-label-sm text-label-sm text-primary"
                          >
                            <span className="material-symbols-outlined text-sm">
                              star
                            </span>
                            Đánh giá
                          </button>
                        )}
                      </div>
                    )}
                  </article>
                ))}
              </div>
            </section>
          )}

          <footer className="flex flex-col gap-md pb-xl font-label-sm text-label-sm text-on-surface-variant sm:flex-row sm:items-center sm:justify-between">
            <p>© 2024 Servio Automotive Management. All rights reserved.</p>
          </footer>
        </div>
      </main>

      <nav className="fixed bottom-0 left-0 z-50 flex h-20 w-full items-center justify-around border-t border-outline-variant bg-surface px-2 md:hidden">
        <button
          className="flex flex-col items-center justify-center text-on-surface-variant"
          type="button"
          onClick={onHomeClick}
        >
          <span className="material-symbols-outlined">home</span>
          <span className="font-label-sm text-label-sm">Trang chủ</span>
        </button>
        <button
          className="flex flex-col items-center justify-center text-on-surface-variant"
          type="button"
          onClick={onTrackingClick}
        >
          <span className="material-symbols-outlined">location_searching</span>
          <span className="font-label-sm text-label-sm">Theo dõi</span>
        </button>
        <button
          className="flex flex-col items-center justify-center rounded-full bg-secondary-container px-4 py-1 text-on-secondary-container"
          type="button"
        >
          <span
            className="material-symbols-outlined"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            history
          </span>
          <span className="font-label-sm text-label-sm">Lịch sử</span>
        </button>
        <button
          className="flex flex-col items-center justify-center text-on-surface-variant"
          type="button"
          onClick={onProfileClick}
        >
          <span className="material-symbols-outlined">person</span>
          <span className="font-label-sm text-label-sm">Cá nhân</span>
        </button>
      </nav>

      {reviewingRecord && (
        <div
          ref={reviewRef}
          role="dialog"
          aria-modal="true"
          aria-label="Đánh giá dịch vụ"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        >
          <div className="w-full max-w-[28rem] rounded-2xl border border-outline-variant bg-surface-container-lowest p-lg shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="font-headline-md text-headline-md">
                {reviewingRecord.reviewId ? "Sửa đánh giá" : "Đánh giá dịch vụ"}
              </h3>
              <button aria-label="Đóng"
                type="button"
                onClick={() => setReviewingRecord(null)}
                className="rounded-full p-2 text-on-surface-variant hover:bg-surface-container"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <p className="mt-1 font-body-sm text-body-sm text-on-surface-variant">
              {reviewingRecord.serviceName} · {reviewingRecord.vehicleModel}
            </p>

            <div className="mt-lg flex justify-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setReviewRating(star)}
                  aria-label={`${star} sao`}
                  className="p-1"
                >
                  <span
                    className="material-symbols-outlined text-3xl"
                    style={{
                      fontVariationSettings: star <= reviewRating ? "'FILL' 1" : "'FILL' 0",
                      color:
                        star <= reviewRating
                          ? "var(--color-tertiary)"
                          : "var(--color-outline-variant)",
                    }}
                  >
                    star
                  </span>
                </button>
              ))}
            </div>

            <div className="mt-lg space-y-sm">
              <label htmlFor="pages-customer-historypage-field-1" className="block font-label-md text-label-md text-on-surface-variant">
                Nhận xét (không bắt buộc)
              </label>
              <textarea id="pages-customer-historypage-field-1"
                rows={3}
                maxLength={REVIEW_COMMENT_LIMIT}
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder="Chia sẻ trải nghiệm của bạn về dịch vụ này..."
                className="w-full rounded-lg border border-outline-variant bg-surface px-4 py-3 font-body-md text-body-md outline-none focus:border-primary focus:ring-2 focus:ring-primary"
              />
              <div className="flex justify-between font-label-sm text-label-sm text-on-surface-variant">
                <span>Tối đa {REVIEW_COMMENT_LIMIT.toLocaleString("vi-VN")} ký tự.</span>
                <span aria-live="polite">
                  {reviewComment.length} / {REVIEW_COMMENT_LIMIT.toLocaleString("vi-VN")}
                </span>
              </div>
            </div>

            {reviewingRecord.reviewId && reviewingRecord.reviewEditDaysLeft ? (
              <p className="mt-3 rounded-lg bg-[#fff1cc] px-3 py-2 font-body-sm text-body-sm text-[#6b4200]">
                Bạn còn {reviewingRecord.reviewEditDaysLeft} ngày để sửa. Sau đó đánh giá sẽ được giữ nguyên.
              </p>
            ) : null}

            {reviewError && (
              <p className="mt-3 font-body-sm text-body-sm text-error">{reviewError}</p>
            )}

            <button
              type="button"
              onClick={submitReview}
              disabled={isSubmittingReview}
              className="mt-lg w-full rounded-lg bg-primary py-3 font-label-md text-label-md text-on-primary transition hover:opacity-90 active:scale-[0.98] disabled:opacity-60"
            >
              {isSubmittingReview
                ? "Đang gửi..."
                : reviewingRecord.reviewId
                  ? "Lưu thay đổi"
                  : "Gửi đánh giá"}
            </button>
          </div>
        </div>
      )}

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

function reviewDate(value: string | null | undefined) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleDateString("vi-VN");
}

// Đánh giá khách đã gửi cho một lịch hẹn: sao, nội dung, hạn sửa, trạng thái bị ẩn và phản hồi của garage.
function ReviewBlock({ record, onEdit }: { record: AppointmentDto; onEdit: () => void }) {
  const canEdit = record.reviewCanEdit === true;
  const hidden = record.reviewHidden === true;

  return (
    <div className="space-y-2 rounded-xl border border-outline-variant bg-surface-container-low px-4 py-3">
      <div className="flex flex-wrap items-center gap-2">
        <b className="font-label-md text-label-md">Đánh giá của bạn</b>
        <StarRating value={record.reviewRating ?? 0} size={16} />
        {record.reviewCreatedAt && (
          <span className="font-label-sm text-label-sm text-on-surface-variant">
            · gửi {reviewDate(record.reviewCreatedAt)}
          </span>
        )}
        <span className="ml-auto flex flex-wrap items-center gap-2">
          {hidden && (
            <span className="rounded-full bg-error-container px-2.5 py-0.5 font-label-sm text-label-sm text-on-error-container">
              Đã bị ẩn khỏi trang garage
            </span>
          )}
          {canEdit ? (
            <span className="rounded-full bg-[#fff1cc] px-2.5 py-0.5 font-label-sm text-label-sm text-[#6b4200]">
              Còn {record.reviewEditDaysLeft ?? 1} ngày để sửa
            </span>
          ) : (
            <span className="rounded-full bg-[#e9eaeb] px-2.5 py-0.5 font-label-sm text-label-sm text-[#3a3f4b]">
              Đã quá hạn sửa
            </span>
          )}
        </span>
      </div>
      {record.reviewComment && (
        <p className="font-body-md text-body-md text-on-surface">{record.reviewComment}</p>
      )}
      {hidden && (
        <p className="flex items-start gap-1.5 font-label-sm text-label-sm text-on-surface-variant">
          <span aria-hidden="true" className="material-symbols-outlined text-base">
            info
          </span>
          Quản trị viên đã ẩn đánh giá này khỏi trang công khai. Chỉ mình bạn nhìn thấy nó.
        </p>
      )}
      {record.reviewReply && (
        <div className="flex gap-2 rounded-lg bg-surface-container px-3 py-2 font-label-sm text-label-sm text-on-surface-variant">
          <span aria-hidden="true" className="material-symbols-outlined text-lg text-primary">
            subdirectory_arrow_right
          </span>
          <div>
            <b className="text-on-surface">Phản hồi từ garage</b>
            <p>{record.reviewReply}</p>
          </div>
        </div>
      )}
      {canEdit && (
        <button
          type="button"
          onClick={onEdit}
          className="inline-flex items-center gap-1 font-label-md text-label-md text-primary hover:underline"
        >
          <span aria-hidden="true" className="material-symbols-outlined text-base">
            edit
          </span>
          Sửa đánh giá
        </button>
      )}
    </div>
  );
}

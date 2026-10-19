import { useEffect, useMemo, useState } from "react";
import {
  getMyWithdrawals,
  getWithdrawalEligibility,
  getWalletHistory,
  getWalletSummary,
  requestWalletTopUp,
  requestWithdrawal,
  type WalletSummary,
  type WalletTransactionItem,
  type WithdrawalEligibility,
  type WithdrawalRequestItem,
} from "../../services/api";
import { formatDateTime, formatVnd } from "../../utils/format";
import WalletHistory from "./WalletHistory";

const TOP_UP_MIN = 10000;
const WITHDRAW_MIN = 50000;
const WITHDRAW_MAX = 50000000;
const QR_MAX_BYTES = 5 * 1024 * 1024;
const QUICK_AMOUNTS = [50000, 100000, 200000, 500000];

const WITHDRAWAL_STATUS = {
  PENDING: { label: "Chờ xử lý", cls: "bg-[#fff1cc] text-[#6b4200]", tone: "bg-[#fff1cc] text-[#6b4200]", icon: "hourglass_top" },
  COMPLETED: { label: "Đã chuyển", cls: "bg-[#d9f7dd] text-[#00531a]", tone: "bg-[#d9f7dd] text-[#00531a]", icon: "task_alt" },
  REJECTED: { label: "Bị từ chối", cls: "bg-error-container text-on-error-container", tone: "bg-error-container text-on-error-container", icon: "cancel" },
} as const;

function maskAccount(accountNumber: string) {
  return accountNumber.length > 4 ? `****${accountNumber.slice(-4)}` : accountNumber;
}

// Nội dung trang ví; khung điều hướng (thanh bên, header) do AppShell cung cấp như các trang khách khác.
export default function WalletPage() {
  const [summary, setSummary] = useState<WalletSummary | null>(null);
  const [history, setHistory] = useState<WalletTransactionItem[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequestItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [tab, setTab] = useState<"topup" | "withdraw">("topup");
  const [topUpAmount, setTopUpAmount] = useState("");
  const [isTopUpSubmitting, setIsTopUpSubmitting] = useState(false);
  const [topUpError, setTopUpError] = useState<string | null>(null);

  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountHolder, setAccountHolder] = useState("");
  const [isWithdrawSubmitting, setIsWithdrawSubmitting] = useState(false);
  const [withdrawError, setWithdrawError] = useState<string | null>(null);
  const [qrImage, setQrImage] = useState<File | null>(null);
  const [qrError, setQrError] = useState<string | null>(null);
  const [eligibility, setEligibility] = useState<WithdrawalEligibility | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const qrPreview = useMemo(() => (qrImage ? URL.createObjectURL(qrImage) : null), [qrImage]);
  useEffect(() => {
    return () => {
      if (qrPreview) URL.revokeObjectURL(qrPreview);
    };
  }, [qrPreview]);

  const pickQr = (file: File | null) => {
    setQrError(null);
    if (!file) {
      setQrImage(null);
      return;
    }
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setQrError("Chỉ nhận ảnh JPG, PNG hoặc WebP.");
      return;
    }
    if (file.size > QR_MAX_BYTES) {
      setQrError("Ảnh QR tối đa 5 MB.");
      return;
    }
    setQrImage(file);
  };

  useEffect(() => {
    let cancelled = false;
    Promise.all([getWalletSummary(), getWalletHistory(), getMyWithdrawals(), getWithdrawalEligibility()])
      .then(([summaryData, historyData, withdrawalData, eligibilityData]) => {
        if (cancelled) return;
        setEligibility(eligibilityData);
        setSummary(summaryData);
        setHistory(historyData);
        setWithdrawals(withdrawalData);
      })
      .catch((err) => {
        if (!cancelled) {
          setLoadError(err instanceof Error ? err.message : "Không tải được thông tin ví.");
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const refresh = async () => {
    try {
      const [summaryData, historyData, withdrawalData, eligibilityData] = await Promise.all([
        getWalletSummary(),
        getWalletHistory(),
        getMyWithdrawals(),
        getWithdrawalEligibility(),
      ]);
      setEligibility(eligibilityData);
      setSummary(summaryData);
      setHistory(historyData);
      setWithdrawals(withdrawalData);
    } catch {
      // Giữ nguyên dữ liệu đang hiển thị nếu làm mới thất bại.
    }
  };

  const canTopUpRole = summary?.role === "customer";
  // Super Admin là bên nhận hoa hồng, không rút tiền về tài khoản nào: ẩn form và danh sách yêu cầu rút.
  const isAdmin = summary?.role === "admin";
  const activeTab = canTopUpRole ? tab : "withdraw";

  const topUpValue = Number(topUpAmount);
  const canTopUp = !isTopUpSubmitting && Number.isInteger(topUpValue) && topUpValue >= TOP_UP_MIN;

  const submitTopUp = async () => {
    if (!canTopUp) return;
    setIsTopUpSubmitting(true);
    setTopUpError(null);
    try {
      const response = await requestWalletTopUp(topUpValue);
      window.location.href = response.paymentUrl;
    } catch (err) {
      setTopUpError(err instanceof Error ? err.message : "Không tạo được link nạp tiền.");
      setIsTopUpSubmitting(false);
    }
  };

  const withdrawValue = Number(withdrawAmount);
  const balance = summary?.balance ?? 0;
  const withdrawAmountError =
    withdrawAmount === ""
      ? null
      : !Number.isInteger(withdrawValue) || withdrawValue < WITHDRAW_MIN || withdrawValue > WITHDRAW_MAX
        ? `Số tiền rút từ ${formatVnd(WITHDRAW_MIN)} đến ${formatVnd(WITHDRAW_MAX)}.`
        : withdrawValue > balance
          ? "Số dư ví không đủ."
          : null;
  const canWithdraw =
    !isWithdrawSubmitting &&
    eligibility?.eligible !== false &&
    withdrawAmount !== "" &&
    withdrawAmountError === null &&
    bankName.trim().length >= 2 &&
    /^\d{6,20}$/.test(accountNumber.trim()) &&
    accountHolder.trim().length >= 2;

  const submitWithdraw = async () => {
    if (!canWithdraw) return;
    setIsWithdrawSubmitting(true);
    setWithdrawError(null);
    try {
      await requestWithdrawal({
        amount: withdrawValue,
        bankName: bankName.trim(),
        accountNumber: accountNumber.trim(),
        accountHolder: accountHolder.trim(),
        qrImage,
      });
      setWithdrawAmount("");
      setQrImage(null);
      setNotice("Đã gửi yêu cầu rút tiền. Số tiền được giữ lại và sẽ chuyển về tài khoản của bạn sau khi được duyệt.");
      await refresh();
    } catch (err) {
      setWithdrawError(err instanceof Error ? err.message : "Không gửi được yêu cầu rút tiền.");
    } finally {
      setIsWithdrawSubmitting(false);
    }
  };

  const inputClass =
    "min-h-12 w-full rounded-2xl border border-outline-variant bg-surface-container-lowest px-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/30";

  return (
    <div className="font-sans text-on-surface">
      <div className="mx-auto max-w-[1100px] space-y-5 p-margin-mobile pb-16 md:p-xl">
        {isLoading && (
          <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-xl text-center text-on-surface-variant">
            Đang tải thông tin ví...
          </div>
        )}

        {!isLoading && loadError && (
          <div className="rounded-xl border border-error/30 bg-error-container/10 p-xl text-center text-error">
            {loadError}
          </div>
        )}

        {!isLoading && !loadError && summary && (
          <>
            <section
              aria-label="Số dư"
              className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-primary-container p-[26px] text-on-primary"
            >
              <span
                aria-hidden="true"
                className="material-symbols-outlined pointer-events-none absolute -right-5 -top-4 text-[180px] opacity-10"
              >
                account_balance_wallet
              </span>
              <p className="text-[13px] font-semibold opacity-85">Số dư hiện tại</p>
              <p className="mb-[18px] mt-1.5 text-[44px] font-extrabold leading-tight tracking-tight" data-testid="wallet-balance">
                {formatVnd(summary.balance)}
              </p>
              <div className="flex flex-wrap gap-3.5">
                {canTopUpRole ? (
                  <>
                    <div className="min-w-[10rem] flex-1 rounded-2xl bg-white/15 px-4 py-3.5">
                      <p className="text-xs opacity-85">Tổng đã nạp</p>
                      <p className="text-lg font-bold">{formatVnd(summary.totalTopUp)}</p>
                    </div>
                    <div className="min-w-[10rem] flex-1 rounded-2xl bg-white/15 px-4 py-3.5">
                      <p className="text-xs opacity-85">Tổng đã chi</p>
                      <p className="text-lg font-bold">{formatVnd(summary.totalSpent)}</p>
                    </div>
                  </>
                ) : (
                  <div className="min-w-[10rem] flex-1 rounded-2xl bg-white/15 px-4 py-3.5">
                    <p className="text-xs opacity-85">Tổng đã nhận</p>
                    <p className="text-lg font-bold">{formatVnd(summary.totalEarned)}</p>
                  </div>
                )}
                {(summary.heldAmount ?? 0) > 0 && (
                  <div className="min-w-[10rem] flex-1 rounded-2xl bg-white/15 px-4 py-3.5" data-testid="wallet-held">
                    <p className="text-xs opacity-85">{canTopUpRole ? "Đang giữ cho lịch hẹn" : "Chờ bàn giao xe"}</p>
                    <p className="text-lg font-bold">{formatVnd(summary.heldAmount ?? 0)}</p>
                  </div>
                )}
              </div>
            </section>

            {notice && (
              <div
                role="status"
                className="rounded-2xl border border-tertiary/30 bg-[#d9f7dd] p-4 text-sm text-[#00531a]"
              >
                {notice}
              </div>
            )}

            <div className={`grid items-start gap-5 ${!isAdmin && withdrawals.length > 0 ? "lg:grid-cols-[1fr_24rem]" : ""}`}>
              {!isAdmin && (
                <section
                  aria-labelledby="wallet-money-title"
                  className="rounded-3xl border border-outline-variant/40 bg-surface-container-lowest p-6 shadow-[0_10px_26px_-14px_rgba(25,28,29,0.28)]"
                >
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <h2 id="wallet-money-title" className="text-lg font-extrabold">
                      Giao dịch tiền
                    </h2>
                    {canTopUpRole && (
                      <div role="tablist" aria-label="Loại giao dịch" className="inline-flex gap-1 rounded-2xl bg-surface-container p-1">
                        {(["topup", "withdraw"] as const).map((key) => (
                          <button
                            key={key}
                            type="button"
                            role="tab"
                            aria-selected={tab === key}
                            onClick={() => setTab(key)}
                            className={`min-h-10 rounded-xl px-5 text-[13px] font-bold ${
                              tab === key
                                ? "bg-surface-container-lowest text-on-primary-fixed-variant shadow-sm"
                                : "text-on-surface-variant hover:text-on-surface"
                            }`}
                          >
                            {key === "topup" ? "Nạp tiền" : "Rút tiền"}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {activeTab === "topup" && (
                    <form
                      className="space-y-4"
                      onSubmit={(event) => {
                        event.preventDefault();
                        void submitTopUp();
                      }}
                    >
                      <div>
                        <label htmlFor="pages-customer-walletpage-field-1" className="mb-1.5 block text-xs font-bold text-on-surface-variant">
                          Số tiền muốn nạp (tối thiểu {formatVnd(TOP_UP_MIN)})
                        </label>
                        <div className="flex h-14 items-center gap-2 rounded-2xl border-[1.5px] border-primary bg-surface-container-lowest px-4 focus-within:ring-[3px] focus-within:ring-primary/20">
                          <input
                            id="pages-customer-walletpage-field-1"
                            value={topUpAmount}
                            onChange={(event) => setTopUpAmount(event.target.value.replace(/\D/g, ""))}
                            inputMode="numeric"
                            placeholder="Ví dụ: 200000"
                            className="min-w-0 flex-1 bg-transparent text-[22px] font-extrabold outline-none"
                          />
                          <span className="font-bold text-outline">đ</span>
                        </div>
                      </div>
                      <div role="group" aria-label="Chọn nhanh số tiền" className="flex flex-wrap gap-2">
                        {QUICK_AMOUNTS.map((amount) => (
                          <button
                            key={amount}
                            type="button"
                            aria-pressed={topUpAmount === String(amount)}
                            onClick={() => setTopUpAmount(String(amount))}
                            className={`min-h-9 rounded-full border px-3.5 text-[13px] font-semibold ${
                              topUpAmount === String(amount)
                                ? "border-primary bg-primary-fixed text-on-primary-fixed-variant"
                                : "border-outline-variant bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container-low"
                            }`}
                          >
                            {formatVnd(amount)}
                          </button>
                        ))}
                      </div>
                      <p className="flex items-start gap-2.5 rounded-2xl bg-surface-container-low p-3.5 text-[13px]">
                        <span aria-hidden="true" className="material-symbols-outlined text-xl text-on-primary-fixed-variant">
                          qr_code_2
                        </span>
                        <span>
                          Bạn sẽ được chuyển sang cổng thanh toán PayOS (VietQR) để hoàn tất.
                          {canTopUp && (
                            <>
                              {" "}
                              Số dư sau khi nạp: <b>{formatVnd(balance + topUpValue)}</b>.
                            </>
                          )}
                        </span>
                      </p>
                      {topUpError && (
                        <p role="alert" className="text-sm text-error">
                          {topUpError}
                        </p>
                      )}
                      <button
                        type="submit"
                        disabled={!canTopUp}
                        className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-primary to-primary-container text-[15px] font-bold text-on-primary shadow-[0_12px_22px_-14px_rgba(0,89,187,0.9)] transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <span aria-hidden="true" className="material-symbols-outlined">
                          qr_code_scanner
                        </span>
                        {isTopUpSubmitting ? "Đang chuyển sang trang thanh toán..." : "Nạp tiền qua PayOS (VietQR)"}
                      </button>
                    </form>
                  )}

                  {activeTab === "withdraw" && (
                    <form
                      className="space-y-4"
                      onSubmit={(event) => {
                        event.preventDefault();
                        void submitWithdraw();
                      }}
                    >
                      <div>
                        <label htmlFor="pages-customer-walletpage-field-2" className="mb-1.5 block text-xs font-bold text-on-surface-variant">
                          Số tiền muốn rút ({formatVnd(WITHDRAW_MIN)} – {formatVnd(WITHDRAW_MAX)})
                        </label>
                        <input
                          id="pages-customer-walletpage-field-2"
                          value={withdrawAmount}
                          onChange={(event) => setWithdrawAmount(event.target.value.replace(/\D/g, ""))}
                          inputMode="numeric"
                          placeholder="Ví dụ: 200000"
                          className={inputClass}
                        />
                        {withdrawAmountError && (
                          <p className="mt-1 text-sm text-error">{withdrawAmountError}</p>
                        )}
                      </div>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <label htmlFor="pages-customer-walletpage-field-3" className="mb-1.5 block text-xs font-bold text-on-surface-variant">
                            Ngân hàng
                          </label>
                          <input
                            id="pages-customer-walletpage-field-3"
                            value={bankName}
                            onChange={(event) => setBankName(event.target.value)}
                            maxLength={100}
                            placeholder="Ví dụ: Vietcombank"
                            className={inputClass}
                          />
                        </div>
                        <div>
                          <label htmlFor="pages-customer-walletpage-field-4" className="mb-1.5 block text-xs font-bold text-on-surface-variant">
                            Số tài khoản
                          </label>
                          <input
                            id="pages-customer-walletpage-field-4"
                            value={accountNumber}
                            onChange={(event) => setAccountNumber(event.target.value.replace(/\D/g, ""))}
                            inputMode="numeric"
                            maxLength={20}
                            placeholder="6 – 20 chữ số"
                            className={inputClass}
                          />
                        </div>
                      </div>
                      <div>
                        <label htmlFor="pages-customer-walletpage-field-5" className="mb-1.5 block text-xs font-bold text-on-surface-variant">
                          Tên chủ tài khoản
                        </label>
                        <input
                          id="pages-customer-walletpage-field-5"
                          value={accountHolder}
                          onChange={(event) => setAccountHolder(event.target.value)}
                          maxLength={100}
                          placeholder="Đúng như trên thẻ ngân hàng"
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label className="mb-1.5 block text-xs font-bold text-on-surface-variant">
                          Ảnh mã QR ngân hàng (không bắt buộc)
                        </label>
                        <input
                          aria-label="Ảnh mã QR ngân hàng"
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          onChange={(event) => {
                            pickQr(event.target.files?.[0] ?? null);
                            event.target.value = "";
                          }}
                          className="block w-full text-sm text-on-surface-variant file:mr-3 file:rounded-xl file:border-0 file:bg-surface-container file:px-4 file:py-2 file:text-[13px] file:font-bold"
                        />
                        {qrError && <p className="mt-1 text-sm text-error">{qrError}</p>}
                        {qrPreview && (
                          <div className="mt-2 flex items-center gap-3">
                            <img
                              src={qrPreview}
                              alt="QR đã chọn"
                              className="h-24 w-24 rounded-2xl border border-outline-variant object-contain"
                            />
                            <button type="button" onClick={() => setQrImage(null)} className="text-sm font-semibold text-error">
                              Bỏ ảnh
                            </button>
                          </div>
                        )}
                      </div>
                      {eligibility && !eligibility.eligible && (
                        <p className="rounded-2xl bg-error-container/30 p-3 text-sm text-error">
                          {eligibility.message ?? "Hiện chưa thể tạo thêm yêu cầu rút tiền."}
                        </p>
                      )}
                      <p className="text-xs text-on-surface-variant">
                        Số tiền được giữ lại ngay khi gửi yêu cầu và chuyển về tài khoản của bạn sau khi quản trị
                        viên duyệt (thường trong 1–2 ngày làm việc). Nếu yêu cầu bị từ chối, tiền sẽ được hoàn lại
                        ví.
                      </p>
                      {withdrawError && (
                        <p role="alert" className="text-sm text-error">
                          {withdrawError}
                        </p>
                      )}
                      <button
                        type="submit"
                        disabled={!canWithdraw}
                        className="min-h-[52px] w-full rounded-2xl bg-gradient-to-br from-primary to-primary-container text-[15px] font-bold text-on-primary shadow-[0_12px_22px_-14px_rgba(0,89,187,0.9)] transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {isWithdrawSubmitting ? "Đang gửi..." : "Gửi yêu cầu rút tiền"}
                      </button>
                    </form>
                  )}
                </section>
              )}

              {withdrawals.length > 0 && !isAdmin && (
                <section
                  aria-labelledby="wallet-withdrawals-title"
                  className="rounded-3xl border border-outline-variant/40 bg-surface-container-lowest p-6 shadow-[0_10px_26px_-14px_rgba(25,28,29,0.28)]"
                >
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <h2 id="wallet-withdrawals-title" className="text-lg font-extrabold">
                      Yêu cầu rút tiền
                    </h2>
                    {withdrawals.some((item) => item.status === "PENDING") && (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#fff1cc] px-2.5 py-1 text-xs font-bold text-[#6b4200]">
                        <i aria-hidden="true" className="h-[7px] w-[7px] rounded-full bg-[#c47f00]" />
                        {withdrawals.filter((item) => item.status === "PENDING").length} đang chờ
                      </span>
                    )}
                  </div>
                  <ul className="space-y-2.5">
                    {withdrawals.map((item) => {
                      const status = WITHDRAWAL_STATUS[item.status] ?? WITHDRAWAL_STATUS.PENDING;
                      return (
                        <li
                          key={item.id}
                          className="flex items-center gap-3 rounded-[18px] border-[1.5px] border-outline-variant/40 p-3.5"
                        >
                          <span
                            aria-hidden="true"
                            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] ${status.tone}`}
                          >
                            <span className="material-symbols-outlined">{status.icon}</span>
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="font-bold">{formatVnd(item.amount)}</p>
                            <p className="truncate text-[13px] text-on-surface-variant">
                              {item.bankName} · {maskAccount(item.accountNumber)} · {item.accountHolder}
                            </p>
                            <p className="text-xs text-on-surface-variant">{formatDateTime(item.createdAt)}</p>
                            {item.qrImageUrl && (
                              <a
                                href={item.qrImageUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-block text-xs font-semibold text-on-primary-fixed-variant underline"
                              >
                                Xem ảnh QR đã gửi
                              </a>
                            )}
                            {item.note && (
                              <p className="mt-1 text-xs text-on-surface-variant">Ghi chú: {item.note}</p>
                            )}
                          </div>
                          <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${status.cls}`}>
                            {status.label}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              )}
            </div>

            <WalletHistory history={history} />
          </>
        )}
      </div>
    </div>
  );
}

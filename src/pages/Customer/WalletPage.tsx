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
import { formatVnd } from "../../utils/format";

const TOP_UP_MIN = 10000;
const WITHDRAW_MIN = 50000;
const WITHDRAW_MAX = 50000000;
const QR_MAX_BYTES = 5 * 1024 * 1024;
const QUICK_AMOUNTS = [50000, 100000, 200000, 500000];

// Loại giao dịch -> nhãn, icon và chiều tiền (+ vào ví, - ra khỏi ví).
const TRANSACTION_META: Record<string, { label: string; icon: string; sign: 1 | -1 }> = {
  TOPUP: { label: "Nạp tiền", icon: "add_card", sign: 1 },
  PAYMENT: { label: "Thanh toán dịch vụ", icon: "shopping_bag", sign: -1 },
  RECEIVE_PAYMENT: { label: "Nhận thanh toán", icon: "payments", sign: 1 },
  COMMISSION: { label: "Hoa hồng", icon: "percent", sign: 1 },
  COMMISSION_DEBIT: { label: "Trừ hoa hồng tiền mặt", icon: "percent", sign: -1 },
  REFUND: { label: "Hoàn tiền", icon: "undo", sign: 1 },
  WITHDRAW: { label: "Rút tiền", icon: "account_balance", sign: -1 },
  WITHDRAW_REFUND: { label: "Hoàn tiền rút", icon: "undo", sign: 1 },
};

const WITHDRAWAL_STATUS = {
  PENDING: { label: "Chờ xử lý", cls: "bg-tertiary-container/20 text-tertiary" },
  COMPLETED: { label: "Đã chuyển", cls: "bg-primary-container/15 text-primary" },
  REJECTED: { label: "Bị từ chối", cls: "bg-error-container/20 text-error" },
} as const;

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

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
    "w-full rounded-lg border border-outline-variant bg-surface-container-low px-4 py-3 font-body-md text-body-md outline-none focus:border-primary focus:ring-1 focus:ring-primary";

  return (
    <div className="font-sans text-on-surface">
      <div className="mx-auto max-w-[960px] space-y-lg p-margin-mobile pb-16 md:p-xl">
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
            <section className="rounded-2xl bg-primary p-xl text-on-primary shadow-lg">
              <p className="font-label-md text-label-md opacity-80">Số dư hiện tại</p>
              <p className="mt-1 font-display-lg text-display-lg" data-testid="wallet-balance">
                {formatVnd(summary.balance)}
              </p>
              <div className="mt-lg grid grid-cols-2 gap-md text-sm">
                <div className="rounded-lg bg-white/10 p-md">
                  <p className="opacity-80">Tổng đã nạp</p>
                  <p className="mt-1 font-bold">{formatVnd(summary.totalTopUp)}</p>
                </div>
                <div className="rounded-lg bg-white/10 p-md">
                  <p className="opacity-80">Tổng đã chi</p>
                  <p className="mt-1 font-bold">{formatVnd(summary.totalSpent)}</p>
                </div>
              </div>
            </section>

            {notice && (
              <div
                role="status"
                className="rounded-xl border border-tertiary/30 bg-tertiary-container/20 p-lg font-body-md text-body-md"
              >
                {notice}
              </div>
            )}

            <section className="rounded-xl border border-outline-variant bg-surface-container-lowest p-lg">
              <div className="mb-lg inline-flex rounded-lg border border-outline-variant bg-surface-container-low p-1">
                {(["topup", "withdraw"] as const).map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setTab(key)}
                    className={`rounded-md px-5 py-2 font-label-md text-label-md transition ${
                      tab === key
                        ? "bg-primary text-on-primary"
                        : "text-on-surface-variant hover:bg-surface-container"
                    }`}
                  >
                    {key === "topup" ? "Nạp tiền" : "Rút tiền"}
                  </button>
                ))}
              </div>

              {tab === "topup" && (
                <form
                  className="space-y-md"
                  onSubmit={(event) => {
                    event.preventDefault();
                    void submitTopUp();
                  }}
                >
                  <div>
                    <label className="mb-1 block font-label-md text-label-md text-on-surface-variant">
                      Số tiền muốn nạp (tối thiểu {formatVnd(TOP_UP_MIN)})
                    </label>
                    <input
                      value={topUpAmount}
                      onChange={(event) => setTopUpAmount(event.target.value.replace(/\D/g, ""))}
                      inputMode="numeric"
                      placeholder="Ví dụ: 200000"
                      className={inputClass}
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {QUICK_AMOUNTS.map((amount) => (
                      <button
                        key={amount}
                        type="button"
                        onClick={() => setTopUpAmount(String(amount))}
                        className="rounded-full border border-outline-variant px-4 py-1.5 text-sm text-on-surface-variant transition hover:bg-surface-container"
                      >
                        {formatVnd(amount)}
                      </button>
                    ))}
                  </div>
                  {topUpError && <p className="text-sm text-error">{topUpError}</p>}
                  <button
                    type="submit"
                    disabled={!canTopUp}
                    className="w-full rounded-lg bg-primary py-3 font-label-md text-label-md text-on-primary transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isTopUpSubmitting ? "Đang chuyển sang trang thanh toán..." : "Nạp tiền qua PayOS (VietQR)"}
                  </button>
                </form>
              )}

              {tab === "withdraw" && (
                <form
                  className="space-y-md"
                  onSubmit={(event) => {
                    event.preventDefault();
                    void submitWithdraw();
                  }}
                >
                  <div>
                    <label className="mb-1 block font-label-md text-label-md text-on-surface-variant">
                      Số tiền muốn rút ({formatVnd(WITHDRAW_MIN)} – {formatVnd(WITHDRAW_MAX)})
                    </label>
                    <input
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
                  <div className="grid gap-md sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block font-label-md text-label-md text-on-surface-variant">
                        Ngân hàng
                      </label>
                      <input
                        value={bankName}
                        onChange={(event) => setBankName(event.target.value)}
                        maxLength={100}
                        placeholder="Ví dụ: Vietcombank"
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className="mb-1 block font-label-md text-label-md text-on-surface-variant">
                        Số tài khoản
                      </label>
                      <input
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
                    <label className="mb-1 block font-label-md text-label-md text-on-surface-variant">
                      Tên chủ tài khoản
                    </label>
                    <input
                      value={accountHolder}
                      onChange={(event) => setAccountHolder(event.target.value)}
                      maxLength={100}
                      placeholder="Đúng như trên thẻ ngân hàng"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block font-label-md text-label-md text-on-surface-variant">
                      Ảnh mã QR ngân hàng (không bắt buộc)
                    </label>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={(event) => {
                        pickQr(event.target.files?.[0] ?? null);
                        event.target.value = "";
                      }}
                      className="block w-full text-sm text-on-surface-variant file:mr-3 file:rounded-lg file:border-0 file:bg-surface-container file:px-4 file:py-2 file:font-label-md"
                    />
                    {qrError && <p className="mt-1 text-sm text-error">{qrError}</p>}
                    {qrPreview && (
                      <div className="mt-2 flex items-center gap-3">
                        <img
                          src={qrPreview}
                          alt="QR đã chọn"
                          className="h-24 w-24 rounded-lg border border-outline-variant object-contain"
                        />
                        <button type="button" onClick={() => setQrImage(null)} className="text-sm text-error">
                          Bỏ ảnh
                        </button>
                      </div>
                    )}
                  </div>
                  {eligibility && !eligibility.eligible && (
                    <p className="rounded-lg bg-error-container/10 p-3 text-sm text-error">
                      {eligibility.message ?? "Hiện chưa thể tạo thêm yêu cầu rút tiền."}
                    </p>
                  )}
                  <p className="text-xs text-on-surface-variant">
                    Số tiền được giữ lại ngay khi gửi yêu cầu và chuyển về tài khoản của bạn sau khi quản trị
                    viên duyệt (thường trong 1–2 ngày làm việc). Nếu yêu cầu bị từ chối, tiền sẽ được hoàn lại
                    ví.
                  </p>
                  {withdrawError && <p className="text-sm text-error">{withdrawError}</p>}
                  <button
                    type="submit"
                    disabled={!canWithdraw}
                    className="w-full rounded-lg bg-primary py-3 font-label-md text-label-md text-on-primary transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isWithdrawSubmitting ? "Đang gửi..." : "Gửi yêu cầu rút tiền"}
                  </button>
                </form>
              )}
            </section>

            {withdrawals.length > 0 && (
              <section className="rounded-xl border border-outline-variant bg-surface-container-lowest p-lg">
                <h2 className="mb-md font-headline-md text-headline-md">Yêu cầu rút tiền</h2>
                <ul className="space-y-3">
                  {withdrawals.map((item) => {
                    const status = WITHDRAWAL_STATUS[item.status] ?? WITHDRAWAL_STATUS.PENDING;
                    return (
                      <li
                        key={item.id}
                        className="rounded-lg border border-outline-variant bg-surface-container-low p-4"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div>
                            <p className="font-semibold">{formatVnd(item.amount)}</p>
                            <p className="text-xs text-on-surface-variant">
                              {item.bankName} · {maskAccount(item.accountNumber)} · {item.accountHolder}
                            </p>
                            <p className="mt-1 text-xs text-on-surface-variant">
                              {formatDateTime(item.createdAt)}
                            </p>
                          </div>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${status.cls}`}
                          >
                            {status.label}
                          </span>
                        </div>
                        {item.qrImageUrl && (
                          <a
                            href={item.qrImageUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-2 inline-block text-xs text-primary underline"
                          >
                            Xem ảnh QR đã gửi
                          </a>
                        )}
                        {item.note && (
                          <p className="mt-2 text-xs text-on-surface-variant">Ghi chú: {item.note}</p>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </section>
            )}

            <section className="rounded-xl border border-outline-variant bg-surface-container-lowest p-lg">
              <h2 className="mb-md font-headline-md text-headline-md">Lịch sử giao dịch</h2>
              {history.length === 0 ? (
                <p className="text-sm text-on-surface-variant">Chưa có giao dịch nào.</p>
              ) : (
                <ul className="divide-y divide-outline-variant">
                  {history.map((item) => {
                    const meta = TRANSACTION_META[item.type] ?? {
                      label: item.type,
                      icon: "receipt_long",
                      sign: 1 as const,
                    };
                    return (
                      <li key={item.id} className="flex items-center justify-between gap-3 py-3">
                        <div className="flex items-center gap-3">
                          <span className="material-symbols-outlined rounded-full bg-surface-container p-2 text-on-surface-variant">
                            {meta.icon}
                          </span>
                          <div>
                            <p className="font-semibold">{meta.label}</p>
                            {item.description && (
                              <p className="text-xs text-on-surface-variant">{item.description}</p>
                            )}
                            <p className="text-xs text-on-surface-variant">
                              {formatDateTime(item.createdAt)}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`font-bold ${meta.sign > 0 ? "text-tertiary" : "text-error"}`}>
                            {meta.sign > 0 ? "+" : "−"}
                            {formatVnd(item.amount)}
                          </p>
                          {item.balanceAfter !== null && (
                            <p className="text-xs text-on-surface-variant">
                              Số dư: {formatVnd(item.balanceAfter)}
                            </p>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}

import { useEffect, useId, useState, type FormEvent } from "react";
import {
  diagnoseVehicle,
  getAiQuota,
  getMyDiagnoses,
  getMyFleet,
  sendDiagnosisFeedback,
  type AiDiagnosis,
  type AiQuota,
  type DiagnosisLikelihood,
  type DiagnosisResult,
  type DiagnosisSeverity,
  type Vehicle,
} from "../../services/api";

type DiagnosePageProps = {
  initialVehicleId: number | null;
  onBookServiceClick: (serviceId: number) => void;
  onAddVehicleClick: () => void;
};

const MIN_SYMPTOMS = 5;
const MAX_SYMPTOMS = 2000;
const QUICK_CHIPS = [
  "Tiếng kêu lạ",
  "Đèn báo lỗi",
  "Xe rung lắc",
  "Khó nổ máy",
  "Hao xăng",
  "Điều hòa kém lạnh",
];

const severityMeta: Record<
  DiagnosisSeverity,
  { label: string; chip: string; banner: string; icon: string }
> = {
  URGENT: {
    label: "Khẩn cấp",
    chip: "bg-error-container text-on-error-container",
    banner: "border-[#f3b6af] bg-error-container text-on-error-container",
    icon: "report",
  },
  MEDIUM: {
    label: "Trung bình",
    chip: "bg-[#ffe9c7] text-[#6b4000]",
    banner: "border-[#f1d29b] bg-[#fff7ea] text-[#6b4000]",
    icon: "schedule",
  },
  LOW: {
    label: "Thấp",
    chip: "bg-[#d7f5dc] text-on-tertiary-fixed-variant",
    banner: "border-[#bfe5c6] bg-[#eefaf0] text-on-tertiary-fixed-variant",
    icon: "check_circle",
  },
};

const likelihoodMeta: Record<DiagnosisLikelihood, { label: string; className: string }> = {
  HIGH: { label: "Khả năng cao", className: "bg-primary-fixed text-on-primary-fixed" },
  MEDIUM: {
    label: "Khả năng trung bình",
    className: "bg-surface-container-highest text-on-surface-variant",
  },
  LOW: { label: "Khả năng thấp", className: "bg-surface-container-low text-outline" },
};

function bannerCopy(result: DiagnosisResult): { title: string; body: string } {
  if (result.stopDriving) {
    return {
      title: "Khẩn cấp: nên ngừng lái xe và gọi cứu hộ",
      body: "Triệu chứng có thể ảnh hưởng an toàn. Đừng tiếp tục lái cho đến khi kỹ thuật viên kiểm tra.",
    };
  }
  if (result.severity === "URGENT") {
    return { title: "Cần kiểm tra ngay", body: "Nên đưa xe đến garage càng sớm càng tốt." };
  }
  if (result.severity === "MEDIUM") {
    return { title: "Nên kiểm tra sớm", body: "Chưa nguy hiểm ngay nhưng không nên để lâu." };
  }
  return { title: "Mức độ thấp", body: "Tiếp tục theo dõi và kiểm tra khi đến kỳ bảo dưỡng." };
}

function formatDateTime(iso: string | null): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatPrice(price: number | null): string {
  return price != null ? `${price.toLocaleString("vi-VN")} đ` : "";
}

export default function DiagnosePage({
  initialVehicleId,
  onBookServiceClick,
  onAddVehicleClick,
}: DiagnosePageProps) {
  const symptomsId = useId();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [history, setHistory] = useState<AiDiagnosis[]>([]);
  const [quota, setQuota] = useState<AiQuota | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [selectedVehicleId, setSelectedVehicleId] = useState<number | null>(initialVehicleId);
  const [symptoms, setSymptoms] = useState("");
  const [current, setCurrent] = useState<AiDiagnosis | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSendingFeedback, setIsSendingFeedback] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      getMyFleet(),
      // Lịch sử và số lượt chỉ là thông tin phụ — lỗi thì bỏ qua, vẫn chẩn đoán được.
      getMyDiagnoses().catch(() => [] as AiDiagnosis[]),
      getAiQuota().catch(() => null),
    ])
      .then(([fleet, diagnoses, myQuota]) => {
        if (cancelled) return;
        setVehicles(fleet);
        setHistory(diagnoses);
        setQuota(myQuota);
        setSelectedVehicleId((previous) =>
          previous !== null && fleet.some((vehicle) => vehicle.id === previous)
            ? previous
            : (fleet[0]?.id ?? null),
        );
      })
      .catch((requestError) => {
        if (cancelled) return;
        setLoadError(
          requestError instanceof Error ? requestError.message : "Không tải được danh sách xe.",
        );
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const trimmedLength = symptoms.trim().length;
  const isQuotaExhausted = quota !== null && quota.used >= quota.limit;
  const canSubmit =
    selectedVehicleId !== null && trimmedLength >= MIN_SYMPTOMS && !isSubmitting && !isQuotaExhausted;

  const addChip = (chip: string) => {
    setSymptoms((previous) => {
      const base = previous.trim();
      const next = base ? `${base}${/[.!?]$/.test(base) ? " " : ". "}${chip}` : chip;
      return next.slice(0, MAX_SYMPTOMS);
    });
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!canSubmit || selectedVehicleId === null) return;

    setIsSubmitting(true);
    setError("");
    try {
      const created = await diagnoseVehicle(selectedVehicleId, symptoms.trim());
      setCurrent(created);
      setHistory((items) => [created, ...items.filter((item) => item.id !== created.id)].slice(0, 20));
      setQuota((previous) => (previous ? { ...previous, used: previous.used + 1 } : previous));
      setSymptoms("");
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Không thể chẩn đoán lúc này. Vui lòng thử lại.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFeedback = async (helpful: boolean) => {
    if (!current) return;
    setIsSendingFeedback(true);
    setError("");
    try {
      const updated = await sendDiagnosisFeedback(current.id, helpful);
      setCurrent(updated);
      setHistory((items) => items.map((item) => (item.id === updated.id ? updated : item)));
    } catch (requestError) {
      setError(
        requestError instanceof Error ? requestError.message : "Không gửi được đánh giá. Vui lòng thử lại.",
      );
    } finally {
      setIsSendingFeedback(false);
    }
  };

  const startNew = () => {
    setCurrent(null);
    setError("");
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-6xl p-margin-mobile md:p-margin-desktop">
        <p className="font-body-md text-body-md text-on-surface-variant">Đang tải...</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="mx-auto max-w-6xl p-margin-mobile md:p-margin-desktop">
        <p className="rounded-lg bg-error-container px-4 py-3 text-sm text-on-error-container">{loadError}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-lg p-margin-mobile pb-28 md:p-margin-desktop">
      <div className="flex flex-col justify-between gap-md sm:flex-row sm:items-end">
        <div>
          <h2 className="flex items-center gap-2 font-display-lg text-display-lg text-on-surface">
            <span className="material-symbols-outlined text-[32px] text-primary" aria-hidden="true">
              auto_awesome
            </span>
            {current ? "Kết quả chẩn đoán" : "Chẩn đoán xe bằng AI"}
          </h2>
          <p className="font-body-md text-body-md text-on-surface-variant">
            {current
              ? `${current.vehicleLabel}${current.createdAt ? ` · ${formatDateTime(current.createdAt)}` : ""}`
              : "Mô tả triệu chứng, AI sẽ gợi ý nguyên nhân khả dĩ và dịch vụ phù hợp tại garage."}
          </p>
        </div>
        {current && (
          <button
            type="button"
            onClick={startNew}
            className="flex min-h-11 items-center gap-2 rounded-lg border border-outline-variant bg-white px-lg font-label-md text-label-md text-primary transition-colors hover:bg-surface-container-low"
          >
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
              refresh
            </span>
            Chẩn đoán lại
          </button>
        )}
      </div>

      <div className="flex flex-col gap-lg lg:flex-row lg:items-start">
        {current ? (
          <ResultView
            diagnosis={current}
            isSendingFeedback={isSendingFeedback}
            error={error}
            onFeedback={handleFeedback}
            onBook={onBookServiceClick}
          />
        ) : (
          <section className="min-w-0 flex-1 space-y-lg rounded-xl border border-outline-variant bg-white p-lg">
            {vehicles.length === 0 ? (
              <div className="space-y-md">
                <p className="font-body-md text-body-md text-on-surface-variant">
                  Bạn chưa có xe nào để chẩn đoán. Hãy thêm phương tiện trước.
                </p>
                <button
                  type="button"
                  onClick={onAddVehicleClick}
                  className="min-h-11 rounded-lg bg-primary px-lg font-label-md text-label-md text-on-primary"
                >
                  Thêm phương tiện
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-lg">
                <div>
                  <div
                    className="mb-sm font-label-md text-label-md font-semibold text-on-surface"
                    id={`${symptomsId}-vehicle`}
                  >
                    1. Chọn xe cần chẩn đoán
                  </div>
                  <div
                    role="radiogroup"
                    aria-labelledby={`${symptomsId}-vehicle`}
                    className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3"
                  >
                    {vehicles.map((vehicle) => {
                      const selected = vehicle.id === selectedVehicleId;
                      return (
                        <button
                          key={vehicle.id}
                          type="button"
                          role="radio"
                          aria-checked={selected}
                          onClick={() => setSelectedVehicleId(vehicle.id)}
                          className={`rounded-xl p-3 text-left transition-colors ${
                            selected
                              ? "border-2 border-primary bg-primary-fixed/40"
                              : "border border-outline-variant bg-white hover:bg-surface-container-low"
                          }`}
                        >
                          <span className="flex items-center justify-between font-label-md text-label-md font-semibold text-on-surface">
                            {vehicle.model}
                            {selected && (
                              <span className="material-symbols-outlined text-[20px] text-primary" aria-hidden="true">
                                check_circle
                              </span>
                            )}
                          </span>
                          <span className="mt-1 block font-label-sm text-label-sm text-on-surface-variant">
                            {vehicle.licensePlate || "Chưa có biển số"}
                            {vehicle.odometer != null ? ` · ${vehicle.odometer.toLocaleString("vi-VN")} km` : ""}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label
                    htmlFor={symptomsId}
                    className="mb-sm block font-label-md text-label-md font-semibold text-on-surface"
                  >
                    2. Mô tả triệu chứng
                  </label>
                  <textarea
                    id={symptomsId}
                    rows={5}
                    maxLength={MAX_SYMPTOMS}
                    value={symptoms}
                    onChange={(event) => setSymptoms(event.target.value)}
                    placeholder="Ví dụ: Xe có tiếng kêu ken két mỗi khi đạp phanh, nhất là lúc xuống dốc."
                    className="w-full resize-none rounded-xl border border-outline-variant bg-white p-3 font-body-md text-body-md outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                  <div className="mt-1 flex justify-between font-label-sm text-label-sm text-outline">
                    <span>Càng chi tiết càng chính xác: khi nào xảy ra, âm thanh, mùi, đèn báo...</span>
                    <span>
                      {symptoms.length}/{MAX_SYMPTOMS}
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {QUICK_CHIPS.map((chip) => (
                      <button
                        key={chip}
                        type="button"
                        onClick={() => addChip(chip)}
                        className="min-h-9 rounded-full border border-outline-variant bg-white px-3 font-label-md text-label-md text-on-surface-variant transition-colors hover:bg-surface-container-low"
                      >
                        {chip}
                      </button>
                    ))}
                  </div>
                </div>

                {error && (
                  <p role="alert" className="rounded-lg bg-error-container px-4 py-3 text-sm text-on-error-container">
                    {error}
                  </p>
                )}

                <div className="flex flex-wrap items-center justify-between gap-md">
                  <span className="font-label-md text-label-md text-on-surface-variant">
                    {quota
                      ? isQuotaExhausted
                        ? "Bạn đã dùng hết lượt chẩn đoán hôm nay."
                        : `Còn ${quota.limit - quota.used}/${quota.limit} lượt chẩn đoán hôm nay`
                      : ""}
                  </span>
                  <button
                    type="submit"
                    disabled={!canSubmit}
                    className="flex min-h-12 items-center gap-2 rounded-xl bg-primary px-8 font-label-md text-label-md font-semibold text-on-primary transition-all hover:shadow-lg active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <span
                      className={`material-symbols-outlined text-[20px] ${isSubmitting ? "animate-spin" : ""}`}
                      aria-hidden="true"
                    >
                      {isSubmitting ? "sync" : "auto_awesome"}
                    </span>
                    {isSubmitting ? "AI đang phân tích..." : "Chẩn đoán ngay"}
                  </button>
                </div>
                {isSubmitting && (
                  <p className="font-label-sm text-label-sm text-on-surface-variant" role="status">
                    Việc này có thể mất vài chục giây, vui lòng không đóng trang.
                  </p>
                )}

                <p className="flex gap-2 rounded-lg bg-surface-container-low p-3 font-label-sm text-label-sm text-on-surface-variant">
                  <span className="material-symbols-outlined text-[18px] text-outline" aria-hidden="true">
                    info
                  </span>
                  Kết quả chỉ mang tính tham khảo, không thay thế việc kỹ thuật viên kiểm tra trực tiếp. Khi phanh
                  yếu, khói, mùi cháy hoặc đèn đỏ, hãy dừng xe và gọi cứu hộ.
                </p>
              </form>
            )}
          </section>
        )}

        <div className="w-full shrink-0 space-y-md lg:w-80">
          {current && (
            <div className="space-y-2 rounded-xl border border-outline-variant bg-white p-lg">
              <h3 className="font-headline-md text-headline-md text-on-surface">Bạn đã mô tả</h3>
              <p className="whitespace-pre-line font-body-md text-body-md text-on-surface-variant">
                {current.symptoms}
              </p>
              <p className="border-t border-surface-container-highest pt-2 font-label-sm text-label-sm text-outline">
                {current.vehicleLabel}
              </p>
            </div>
          )}

          <div className="space-y-sm rounded-xl border border-outline-variant bg-white p-lg">
            <h3 className="font-headline-md text-headline-md text-on-surface">Lịch sử chẩn đoán</h3>
            {history.length === 0 ? (
              <p className="font-label-md text-label-md text-on-surface-variant">Chưa có lần chẩn đoán nào.</p>
            ) : (
              history.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setCurrent(item);
                    setError("");
                  }}
                  className={`flex w-full flex-col gap-1 rounded-xl border p-3 text-left transition-colors hover:bg-surface-container-low ${
                    current?.id === item.id ? "border-primary bg-primary-fixed/30" : "border-outline-variant"
                  }`}
                >
                  <span className="flex items-center justify-between gap-2">
                    <span className="font-label-md text-label-md font-semibold text-on-surface">
                      {item.vehicleLabel}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 font-label-sm text-label-sm font-semibold ${severityMeta[item.result.severity].chip}`}
                    >
                      {severityMeta[item.result.severity].label}
                    </span>
                  </span>
                  <span className="line-clamp-2 font-label-md text-label-md text-on-surface-variant">
                    {item.result.summary || item.symptoms}
                  </span>
                  <span className="font-label-sm text-label-sm text-outline">{formatDateTime(item.createdAt)}</span>
                </button>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ResultView({
  diagnosis,
  isSendingFeedback,
  error,
  onFeedback,
  onBook,
}: {
  diagnosis: AiDiagnosis;
  isSendingFeedback: boolean;
  error: string;
  onFeedback: (helpful: boolean) => void;
  onBook: (serviceId: number) => void;
}) {
  const { result } = diagnosis;
  const meta = severityMeta[result.severity];
  const banner = bannerCopy(result);
  const urgent = result.severity === "URGENT";

  return (
    <section className="min-w-0 flex-1 space-y-md">
      <div className={`flex items-start gap-md rounded-xl border p-md ${meta.banner}`} role="status">
        <span className="material-symbols-outlined text-[32px]" aria-hidden="true">
          {meta.icon}
        </span>
        <div>
          <p className="font-headline-md text-headline-md font-bold">{banner.title}</p>
          <p className="font-body-md text-body-md">{banner.body}</p>
        </div>
      </div>

      <div className="space-y-lg rounded-xl border border-outline-variant bg-white p-lg">
        {result.summary && (
          <div>
            <h3 className="mb-1 font-headline-md text-headline-md text-on-surface">Tóm tắt</h3>
            <p className="font-body-md text-body-md text-on-surface-variant">{result.summary}</p>
          </div>
        )}

        {result.causes.length > 0 && (
          <div>
            <h3 className="mb-sm font-headline-md text-headline-md text-on-surface">Nguyên nhân khả dĩ</h3>
            <ul className="space-y-sm">
              {result.causes.map((cause, index) => (
                <li key={`${cause.name}-${index}`} className="rounded-xl border border-outline-variant p-3">
                  <div className="flex items-center justify-between gap-md">
                    <span className="font-label-md text-label-md font-semibold text-on-surface">{cause.name}</span>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-0.5 font-label-sm text-label-sm font-semibold ${likelihoodMeta[cause.likelihood].className}`}
                    >
                      {likelihoodMeta[cause.likelihood].label}
                    </span>
                  </div>
                  <p className="mt-1 font-label-md text-label-md text-on-surface-variant">{cause.explanation}</p>
                </li>
              ))}
            </ul>
          </div>
        )}

        {result.advice && (
          <div className="rounded-lg bg-surface-container-low p-3">
            <p className="font-label-md text-label-md font-semibold text-on-surface">Lời khuyên</p>
            <p className="font-body-md text-body-md text-on-surface-variant">{result.advice}</p>
          </div>
        )}
      </div>

      {diagnosis.suggestedServices.length > 0 && (
        <div className="space-y-sm rounded-xl border border-outline-variant bg-white p-lg">
          <h3 className="font-headline-md text-headline-md text-on-surface">Dịch vụ gợi ý tại Servio</h3>
          {diagnosis.suggestedServices.map((service) => (
            <div
              key={service.id}
              className="flex flex-col gap-md rounded-xl border border-outline-variant p-3 sm:flex-row sm:items-center"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary-fixed text-primary">
                <span className="material-symbols-outlined" aria-hidden="true">
                  build
                </span>
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-label-md text-label-md font-semibold text-on-surface">{service.name}</p>
                <p className="font-label-sm text-label-sm text-on-surface-variant">{formatPrice(service.price)}</p>
              </div>
              <button
                type="button"
                onClick={() => onBook(service.id)}
                className={`min-h-11 shrink-0 rounded-lg px-lg font-label-md text-label-md text-white transition-all hover:shadow-lg active:scale-95 ${
                  urgent ? "bg-error" : "bg-primary"
                }`}
              >
                Đặt lịch ngay
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-md rounded-xl border border-outline-variant bg-white p-md">
        <span className="font-label-md text-label-md font-semibold text-on-surface">
          {diagnosis.helpful === null ? "Kết quả này có hữu ích không?" : "Cảm ơn bạn đã đánh giá."}
        </span>
        <div className="flex gap-2" role="group" aria-label="Đánh giá kết quả">
          <button
            type="button"
            disabled={isSendingFeedback}
            aria-pressed={diagnosis.helpful === true}
            onClick={() => onFeedback(true)}
            className={`flex min-h-11 items-center gap-1.5 rounded-lg border px-4 font-label-md text-label-md font-semibold transition-colors disabled:opacity-60 ${
              diagnosis.helpful === true
                ? "border-primary bg-primary-fixed text-on-primary-fixed"
                : "border-outline-variant bg-white text-on-surface hover:bg-surface-container-low"
            }`}
          >
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
              thumb_up
            </span>
            Hữu ích
          </button>
          <button
            type="button"
            disabled={isSendingFeedback}
            aria-pressed={diagnosis.helpful === false}
            onClick={() => onFeedback(false)}
            className={`flex min-h-11 items-center gap-1.5 rounded-lg border px-4 font-label-md text-label-md font-semibold transition-colors disabled:opacity-60 ${
              diagnosis.helpful === false
                ? "border-primary bg-primary-fixed text-on-primary-fixed"
                : "border-outline-variant bg-white text-on-surface hover:bg-surface-container-low"
            }`}
          >
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
              thumb_down
            </span>
            Chưa đúng
          </button>
        </div>
      </div>

      {error && (
        <p role="alert" className="rounded-lg bg-error-container px-4 py-3 text-sm text-on-error-container">
          {error}
        </p>
      )}

      <p className="font-label-sm text-label-sm text-outline">
        Kết quả chỉ mang tính tham khảo do AI tạo ra, không thay thế việc kỹ thuật viên kiểm tra trực tiếp.
      </p>
    </section>
  );
}

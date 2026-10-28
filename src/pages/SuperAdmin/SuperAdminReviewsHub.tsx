import { useState } from "react";
import SuperAdminReviewsTab from "./SuperAdminReviewsTab";
import SuperAdminWebReviewsTab from "./SuperAdminWebReviewsTab";

type Kind = "garage" | "web";

const KINDS: Array<{ key: Kind; icon: string; label: string }> = [
  { key: "garage", icon: "storefront", label: "Đánh giá garage" },
  { key: "web", icon: "language", label: "Đánh giá website" },
];

type Props = {
  notify: (message: string, type?: "success" | "error") => void;
};

// Tab "Đánh giá" của Super Admin: chuyển giữa đánh giá garage và đánh giá website Servio.
export default function SuperAdminReviewsHub({ notify }: Props) {
  const [kind, setKind] = useState<Kind>("garage");

  return (
    <div className="space-y-5">
      <div role="tablist" aria-label="Loại đánh giá" className="inline-flex gap-1 rounded-xl bg-[#e9eaeb] p-1">
        {KINDS.map((option) => (
          <button
            key={option.key}
            type="button"
            role="tab"
            id={`reviews-kind-${option.key}`}
            aria-selected={kind === option.key}
            aria-controls={`reviews-kind-panel-${option.key}`}
            onClick={() => setKind(option.key)}
            className={`inline-flex min-h-9 items-center gap-1.5 rounded-[9px] px-4 text-sm font-bold ${
              kind === option.key
                ? "bg-surface-container-lowest text-on-primary-fixed-variant shadow-sm"
                : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            <span aria-hidden="true" className="material-symbols-outlined text-xl">
              {option.icon}
            </span>
            {option.label}
          </button>
        ))}
      </div>

      <div role="tabpanel" id={`reviews-kind-panel-${kind}`} aria-labelledby={`reviews-kind-${kind}`}>
        {kind === "garage" ? <SuperAdminReviewsTab notify={notify} /> : <SuperAdminWebReviewsTab notify={notify} />}
      </div>
    </div>
  );
}

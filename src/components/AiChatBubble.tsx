import { useState } from "react";

const TIP_DISMISSED_KEY = "ai_bubble_tip_dismissed";

function readDismissed() {
  try {
    return localStorage.getItem(TIP_DISMISSED_KEY) === "1";
  } catch {
    return false;
  }
}

type AiChatBubbleProps = {
  onClick: () => void;
  // Lời chào nhỏ chỉ hiện ở trang chủ và chỉ cho tới khi khách bấm tắt.
  showTip?: boolean;
};

// Bong bóng chat nổi ở góc phải dưới: nhấn vào để mở trang chẩn đoán xe bằng AI.
export default function AiChatBubble({ onClick, showTip = false }: AiChatBubbleProps) {
  const [dismissed, setDismissed] = useState(readDismissed);

  const dismissTip = () => {
    setDismissed(true);
    try {
      localStorage.setItem(TIP_DISMISSED_KEY, "1");
    } catch {
      // Không lưu được thì lần sau lời chào hiện lại, không ảnh hưởng gì khác.
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-40 flex flex-col items-end gap-3 md:bottom-8 md:right-8">
      {showTip && !dismissed && (
        <div className="relative max-w-[15rem] rounded-[20px_20px_6px_20px] border border-outline-variant/40 bg-surface-container-lowest px-4 py-3 text-[13.5px] leading-relaxed shadow-[0_14px_30px_-14px_rgba(25,28,29,0.4)]">
          <button
            type="button"
            onClick={dismissTip}
            aria-label="Tắt lời chào"
            className="absolute -left-2.5 -top-2.5 flex h-6 w-6 items-center justify-center rounded-full border border-outline-variant/60 bg-surface-container-lowest text-outline shadow-sm hover:text-on-surface"
          >
            <span aria-hidden="true" className="material-symbols-outlined text-base">
              close
            </span>
          </button>
          <b className="block text-sm text-on-primary-fixed-variant">Xe có vấn đề gì không?</b>
          Hỏi trợ lý AI để biết nguyên nhân và mức độ khẩn cấp.
        </div>
      )}
      <button
        type="button"
        onClick={onClick}
        aria-label="Chẩn đoán xe bằng AI"
        className="group relative flex h-16 items-center rounded-full bg-gradient-to-br from-primary to-primary-container pl-0 text-on-primary shadow-[0_18px_30px_-12px_rgba(0,89,187,0.75),0_0_0_6px_rgba(0,89,187,0.14)] transition-all duration-200 active:scale-95 max-md:h-14"
      >
        <span className="flex h-16 w-16 shrink-0 items-center justify-center max-md:h-14 max-md:w-14">
          <span
            aria-hidden="true"
            className="material-symbols-outlined text-[32px]"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            auto_awesome
          </span>
        </span>
        <span className="max-w-0 overflow-hidden whitespace-nowrap text-[15px] font-bold transition-all duration-200 group-hover:max-w-[12rem] group-hover:pr-6 group-focus-visible:max-w-[12rem] group-focus-visible:pr-6 max-md:hidden">
          Chẩn đoán xế yêu
        </span>
        <i
          aria-hidden="true"
          className="absolute right-0.5 top-0.5 h-3.5 w-3.5 rounded-full border-2 border-white bg-[#008730]"
        />
      </button>
    </div>
  );
}

import { useEffect, useState } from "react";
import { getNotificationStreamUrl, getUnreadNotificationCount } from "../services/api";

const FALLBACK_POLL_INTERVAL_MS = 30000;

// Ưu tiên kênh SSE (real-time thật) qua GET /api/notifications/stream. Nếu
// không mở được kết nối (mạng chặn, trình duyệt cũ, backend đang restart...)
// thì rơi về polling định kỳ để badge vẫn đúng, chỉ là không tức thời.
export function useUnreadNotificationCount() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    let pollIntervalId: number | undefined;
    let eventSource: EventSource | null = null;

    const startPolling = () => {
      if (pollIntervalId !== undefined) return;
      const poll = () => {
        getUnreadNotificationCount()
          .then((value) => {
            if (!cancelled) setCount(value);
          })
          .catch(() => {
            // Bỏ qua lỗi tạm thời, giữ nguyên giá trị cũ để badge không nhấp nháy.
          });
      };
      poll();
      pollIntervalId = window.setInterval(poll, FALLBACK_POLL_INTERVAL_MS);
    };

    const streamUrl = getNotificationStreamUrl();
    if (!streamUrl || typeof EventSource === "undefined") {
      startPolling();
      return () => {
        cancelled = true;
        if (pollIntervalId !== undefined) window.clearInterval(pollIntervalId);
      };
    }

    eventSource = new EventSource(streamUrl);
    eventSource.addEventListener("unread-count", (event) => {
      const value = Number((event as MessageEvent).data);
      if (!cancelled && Number.isFinite(value)) setCount(value);
    });
    eventSource.onerror = () => {
      // EventSource tự động reconnect khi rớt kết nối tạm thời; nếu backend
      // không hỗ trợ/không tới được thì vẫn cần polling để không mất cập nhật.
      startPolling();
    };

    return () => {
      cancelled = true;
      eventSource?.close();
      if (pollIntervalId !== undefined) window.clearInterval(pollIntervalId);
    };
  }, []);

  return count;
}

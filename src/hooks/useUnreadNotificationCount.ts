import { useEffect, useState } from "react";
import { getUnreadNotificationCount } from "../services/api";

const POLL_INTERVAL_MS = 30000;

// Backend chưa có WebSocket/SSE, nên đây chỉ là "gần real-time" bằng polling
// định kỳ, không phải push thật sự.
export function useUnreadNotificationCount() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const poll = () => {
      getUnreadNotificationCount()
        .then((value) => {
          if (!cancelled) setCount(value);
        })
        .catch(() => {
          // Bỏ qua lỗi tạm thời, giữ nguyên giá trị đã có để không nhấp nháy badge.
        });
    };

    poll();
    const intervalId = window.setInterval(poll, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, []);

  return count;
}

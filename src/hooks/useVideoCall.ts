import { createContext, useContext } from "react";

export type VideoCallApi = {
  // Bắt đầu cuộc gọi mới cho lịch hẹn: backend tạo phòng và báo cho bên kia.
  start: (appointmentId: number | string) => void;
  // Vào phòng của cuộc gọi đã có (nhận lời mời, hoặc vào lại).
  join: (appointmentId: number | string) => void;
  // Đang tạo hoặc mở phòng: dùng để khoá nút, tránh bấm lặp (mỗi lần gọi backend lại ghi chat và gửi thông báo).
  busy: boolean;
};

export const VideoCallContext = createContext<VideoCallApi | null>(null);

// null khi nằm ngoài VideoCallHost (ví dụ trang xem trước): khi đó không hiện nút gọi video.
export function useVideoCall() {
  return useContext(VideoCallContext);
}

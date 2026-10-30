import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useDialogA11y } from "../hooks/useDialogA11y";
import { VideoCallContext } from "../hooks/useVideoCall";
import {
  getNotificationStreamUrl,
  getVideoCallInfo,
  startVideoCall,
  type VideoCallInfo,
} from "../services/api";
import AppointmentChat from "./AppointmentChat";

const PROVIDER_LABEL: Record<string, string> = { JITSI: "Jitsi", DAILY: "Daily", MIROTALK: "MiroTalk" };
const INCOMING_AUTO_DISMISS_MS = 2 * 60 * 1000;
// Sau chừng này mà vẫn đang ở trang chờ thì nhắc người dùng nhắn tin hoặc gọi thường.
const NUDGE_AFTER_MS = 3 * 60 * 1000;

type Mode = "start" | "join";
type Room = {
  appointmentId: number | string;
  mode: Mode;
  phase: "opening" | "open" | "blocked" | "error";
  info: VideoCallInfo | null;
  message?: string;
};

// Bao quanh một khung trang (AppShell, StaffShell, AdminShell): cung cấp nút gọi video cho khung chat, hiện hộp
// thoại khi có cuộc gọi đến (SSE "video-call") và trang chờ khi phòng gọi đã mở ở tab mới. Phòng gọi nằm ở nhà cung
// cấp ngoài (Jitsi mặc định không cho nhúng vào trang) nên luôn mở bằng tab mới.
export default function VideoCallHost({ children }: { children: ReactNode }) {
  const [room, setRoom] = useState<Room | null>(null);
  const [incoming, setIncoming] = useState<VideoCallInfo | null>(null);
  const [busy, setBusy] = useState(false);
  const [nudge, setNudge] = useState(false);

  const busyRef = useRef(false);
  const roomRef = useRef<Room | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    roomRef.current = room;
  }, [room]);

  const closeRoom = useCallback(() => setRoom(null), []);

  const open = useCallback((appointmentId: number | string, mode: Mode) => {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setIncoming(null);
    setNudge(false);

    // Phải mở cửa sổ ngay trong lúc bấm (trước khi chờ máy chủ), nếu không trình duyệt sẽ chặn cửa sổ mới.
    const popup = window.open("about:blank", "_blank");
    if (popup) popup.opener = null;
    setRoom({ appointmentId, mode, phase: "opening", info: null });

    const request = mode === "start" ? startVideoCall(appointmentId) : getVideoCallInfo(appointmentId);
    request
      .then((info) => {
        if (popup && !popup.closed) {
          popup.location.href = info.roomUrl;
          setRoom({ appointmentId, mode, phase: "open", info });
        } else {
          setRoom({ appointmentId, mode, phase: "blocked", info });
        }
      })
      .catch((error) => {
        popup?.close();
        setRoom({
          appointmentId,
          mode,
          phase: "error",
          info: null,
          message: error instanceof Error ? error.message : "Không bắt đầu được cuộc gọi.",
        });
      })
      .finally(() => {
        busyRef.current = false;
        setBusy(false);
      });
  }, []);

  const reopenRoom = () => {
    const info = room?.info;
    if (!info) return;
    // Không dùng "noopener" vì khi đó window.open luôn trả về null, không biết có bị chặn hay không.
    const popup = window.open(info.roomUrl, "_blank");
    if (popup) {
      popup.opener = null;
      setRoom({ ...room, phase: "open" });
    }
  };

  // Kênh SSE riêng cho cuộc gọi đến: backend chỉ gửi cho người còn lại của lịch hẹn, không gửi cho người gọi.
  useEffect(() => {
    const url = getNotificationStreamUrl();
    if (!url || typeof EventSource === "undefined") return;
    const source = new EventSource(url);
    const onCall = (event: Event) => {
      try {
        const info = JSON.parse((event as MessageEvent).data) as VideoCallInfo;
        if (!info || info.appointmentId == null) return;
        // Đang ở đúng cuộc gọi này rồi thì không hiện lời mời nữa.
        if (String(roomRef.current?.appointmentId) === String(info.appointmentId)) return;
        setIncoming(info);
      } catch {
        // Dữ liệu sự kiện lỗi: bỏ qua, vẫn còn thông báo và dòng trong chat.
      }
    };
    source.addEventListener("video-call", onCall);
    return () => {
      source.removeEventListener("video-call", onCall);
      source.close();
    };
  }, []);

  useEffect(() => {
    if (!incoming) return;
    const timer = window.setTimeout(() => setIncoming(null), INCOMING_AUTO_DISMISS_MS);
    return () => window.clearTimeout(timer);
  }, [incoming]);

  useEffect(() => {
    if (room?.phase !== "open") return;
    const timer = window.setTimeout(() => setNudge(true), NUDGE_AFTER_MS);
    return () => window.clearTimeout(timer);
  }, [room?.phase, room?.appointmentId]);

  useDialogA11y(room !== null, dialogRef, closeRoom);

  const api = useMemo(
    () => ({
      start: (appointmentId: number | string) => open(appointmentId, "start"),
      join: (appointmentId: number | string) => open(appointmentId, "join"),
      busy,
    }),
    [open, busy],
  );

  const providerName = room?.info ? (PROVIDER_LABEL[room.info.provider] ?? room.info.provider) : null;

  return (
    <VideoCallContext.Provider value={api}>
      {children}

      {incoming && (
        <div
          role="alert"
          className="fixed left-1/2 top-4 z-[90] w-[min(26rem,calc(100vw-2rem))] -translate-x-1/2 rounded-3xl border border-outline-variant/40 bg-surface-container-lowest p-4 shadow-[0_24px_50px_-18px_rgba(0,0,0,0.45)]"
        >
          <div className="flex items-center gap-3">
            <span
              aria-hidden="true"
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#d9f7dd] text-[#00531a]"
            >
              <span className="material-symbols-outlined">videocam</span>
            </span>
            <div className="min-w-0">
              <p className="truncate text-[15px] font-extrabold">{incoming.initiatorName} đang gọi video</p>
              <p className="text-xs text-on-surface-variant">Lịch hẹn #{incoming.appointmentId}</p>
            </div>
          </div>
          <div className="mt-3.5 flex gap-2.5">
            <button
              type="button"
              onClick={() => setIncoming(null)}
              className="min-h-11 flex-1 rounded-xl border-[1.5px] border-outline-variant text-sm font-bold hover:bg-surface-container-low"
            >
              Để sau
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => open(incoming.appointmentId, "join")}
              className="inline-flex min-h-11 flex-[1.4] items-center justify-center gap-1.5 rounded-xl bg-gradient-to-br from-[#008730] to-[#00a63f] text-sm font-bold text-white disabled:opacity-60"
            >
              <span aria-hidden="true" className="material-symbols-outlined text-xl">
                videocam
              </span>
              Tham gia
            </button>
          </div>
          <p className="mt-2.5 text-[11.5px] leading-snug text-on-surface-variant">
            "Để sau" chỉ tắt hộp thoại này. Bạn vẫn vào lại được từ thông báo hoặc dòng trong chat.
          </p>
        </div>
      )}

      {room && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-4">
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-label="Cuộc gọi video"
            className="grid max-h-[calc(100dvh-2rem)] w-full max-w-5xl gap-4 overflow-y-auto rounded-3xl bg-surface p-5 shadow-[0_30px_70px_-20px_rgba(0,0,0,0.55)] md:grid-cols-[1fr_22rem]"
          >
            <section className="flex flex-col items-center gap-3.5 rounded-3xl border border-outline-variant/40 bg-surface-container-lowest px-6 py-8 text-center">
              {providerName && (
                <span className="rounded-full bg-[#e6defa] px-3 py-1 text-xs font-bold text-[#3b2a7a]">
                  Phòng gọi: {providerName}
                </span>
              )}

              {room.phase === "opening" && (
                <>
                  <span className="flex h-20 w-20 items-center justify-center rounded-full bg-surface-container text-primary">
                    <span className="material-symbols-outlined animate-spin text-[40px]" aria-hidden="true">
                      sync
                    </span>
                  </span>
                  <h2 role="status" className="text-xl font-extrabold">
                    {room.mode === "start" ? "Đang tạo phòng gọi…" : "Đang vào phòng gọi…"}
                  </h2>
                  <p className="max-w-[24rem] text-sm text-on-surface-variant">
                    Backend tạo phòng, báo cho người kia và ghi một dòng vào chat. Xong sẽ tự mở phòng ở tab mới.
                  </p>
                </>
              )}

              {room.phase === "error" && (
                <>
                  <span className="flex h-20 w-20 items-center justify-center rounded-full bg-error-container text-on-error-container">
                    <span className="material-symbols-outlined text-[40px]" aria-hidden="true">
                      videocam_off
                    </span>
                  </span>
                  <h2 className="text-xl font-extrabold">Chưa gọi video được</h2>
                  <p role="alert" className="max-w-[24rem] rounded-2xl bg-error-container px-4 py-3 text-sm text-on-error-container">
                    {room.message}
                  </p>
                  <p className="max-w-[24rem] text-xs text-on-surface-variant">
                    Kiểm tra kết nối mạng rồi thử lại. Nếu vẫn lỗi, bạn có thể gọi thường hoặc nhắn tin cho người kia.
                  </p>
                </>
              )}

              {room.phase === "blocked" && (
                <>
                  <span className="flex h-20 w-20 items-center justify-center rounded-full bg-[#fff1cc] text-[#6b4200]">
                    <span className="material-symbols-outlined text-[40px]" aria-hidden="true">
                      web_asset_off
                    </span>
                  </span>
                  <h2 className="text-xl font-extrabold">Chưa mở được phòng gọi</h2>
                  <p className="max-w-[24rem] rounded-2xl bg-[#fff1cc] px-4 py-3 text-sm text-[#6b4200]">
                    Trình duyệt đã chặn cửa sổ mới. Phòng gọi đã tạo xong và người kia đã được báo. Bấm nút dưới để mở.
                  </p>
                </>
              )}

              {room.phase === "open" && (
                <>
                  <span className="flex h-20 w-20 items-center justify-center rounded-full bg-[#d9f7dd] text-[#00531a] shadow-[0_0_0_10px_rgba(0,135,48,0.1)]">
                    <span className="material-symbols-outlined text-[40px]" aria-hidden="true">
                      open_in_new
                    </span>
                  </span>
                  <h2 className="text-xl font-extrabold">Đã mở phòng gọi ở tab mới</h2>
                  <p className="max-w-[24rem] text-sm text-on-surface-variant">
                    {room.mode === "start" ? "Servio đã báo cho người kia. " : ""}
                    Chuyển sang tab phòng gọi để nói chuyện, trang này giữ nguyên để bạn nhắn tin.
                  </p>
                  <ol className="w-full max-w-[24rem] space-y-2 rounded-2xl bg-surface-container-low px-4 py-3.5 text-left text-[13.5px] leading-snug">
                    {[
                      "Khi trình duyệt hỏi, chọn Cho phép camera và micro.",
                      "Chờ người kia vào phòng, thường vài chục giây.",
                      "Gọi xong, đóng tab phòng gọi rồi bấm Xong ở đây.",
                    ].map((step, index) => (
                      <li key={step} className="flex items-start gap-2.5">
                        <span
                          aria-hidden="true"
                          className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full bg-primary text-xs font-extrabold text-on-primary"
                        >
                          {index + 1}
                        </span>
                        {step}
                      </li>
                    ))}
                  </ol>
                  {nudge && room.mode === "start" && (
                    <p role="status" className="max-w-[24rem] rounded-2xl bg-primary-fixed px-4 py-3 text-[13px] text-on-primary-fixed-variant">
                      Đã gọi một lúc mà chưa chắc người kia đã vào. Hãy nhắn tin bên cạnh hoặc gọi thường cho họ.
                    </p>
                  )}
                </>
              )}

              <div className="mt-1 flex flex-wrap justify-center gap-3">
                {room.phase === "error" && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => open(room.appointmentId, room.mode)}
                    className="inline-flex min-h-12 items-center gap-2 rounded-2xl bg-gradient-to-br from-[#008730] to-[#00a63f] px-6 text-[15px] font-bold text-white disabled:opacity-60"
                  >
                    <span aria-hidden="true" className="material-symbols-outlined">
                      refresh
                    </span>
                    Thử lại
                  </button>
                )}
                {(room.phase === "open" || room.phase === "blocked") && (
                  <button
                    type="button"
                    onClick={reopenRoom}
                    className="inline-flex min-h-12 items-center gap-2 rounded-2xl bg-gradient-to-br from-[#008730] to-[#00a63f] px-6 text-[15px] font-bold text-white shadow-[0_14px_24px_-14px_rgba(0,135,48,0.9)]"
                  >
                    <span aria-hidden="true" className="material-symbols-outlined">
                      videocam
                    </span>
                    {room.phase === "blocked" ? "Mở phòng gọi" : "Mở lại phòng gọi"}
                  </button>
                )}
                <button
                  type="button"
                  onClick={closeRoom}
                  className="min-h-12 rounded-2xl border-[1.5px] border-outline-variant px-6 text-[15px] font-bold hover:bg-surface-container-low"
                >
                  {room.phase === "open" ? "Xong" : "Đóng"}
                </button>
              </div>
              {room.phase === "open" && (
                <p className="max-w-[24rem] text-xs text-on-surface-variant">
                  Servio không biết khi nào cuộc gọi kết thúc nên không hiện thời lượng. "Xong" chỉ đóng hộp thoại này.
                </p>
              )}
            </section>

            <AppointmentChat key={String(room.appointmentId)} appointmentId={room.appointmentId} hideVideoCall />
          </div>
        </div>
      )}
    </VideoCallContext.Provider>
  );
}

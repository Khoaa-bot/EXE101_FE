import { useState } from "react";
import AppSidebar, { type AppSection } from "../components/AppSidebar";

type TrackingPageProps = {
  onHomeClick: () => void;
  onHistoryClick: () => void;
  onNotificationsClick: () => void;
  onProfileClick: () => void;
};

const heroImage =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuA5opdYRFXDXPug76ui2WhPQXBxEm3_08zVyoBKEzpxvtg-DvZy1Qq4BzA-VlqRU-jsL2AMPXjl0xx8PU81dOeT_7Aiqgd9NWCM5BlaGfU4XFsLLygJLOEchPINjufRimmnmxHzgKLS-dB-FgiZhkyhqSK85fJP9hVfsXHWwg-0VN07FfaB2g2GYI5W2wOeHETCY1RBWAykLtsAuHlfOTjJ8OaobR94b1ge6HIm2CFiw9yMpzO4RG5VM4SbSzrhgeyGPmUWoAouYgtJ";
const brakeImage =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuDG582pkefYaekFIoo6RGvLQCZ9JCtjeftO8p42ZChe_1KGpB3902lDQjFheMXVClFu_OcZv9rBUjlB6EDII4n7-nbKOYt0T_1s5_yUq1MdKx7F4K7VJMBH2YZal5TDGlFkHGt7f1s5wMcW0foE-M_WWAkLpAZc1sUfgv6HtymcRMk04LwHHeYfXHJ1hHM4fZlNopIRr-9D2eHMWlEx7DvDjFLRA-WedlDrIgHvfe6_yk1ecuEwyr0LX0R2P_Br_dLX-y4u9jlGvJo_";
const oilImage =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuByHw9cwkJkc9RMoESZqrXn-dnslZHdAWbXMidW9EIFJ8aQ0jYLPOWVmwwdRzE_zH5i6xJSEEit-0n5xCpWV_M6inyGxEVE0AL_Reela7AONboONp7eelTRKYTReiEK4fmAYBSa-cEMbHJMQS2eH_ulVmvGaq-zGeot_JiDsYUkcxyou3fNP00NMRYcIunNQZpZgeSR6PnDji7YupkCgWsoFBxera8IVWn5dHxw9QyB6WErSX80CES0hrKsR3FrWpVrKP_eKDDeuKTA";

export default function TrackingPage({
  onHomeClick,
  onHistoryClick,
  onNotificationsClick,
  onProfileClick,
}: TrackingPageProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleNavigate = (section: AppSection) => {
    if (section === "home") onHomeClick();
    if (section === "history") onHistoryClick();
    if (section === "notifications") onNotificationsClick();
    if (section === "profile") onProfileClick();
  };

  return (
    <div className="min-h-dvh bg-background pb-32 text-on-surface font-sans">
      <AppSidebar
        active="tracking"
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onNavigate={handleNavigate}
      />

      <header className="fixed top-0 z-50 flex h-16 w-full items-center justify-between border-b border-outline-variant bg-surface px-margin-mobile">
        <div className="flex items-center gap-2">
          <button
            className="-ml-2 rounded-full p-2 transition-colors hover:bg-surface-container-low active:opacity-70"
            type="button"
            onClick={() => setIsSidebarOpen(true)}
            aria-label="Mở menu"
          >
            <span className="material-symbols-outlined text-on-surface-variant">
              menu
            </span>
          </button>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">
              electric_car
            </span>
            <h1 className="font-headline-lg-mobile text-headline-lg-mobile font-bold text-primary">
              Servio
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            className="rounded-full p-2 transition-colors hover:bg-surface-container-low active:opacity-70"
            type="button"
            aria-label="Tìm kiếm"
          >
            <span className="material-symbols-outlined text-on-surface-variant">
              search
            </span>
          </button>
          <button
            className="rounded-full p-2 transition-colors hover:bg-surface-container-low active:opacity-70"
            type="button"
            aria-label="Tài khoản"
          >
            <span className="material-symbols-outlined text-on-surface-variant">
              account_circle
            </span>
          </button>
        </div>
      </header>

      <main className="mx-auto mt-16 w-full max-w-[448px]">
        <section className="relative h-64 w-full overflow-hidden bg-surface-container">
          <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/60 to-transparent" />
          <img
            className="h-full w-full object-cover"
            src={heroImage}
            alt="VinFast VF8 trong trung tâm dịch vụ"
          />
          <div className="absolute bottom-4 left-margin-mobile z-20">
            <span className="mb-2 inline-block rounded-full bg-primary px-2 py-1 font-label-md text-label-md text-on-primary">
              30A - 123.45
            </span>
            <h2 className="font-headline-lg text-headline-lg text-white">
              VinFast VF8 Plus
            </h2>
            <p className="font-body-md text-body-md text-white/80">
              Bảo dưỡng định kỳ 20.000km
            </p>
          </div>
        </section>

        <section className="px-margin-mobile py-lg">
          <div className="mb-lg rounded-xl border border-outline-variant bg-surface-container-lowest p-md shadow-sm">
            <div className="mb-sm flex items-center justify-between">
              <span className="font-label-md text-label-md text-on-surface-variant">
                TRẠNG THÁI HIỆN TẠI
              </span>
              <span className="flex items-center gap-1 font-label-md text-label-md text-primary">
                <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
                Đang thực hiện
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary-container p-2">
                <span className="material-symbols-outlined text-on-primary-container">
                  build
                </span>
              </div>
              <div>
                <h3 className="font-headline-md text-headline-md text-on-surface">
                  Đang sửa chữa
                </h3>
                <p className="font-body-md text-body-md text-on-surface-variant">
                  Kỹ thuật viên: Nguyễn Văn An
                </p>
              </div>
            </div>
          </div>

          <div className="relative space-y-8 pl-8">
            <div className="absolute left-[11px] top-6 z-0 h-full w-0.5 bg-outline-variant" />
            <TimelineItem done title="Tiếp nhận" description="08:30 - 24/10/2023" />
            <TimelineItem done title="Kiểm tra" description="09:15 - 24/10/2023" />

            <div className="relative flex items-start gap-4">
              <div className="absolute -left-8 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-primary before:absolute before:h-10 before:w-10 before:animate-ping before:rounded-full before:bg-primary/20">
                <div className="h-2 w-2 rounded-full bg-white" />
              </div>
              <div>
                <h4 className="font-headline-md text-headline-md text-primary">
                  Đang sửa chữa
                </h4>
                <p className="font-body-md text-body-md text-on-surface-variant">
                  Bắt đầu lúc 10:00. Đang thay dầu và kiểm tra hệ thống phanh.
                </p>
                <div className="mt-md grid grid-cols-2 gap-sm">
                  <ProgressImage src={brakeImage} alt="Kiểm tra hệ thống phanh" />
                  <ProgressImage src={oilImage} alt="Lọc dầu mới" />
                </div>
              </div>
            </div>

            <TimelineItem
              muted
              title="Kiểm tra chất lượng"
              description="Dự kiến: 15:30"
            />
            <TimelineItem muted title="Hoàn thành" description="Sẵn sàng bàn giao" />
          </div>
        </section>
      </main>

      <div className="fixed bottom-6 left-0 right-0 z-40 px-margin-mobile">
        <div className="flex items-center justify-between rounded-xl bg-primary p-md text-on-primary shadow-lg">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-white/20 p-2">
              <span className="material-symbols-outlined text-white">schedule</span>
            </div>
            <div>
              <p className="font-label-sm text-label-sm uppercase tracking-wider text-white/80">
                Thời gian dự kiến xong
              </p>
              <p className="font-headline-md text-headline-md text-white">
                Hôm nay, 16:30
              </p>
            </div>
          </div>
          <button
            className="rounded-lg bg-white px-4 py-2 font-label-md text-label-md text-primary transition-transform active:scale-95"
            type="button"
          >
            Chi tiết
          </button>
        </div>
      </div>
    </div>
  );
}

function TimelineItem({
  title,
  description,
  done = false,
  muted = false,
}: {
  title: string;
  description: string;
  done?: boolean;
  muted?: boolean;
}) {
  return (
    <div className={`relative flex items-start gap-4 ${muted ? "opacity-50" : ""}`}>
      <div
        className={`absolute -left-8 z-10 flex h-6 w-6 items-center justify-center rounded-full ${
          done
            ? "bg-tertiary"
            : "border border-outline-variant bg-surface-container-highest"
        }`}
      >
        {done && (
          <span className="material-symbols-outlined text-[16px] text-on-tertiary">
            check
          </span>
        )}
      </div>
      <div>
        <h4 className="font-headline-md text-headline-md text-on-surface">
          {title}
        </h4>
        <p className="font-body-md text-body-md text-on-surface-variant">
          {description}
        </p>
      </div>
    </div>
  );
}

function ProgressImage({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="aspect-video overflow-hidden rounded-lg border border-outline-variant bg-surface-container">
      <img className="h-full w-full object-cover" src={src} alt={alt} />
    </div>
  );
}

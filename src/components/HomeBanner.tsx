import { useEffect, useRef, useState } from "react";

export type HomeBannerSlide = {
  eyebrow: string;
  title: string;
  body: string;
  cta: string;
  image: string;
  imageAlt: string;
  bg: string;
  fg: string;
  sub: string;
  ctaBg: string;
  ctaFg: string;
  onClick?: () => void;
};

const AUTOPLAY_MS = 6000;
const SWIPE_PX = 40;

// Banner trượt dạng "peek": thẻ giữa to và nổi, hai thẻ bên thu nhỏ và lộ một phần ở mép.
export default function HomeBanner({ slides }: { slides: HomeBannerSlide[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const n = slides.length;

  const go = (next: number) => setIndex(((next % n) + n) % n);

  useEffect(() => {
    if (n < 2 || paused) return;
    const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) return;
    const timer = window.setInterval(() => setIndex((i) => (i + 1) % n), AUTOPLAY_MS);
    return () => window.clearInterval(timer);
  }, [n, paused]);

  if (n === 0) return null;

  return (
    <section
      aria-label="Dịch vụ và ưu đãi nổi bật"
      aria-roledescription="carousel"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <div
        className="relative h-[15.5rem] overflow-hidden md:h-[16rem]"
        onTouchStart={(e) => {
          touchStartX.current = e.touches[0].clientX;
          setPaused(true);
        }}
        onTouchEnd={(e) => {
          const start = touchStartX.current;
          touchStartX.current = null;
          setPaused(false);
          if (start === null) return;
          const dx = e.changedTouches[0].clientX - start;
          if (dx <= -SWIPE_PX) go(index + 1);
          if (dx >= SWIPE_PX) go(index - 1);
        }}
      >
        {slides.map((slide, i) => {
          let off = (i - index + n) % n;
          if (off > n / 2) off -= n;
          const center = off === 0;
          const visible = Math.abs(off) <= 1;
          return (
            <div
              key={slide.title}
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} trên ${n}: ${slide.title}`}
              aria-hidden={!center}
              inert={!center}
              onClick={center ? undefined : () => go(i)}
              className={`absolute left-1/2 top-1/2 flex h-[14.5rem] w-[88%] overflow-hidden rounded-[22px] transition-all duration-500 ease-out motion-reduce:transition-none md:h-[15rem] md:w-[44rem] ${
                center
                  ? "z-[2] shadow-[0_22px_40px_-18px_rgba(11,40,90,0.55)]"
                  : "z-[1] cursor-pointer opacity-90"
              } ${visible ? "" : "pointer-events-none opacity-0"}`}
              style={{
                background: slide.bg,
                transform: `translate(calc(-50% + ${off * 100}%), -50%) scale(${center ? 1 : 0.84})`,
              }}
            >
              <div className="relative z-[1] flex min-w-0 flex-1 flex-col justify-center gap-2 py-5 pl-5 pr-2 md:pl-7">
                <p className="text-xs font-bold tracking-wide md:text-[13px]" style={{ color: slide.sub }}>
                  {slide.eyebrow}
                </p>
                <p className="text-[22px] font-extrabold leading-tight md:text-[28px]" style={{ color: slide.fg }}>
                  {slide.title}
                </p>
                <p className="line-clamp-2 text-[13px] leading-snug md:text-sm" style={{ color: slide.sub }}>
                  {slide.body}
                </p>
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={slide.onClick}
                    className="min-h-11 rounded-xl px-5 text-sm font-bold transition-all active:scale-95"
                    style={{ background: slide.ctaBg, color: slide.ctaFg }}
                  >
                    {slide.cta}
                  </button>
                </div>
              </div>
              <div className="relative w-[38%] shrink-0 md:w-[17rem]">
                <img
                  src={slide.image}
                  alt={slide.imageAlt}
                  loading={i === 0 ? "eager" : "lazy"}
                  className="h-full w-full object-cover"
                />
                <div
                  aria-hidden="true"
                  className="absolute inset-0"
                  style={{ background: `linear-gradient(90deg, ${slide.bg} 0%, transparent 40%)` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {n > 1 && (
        <div className="mt-2 flex items-center justify-between gap-3">
          <div className="flex items-center gap-1">
            {slides.map((slide, i) => (
              <button
                key={slide.title}
                type="button"
                aria-label={`Xem thẻ ${i + 1}: ${slide.title}`}
                aria-current={i === index}
                onClick={() => go(i)}
                className="flex h-11 items-center justify-center px-1"
              >
                <span
                  aria-hidden="true"
                  className={`block h-2.5 rounded-full transition-all ${
                    i === index ? "w-7 bg-primary" : "w-2.5 bg-outline-variant"
                  }`}
                />
              </button>
            ))}
          </div>
          <div className="flex gap-2.5">
            <button
              type="button"
              aria-label="Thẻ trước"
              onClick={() => go(index - 1)}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-outline-variant bg-surface-container-lowest text-on-surface hover:bg-surface-container-high"
            >
              <span aria-hidden="true" className="material-symbols-outlined">chevron_left</span>
            </button>
            <button
              type="button"
              aria-label="Thẻ sau"
              onClick={() => go(index + 1)}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-outline-variant bg-surface-container-lowest text-on-surface hover:bg-surface-container-high"
            >
              <span aria-hidden="true" className="material-symbols-outlined">chevron_right</span>
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

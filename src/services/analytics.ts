// Google Analytics 4: đo lượt truy cập và số người đăng ký theo nguồn (Facebook, TikTok...).
// Mã đo lường lấy từ biến môi trường VITE_GA_MEASUREMENT_ID (dạng G-XXXXXXXXXX) nếu có. Bản chạy thật (build production)
// mà không đặt biến thì dùng mã mặc định bên dưới (mã đo lường là thông tin công khai, không phải bí mật).
// Khi chạy dev trên máy (npm run dev) không có biến thì mọi hàm ở đây không làm gì, để khỏi lẫn số liệu thử vào GA.
const DEFAULT_MEASUREMENT_ID = "G-S9ELHHEM2K";
const MEASUREMENT_ID =
  (import.meta.env.VITE_GA_MEASUREMENT_ID as string | undefined)?.trim() ||
  (import.meta.env.PROD ? DEFAULT_MEASUREMENT_ID : undefined);

const ACQUISITION_KEY = "servio_acquisition";
const ACQUISITION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

export type Acquisition = {
  source: string; // facebook, tiktok, google, direct...
  medium: string; // social, cpc, referral, none...
  campaign?: string;
  content?: string;
  at: number;
};

const SOCIAL_REFERRERS: Array<[RegExp, string]> = [
  [/(^|\.)(facebook|fb|messenger)\.com$|(^|\.)fb\.me$|(^|\.)lm\.facebook\.com$/, "facebook"],
  [/(^|\.)tiktok\.com$|(^|\.)tiktokv\.com$/, "tiktok"],
  [/(^|\.)instagram\.com$/, "instagram"],
  [/(^|\.)zalo\.me$/, "zalo"],
  [/(^|\.)youtube\.com$|(^|\.)youtu\.be$/, "youtube"],
];

function referrerSource(referrer: string): string | null {
  try {
    const host = new URL(referrer).hostname.toLowerCase();
    if (host === window.location.hostname) return null;
    for (const [pattern, name] of SOCIAL_REFERRERS) {
      if (pattern.test(host)) return name;
    }
    return host.replace(/^www\./, "");
  } catch {
    return null;
  }
}

// Mở link từ app Facebook / TikTok thường không có referrer, nên nhận diện qua trình duyệt nhúng trong app.
function inAppBrowserSource(userAgent: string): string | null {
  if (/FBAN|FBAV|FB_IAB|FBIOS/i.test(userAgent)) return "facebook";
  if (/musical_ly|BytedanceWebview|TikTok|ttwebview/i.test(userAgent)) return "tiktok";
  if (/Instagram/i.test(userAgent)) return "instagram";
  if (/Zalo/i.test(userAgent)) return "zalo";
  return null;
}

// Nguồn của lượt truy cập hiện tại: tham số utm_* > trang giới thiệu > trình duyệt nhúng trong app > truy cập trực tiếp.
export function detectAcquisition(
  search: string = window.location.search,
  referrer: string = document.referrer,
  userAgent: string = navigator.userAgent,
): Acquisition & { hasUtm: boolean } {
  const params = new URLSearchParams(search);
  const utmSource = params.get("utm_source")?.trim().toLowerCase();
  if (utmSource) {
    return {
      source: utmSource,
      medium: params.get("utm_medium")?.trim().toLowerCase() || "referral",
      campaign: params.get("utm_campaign")?.trim() || undefined,
      content: params.get("utm_content")?.trim() || undefined,
      at: Date.now(),
      hasUtm: true,
    };
  }
  const fromReferrer = referrer ? referrerSource(referrer) : null;
  if (fromReferrer) {
    const social = SOCIAL_REFERRERS.some(([, name]) => name === fromReferrer);
    return { source: fromReferrer, medium: social ? "social" : "referral", at: Date.now(), hasUtm: false };
  }
  const inApp = inAppBrowserSource(userAgent);
  if (inApp) return { source: inApp, medium: "social", at: Date.now(), hasUtm: false };
  return { source: "direct", medium: "none", at: Date.now(), hasUtm: false };
}

function readStoredAcquisition(): Acquisition | null {
  try {
    const raw = localStorage.getItem(ACQUISITION_KEY);
    if (!raw) return null;
    const stored = JSON.parse(raw) as Acquisition;
    return Date.now() - stored.at < ACQUISITION_TTL_MS ? stored : null;
  } catch {
    return null;
  }
}

// Nguồn đầu tiên khách đến từ (giữ 30 ngày). Lượt trực tiếp về sau không ghi đè nguồn mạng xã hội đã lưu.
export function getAcquisition(): Acquisition {
  return readStoredAcquisition() ?? { source: "direct", medium: "none", at: Date.now() };
}

function rememberAcquisition(current: Acquisition & { hasUtm: boolean }) {
  const stored = readStoredAcquisition();
  if (current.source === "direct" && stored) return;
  if (stored && !current.hasUtm && stored.source !== "direct") return;
  try {
    const { hasUtm, ...toStore } = current;
    void hasUtm;
    localStorage.setItem(ACQUISITION_KEY, JSON.stringify(toStore));
  } catch {
    // trình duyệt chặn lưu trữ thì bỏ qua
  }
}

function gtag(..._args: unknown[]) {
  void _args;
  // gtag.js chỉ nhận đối tượng `arguments`, không nhận mảng.
  // eslint-disable-next-line prefer-rest-params
  window.dataLayer?.push(arguments);
}

let started = false;

export function initAnalytics() {
  if (started || typeof window === "undefined") return;
  started = true;

  // Nguồn khách đến được ghi nhớ kể cả khi chưa có mã GA, vì nó còn được gửi kèm lúc đăng ký để Super Admin xem.
  const current = detectAcquisition();
  rememberAcquisition(current);
  if (!MEASUREMENT_ID) return;

  window.dataLayer = window.dataLayer || [];
  window.gtag = gtag;
  gtag("js", new Date());
  // Không có utm_* trong link nhưng nhận ra nguồn (referrer / app Facebook, TikTok): báo cho GA để báo cáo đúng nguồn.
  const override =
    !current.hasUtm && current.source !== "direct"
      ? { campaign_source: current.source, campaign_medium: current.medium }
      : {};
  gtag("config", MEASUREMENT_ID, { send_page_view: false, ...override });

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(MEASUREMENT_ID)}`;
  document.head.appendChild(script);
}

let lastTrackedPath: string | null = null;

export function trackPageView(path: string) {
  if (!MEASUREMENT_ID || !window.gtag) return;
  // Bỏ qua lần gửi trùng liên tiếp cùng một đường dẫn (React StrictMode chạy effect hai lần ở môi trường dev).
  if (path === lastTrackedPath) return;
  lastTrackedPath = path;
  window.gtag("event", "page_view", {
    page_path: path,
    page_location: window.location.origin + path + window.location.search,
    page_title: document.title,
  });
}

export function trackEvent(name: string, params: Record<string, unknown> = {}) {
  if (!MEASUREMENT_ID || !window.gtag) return;
  window.gtag("event", name, params);
}

// Đăng ký thành công: kèm nguồn đầu tiên (acquisition_*) để so sánh Facebook / TikTok trong báo cáo.
export function trackSignUp(method = "email") {
  const acquisition = getAcquisition();
  trackEvent("sign_up", {
    method,
    acquisition_source: acquisition.source,
    acquisition_medium: acquisition.medium,
    acquisition_campaign: acquisition.campaign,
  });
}

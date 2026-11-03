// Nhãn và màu cho nguồn đăng ký của khách (BE lưu chữ thường: facebook, tiktok, direct, counter...).
export type SourceGroup = "facebook" | "tiktok" | "instagram" | "direct" | "counter" | "other" | "unknown";

type SourceMeta = { label: string; icon: string; tone: string };

export const SOURCE_META: Record<SourceGroup, SourceMeta> = {
  facebook: { label: "Facebook", icon: "thumb_up", tone: "bg-[#d8e2ff] text-[#00419a]" },
  tiktok: { label: "TikTok", icon: "music_note", tone: "bg-[#ffd9e6] text-[#7a0032]" },
  instagram: { label: "Instagram", icon: "photo_camera", tone: "bg-[#f3d9ff] text-[#5b0a7a]" },
  direct: { label: "Trực tiếp", icon: "language", tone: "bg-[#e9eaeb] text-[#3a3f4b]" },
  counter: { label: "Tại quầy", icon: "storefront", tone: "bg-[#ffe4d6] text-[#7a2e00]" },
  other: { label: "Khác", icon: "link", tone: "bg-[#d0f0ff] text-[#005272]" },
  unknown: { label: "Không rõ", icon: "help", tone: "border border-dashed border-outline-variant bg-white text-outline" },
};

// Thứ tự hiển thị các nhóm trong bộ lọc.
export const SOURCE_GROUPS: SourceGroup[] = ["facebook", "tiktok", "instagram", "direct", "counter", "other", "unknown"];

export function sourceGroup(source: string | null | undefined): SourceGroup {
  const value = (source ?? "").trim().toLowerCase();
  if (!value || value === "unknown") return "unknown";
  if (value in SOURCE_META) return value as SourceGroup;
  return "other";
}

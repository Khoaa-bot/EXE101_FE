import { useEffect, useState } from "react";
import {
  getGarageById,
  getMyProfile,
  updateMyGarage,
  uploadGarageImage,
  type Garage,
} from "../../services/api";
import AdminShell, { type AdminNavProps } from "./AdminShell";

export type AdminGaragePageProps = AdminNavProps;

export default function AdminGaragePage(props: AdminGaragePageProps) {
  const [garage, setGarage] = useState<Garage | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [notice, setNotice] = useState("");

  const showNotice = (msg: string) => {
    setNotice(msg);
    window.setTimeout(() => setNotice(""), 3000);
  };

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setLoadError(null);

    getMyProfile()
      .then((profile) => {
        if (cancelled) return null;
        if (!profile.garageId) {
          throw new Error("Tài khoản này chưa được gán garage nào.");
        }
        return getGarageById(profile.garageId);
      })
      .then((g) => {
        if (cancelled || !g) return;
        setGarage(g);
        setName(g.name ?? "");
        setAddress(g.address ?? "");
        setPhone(g.phone ?? "");
        setDescription(g.description ?? "");
        setImageUrl(g.imageUrl ?? "");
      })
      .catch((err) => {
        if (cancelled) return;
        setLoadError(
          err instanceof Error
            ? err.message
            : "Không tải được thông tin garage.",
        );
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const saveGarage = () => {
    if (!name.trim() || !address.trim()) {
      showNotice("Vui lòng nhập tên và địa chỉ garage!");
      return;
    }
    setIsSaving(true);
    updateMyGarage({ name, address, phone, description, imageUrl })
      .then((updated) => {
        setGarage(updated);
        showNotice("Đã cập nhật thông tin garage thành công!");
      })
      .catch((err) => {
        showNotice(
          err instanceof Error
            ? err.message
            : "Không thể cập nhật thông tin garage.",
        );
      })
      .finally(() => setIsSaving(false));
  };

  const handleImageFile = (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    setIsUploadingImage(true);
    uploadGarageImage(file)
      .then((updated) => {
        setGarage(updated);
        setImageUrl(updated.imageUrl ?? "");
        showNotice("Đã tải ảnh garage lên thành công!");
      })
      .catch((err) => {
        showNotice(
          err instanceof Error ? err.message : "Tải ảnh lên không thành công.",
        );
      })
      .finally(() => setIsUploadingImage(false));
  };

  return (
    <AdminShell
      activeTab="garage"
      title="Thông tin garage"
      description="Thông tin hiển thị cho khách hàng trên ứng dụng và bản đồ tìm kiếm."
      garageName={garage?.name}
      notice={notice}
      maxWidthClass="max-w-4xl"
      {...props}
    >
      {isLoading && (
        <div className="flex items-center gap-2 py-8 text-body-sm text-on-surface-variant">
          <span className="material-symbols-outlined animate-spin text-primary">sync</span>
          <span>Đang tải thông tin garage...</span>
        </div>
      )}

      {!isLoading && loadError && (
        <div className="rounded-xl border border-error/30 bg-error-container/10 p-4 text-body-sm text-error">
          {loadError}
        </div>
      )}

      {!isLoading && !loadError && garage && (
        <div className="rounded-2xl border border-outline-variant/40 bg-surface-container-lowest p-6 shadow-[0_10px_26px_-14px_rgba(25,28,29,0.28)] sm:p-8">
          {imageUrl && (
            <div className="mb-6 overflow-hidden rounded-2xl border border-outline-variant/60 shadow-sm">
              <img
                src={imageUrl}
                alt="Xem trước ảnh garage"
                className="h-56 w-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label
                htmlFor="garage-name-input"
                className="mb-1 block text-xs font-semibold text-on-surface-variant"
              >
                Tên garage *
              </label>
              <input
                id="garage-name-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-outline-variant bg-surface-container-low px-3.5 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>

            <div>
              <label
                htmlFor="garage-address-input"
                className="mb-1 block text-xs font-semibold text-on-surface-variant"
              >
                Địa chỉ *
              </label>
              <input
                id="garage-address-input"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full rounded-xl border border-outline-variant bg-surface-container-low px-3.5 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>

            <div>
              <label
                htmlFor="garage-phone-input"
                className="mb-1 block text-xs font-semibold text-on-surface-variant"
              >
                Số điện thoại liên hệ
              </label>
              <input
                id="garage-phone-input"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-xl border border-outline-variant bg-surface-container-low px-3.5 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-on-surface-variant">
                Hình ảnh garage
              </label>
              <label
                className={`flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-outline-variant/70 bg-surface-container-low/30 p-5 text-center cursor-pointer transition hover:border-primary hover:bg-surface-container-low ${
                  isUploadingImage ? "opacity-50 pointer-events-none" : ""
                }`}
              >
                <span className="material-symbols-outlined text-3xl text-primary">
                  photo_camera
                </span>
                <span className="text-xs font-semibold text-on-surface">
                  {isUploadingImage
                    ? "Đang tải ảnh lên hệ thống..."
                    : "Nhấp để tải ảnh đại diện từ máy tính"}
                </span>
                <span className="text-[11px] text-on-surface-variant">
                  Hỗ trợ định dạng PNG, JPG, WEBP (tối đa 5MB)
                </span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleImageFile(e.target.files)}
                />
              </label>

              <input
                aria-label="Hoặc dán đường dẫn ảnh (URL)..."
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="Hoặc dán trực tiếp đường dẫn ảnh (URL)..."
                className="mt-2.5 w-full rounded-xl border border-outline-variant bg-surface-container-low px-3.5 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>

            <div>
              <label
                htmlFor="garage-desc-input"
                className="mb-1 block text-xs font-semibold text-on-surface-variant"
              >
                Mô tả &amp; giới thiệu garage
              </label>
              <textarea
                id="garage-desc-input"
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Giới thiệu dịch vụ nổi bật, trang thiết bị kỹ thuật, giờ mở cửa..."
                className="w-full rounded-xl border border-outline-variant bg-surface-container-low px-3.5 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={saveGarage}
                disabled={isSaving}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-on-primary transition hover:opacity-90 active:scale-[0.98] disabled:opacity-60"
              >
                <span className="material-symbols-outlined text-lg">
                  {isSaving ? "sync" : "save"}
                </span>
                {isSaving ? "Đang lưu thay đổi..." : "Lưu thông tin garage"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  );
}

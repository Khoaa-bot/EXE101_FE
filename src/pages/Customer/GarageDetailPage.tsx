import { useState } from "react";

type GarageDetailPageProps = {
  onBackClick: () => void;
  onBookingClick: (serviceLevel: string) => void;
};

export default function GarageDetailPage({
  onBackClick,
  onBookingClick,
}: GarageDetailPageProps) {
  const [isFollowing, setIsFollowing] = useState(false);

  const services = [
    {
      level: "Level 1",
      title: "Bảo dưỡng cơ bản",
      description: "Thay dầu máy, lọc dầu, kiểm tra cơ bản.",
      price: "850.000đ",
    },
    {
      level: "Level 2",
      title: "Bảo dưỡng tiêu chuẩn",
      description: "Bảo dưỡng tiêu chuẩn theo mốc km khuyến nghị.",
      price: "1.500.000đ",
    },
    {
      level: "Level 3",
      title: "Bảo dưỡng nâng cao",
      description: "Kiểm tra toàn diện, thay thế phụ tùng theo định kỳ.",
      price: "2.500.000đ",
    },
    {
      level: "Level 4",
      title: "Đại tu (Big Maintenance)",
      description: "Đại tu lớn, xử lý sâu hệ thống động cơ - gầm.",
      price: "6.000.000đ",
    },
    {
      level: "Level 5",
      title: "Dịch vụ theo yêu cầu",
      description: "Dịch vụ theo yêu cầu riêng, báo giá sau kiểm tra.",
      price: "2.000.000đ",
    },
  ];

  const reviews = [
    {
      author: "Nguyễn Văn A",
      rating: 5,
      time: "2 ngày trước",
      content: "Dịch vụ rất tốt, nhân viên nhiệt tình tư vấn. Sẽ quay lại ủng hộ.",
    },
    {
      author: "Trần Thị B",
      rating: 5,
      time: "1 tuần trước",
      content: "Xe được giao đúng hẹn, báo giá minh bạch, không phát sinh.",
    },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 md:px-8">
      {/* Breadcrumbs */}
      <nav className="mb-4 flex items-center gap-2 text-sm text-on-surface-variant">
        <button
          onClick={onBackClick}
          className="hover:text-primary transition-colors cursor-pointer"
        >
          Tìm garage
        </button>
        <span className="material-symbols-outlined text-[16px]">chevron_right</span>
        <span className="text-on-surface font-medium">Servio Central - Quận 1</span>
      </nav>

      {/* Banner */}
      <div className="relative mb-6 h-64 w-full overflow-hidden rounded-2xl bg-black md:h-80 shadow-md">
        <img
          src="https://images.unsplash.com/photo-1617788138017-80ad40651399?auto=format&fit=crop&q=80&w=1200"
          alt="Servio Central - Quận 1"
          className="h-full w-full object-cover opacity-80"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
        
        <div className="absolute bottom-6 left-6 right-6 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div className="text-white">
            <h1 className="text-2xl font-bold md:text-3xl">Servio Central - Quận 1</h1>
            <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-gray-300">
              <div className="flex items-center gap-1 font-medium text-orange-400">
                <span className="material-symbols-outlined text-[16px]">star</span>
                4.9 <span className="text-gray-400">(1204+ reviews)</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px]">location_on</span>
                0.4 km
              </div>
              <div className="flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px]">schedule</span>
                08:00 - 18:00
              </div>
            </div>
          </div>

          <button
            onClick={() => setIsFollowing(!isFollowing)}
            className={`flex items-center gap-2 rounded-full px-5 py-2 text-sm font-medium transition-colors ${
              isFollowing
                ? "bg-primary text-white"
                : "bg-white/20 text-white hover:bg-white/30 backdrop-blur-sm"
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">
              {isFollowing ? "favorite" : "favorite_border"}
            </span>
            {isFollowing ? "Đang theo dõi" : "Theo dõi"}
          </button>
        </div>
      </div>

      {/* Main Content Columns */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column: Services list */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-bold text-on-surface mb-2">Dịch vụ cung cấp</h2>
          
          <div className="space-y-3">
            {services.map((service) => (
              <div
                key={service.level}
                className="flex flex-col justify-between gap-4 rounded-xl border border-outline-variant bg-white p-5 sm:flex-row sm:items-center transition-shadow hover:shadow-sm"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-primary">{service.level}</span>
                    <span className="text-gray-300">•</span>
                    <h3 className="text-base font-bold text-on-surface">{service.title}</h3>
                  </div>
                  <p className="mt-1 text-sm text-on-surface-variant">
                    {service.description}
                  </p>
                </div>

                <div className="flex items-center justify-between gap-4 sm:justify-end shrink-0">
                  <div className="text-left sm:text-right">
                    <span className="block text-[10px] text-on-surface-variant uppercase tracking-wider">Giá từ</span>
                    <span className="text-base font-bold text-primary">{service.price}</span>
                  </div>
                  <button
                    onClick={() => onBookingClick(service.level)}
                    className="rounded-lg bg-primary px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
                  >
                    Đặt lịch
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: About and Reviews */}
        <div className="space-y-6">
          {/* About us */}
          <div className="rounded-xl border border-outline-variant bg-white p-5 shadow-sm">
            <h2 className="text-base font-bold text-on-surface mb-3">Về chúng tôi</h2>
            <p className="text-sm text-on-surface-variant leading-relaxed">
              Servio Central - Quận 1 là một trong những trung tâm chăm sóc xe hàng đầu tại 123 Lê Lợi, P. Bến Thành, Q.1, với trang thiết bị hiện đại và đội ngũ kỹ thuật viên nhiều năm kinh nghiệm, đảm bảo mang lại sự an tâm tuyệt đối cho khách hàng.
            </p>
            
            <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm text-on-surface-variant border-t border-gray-100 pt-4">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[18px] text-blue-500">check_circle</span>
                Chính hãng
              </div>
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[18px] text-blue-500">schedule</span>
                Hỗ trợ 24/7
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <span className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600">Bảo dưỡng</span>
              <span className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600">Sửa chữa</span>
              <span className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600">Đồng sơn</span>
              <span className="rounded bg-green-100 px-2 py-0.5 text-xs text-green-700 font-medium">Giảm 20% thay dầu</span>
            </div>
          </div>

          {/* Rating */}
          <div className="rounded-xl border border-outline-variant bg-white p-5 shadow-sm">
            <h2 className="text-base font-bold text-on-surface mb-3">Đánh giá</h2>
            
            <div className="flex items-center gap-4 mb-4">
              <div className="text-3xl font-bold text-on-surface">4.9</div>
              <div>
                <div className="flex text-orange-400">
                  <span className="material-symbols-outlined text-[18px] fill-current">star</span>
                  <span className="material-symbols-outlined text-[18px] fill-current">star</span>
                  <span className="material-symbols-outlined text-[18px] fill-current">star</span>
                  <span className="material-symbols-outlined text-[18px] fill-current">star</span>
                  <span className="material-symbols-outlined text-[18px] fill-current">star</span>
                </div>
                <div className="text-xs text-on-surface-variant mt-0.5">1204 đánh giá</div>
              </div>
            </div>

            {/* Rating distribution */}
            <div className="space-y-1.5 border-b border-gray-100 pb-4 mb-4">
              <div className="flex items-center gap-3 text-xs">
                <span className="w-3 text-right">5</span>
                <div className="h-2 flex-1 rounded-full bg-gray-100 overflow-hidden">
                  <div className="h-full w-[90%] rounded-full bg-primary" />
                </div>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="w-3 text-right">4</span>
                <div className="h-2 flex-1 rounded-full bg-gray-100 overflow-hidden">
                  <div className="h-full w-[8%] rounded-full bg-primary" />
                </div>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="w-3 text-right">3</span>
                <div className="h-2 flex-1 rounded-full bg-gray-100 overflow-hidden">
                  <div className="h-full w-[2%] rounded-full bg-primary" />
                </div>
              </div>
            </div>

            {/* Review comments list */}
            <div className="space-y-4">
              {reviews.map((review, i) => (
                <div key={i} className="text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-on-surface">{review.author}</span>
                    <span className="text-xs text-on-surface-variant">{review.time}</span>
                  </div>
                  <div className="flex text-orange-400 my-1">
                    {Array.from({ length: review.rating }).map((_, idx) => (
                      <span key={idx} className="material-symbols-outlined text-[14px] fill-current">star</span>
                    ))}
                  </div>
                  <p className="text-on-surface-variant leading-relaxed">
                    {review.content}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useState } from "react";

type FindGaragePageProps = {
  onBookingClick: (garageId: string) => void;
};

const garages = [
  {
    id: "g1",
    name: "Servio Central - Quận 1",
    address: "123 Lê Lợi, P. Bến Thành, Q.1",
    rating: 4.9,
    reviews: 1204,
    distance: "0.4 km",
    time: "08:00 - 18:00",
    tags: ["Bảo dưỡng", "Sửa chữa", "Đồng sơn"],
    promo: "Giảm 20% thay dầu",
  },
  {
    id: "g2",
    name: "Servio Auto - Quận 7",
    address: "45 Nguyễn Thị Thập, Q.7",
    rating: 4.7,
    reviews: 861,
    distance: "3.2 km",
    time: "08:00 - 19:00",
    tags: ["Bảo dưỡng", "Lốp & Phanh"],
  },
  {
    id: "g3",
    name: "Servio Bình Thạnh",
    address: "88 Điện Biên Phủ, Q. Bình Thạnh",
    rating: 4.6,
    reviews: 542,
    distance: "5.8 km",
    time: "07:30 - 18:30",
    tags: ["Bảo dưỡng", "Điện - Điều hòa"],
    promo: "Rửa xe miễn phí",
  },
];

export default function FindGaragePage({ onBookingClick }: FindGaragePageProps) {
  const [activeFilter, setActiveFilter] = useState<"near" | "rating">("near");

  return (
    <div className="mx-auto max-w-7xl p-6 md:p-8">
      <div className="mb-6">
        <h2 className="mb-1 text-2xl font-bold text-on-surface">Garage gần bạn</h2>
        <p className="text-on-surface-variant">
          Chọn garage bạn muốn bảo dưỡng hoặc sửa chữa xe, rồi đặt lịch ngay.
        </p>
      </div>

      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center">
        <div className="relative w-full md:w-80 lg:w-96">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">
            search
          </span>
          <input
            className="w-full rounded-full border border-outline-variant bg-surface-container-low py-2.5 pl-10 pr-4 text-sm outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary"
            placeholder="Tìm garage, khu vực, dịch vụ..."
            type="text"
          />
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={() => setActiveFilter("near")}
            className={`rounded-full px-5 py-2 text-sm font-medium transition-colors ${
              activeFilter === "near"
                ? "bg-primary text-white"
                : "border border-outline-variant bg-surface text-on-surface hover:bg-surface-container"
            }`}
          >
            Gần nhất
          </button>
          <button
            onClick={() => setActiveFilter("rating")}
            className={`rounded-full px-5 py-2 text-sm font-medium transition-colors ${
              activeFilter === "rating"
                ? "bg-primary text-white"
                : "border border-outline-variant bg-surface text-on-surface hover:bg-surface-container"
            }`}
          >
            Đánh giá cao
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {garages.map((garage) => (
          <div
            key={garage.id}
            className="flex flex-col justify-between rounded-xl border border-outline-variant bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
          >
            <div>
              <div className="flex items-start justify-between">
                <div className="flex gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-primary">
                    <span className="material-symbols-outlined text-2xl">
                      build
                    </span>
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-on-surface">
                      {garage.name}
                    </h3>
                    <div className="mt-1 flex items-center gap-1 text-sm text-on-surface-variant">
                      <span className="material-symbols-outlined text-[16px]">
                        location_on
                      </span>
                      {garage.address}
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-on-surface-variant">
                      <div className="flex items-center gap-1 font-medium text-orange-500">
                        <span className="material-symbols-outlined text-[16px]">
                          star
                        </span>
                        {garage.rating}{" "}
                        <span className="text-on-surface-variant font-normal">
                          ({garage.reviews})
                        </span>
                      </div>
                      <div>{garage.distance}</div>
                      <div className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[16px]">
                          schedule
                        </span>
                        {garage.time}
                      </div>
                    </div>
                  </div>
                </div>
                <button className="text-outline transition-colors hover:text-red-500">
                  <span className="material-symbols-outlined">favorite_border</span>
                </button>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {garage.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-md bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700"
                  >
                    {tag}
                  </span>
                ))}
                {garage.promo && (
                  <span className="rounded-md bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700">
                    {garage.promo}
                  </span>
                )}
              </div>
            </div>

            <button
              onClick={() => onBookingClick(garage.id)}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
            >
              Chọn garage này
              <span className="material-symbols-outlined text-[18px]">
                arrow_forward
              </span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

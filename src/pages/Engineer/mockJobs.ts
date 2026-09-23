// Dữ liệu mẫu dùng cho các trang Engineer chưa có API backing
// (Lịch làm việc theo tuần, danh sách khách hàng gộp theo job).
// Trang Tổng quan / Lịch hẹn / Chi tiết công việc dùng dữ liệu thật — xem
// getEngineerDashboard/getEngineerAppointmentDetail trong services/api.ts.
export type JobStatus = "pending" | "accepted" | "in_progress" | "done";

export type JobItem = {
  id: string;
  service: string;
  time: string;
  date: string;
  vehicle: {
    model: string;
    plate: string;
    color: string;
    vin: string;
    image: string;
  };
  customer: {
    name: string;
    phone: string;
  };
  status: JobStatus;
  icon: "wrench" | "alert" | "battery";
  assignee: string;
};

export const INITIAL_JOBS: JobItem[] = [
  {
    id: "JOB-101",
    service: "Bảo dưỡng định kỳ & Kiểm tra pin 10.000km",
    time: "09:00 AM",
    date: "15/11/2023",
    vehicle: {
      model: "VinFast VF8",
      plate: "51H-123.45",
      color: "Trắng Ngọc Trai",
      vin: "VF8EV2023-99812",
      image: "https://images.unsplash.com/photo-1563720223185-11003d516935?w=500&auto=format&fit=crop&q=60",
    },
    customer: {
      name: "Nguyễn Văn Minh",
      phone: "091 234 5678",
    },
    status: "in_progress",
    icon: "battery",
    assignee: "Trần Quốc Toản",
  },
  {
    id: "JOB-102",
    service: "Thay bộ má phanh đĩa cao cấp",
    time: "11:30 AM",
    date: "15/11/2023",
    vehicle: {
      model: "Mazda CX-5",
      plate: "30E-678.90",
      color: "Đỏ Crystal",
      vin: "MZCX52022-77123",
      image: "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=500&auto=format&fit=crop&q=60",
    },
    customer: {
      name: "Trần Hoàng Nam",
      phone: "098 765 4321",
    },
    status: "accepted",
    icon: "wrench",
    assignee: "Trần Quốc Toản",
  },
  {
    id: "JOB-103",
    service: "Kiểm tra & Sửa chữa hệ thống điều hòa",
    time: "02:00 PM",
    date: "15/11/2023",
    vehicle: {
      model: "VinFast VF9",
      plate: "51A-111.11",
      color: "Đen Nham Thạch",
      vin: "VF9EV2023-11002",
      image: "https://images.unsplash.com/photo-1617788138017-80ad40651399?w=500&auto=format&fit=crop&q=60",
    },
    customer: {
      name: "Lê Thanh Tâm",
      phone: "090 112 2334",
    },
    status: "pending",
    icon: "alert",
    assignee: "Trần Quốc Toản",
  },
];

export const TECHNICIANS_LIST = [
  "Trần Quốc Toản",
  "Nguyễn Mỹ Linh",
  "Đặng Hữu Tài",
  "Phạm Văn Hùng",
];

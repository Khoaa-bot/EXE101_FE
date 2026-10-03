import { useCallback, useEffect, useState } from "react";
import { getStoredAuthSession } from "./services/api";
import AppShell from "./components/AppShell";
import AddVehiclePage from "./pages/Customer/AddVehiclePage";
import AdminDashboardPage from "./pages/Admin/AdminDashboardPage";
import AdminCustomersPage from "./pages/Admin/AdminCustomersPage";
import AdminEngineersPage from "./pages/Admin/AdminEngineersPage";
import AdminInventoryPage from "./pages/Admin/AdminInventoryPage";
import AdminPricingPage from "./pages/Admin/AdminPricingPage";
import AdminGaragePage from "./pages/Admin/AdminGaragePage";
import SuperAdminDashboardPage from "./pages/SuperAdmin/SuperAdminDashboardPage";
import AdminCustomerDetailPage, {
  type Customer,
} from "./pages/Admin/AdminCustomerDetailPage";
import BookingPage from "./pages/Customer/BookingPage";
import HistoryPage from "./pages/Customer/HistoryPage";
import Home from "./pages/Customer/HomePage";
import LoginPage from "./Auth/pages/LoginPage";
import ForgotPasswordPage from "./Auth/pages/ForgotPasswordPage";
import NotificationsPage from "./pages/Customer/NotificationsPage";
import ProfilePage from "./pages/Customer/ProfilePage";
import RegisterPage from "./Auth/pages/RegisterPage";
import EngineerDashboardPage from "./pages/Engineer/EngineerDashboardPage";
import EngineerSchedulePage from "./pages/Engineer/EngineerSchedulePage";
import EngineerAppointmentsPage from "./pages/Engineer/EngineerAppointmentsPage";
import EngineerTechniciansPage from "./pages/Engineer/EngineerTechniciansPage";
import EngineerCustomersPage from "./pages/Engineer/EngineerCustomersPage";
import EngineerJobDetailPage from "./pages/Engineer/EngineerJobDetailPage";
import EngineerSettingsPage from "./pages/Engineer/EngineerSettingsPage";
import TrackingPage from "./pages/Customer/TrackingPage";
import FindGaragePage from "./pages/Customer/FindGaragePage";
import GarageDetailPage from "./pages/Customer/GarageDetailPage";
import PaymentResultPage from "./pages/Customer/PaymentResultPage";
import ReceptionDashboardPage from "./pages/Reception/ReceptionDashboardPage";
import ReceptionSchedulePage from "./pages/Reception/ReceptionSchedulePage";
import ReceptionAppointmentsPage from "./pages/Reception/ReceptionAppointmentsPage";
import ReceptionAppointmentDetailPage from "./pages/Reception/ReceptionAppointmentDetailPage";
import ReceptionNewAppointmentPage from "./pages/Reception/ReceptionNewAppointmentPage";
import ReceptionCustomersPage from "./pages/Reception/ReceptionCustomersPage";

const normalizePath = (path: string) => {
  const normalized = path.replace(/\/+$/, "");
  return normalized || "/";
};

const appRoutes = new Set([
  "/home",
  "/history",
  "/notifications",
  "/tracking",
  "/profile",
  "/add-vehicle",
  "/booking",
  "/find-garage",
  "/garage-detail",
  "/payment-result",
  "/admin",
  "/admin/customers",
  "/admin/engineers",
  "/admin/inventory",
  "/admin/pricing",
  "/admin/garage",
  "/super-admin",
  "/engineer",
  "/engineer/schedule",
  "/engineer/appointments",
  "/engineer/technicians",
  "/engineer/customers",
  "/engineer/job-detail",
  "/engineer/settings",
  "/reception",
  "/reception/schedule",
  "/reception/appointments",
  "/reception/appointments/new",
  "/reception/appointments/detail",
  "/reception/customers",
]);

const publicRoutes = new Set([
  "/",
  "/login",
  "/register",
  "/forgot-password",
  "/preview/customer",
  "/preview/admin",
  "/preview/admin/customers",
  "/preview/admin/engineers",
  "/preview/admin/inventory",
  "/preview/admin/pricing",
  "/preview/engineer",
  "/preview/engineer/schedule",
  "/preview/engineer/appointments",
  "/preview/engineer/technicians",
  "/preview/engineer/customers",
  "/preview/engineer/job-detail",
  "/preview/engineer/settings",
  "/preview/reception",
  "/preview/reception/schedule",
  "/preview/reception/appointments",
  "/preview/reception/appointments/new",
  "/preview/reception/appointments/detail",
  "/preview/reception/customers",
]);

const roleRoutes: Record<string, Set<string>> = {
  // "garage_owner" = admin của 1 garage (trước đây gọi là "admin" bên
  // backend, đã đổi tên). "admin" giờ là Super Admin toàn hệ thống.
  GARAGE_OWNER: new Set([
    "/admin", "/admin/customers", "/admin/engineers", "/admin/inventory", "/admin/pricing", "/admin/garage",
  ]),
  ADMIN: new Set(["/super-admin"]),
  ENGINEER: new Set([
    "/engineer", "/engineer/schedule", "/engineer/appointments",
    "/engineer/technicians", "/engineer/customers", "/engineer/job-detail", "/engineer/settings",
  ]),
  RECEPTION: new Set([
    "/reception", "/reception/schedule", "/reception/appointments",
    "/reception/appointments/new", "/reception/appointments/detail", "/reception/customers",
  ]),
  CUSTOMER: new Set([
    "/home", "/history", "/notifications", "/tracking", "/profile",
    "/add-vehicle", "/booking", "/find-garage", "/garage-detail", "/payment-result",
  ]),
};

const defaultHome: Record<string, string> = {
  GARAGE_OWNER: "/admin",
  ADMIN: "/super-admin",
  ENGINEER: "/engineer",
  RECEPTION: "/reception",
  CUSTOMER: "/home",
};

const getRoutePath = (isAuthenticated: boolean, pathname: string, role: string) => {
  if (!isAuthenticated) {
    return publicRoutes.has(pathname) ? pathname : "/login";
  }

  if (pathname === "/" || pathname === "/login" || pathname === "/register" || pathname === "/forgot-password") {
    return defaultHome[role] || "/home";
  }

  const isDetailRoute =
    pathname.startsWith("/admin/customers/") ||
    pathname.startsWith("/admin/employees/");
  if (!appRoutes.has(pathname) && !isDetailRoute) {
    return defaultHome[role] || "/home";
  }

  const allowed = roleRoutes[role];
  if (allowed && !allowed.has(pathname) && !isDetailRoute) {
    return defaultHome[role] || "/home";
  }

  return pathname;
};

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(
    () => Boolean(localStorage.getItem("auth_session")),
  );
  const [role, setRole] = useState<string>(
    () => getStoredAuthSession()?.role?.toUpperCase() || "CUSTOMER",
  );
  const [pathname, setPathname] = useState(() =>
    normalizePath(window.location.pathname),
  );
  const [selectedGarageId, setSelectedGarageId] = useState<string | null>(null);
  const [selectedServiceId, setSelectedServiceId] = useState<number | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const routePath = getRoutePath(isAuthenticated, pathname, role);

  useEffect(() => {
    const handlePopState = () => {
      setPathname(normalizePath(window.location.pathname));
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const navigate = useCallback((path: string, replace = false) => {
    const nextPath = normalizePath(path);

    if (nextPath === normalizePath(window.location.pathname)) {
      setPathname(nextPath);
      return;
    }

    const method = replace ? "replaceState" : "pushState";
    window.history[method](null, "", nextPath);
    setPathname(nextPath);
    window.scrollTo({ top: 0 });
  }, []);

  useEffect(() => {
    if (routePath !== pathname) {
      window.history.replaceState(null, "", routePath);
    }
  }, [pathname, routePath]);

  const [appointmentId, setAppointmentId] = useState<string>("1");

  const previewAdminProps = {
    onDashboardClick: () => navigate("/preview/admin"),
    onCustomersClick: () => navigate("/preview/admin/customers"),
    onEngineersClick: () => navigate("/preview/admin/engineers"),
    onInventoryClick: () => navigate("/preview/admin/inventory"),
    onPricingClick: () => navigate("/preview/admin/pricing"),
    onLogout: () => navigate("/login"),
  };

  const previewEngineerProps = {
    onDashboardClick: () => navigate("/preview/engineer"),
    onScheduleClick: () => navigate("/preview/engineer/schedule"),
    onAppointmentsClick: () => navigate("/preview/engineer/appointments"),
    onTechniciansClick: () => navigate("/preview/engineer/technicians"),
    onCustomersClick: () => navigate("/preview/engineer/customers"),
    onSettingsClick: () => navigate("/preview/engineer/settings"),
    onJobDetailClick: () => navigate("/preview/engineer/job-detail"),
    onLogout: () => navigate("/login"),
  };

  const previewReceptionProps = {
    onDashboardClick: () => navigate("/preview/reception"),
    onScheduleClick: () => navigate("/preview/reception/schedule"),
    onAppointmentsClick: () => navigate("/preview/reception/appointments"),
    onCustomersClick: () => navigate("/preview/reception/customers"),
    onNewAppointmentClick: () => navigate("/preview/reception/appointments/new"),
    onAppointmentDetailClick: (id: string) => {
      setAppointmentId(id);
      navigate("/preview/reception/appointments/detail");
    },
    onLogout: () => navigate("/login"),
  };

  if (routePath === "/preview/admin") {
    return <AdminDashboardPage {...previewAdminProps} />;
  }

  if (routePath === "/preview/admin/customers") {
    return <AdminCustomersPage {...previewAdminProps} />;
  }

  if (routePath === "/preview/admin/engineers") {
    return <AdminEngineersPage {...previewAdminProps} />;
  }

  if (routePath === "/preview/admin/inventory") {
    return <AdminInventoryPage {...previewAdminProps} />;
  }

  if (routePath === "/preview/admin/pricing") {
    return <AdminPricingPage {...previewAdminProps} />;
  }

  if (routePath === "/preview/engineer") {
    return <EngineerDashboardPage {...previewEngineerProps} />;
  }

  if (routePath === "/preview/engineer/schedule") {
    return <EngineerSchedulePage {...previewEngineerProps} />;
  }

  if (routePath === "/preview/engineer/appointments") {
    return <EngineerAppointmentsPage {...previewEngineerProps} />;
  }

  if (routePath === "/preview/engineer/technicians") {
    return <EngineerTechniciansPage {...previewEngineerProps} />;
  }

  if (routePath === "/preview/engineer/customers") {
    return <EngineerCustomersPage {...previewEngineerProps} />;
  }

  if (routePath === "/preview/engineer/job-detail") {
    return <EngineerJobDetailPage {...previewEngineerProps} />;
  }

  if (routePath === "/preview/engineer/settings") {
    return <EngineerSettingsPage {...previewEngineerProps} />;
  }

  if (routePath === "/preview/reception") {
    return <ReceptionDashboardPage {...previewReceptionProps} />;
  }

  if (routePath === "/preview/reception/schedule") {
    return <ReceptionSchedulePage {...previewReceptionProps} />;
  }

  if (routePath === "/preview/reception/appointments") {
    return <ReceptionAppointmentsPage {...previewReceptionProps} />;
  }

  if (routePath === "/preview/reception/appointments/new") {
    return <ReceptionNewAppointmentPage {...previewReceptionProps} />;
  }

  if (routePath === "/preview/reception/appointments/detail") {
    return (
      <ReceptionAppointmentDetailPage
        appointmentId={appointmentId}
        {...previewReceptionProps}
      />
    );
  }

  if (routePath === "/preview/reception/customers") {
    return <ReceptionCustomersPage {...previewReceptionProps} />;
  }

  if (routePath === "/preview/customer") {
    return (
      <Home
        onBookingClick={() => navigate("/booking")}
        onHistoryClick={() => navigate("/history")}
        onNotificationsClick={() => navigate("/notifications")}
        onTrackingClick={() => navigate("/tracking")}
        onProfileClick={() => navigate("/profile")}
      />
    );
  }

  if (!isAuthenticated) {
    if (routePath === "/register") {
      return <RegisterPage onBackToLogin={() => navigate("/login")} />;
    }

    if (routePath === "/forgot-password") {
      return <ForgotPasswordPage onBackToLogin={() => navigate("/login")} />;
    }

    return (
      <LoginPage
        onForgotPasswordClick={() => navigate("/forgot-password")}
        onLogin={(session) => {
          setIsAuthenticated(true);
          const r = session.role.toUpperCase();
          setRole(r);
          navigate(
            r === "ADMIN"
              ? "/super-admin"
              : r === "GARAGE_OWNER"
                ? "/admin"
                : r === "ENGINEER"
                  ? "/engineer"
                  : r === "RECEPTION"
                    ? "/reception"
                    : "/home",
          );
        }}
        onRegisterClick={() => navigate("/register")}
      />
    );
  }

  const shellProps = {
    onHomeClick: () => navigate("/home"),
    onFindGarageClick: () => navigate("/find-garage"),
    onHistoryClick: () => navigate("/history"),
    onNotificationsClick: () => navigate("/notifications"),
    onProfileClick: () => navigate("/profile"),
    onTrackingClick: () => navigate("/tracking"),
    onLogout: () => {
      localStorage.removeItem("auth_session");
      setIsAuthenticated(false);
      setRole("CUSTOMER");
      navigate("/login", true);
    },
  };

  const adminProps = {
    onDashboardClick: () => navigate("/admin"),
    onCustomersClick: () => navigate("/admin/customers"),
    onEngineersClick: () => navigate("/admin/engineers"),
    onInventoryClick: () => navigate("/admin/inventory"),
    onPricingClick: () => navigate("/admin/pricing"),
    onGarageClick: () => navigate("/admin/garage"),
    onCustomerDetailClick: (customer: Customer) => {
      setSelectedCustomer(customer);
      navigate(`/admin/customers/${customer.id}`);
    },
    onEmployeeDetailClick: (id: string) => {
      navigate(`/admin/employees/${id}`);
    },
    onLogout: shellProps.onLogout,
  };

  const engineerProps = {
    onDashboardClick: () => navigate("/engineer"),
    onScheduleClick: () => navigate("/engineer/schedule"),
    onAppointmentsClick: () => navigate("/engineer/appointments"),
    onTechniciansClick: () => navigate("/engineer/technicians"),
    onCustomersClick: () => navigate("/engineer/customers"),
    onSettingsClick: () => navigate("/engineer/settings"),
    onJobDetailClick: (id?: string) => {
      if (id) setAppointmentId(id);
      navigate("/engineer/job-detail");
    },
    onLogout: shellProps.onLogout,
  };

  if (routePath === "/admin") {
    return <AdminDashboardPage {...adminProps} />;
  }

  if (routePath.startsWith("/admin/customers/")) {
    if (selectedCustomer) {
      return (
        <AdminCustomerDetailPage
          customer={selectedCustomer}
          onBack={() => {
            setSelectedCustomer(null);
            navigate("/admin/customers");
          }}
          {...adminProps}
        />
      );
    }
    return <AdminCustomersPage {...adminProps} />;
  }

  if (routePath === "/admin/customers") {
    return <AdminCustomersPage {...adminProps} />;
  }

  if (routePath.startsWith("/admin/employees/")) {
    return <AdminEngineersPage {...adminProps} />;
  }

  if (routePath === "/admin/engineers") {
    return <AdminEngineersPage {...adminProps} />;
  }

  if (routePath === "/admin/inventory") {
    return <AdminInventoryPage {...adminProps} />;
  }

  if (routePath === "/admin/pricing") {
    return <AdminPricingPage {...adminProps} />;
  }

  if (routePath === "/admin/garage") {
    return <AdminGaragePage {...adminProps} />;
  }

  if (routePath === "/super-admin") {
    return <SuperAdminDashboardPage onLogout={shellProps.onLogout} />;
  }

  if (routePath === "/engineer") {
    return <EngineerDashboardPage {...engineerProps} />;
  }

  if (routePath === "/engineer/schedule") {
    return <EngineerSchedulePage {...engineerProps} />;
  }

  if (routePath === "/engineer/appointments") {
    return <EngineerAppointmentsPage {...engineerProps} />;
  }

  if (routePath === "/engineer/technicians") {
    return <EngineerTechniciansPage {...engineerProps} />;
  }

  if (routePath === "/engineer/customers") {
    return <EngineerCustomersPage {...engineerProps} />;
  }

  if (routePath === "/engineer/job-detail") {
    return <EngineerJobDetailPage appointmentId={appointmentId} {...engineerProps} />;
  }

  if (routePath === "/engineer/settings") {
    return <EngineerSettingsPage {...engineerProps} />;
  }

  const receptionProps = {
    onDashboardClick: () => navigate("/reception"),
    onScheduleClick: () => navigate("/reception/schedule"),
    onAppointmentsClick: () => navigate("/reception/appointments"),
    onCustomersClick: () => navigate("/reception/customers"),
    onNewAppointmentClick: () => navigate("/reception/appointments/new"),
    onAppointmentDetailClick: (id: string) => {
      setAppointmentId(id);
      navigate("/reception/appointments/detail");
    },
    onLogout: shellProps.onLogout,
  };

  if (routePath === "/reception" || routePath === "/reception/dashboard") {
    return <ReceptionDashboardPage {...receptionProps} />;
  }

  if (routePath === "/reception/schedule") {
    return <ReceptionSchedulePage {...receptionProps} />;
  }

  if (routePath === "/reception/appointments") {
    return <ReceptionAppointmentsPage {...receptionProps} />;
  }

  if (routePath === "/reception/appointments/new") {
    return <ReceptionNewAppointmentPage {...receptionProps} />;
  }

  if (routePath === "/reception/appointments/detail") {
    return (
      <ReceptionAppointmentDetailPage
        appointmentId={appointmentId}
        {...receptionProps}
      />
    );
  }

  if (routePath === "/reception/customers") {
    return <ReceptionCustomersPage {...receptionProps} />;
  }

  if (routePath === "/history") {
    return (
      <AppShell active="history" title="Lịch sử dịch vụ" {...shellProps}>
        <HistoryPage
          onHomeClick={shellProps.onHomeClick}
          onNotificationsClick={shellProps.onNotificationsClick}
          onTrackingClick={shellProps.onTrackingClick}
          onProfileClick={shellProps.onProfileClick}
        />
      </AppShell>
    );
  }

  if (routePath === "/notifications") {
    return (
      <AppShell active="notifications" title="Thông báo" {...shellProps}>
        <NotificationsPage
          onHomeClick={shellProps.onHomeClick}
          onHistoryClick={shellProps.onHistoryClick}
          onTrackingClick={shellProps.onTrackingClick}
          onProfileClick={shellProps.onProfileClick}
        />
      </AppShell>
    );
  }

  if (routePath === "/tracking") {
    return (
      <AppShell active="tracking" title="Theo dõi phương tiện" {...shellProps}>
        <TrackingPage
          onHomeClick={shellProps.onHomeClick}
          onHistoryClick={shellProps.onHistoryClick}
          onNotificationsClick={shellProps.onNotificationsClick}
          onProfileClick={shellProps.onProfileClick}
        />
      </AppShell>
    );
  }

  if (routePath === "/profile") {
    return (
      <AppShell
        active="profile"
        title="Cá nhân"
        {...shellProps}
      >
        <ProfilePage
          onHomeClick={shellProps.onHomeClick}
          onAddVehicleClick={() => navigate("/add-vehicle")}
          onHistoryClick={shellProps.onHistoryClick}
          onTrackingClick={shellProps.onTrackingClick}
          onNotificationsClick={shellProps.onNotificationsClick}
        />
      </AppShell>
    );
  }

  if (routePath === "/add-vehicle") {
    return (
      <AppShell active="profile" title="Thêm phương tiện mới" {...shellProps}>
        <AddVehiclePage onBackClick={() => navigate("/profile")} />
      </AppShell>
    );
  }

  if (routePath === "/booking") {
    return (
      <AppShell active="home" title="Đặt lịch dịch vụ" {...shellProps}>
        <BookingPage
          onHomeClick={shellProps.onHomeClick}
          onHistoryClick={shellProps.onHistoryClick}
          onNotificationsClick={shellProps.onNotificationsClick}
          onTrackingClick={shellProps.onTrackingClick}
          onProfileClick={shellProps.onProfileClick}
          garageId={selectedGarageId}
          serviceId={selectedServiceId}
        />
      </AppShell>
    );
  }

  if (routePath === "/find-garage") {
    return (
      <AppShell active="find_garage" title="Tìm garage" {...shellProps}>
        <FindGaragePage
          onBookingClick={(garageId) => {
            setSelectedGarageId(garageId);
            setSelectedServiceId(null);
            navigate("/garage-detail");
          }}
        />
      </AppShell>
    );
  }

  if (routePath === "/garage-detail") {
    return (
      <AppShell active="find_garage" title="Chi tiết garage" {...shellProps}>
        <GarageDetailPage
          garageId={selectedGarageId}
          onBackClick={() => navigate("/find-garage")}
          onBookingClick={(serviceId) => {
            setSelectedServiceId(serviceId);
            navigate("/booking");
          }}
        />
      </AppShell>
    );
  }

  if (routePath === "/payment-result") {
    return <PaymentResultPage onHomeClick={() => navigate("/home", true)} />;
  }

  return (
    <AppShell
      active="home"
      title="Tổng quan"
      {...shellProps}
    >
      <Home
        onBookingClick={() => {
          setSelectedGarageId(null);
          setSelectedServiceId(null);
          navigate("/booking");
        }}
        onHistoryClick={shellProps.onHistoryClick}
        onNotificationsClick={shellProps.onNotificationsClick}
        onTrackingClick={shellProps.onTrackingClick}
        onProfileClick={shellProps.onProfileClick}
      />
    </AppShell>
  );
}

export default App;

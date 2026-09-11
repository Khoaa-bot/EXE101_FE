import { useCallback, useEffect, useState } from "react";
import AppShell from "./components/AppShell";
import AddVehiclePage from "./pages/AddVehiclePage";
import BookingPage from "./pages/BookingPage";
import HistoryPage from "./pages/HistoryPage";
import Home from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import NotificationsPage from "./pages/NotificationsPage";
import ProfilePage from "./pages/ProfilePage";
import RegisterPage from "./pages/RegisterPage";
import TrackingPage from "./pages/TrackingPage";
import FindGaragePage from "./pages/FindGaragePage";
import GarageDetailPage from "./pages/GarageDetailPage";

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
]);

const publicRoutes = new Set(["/", "/login", "/register"]);

const getRoutePath = (isAuthenticated: boolean, pathname: string) => {
  if (!isAuthenticated) {
    return publicRoutes.has(pathname) ? pathname : "/login";
  }

  if (pathname === "/" || pathname === "/login" || pathname === "/register") {
    return "/home";
  }

  return appRoutes.has(pathname) ? pathname : "/home";
};

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(
    () => Boolean(localStorage.getItem("auth_session")),
  );
  const [pathname, setPathname] = useState(() =>
    normalizePath(window.location.pathname),
  );
  const [selectedGarageId, setSelectedGarageId] = useState<string | null>(null);
  const [selectedServiceId, setSelectedServiceId] = useState<number | null>(null);
  const routePath = getRoutePath(isAuthenticated, pathname);

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

  if (!isAuthenticated) {
    if (routePath === "/register") {
      return <RegisterPage onBackToLogin={() => navigate("/login")} />;
    }

    return (
      <LoginPage
        onLogin={() => {
          setIsAuthenticated(true);
          navigate("/home");
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
      navigate("/login", true);
    },
  };

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

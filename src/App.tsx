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
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pathname, setPathname] = useState(() =>
    normalizePath(window.location.pathname),
  );
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
    onHistoryClick: () => navigate("/history"),
    onNotificationsClick: () => navigate("/notifications"),
    onProfileClick: () => navigate("/profile"),
    onTrackingClick: () => navigate("/tracking"),
    onLogout: () => {
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
        onBookingClick={() => navigate("/booking")}
        onHistoryClick={shellProps.onHistoryClick}
        onNotificationsClick={shellProps.onNotificationsClick}
        onTrackingClick={shellProps.onTrackingClick}
        onProfileClick={shellProps.onProfileClick}
      />
    </AppShell>
  );
}

export default App;

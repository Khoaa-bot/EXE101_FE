import { useCallback, useEffect, useState } from "react";
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

  if (routePath === "/history") {
    return (
      <HistoryPage
        onHomeClick={() => navigate("/home")}
        onNotificationsClick={() => navigate("/notifications")}
        onTrackingClick={() => navigate("/tracking")}
        onProfileClick={() => navigate("/profile")}
      />
    );
  }

  if (routePath === "/notifications") {
    return (
      <NotificationsPage
        onHomeClick={() => navigate("/home")}
        onHistoryClick={() => navigate("/history")}
        onTrackingClick={() => navigate("/tracking")}
        onProfileClick={() => navigate("/profile")}
      />
    );
  }

  if (routePath === "/tracking") {
    return (
      <TrackingPage
        onHomeClick={() => navigate("/home")}
        onHistoryClick={() => navigate("/history")}
        onNotificationsClick={() => navigate("/notifications")}
        onProfileClick={() => navigate("/profile")}
      />
    );
  }

  if (routePath === "/profile") {
    return (
      <ProfilePage
        onHomeClick={() => navigate("/home")}
        onAddVehicleClick={() => navigate("/add-vehicle")}
        onHistoryClick={() => navigate("/history")}
        onTrackingClick={() => navigate("/tracking")}
        onNotificationsClick={() => navigate("/notifications")}
      />
    );
  }

  if (routePath === "/add-vehicle") {
    return <AddVehiclePage onBackClick={() => navigate("/profile")} />;
  }

  if (routePath === "/booking") {
    return (
      <BookingPage
        onHomeClick={() => navigate("/home")}
        onHistoryClick={() => navigate("/history")}
        onNotificationsClick={() => navigate("/notifications")}
        onTrackingClick={() => navigate("/tracking")}
        onProfileClick={() => navigate("/profile")}
      />
    );
  }

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

export default App;

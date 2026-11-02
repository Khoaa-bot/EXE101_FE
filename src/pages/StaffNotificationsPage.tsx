import { useEffect, useState } from "react";
import StaffShell, { type StaffRole } from "../components/StaffShell";
import { getMyProfile } from "../services/api";
import NotificationsPage from "./Customer/NotificationsPage";

type StaffNotificationsPageProps = {
  role: StaffRole;
  handlers: Partial<Record<string, (() => void) | undefined>>;
  onLogout?: () => void;
};

const FALLBACK_NAME: Record<StaffRole, string> = {
  reception: "Lễ tân",
  engineer: "Kỹ thuật viên",
};

// Thông báo của Lễ tân và Kỹ thuật viên: dùng lại danh sách của khách, đặt trong khung nhân viên.
export default function StaffNotificationsPage({ role, handlers, onLogout }: StaffNotificationsPageProps) {
  const [name, setName] = useState(FALLBACK_NAME[role]);

  useEffect(() => {
    getMyProfile()
      .then((profile) => setName(profile.fullName || profile.username || FALLBACK_NAME[role]))
      .catch(() => {});
  }, [role]);

  return (
    <StaffShell role={role} active="notifications" handlers={handlers} userName={name} onLogout={onLogout}>
      <div className="mx-auto max-w-4xl">
        <NotificationsPage embedded />
      </div>
    </StaffShell>
  );
}

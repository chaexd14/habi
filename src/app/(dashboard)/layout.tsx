import { ProfileProvider } from "@/providers/profile-provider";
import { NotificationProvider } from "@/providers/notification-provider";
import { SettingsProvider } from "@/providers/settings-provider";
import { ScheduleProvider } from "@/providers/schedule-provider";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProfileProvider>
      <SettingsProvider>
        <ScheduleProvider>
          <NotificationProvider>
            {children}
          </NotificationProvider>
        </ScheduleProvider>
      </SettingsProvider>
    </ProfileProvider>
  );
}

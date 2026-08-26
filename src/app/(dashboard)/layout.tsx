import { ProfileProvider } from "@/providers/profile-provider";
import { NotificationProvider } from "@/providers/notification-provider";
import { SettingsProvider } from "@/providers/settings-provider";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProfileProvider>
      <SettingsProvider>
        <NotificationProvider>
          {children}
        </NotificationProvider>
      </SettingsProvider>
    </ProfileProvider>
  );
}



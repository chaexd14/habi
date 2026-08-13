import { ProfileProvider } from "@/providers/profile-provider";
import { NotificationProvider } from "@/providers/notification-provider";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProfileProvider>
      <NotificationProvider>
        {children}
      </NotificationProvider>
    </ProfileProvider>
  );
}


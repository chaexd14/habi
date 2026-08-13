import { ProfileProvider } from "@/providers/profile-provider";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProfileProvider>
      {children}
    </ProfileProvider>
  );
}

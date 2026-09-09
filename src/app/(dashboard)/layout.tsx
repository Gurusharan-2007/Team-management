import * as React from "react";
import { getCurrentUser } from "@/lib/supabase/server";
import { Sidebar } from "@/components/layout/sidebar";
import { Navbar } from "@/components/layout/navbar";
import { AuthProvider } from "@/components/providers/auth-provider";
import { AmbientBackground } from "@/components/layout/ambient-background";
import { FuturisticFooter } from "@/components/layout/futuristic-footer";
import { getUnreadNotificationCountAction } from "@/actions/notifications";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const currentUser = await getCurrentUser();

  const userEmail = currentUser.user?.email || "member@college.edu";
  const userName = currentUser.profile?.full_name || "Team Member";
  const userRole = currentUser.role;
  const unreadCount = await getUnreadNotificationCountAction();

  return (
    <AuthProvider
      initialRole={userRole}
      initialEmail={userEmail}
      initialName={userName}
    >
      <div className="relative flex min-h-screen bg-background text-foreground overflow-x-hidden">
        {/* Atmospheric Ambient Light Blooms */}
        <AmbientBackground />

        {/* Desktop Sidebar */}
        <div className="relative z-20 hidden lg:flex lg:flex-col shrink-0">
          <Sidebar
            userRole={userRole}
            userEmail={userEmail}
            userName={userName}
            unreadNotificationsCount={unreadCount}
          />
        </div>

        {/* Main Shell */}
        <div className="relative z-10 flex flex-1 flex-col min-w-0">
          <Navbar
            userName={userName}
            userEmail={userEmail}
            userRole={userRole}
            unreadNotificationsCount={unreadCount}
          />
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-[1440px] w-full mx-auto animate-fade-in flex flex-col justify-between">
            <div>{children}</div>
            <FuturisticFooter />
          </main>
        </div>
      </div>
    </AuthProvider>
  );
}

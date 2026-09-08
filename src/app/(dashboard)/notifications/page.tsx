import { PageHeader } from "@/components/layout/page-header";
import { NotificationCenter } from "@/components/notifications/notification-center";
import { getNotificationsAction } from "@/actions/notifications";

export default async function NotificationsPage() {
  const { notifications, unreadCount } = await getNotificationsAction("all");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications"
        description="Automated Saturday reminders, report milestones, and system updates."
      />

      <NotificationCenter
        initialNotifications={notifications}
        initialUnreadCount={unreadCount}
      />
    </div>
  );
}

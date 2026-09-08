import * as React from "react";
import { Bell, Award, FileText, TrendingUp, AlertTriangle } from "lucide-react";
import { NotificationType } from "@/types/database";
import { formatDateTime } from "@/lib/utils";
import { cn } from "@/lib/utils";

export interface NotificationItemProps {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  createdAt: string;
  onMarkAsRead?: (id: string) => void;
  className?: string;
}

const TYPE_ICONS: Record<NotificationType, React.ElementType> = {
  system: Bell,
  reminder: AlertTriangle,
  achievement: Award,
  report: FileText,
  point_change: TrendingUp,
};

export function NotificationItem({
  id,
  title,
  message,
  type,
  isRead,
  createdAt,
  onMarkAsRead,
  className,
}: NotificationItemProps) {
  const Icon = TYPE_ICONS[type] || Bell;

  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-lg border border-border/70 p-3.5 transition-colors",
        isRead ? "bg-background text-muted-foreground" : "bg-card text-foreground font-medium shadow-sm",
        className
      )}
    >
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-md border text-foreground",
          isRead ? "border-border/60 bg-muted/40 text-muted-foreground" : "border-border bg-accent text-accent-foreground"
        )}
      >
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 space-y-1 overflow-hidden">
        <div className="flex items-center justify-between gap-2">
          <h5 className="text-xs font-semibold leading-none truncate">{title}</h5>
          <span className="text-[10px] text-muted-foreground shrink-0">
            {formatDateTime(createdAt)}
          </span>
        </div>
        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed font-normal">
          {message}
        </p>
      </div>
      {!isRead && onMarkAsRead && (
        <button
          onClick={() => onMarkAsRead(id)}
          className="shrink-0 h-2 w-2 rounded-full bg-primary ring-2 ring-primary/20 hover:opacity-75"
          title="Mark as read"
          aria-label="Mark as read"
        />
      )}
    </div>
  );
}

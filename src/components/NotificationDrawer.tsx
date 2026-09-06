import {
  AlertTriangle,
  Bell,
  CheckCheck,
  ChevronRight,
  ShieldAlert,
  ShieldCheck,
  X,
} from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import type { NotificationItem } from "../types/release";
import { Badge } from "./ui/Badge";
import { Button } from "./ui/Button";

export function NotificationDrawer({
  isOpen,
  onClose,
  notifications = [],
  onMarkAllAsRead,
}: {
  isOpen: boolean;
  onClose: () => void;
  notifications: NotificationItem[];
  onMarkAllAsRead: () => void;
}) {
  const [filter, setFilter] = useState<"all" | "blockers">("all");

  if (!isOpen) return null;

  const filteredNotifications = notifications.filter((n) => {
    if (filter === "blockers") return n.type === "blocker";
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-foreground/30 backdrop-blur-xs animate-in fade-in duration-150"
      role="presentation"
      onMouseDown={onClose}
    >
      <div
        className="h-full w-full max-w-md bg-card border-l border-border shadow-2xl flex flex-col animate-in slide-in-from-right duration-200"
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between border-b border-border p-4">
          <div className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10 text-primary">
              <Bell className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-foreground">Release Notifications</h3>
              <p className="text-[11px] text-muted-foreground">
                {unreadCount > 0 ? `${unreadCount} unread action items` : "All alerts caught up"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                className="h-8 px-2 text-xs text-primary"
                onClick={onMarkAllAsRead}
                title="Mark all notifications as read"
              >
                <CheckCheck className="h-3.5 w-3.5 mr-1" /> Mark read
              </Button>
            )}
            <Button variant="ghost" className="h-8 w-8 px-0" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex border-b border-border bg-muted/40 p-2 text-xs font-medium gap-1">
          <button
            type="button"
            onClick={() => setFilter("all")}
            className={`flex-1 rounded-md py-1.5 transition ${
              filter === "all" ? "bg-background text-foreground shadow-xs font-semibold" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            All Alerts ({notifications.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter("blockers")}
            className={`flex-1 rounded-md py-1.5 transition ${
              filter === "blockers" ? "bg-background text-foreground shadow-xs font-semibold text-rose-600" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Blockers Only ({notifications.filter((n) => n.type === "blocker").length})
          </button>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filteredNotifications.map((notif) => (
            <div
              key={notif.id}
              className={`rounded-xl border p-3.5 transition space-y-2 ${
                notif.type === "blocker"
                  ? "border-rose-200 bg-rose-50/40 dark:border-rose-900/50 dark:bg-rose-950/20"
                  : notif.type === "warning"
                    ? "border-amber-200 bg-amber-50/40 dark:border-amber-900/50 dark:bg-amber-950/20"
                    : "border-border bg-card"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2.5">
                  <div className="mt-0.5 shrink-0">
                    {notif.type === "blocker" ? (
                      <ShieldAlert className="h-4 w-4 text-rose-600" />
                    ) : notif.type === "warning" ? (
                      <AlertTriangle className="h-4 w-4 text-amber-600" />
                    ) : (
                      <ShieldCheck className="h-4 w-4 text-emerald-600" />
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-xs text-foreground leading-tight">{notif.title}</p>
                    <p className="mt-1 text-[11px] text-muted-foreground leading-4">{notif.message}</p>
                  </div>
                </div>
                {!notif.read && (
                  <span className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1" />
                )}
              </div>

              {notif.link && (
                <div className="flex justify-end pt-1 border-t border-border/50">
                  <Link
                    to={notif.link}
                    onClick={onClose}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline"
                  >
                    <span>Resolve action</span>
                    <ChevronRight className="h-3 w-3" />
                  </Link>
                </div>
              )}
            </div>
          ))}

          {filteredNotifications.length === 0 && (
            <div className="py-16 text-center space-y-2">
              <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-muted text-muted-foreground">
                <Bell className="h-6 w-6" />
              </div>
              <p className="text-sm font-semibold text-foreground">No active notifications</p>
              <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                {filter === "blockers" ? "No release blockers found for this project." : "You're all caught up with your release tasks."}
              </p>
            </div>
          )}
        </div>

        {/* Drawer Footer */}
        <div className="border-t border-border p-3 text-center bg-muted/20">
          <p className="text-[10px] text-muted-foreground">
            ReleaseIQ real-time compliance monitoring & store policy guard
          </p>
        </div>
      </div>
    </div>
  );
}

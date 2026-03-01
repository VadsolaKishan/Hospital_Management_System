import { useState, useEffect } from 'react';
import { Bell, Check, CheckCheck, Clock } from 'lucide-react';
import { PageLoader } from '@/components/common/Loader';
import { notificationService, Notification } from '@/services/notificationService';
import { formatRelativeTime } from '@/utils/helpers';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export const NotificationList = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const data = await notificationService.getAll();
      setNotifications(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load notifications',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkRead = async (id: number) => {
    try {
      await notificationService.markRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      toast({
        title: 'Marked as read',
        description: 'Notification has been marked as read',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to mark notification as read',
      });
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const unreadNotifications = notifications.filter((n) => !n.is_read);
      await Promise.all(unreadNotifications.map((n) => notificationService.markRead(n.id)));
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      toast({
        title: 'All marked as read',
        description: 'All notifications have been marked as read',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to mark all as read',
      });
    }
  };

  const filteredNotifications = filter === 'unread'
    ? notifications.filter((n) => !n.is_read)
    : notifications;

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  if (isLoading) return <PageLoader />;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Notifications</h1>
          <p className="text-muted-foreground">
            {unreadCount > 0 ? `You have ${unreadCount} unread notifications` : 'All caught up!'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="flex items-center gap-2 rounded-xl border border-border px-4 py-2 font-medium text-foreground hover:bg-muted transition-colors"
          >
            <CheckCheck className="h-4 w-4" />
            Mark All as Read
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="glass-card rounded-2xl p-2 inline-flex gap-2">
        <button
          onClick={() => setFilter('all')}
          className={cn(
            'rounded-xl px-4 py-2 text-sm font-medium transition-colors',
            filter === 'all'
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:bg-muted'
          )}
        >
          All ({notifications.length})
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={cn(
            'rounded-xl px-4 py-2 text-sm font-medium transition-colors',
            filter === 'unread'
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:bg-muted'
          )}
        >
          Unread ({unreadCount})
        </button>
      </div>

      {/* Notifications List */}
      <div className="space-y-4">
        {filteredNotifications.length > 0 ? (
          filteredNotifications.map((notification) => (
            <div
              key={notification.id}
              className={cn(
                'glass-card rounded-2xl p-6 transition-all duration-300',
                !notification.is_read && 'border-l-4 border-l-primary'
              )}
            >
              <div className="flex items-start gap-4">
                <div
                  className={cn(
                    'flex h-12 w-12 items-center justify-center rounded-xl',
                    notification.is_read ? 'bg-muted' : 'bg-primary/10'
                  )}
                >
                  <Bell
                    className={cn(
                      'h-6 w-6',
                      notification.is_read ? 'text-muted-foreground' : 'text-primary'
                    )}
                  />
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3
                        className={cn(
                          'font-semibold',
                          notification.is_read ? 'text-muted-foreground' : 'text-foreground'
                        )}
                      >
                        {notification.title}
                      </h3>
                      <p className="mt-1 text-muted-foreground">{notification.message}</p>
                    </div>
                    {!notification.is_read && (
                      <button
                        onClick={() => handleMarkRead(notification.id)}
                        className="flex items-center gap-2 rounded-lg px-3 py-1 text-sm text-primary hover:bg-primary/10 transition-colors"
                      >
                        <Check className="h-4 w-4" />
                        Mark Read
                      </button>
                    )}
                  </div>
                  <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    {formatRelativeTime(notification.created_at)}
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="glass-card rounded-2xl p-12 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mx-auto mb-4">
              <Bell className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">No notifications</h3>
            <p className="text-muted-foreground">
              {filter === 'unread'
                ? "You've read all your notifications"
                : "You don't have any notifications yet"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

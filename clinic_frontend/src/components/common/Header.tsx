import { useState, useEffect } from 'react';
import { Bell, User, LogOut, Settings, ChevronDown, Menu, Search } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { notificationService, Notification } from '@/services/notificationService';
import { getInitials, formatRelativeTime } from '@/utils/helpers';
import { cn } from '@/lib/utils';

interface HeaderProps {
  title: string;
  onMenuClick?: () => void;
}

export const Header = ({ title, onMenuClick }: HeaderProps) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const data = await notificationService.getUnread();
        setNotifications(data.slice(0, 5));
        setUnreadCount(data.length);
      } catch (error) {
        console.error('Failed to fetch notifications:', error);
      }
    };

    fetchNotifications();
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleMarkRead = async (id: number) => {
    try {
      await notificationService.markRead(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-card/80 backdrop-blur-xl px-6">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-xl font-semibold text-foreground">{title}</h1>
          {user && (
            <p className="text-sm text-muted-foreground">
              Welcome back, {user.first_name}!
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Search Bar - Desktop */}
        <div className="hidden md:flex items-center relative mr-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search patients, doctors..."
            className="h-10 w-64 rounded-xl border border-border bg-muted/50 pl-10 pr-4 text-sm focus:bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
          />
        </div>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowUserMenu(false);
            }}
            className="relative rounded-xl p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white shadow-lg shadow-red-500/40 animate-pulse">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 top-full mt-2 w-80 overflow-hidden rounded-2xl border border-border bg-card shadow-xl animate-scale-in">
              <div className="border-b border-border px-4 py-3">
                <h3 className="font-semibold text-foreground">Notifications</h3>
              </div>
              <div className="max-h-80 overflow-auto">
                {notifications.length > 0 ? (
                  notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className="border-b border-border/50 px-4 py-3 transition-colors hover:bg-muted/50 cursor-pointer"
                      onClick={() => handleMarkRead(notification.id)}
                    >
                      <p className="text-sm font-medium text-foreground">{notification.title}</p>
                      <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                        {notification.message}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground/70">
                        {formatRelativeTime(notification.created_at)}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                    No new notifications
                  </div>
                )}
              </div>
              <div className="border-t border-border px-4 py-3">
                <button
                  onClick={() => {
                    navigate('/notifications');
                    setShowNotifications(false);
                  }}
                  className="text-sm font-medium text-primary hover:underline"
                >
                  View all notifications
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User Menu */}
        <div className="relative">
          <button
            onClick={() => {
              setShowUserMenu(!showUserMenu);
              setShowNotifications(false);
            }}
            className="flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-muted"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-full gradient-primary text-sm font-medium text-primary-foreground">
              {user ? getInitials(user.full_name || `${user.first_name} ${user.last_name}`) : 'U'}
            </div>
            <div className="hidden text-left sm:block">
              <p className="text-sm font-medium text-foreground">
                {user?.first_name} {user?.last_name}
              </p>
              <p className="text-xs text-muted-foreground">{user?.role}</p>
            </div>
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 top-full mt-2 w-56 overflow-hidden rounded-2xl border border-border bg-card shadow-xl animate-scale-in">
              <div className="border-b border-border px-4 py-3">
                <p className="font-medium text-foreground">
                  {user?.first_name} {user?.last_name}
                </p>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
              </div>
              <div className="py-2">
                <button
                  onClick={() => {
                    navigate('/profile');
                    setShowUserMenu(false);
                  }}
                  className="flex w-full items-center gap-3 px-4 py-2 text-sm text-foreground transition-colors hover:bg-muted"
                >
                  <User className="h-4 w-4" />
                  Profile
                </button>
              </div>
              <div className="border-t border-border py-2">
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-3 px-4 py-2 text-sm text-destructive transition-colors hover:bg-destructive/10"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Click outside to close */}
      {(showUserMenu || showNotifications) && (
        <div
          className="fixed inset-0 z-[-1]"
          onClick={() => {
            setShowUserMenu(false);
            setShowNotifications(false);
          }}
        />
      )}
    </header>
  );
};

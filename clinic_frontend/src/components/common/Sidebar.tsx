import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Calendar,
  Users,
  Stethoscope,
  FileText,
  CreditCard,
  Bell,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  Activity,
  Building2,
  BedDouble,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import { ROLES } from '@/utils/constants';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  isMobile?: boolean;
}

const menuItems = [
  {
    title: 'Dashboard',
    icon: LayoutDashboard,
    path: '/dashboard',
    roles: [ROLES.ADMIN, ROLES.DOCTOR, ROLES.STAFF, ROLES.PATIENT],
  },
  {
    title: 'Appointments',
    icon: Calendar,
    path: '/appointments',
    roles: [ROLES.ADMIN, ROLES.DOCTOR, ROLES.STAFF, ROLES.PATIENT],
  },
  {
    title: 'Patients',
    icon: Users,
    path: '/patients',
    roles: [ROLES.ADMIN, ROLES.DOCTOR, ROLES.STAFF],
  },
  {
    title: 'Doctors',
    icon: Stethoscope,
    path: '/doctors',
    roles: [ROLES.ADMIN, ROLES.STAFF, ROLES.PATIENT],
  },
  {
    title: 'Departments',
    icon: Building2,
    path: '/departments',
    roles: [ROLES.ADMIN, ROLES.STAFF, ROLES.DOCTOR, ROLES.PATIENT],
  },
  {
    title: 'Beds',
    icon: BedDouble,
    path: '/beds',
    roles: [ROLES.ADMIN, ROLES.STAFF],
  },
  {
    title: 'Medical Records',
    icon: FileText,
    path: '/records',
    roles: [ROLES.ADMIN, ROLES.DOCTOR, ROLES.STAFF, ROLES.PATIENT],
  },
  {
    title: 'Billing',
    icon: CreditCard,
    path: '/billing',
    roles: [ROLES.ADMIN, ROLES.STAFF, ROLES.PATIENT],
  },
  {
    title: 'Notifications',
    icon: Bell,
    path: '/notifications',
    roles: [ROLES.ADMIN, ROLES.DOCTOR, ROLES.STAFF, ROLES.PATIENT],
  },
  {
    title: 'Support',
    icon: HelpCircle,
    path: '/support',
    roles: [ROLES.ADMIN, ROLES.DOCTOR, ROLES.STAFF, ROLES.PATIENT],
  },
];

export const Sidebar = ({ isOpen, onToggle, isMobile = false }: SidebarProps) => {
  const { user } = useAuth();
  const location = useLocation();

  const filteredMenuItems = menuItems.filter(
    (item) => user && item.roles.includes(user.role)
  );

  return (
    <>
      {/* Mobile overlay */}
      {isMobile && isOpen && (
        <div
          className="fixed inset-0 z-40 bg-foreground/50 backdrop-blur-sm lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-50 flex h-full flex-col border-r border-border/40 bg-card/60 backdrop-blur-xl transition-all duration-300 shadow-xl shadow-primary/5',
          isOpen ? 'w-64' : 'w-20',
          isMobile && !isOpen && '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-between border-b border-border px-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-primary">
              <Activity className="h-6 w-6 text-primary-foreground" />
            </div>
            {isOpen && (
              <div className="animate-fade-in">
                <h1 className="text-lg font-bold gradient-text">HealthCare Pro</h1>
                <p className="text-xs text-muted-foreground">Management System</p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-auto p-4">
          <ul className="space-y-2">
            {filteredMenuItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    className={({ isActive }) => cn(
                      'nav-link group relative overflow-hidden',
                      isActive && 'active'
                    )}
                  >
                    <item.icon className={cn('h-5 w-5 flex-shrink-0', isActive && 'text-primary')} />
                    {isOpen && (
                      <span className="animate-fade-in">{item.title}</span>
                    )}
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Toggle Button */}
        <div className="border-t border-border p-4">
          <button
            onClick={onToggle}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-muted py-2 text-muted-foreground transition-colors hover:bg-muted/80 hover:text-foreground"
          >
            {isOpen ? (
              <>
                <ChevronLeft className="h-5 w-5" />
                <span className="text-sm">Collapse</span>
              </>
            ) : (
              <ChevronRight className="h-5 w-5" />
            )}
          </button>
        </div>
      </aside>
    </>
  );
};

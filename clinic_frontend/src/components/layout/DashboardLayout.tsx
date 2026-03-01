import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '@/components/common/Sidebar';
import { Header } from '@/components/common/Header';
import { cn } from '@/lib/utils';

interface DashboardLayoutProps {
  title: string;
}

export const DashboardLayout = ({ title }: DashboardLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background Orbs */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-secondary/10 rounded-full blur-[120px] translate-y-1/2 -translate-x-1/2" />
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden lg:block relative z-20">
        <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      </div>

      {/* Mobile Sidebar */}
      <div className="lg:hidden relative z-50">
        <Sidebar
          isOpen={mobileSidebarOpen}
          onToggle={() => setMobileSidebarOpen(!mobileSidebarOpen)}
          isMobile
        />
      </div>

      {/* Main Content */}
      <div
        className={cn(
          'transition-all duration-300 relative z-10',
          sidebarOpen ? 'lg:ml-64' : 'lg:ml-20'
        )}
      >
        <Header
          title={title}
          onMenuClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
        />
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

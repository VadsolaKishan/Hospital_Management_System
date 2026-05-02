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
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-0 w-[400px] sm:w-[500px] h-[400px] sm:h-[500px] bg-primary/15 rounded-full blur-[100px] sm:blur-[120px] -translate-y-1/2 translate-x-1/2 animate-pulse-slow" />
        <div className="absolute bottom-0 left-0 w-[400px] sm:w-[500px] h-[400px] sm:h-[500px] bg-secondary/15 rounded-full blur-[100px] sm:blur-[120px] translate-y-1/2 -translate-x-1/2 animate-pulse-slow" style={{ animationDelay: '4s' }} />
        <div className="absolute top-1/2 left-1/4 w-[300px] h-[300px] bg-accent/10 rounded-full blur-[80px] -translate-y-1/2 animate-pulse-slow" style={{ animationDelay: '2s' }} />
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
          'transition-all duration-300 relative z-10 flex flex-col h-screen',
          sidebarOpen ? 'lg:ml-64' : 'lg:ml-24'
        )}
      >
        <Header
          title={title}
          onMenuClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
        />
        <main className="p-4 sm:p-6 flex-1 overflow-y-auto overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

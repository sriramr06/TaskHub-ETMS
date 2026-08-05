import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar, MobileSidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';

const SIDEBAR_STORAGE_KEY = 'taskhub-sidebar-open';

export const AppLayout = () => {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(
    () => localStorage.getItem(SIDEBAR_STORAGE_KEY) !== 'false',
  );

  useEffect(() => {
    localStorage.setItem(SIDEBAR_STORAGE_KEY, String(sidebarOpen));
  }, [sidebarOpen]);

  return (
    <div className="flex h-screen flex-col bg-slate-50">
      {/* Topbar spans full width above everything else, so the logo stays
          visible whether or not the sidebar below it is open. */}
      <Topbar
        onOpenMenu={() => setMobileNavOpen(true)}
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen((open) => !open)}
      />
      <div className="flex min-h-0 flex-1">
        <Sidebar open={sidebarOpen} />
        <MobileSidebar open={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

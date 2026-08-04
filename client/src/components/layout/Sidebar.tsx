import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, UsersRound, FolderKanban, ListChecks, X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { RoleGate } from '@/components/RoleGate';
import { Permission, UserRole } from '@/lib/constants';

const navItemClasses = ({ isActive }: { isActive: boolean }) =>
  cn(
    'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
    isActive ? 'bg-teal-50 text-teal-700' : 'text-slate-600 hover:bg-slate-100',
  );

const SidebarNav = ({ onNavigate }: { onNavigate?: () => void }) => (
  <nav className="flex flex-1 flex-col gap-1">
    <NavLink to="/" end className={navItemClasses} onClick={onNavigate}>
      <LayoutDashboard className="size-4.5" />
      Dashboard
    </NavLink>
    <NavLink to="/projects" className={navItemClasses} onClick={onNavigate}>
      <FolderKanban className="size-4.5" />
      Projects
    </NavLink>
    <NavLink to="/tasks" className={navItemClasses} onClick={onNavigate}>
      <ListChecks className="size-4.5" />
      Tasks
    </NavLink>
    <RoleGate permission={Permission.TEAM_READ}>
      <NavLink to="/teams" className={navItemClasses} onClick={onNavigate}>
        <UsersRound className="size-4.5" />
        Teams
      </NavLink>
    </RoleGate>
    {/* People (accounts + employment records) is an HR-ish admin surface —
        gated by role, not USER_READ, since members/guests need USER_READ
        purely for picker dropdowns elsewhere and shouldn't see this section. */}
    <RoleGate roles={[UserRole.ADMIN, UserRole.MANAGER, UserRole.TEAMLEAD]}>
      <NavLink to="/people" className={navItemClasses} onClick={onNavigate}>
        <Users className="size-4.5" />
        People
      </NavLink>
    </RoleGate>
  </nav>
);

const SidebarBrand = () => (
  <div className="mb-6 flex items-center gap-2 px-2">
    <div className="flex size-8 items-center justify-center rounded-lg bg-teal-600 text-sm font-bold text-white">
      TH
    </div>
    <span className="text-lg font-semibold text-slate-900">TaskHub</span>
  </div>
);

export const Sidebar = () => (
  <aside className="hidden w-60 shrink-0 flex-col border-r border-slate-200 bg-surface px-3 py-4 md:flex">
    <SidebarBrand />
    <SidebarNav />
  </aside>
);

interface MobileSidebarProps {
  open: boolean;
  onClose: () => void;
}

export const MobileSidebar = ({ open, onClose }: MobileSidebarProps) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 md:hidden">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} aria-hidden="true" />
      <div className="relative flex h-full w-72 max-w-[80vw] flex-col border-r border-slate-200 bg-surface px-3 py-4 shadow-xl">
        <div className="mb-2 flex items-center justify-between">
          <SidebarBrand />
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="Close menu"
          >
            <X className="size-5" />
          </button>
        </div>
        <SidebarNav onNavigate={onClose} />
      </div>
    </div>
  );
};

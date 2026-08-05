import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, UsersRound, FolderKanban, ListChecks, X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { RoleGate } from '@/components/RoleGate';
import { Logo } from '@/components/layout/Logo';
import { useAuth } from '@/context/AuthContext';
import { Permission, UserRole, enumLabel } from '@/lib/constants';

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

// The logo now lives permanently in the Topbar (outside the collapsible
// sidebar), so this fills the freed-up space at the top of the nav instead.
const SidebarGreeting = () => {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <div className="mb-6 px-2">
      <p className="text-sm font-semibold text-slate-900">Welcome back, {user.firstName}</p>
      <p className="text-xs text-slate-500">{enumLabel(user.role)}</p>
    </div>
  );
};

interface SidebarProps {
  open: boolean;
}

export const Sidebar = ({ open }: SidebarProps) => (
  <aside
    className={cn(
      'hidden shrink-0 overflow-hidden border-slate-200 bg-surface transition-all duration-200 md:flex',
      open ? 'w-60 border-r' : 'w-0 border-r-0',
    )}
  >
    {/* Fixed-width inner wrapper so the nav never reflows as the <aside>
        animates — the outer overflow-hidden just reveals/clips it. */}
    <div className="flex w-60 shrink-0 flex-col px-3 py-4">
      <SidebarGreeting />
      <SidebarNav />
    </div>
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
          <Logo />
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="Close menu"
          >
            <X className="size-5" />
          </button>
        </div>
        <SidebarGreeting />
        <SidebarNav onNavigate={onClose} />
      </div>
    </div>
  );
};

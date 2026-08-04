import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Contact,
  UsersRound,
  FolderKanban,
  ListChecks,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { RoleGate } from '@/components/RoleGate';
import { Permission } from '@/lib/constants';

const navItemClasses = ({ isActive }: { isActive: boolean }) =>
  cn(
    'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
    isActive ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-100',
  );

export const Sidebar = () => (
  <aside className="hidden w-60 shrink-0 flex-col border-r border-slate-200 bg-white px-3 py-4 md:flex">
    <div className="mb-6 flex items-center gap-2 px-2">
      <div className="flex size-8 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white">
        TH
      </div>
      <span className="text-lg font-semibold text-slate-900">TaskHub</span>
    </div>

    <nav className="flex flex-1 flex-col gap-1">
      <NavLink to="/" end className={navItemClasses}>
        <LayoutDashboard className="size-4.5" />
        Dashboard
      </NavLink>
      <NavLink to="/projects" className={navItemClasses}>
        <FolderKanban className="size-4.5" />
        Projects
      </NavLink>
      <NavLink to="/tasks" className={navItemClasses}>
        <ListChecks className="size-4.5" />
        Tasks
      </NavLink>
      <RoleGate permission={Permission.TEAM_READ}>
        <NavLink to="/teams" className={navItemClasses}>
          <UsersRound className="size-4.5" />
          Teams
        </NavLink>
      </RoleGate>
      <RoleGate permission={Permission.USER_READ}>
        <NavLink to="/employees" className={navItemClasses}>
          <Contact className="size-4.5" />
          Employees
        </NavLink>
      </RoleGate>
      <RoleGate permission={Permission.USER_READ}>
        <NavLink to="/users" className={navItemClasses}>
          <Users className="size-4.5" />
          Users
        </NavLink>
      </RoleGate>
    </nav>
  </aside>
);

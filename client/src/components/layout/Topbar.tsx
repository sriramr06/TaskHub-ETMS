import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, UserRound, ChevronDown } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Avatar } from '@/components/ui/Avatar';
import { enumLabel } from '@/lib/constants';

export const Topbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  if (!user) return null;

  const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ');

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 md:px-6">
      <div>
        <p className="text-sm font-semibold text-slate-900">Welcome back, {user.firstName}</p>
        <p className="text-xs text-slate-500">{enumLabel(user.role)}</p>
      </div>

      <div className="relative">
        <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-slate-100"
        >
          <Avatar name={fullName} src={user.avatar} />
          <ChevronDown className="size-4 text-slate-400" />
        </button>

        {menuOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
            <div className="absolute right-0 z-20 mt-2 w-48 rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  navigate('/profile');
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
              >
                <UserRound className="size-4" />
                Profile
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                <LogOut className="size-4" />
                Log out
              </button>
            </div>
          </>
        )}
      </div>
    </header>
  );
};

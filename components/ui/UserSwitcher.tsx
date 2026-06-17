'use client';

import { useEffect, useState } from 'react';

interface SwitcherUser {
  id: string;
  email: string;
  fullName: string;
  status: string;
  departmentName: string;
  roles: string[];
}

interface UserSwitcherProps {
  currentUser: {
    id: string;
    fullName: string;
    email: string;
    roles: string[];
  } | null;
}

export function UserSwitcher({ currentUser }: UserSwitcherProps) {
  const [users, setUsers] = useState<SwitcherUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const isDev = process.env.NODE_ENV !== 'production';

  useEffect(() => {
    if (!isDev) return;

    async function fetchUsers() {
      try {
        const res = await fetch('/api/auth/switch-user');
        const json = await res.json();
        if (json.success) {
          setUsers(json.data);
        }
      } catch (error) {
        console.error('Failed to load switcher users:', error);
      }
    }
    fetchUsers();
  }, [isDev]);

  const handleSwitch = async (userId: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/switch-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      const json = await res.json();
      if (json.success) {
        setDropdownOpen(false);
        // Reload to apply the new cookie-based session
        window.location.reload();
      } else {
        alert(json.error || 'Failed to switch user');
      }
    } catch (error) {
      console.error('Switch user error:', error);
      alert('Error switching user');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout error:', error);
      alert('Không thể đăng xuất');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative z-50">
      <button
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className="w-full flex items-center justify-between gap-3 px-3 py-2 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-sm font-medium text-slate-300 hover:text-white transition-all duration-200 group cursor-pointer"
        disabled={loading}
      >
        <div className="flex items-center gap-3">
          <span className="relative flex h-2.5 w-2.5 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <div className="text-left">
            <p className="leading-none text-[10px] text-slate-400">Tài khoản</p>
            <p className="font-semibold text-slate-200 mt-0.5 text-xs truncate max-w-[120px]">{currentUser?.fullName.split('(')[0].trim() || 'Khách'}</p>
          </div>
        </div>
        <svg
          className={`h-4 w-4 text-slate-400 group-hover:text-white transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {dropdownOpen && (
        <>
          <div className="fixed inset-0" onClick={() => setDropdownOpen(false)} />
          <div className="absolute bottom-full left-0 mb-2 w-64 rounded-xl border border-slate-800 bg-slate-900 p-2 shadow-2xl animate-fade-in text-slate-200">
            <p className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Tài khoản hiện tại
            </p>
            <div className="px-3 pb-2">
              <p className="text-sm font-bold text-slate-100">{currentUser?.fullName}</p>
              <p className="text-xs text-slate-400 font-mono">{currentUser?.email}</p>
            </div>
            <div className="h-px bg-slate-800 my-1" />
            {isDev && (
              <>
                <p className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Đổi tài khoản kiểm thử
                </p>
                <div className="max-h-64 overflow-y-auto space-y-1">
                  {users.map((user) => {
                    const isActive = currentUser?.id === user.id;
                    return (
                      <button
                        key={user.id}
                        onClick={() => handleSwitch(user.id)}
                        disabled={isActive || loading}
                        className={`w-full text-left px-3 py-2.5 rounded-lg text-xs transition-all duration-150 flex flex-col gap-0.5 cursor-pointer ${
                          isActive
                            ? 'bg-blue-600/20 text-blue-400 font-medium border border-blue-600/30'
                            : 'hover:bg-slate-800/80 text-slate-300'
                        }`}
                      >
                        <span className="font-semibold">{user.fullName}</span>
                        <span className="text-[10px] text-slate-400 flex items-center justify-between">
                          <span className="truncate max-w-[120px]">{user.email}</span>
                          <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono scale-90 shrink-0">
                            {user.roles[0] || 'No Role'}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
                <div className="h-px bg-slate-800 my-1" />
              </>
            )}
            <button
              type="button"
              onClick={handleLogout}
              disabled={loading}
              className="w-full rounded-lg px-3 py-2 text-left text-xs font-semibold text-red-400 hover:bg-red-950/20 disabled:opacity-70 cursor-pointer"
            >
              Đăng xuất
            </button>
          </div>
        </>
      )}
    </div>
  );
}

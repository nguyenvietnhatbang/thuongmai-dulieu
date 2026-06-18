'use client';

import { useState } from 'react';

interface AccountMenuProps {
  currentUser: {
    fullName: string;
    email: string;
  };
  variant?: 'sidebar' | 'header';
}

export function AccountMenu({ currentUser, variant = 'sidebar' }: AccountMenuProps) {
  const [loading, setLoading] = useState(false);
  const initials = currentUser.fullName.slice(0, 2).toUpperCase() || currentUser.email.slice(0, 2).toUpperCase();

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

  if (variant === 'header') {
    return (
      <div className="flex h-10 items-center gap-3 border-l border-border pl-4">
        <div className="hidden md:block min-w-0 text-right">
          <p className="truncate text-xs font-bold leading-tight text-foreground max-w-44">{currentUser.fullName}</p>
          <p className="mt-0.5 truncate text-[10px] font-mono leading-tight text-muted-foreground max-w-44">{currentUser.email}</p>
        </div>
        <div className="h-8 w-8 shrink-0 rounded-full bg-slate-100 text-[10px] font-bold text-slate-700 flex items-center justify-center border border-border">
          {initials}
        </div>
        <button
          type="button"
          onClick={handleLogout}
          disabled={loading}
          className="h-8 rounded-lg border border-border bg-white px-3 text-xs font-semibold text-rose-600 hover:bg-rose-50 disabled:opacity-70 cursor-pointer"
        >
          {loading ? 'Đang...' : 'Đăng xuất'}
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-2.5 text-slate-200">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 h-7 w-7 shrink-0 rounded-full bg-slate-800 text-[10px] font-bold text-slate-200 flex items-center justify-center">
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-bold text-slate-100">{currentUser.fullName}</p>
          <p className="mt-0.5 truncate text-[10px] font-mono text-slate-400">{currentUser.email}</p>
        </div>
      </div>
      <button
        type="button"
        onClick={handleLogout}
        disabled={loading}
        className="mt-2 h-8 w-full rounded-lg border border-white/10 bg-slate-950/30 px-3 text-left text-xs font-semibold text-red-300 hover:bg-red-950/20 disabled:opacity-70 cursor-pointer"
      >
        {loading ? 'Đang đăng xuất...' : 'Đăng xuất'}
      </button>
    </div>
  );
}

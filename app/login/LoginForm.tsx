'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('admin@crm.com');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const json = await response.json();

      if (!json.success) {
        setError(json.error || 'Đăng nhập thất bại.');
        return;
      }

      const next = searchParams.get('next') || '/';
      router.replace(next.startsWith('/') ? next : '/');
      router.refresh();
    } catch (err) {
      console.error('Login submit error:', err);
      setError('Không thể kết nối tới máy chủ.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      <div>
        <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Email</label>
        <input
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="premium-input"
          placeholder="admin@crm.com"
        />
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Mật khẩu</label>
        <input
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="premium-input"
          placeholder="Nhập mật khẩu"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground shadow-md shadow-primary/20 transition-all hover:bg-primary/95 disabled:cursor-not-allowed disabled:opacity-70 cursor-pointer"
      >
        {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
      </button>
    </form>
  );
}

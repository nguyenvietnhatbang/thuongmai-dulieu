import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { LoginForm } from './LoginForm';

export const dynamic = 'force-dynamic';

export default async function LoginPage() {
  const currentUser = await getCurrentUser();
  if (currentUser) redirect('/');

  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md glass-panel rounded-2xl border border-border p-8 shadow-xl">
        <div className="mb-6 space-y-2">
          <div className="h-11 w-11 rounded-xl bg-gradient-to-tr from-primary to-violet-500 flex items-center justify-center text-primary-foreground font-bold shadow-md shadow-primary/25">
            AG
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Đăng nhập hệ thống</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Sử dụng tài khoản nội bộ đã được cấp để truy cập CRM thương mại.
            </p>
          </div>
        </div>

        <LoginForm />

        <div className="mt-5 rounded-lg border border-border bg-slate-50 px-3 py-2 text-xs text-muted-foreground">
          Tài khoản seed mẫu dùng email trong `db/seed.js`. Mật khẩu mặc định khi seed là `ChangeMe123!`, hoặc giá trị `SEED_USER_PASSWORD` nếu bạn đặt trong môi trường.
        </div>
      </div>
    </main>
  );
}

import { getCurrentUser, hasPermission } from '@/lib/auth';
import { DashboardReportsClient } from './DashboardReportsClient';

export const dynamic = 'force-dynamic';

export default async function DashboardReportsPage() {
  const currentUser = await getCurrentUser();
  const canView =
    currentUser?.roles.includes('system_management') ||
    (await hasPermission('reports.view.team')) ||
    (await hasPermission('dashboard.view.team'));

  if (!currentUser || !canView) {
    return (
      <div className="h-full rounded-xl border border-border bg-card flex items-center justify-center text-center">
        <div>
          <h1 className="text-lg font-bold text-foreground">Không có quyền xem dashboard báo cáo</h1>
          <p className="mt-2 text-sm text-muted-foreground">Tài khoản của bạn không được cấp quyền xem biểu đồ quản trị.</p>
        </div>
      </div>
    );
  }

  return <DashboardReportsClient />;
}

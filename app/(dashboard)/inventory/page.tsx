import { getCurrentUser, hasPermission } from '@/lib/auth';
import { InventoryClient } from './InventoryClient';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function InventoryPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <p className="text-muted-foreground">Vui lòng đăng nhập để xem thông tin tồn kho.</p>
      </div>
    );
  }

  // Check view permission
  const canView = currentUser.roles.includes('system_management') ||
    await hasPermission('inventory.view.all');

  if (!canView) {
    return (
      <div className="max-w-md mx-auto mt-20 glass-panel rounded-2xl p-8 text-center space-y-4">
        <div className="p-3 bg-red-100 rounded-full w-12 h-12 flex items-center justify-center text-red-600 mx-auto">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 00-2 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h1 className="text-lg font-bold text-foreground">Không có quyền truy cập</h1>
        <p className="text-sm text-muted-foreground">
          Tài khoản của bạn (<span className="font-mono text-xs">{currentUser.email}</span>) không được cấp quyền xem danh mục tồn kho.
        </p>
        <Link
          href="/"
          className="inline-block px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/95 transition-all cursor-pointer"
        >
          Quay lại Trang chủ
        </Link>
      </div>
    );
  }

  return <InventoryClient currentUser={currentUser} />;
}

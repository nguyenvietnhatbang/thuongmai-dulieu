import { NextResponse } from 'next/server';
import { getCurrentUser, hasPermission } from '@/lib/auth';
import { getDashboardAnalytics } from '@/features/dashboard/services/dashboard.service';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const allowed =
      user.roles.includes('system_management') ||
      (await hasPermission('reports.view.team')) ||
      (await hasPermission('dashboard.view.team'));
    if (!allowed) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const data = await getDashboardAnalytics({
      dateFrom: searchParams.get('dateFrom') || undefined,
      dateTo: searchParams.get('dateTo') || undefined,
      customerId: searchParams.get('customerId') || undefined,
      supplierId: searchParams.get('supplierId') || undefined,
      warehouseId: searchParams.get('warehouseId') || undefined,
    });

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('API Dashboard Analytics GET error:', error);
    return NextResponse.json({ success: false, error: 'Failed to load dashboard analytics' }, { status: 500 });
  }
}

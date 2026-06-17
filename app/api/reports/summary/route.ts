import { NextResponse } from 'next/server';
import { getCurrentUser, hasPermission } from '@/lib/auth';
import { getCommerceReportSummary } from '@/features/reports/services/report.service';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const allowed = user.roles.includes('system_management') || await hasPermission('reports.view.team');
    if (!allowed) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const summary = await getCommerceReportSummary({
      dateFrom: searchParams.get('dateFrom') || undefined,
      dateTo: searchParams.get('dateTo') || undefined,
      customerId: searchParams.get('customerId') || undefined,
      supplierId: searchParams.get('supplierId') || undefined,
      warehouseId: searchParams.get('warehouseId') || undefined,
    });
    return NextResponse.json({ success: true, data: summary });
  } catch (error) {
    console.error('API Reports Summary GET error:', error);
    return NextResponse.json({ success: false, error: 'Failed to load report summary' }, { status: 500 });
  }
}

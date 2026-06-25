import { NextResponse } from 'next/server';
import { getCurrentUser, hasPermission } from '@/lib/auth';
import { getStockIssueById } from '@/features/inventory/services/inventory.service';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const allowed = user.roles.includes('system_management') ||
      await hasPermission('stock_issues.view.all') ||
      await hasPermission('inventory.view.all');
    if (!allowed) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });

    const { id } = await params;
    const issue = await getStockIssueById(id);
    if (!issue) return NextResponse.json({ success: false, error: 'Stock issue not found' }, { status: 404 });

    return NextResponse.json({ success: true, data: issue });
  } catch (error: any) {
    console.error('API Stock Issue GET error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

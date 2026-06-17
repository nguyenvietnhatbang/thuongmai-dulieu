import { NextResponse } from 'next/server';
import { getCurrentUser, hasPermission } from '@/lib/auth';
import { getInventoryOverview } from '@/features/inventory/services/inventory.service';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const allowed = user.roles.includes('system_management') || await hasPermission('inventory.view.all');
    if (!allowed) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });

    const summary = await getInventoryOverview();
    return NextResponse.json({ success: true, data: summary });
  } catch (error) {
    console.error('API Inventory Summary GET error:', error);
    return NextResponse.json({ success: false, error: 'Failed to load inventory summary' }, { status: 500 });
  }
}

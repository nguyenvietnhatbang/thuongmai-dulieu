import { NextResponse } from 'next/server';
import { getCurrentUser, hasPermission } from '@/lib/auth';
import { confirmPurchaseOrder } from '@/features/inventory/services/inventory.service';

export const dynamic = 'force-dynamic';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const allowed = user.roles.includes('system_management') || await hasPermission('purchases.create.all');
    if (!allowed) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });

    const { id } = await params;
    await confirmPurchaseOrder(id, user.id);

    return NextResponse.json({ success: true, message: 'Purchase order confirmed and status set to ordered successfully.' });
  } catch (error: any) {
    console.error('API Purchase Order Confirm error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

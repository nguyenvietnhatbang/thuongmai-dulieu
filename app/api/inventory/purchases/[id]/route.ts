import { NextResponse } from 'next/server';
import { getCurrentUser, hasPermission } from '@/lib/auth';
import { cancelPurchaseOrder, getPurchaseOrderById } from '@/features/inventory/services/inventory.service';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const allowed = user.roles.includes('system_management') || await hasPermission('inventory.view.all');
    if (!allowed) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });

    const { id } = await params;
    const po = await getPurchaseOrderById(id);
    if (!po) return NextResponse.json({ success: false, error: 'Purchase Order not found' }, { status: 404 });

    return NextResponse.json({ success: true, data: po });
  } catch (error: any) {
    console.error('API Purchase GET by ID error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const allowed = user.roles.includes('system_management') || await hasPermission('purchases.create.all');
    if (!allowed) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });

    const { id } = await params;
    const body = await request.json();
    if (body.action !== 'cancel') {
      return NextResponse.json({ success: false, error: 'Unsupported action' }, { status: 400 });
    }

    await cancelPurchaseOrder(id, user.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('API Purchase PATCH error:', error);
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Update failed' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { getCurrentUser, hasPermission } from '@/lib/auth';
import { cancelSalesOrder, getSalesOrderById } from '@/features/inventory/services/inventory.service';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const allowed = user.roles.includes('system_management') || await hasPermission('inventory.view.all') || await hasPermission('sales_orders.create.all');
    if (!allowed) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });

    const { id } = await params;
    const so = await getSalesOrderById(id);
    if (!so) return NextResponse.json({ success: false, error: 'Sales Order not found' }, { status: 404 });

    return NextResponse.json({ success: true, data: so });
  } catch (error: any) {
    console.error('API Sales Order GET by ID error:', error);
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

    const allowed = user.roles.includes('system_management') || await hasPermission('sales_orders.create.all');
    if (!allowed) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });

    const { id } = await params;
    const body = await request.json();
    if (body.action !== 'cancel') {
      return NextResponse.json({ success: false, error: 'Unsupported action' }, { status: 400 });
    }

    await cancelSalesOrder(id, user.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('API Sales Order PATCH error:', error);
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Update failed' }, { status: 500 });
  }
}

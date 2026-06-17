import { NextResponse } from 'next/server';
import { getCurrentUser, hasPermission } from '@/lib/auth';
import { getPurchaseOrders, createPurchaseOrder } from '@/features/inventory/services/inventory.service';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const allowed = user.roles.includes('system_management') || await hasPermission('inventory.view.all');
    if (!allowed) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });

    const purchases = await getPurchaseOrders();
    return NextResponse.json({ success: true, data: purchases });
  } catch (error: any) {
    console.error('API Purchases GET error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const allowed = user.roles.includes('system_management') || await hasPermission('purchases.create.all');
    if (!allowed) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });

    const body = await request.json();
    const { code, supplierId, purchaseDate, items, notes } = body;

    if (!code || !supplierId || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ success: false, error: 'code, supplierId, and non-empty items array are required' }, { status: 400 });
    }

    const purchaseId = await createPurchaseOrder({
      code,
      supplierId,
      purchaseDate,
      items,
      notes,
      userId: user.id
    });

    return NextResponse.json({ success: true, data: { id: purchaseId } }, { status: 201 });
  } catch (error: any) {
    console.error('API Purchases POST error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

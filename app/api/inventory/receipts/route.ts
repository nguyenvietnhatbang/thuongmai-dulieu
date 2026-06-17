import { NextResponse } from 'next/server';
import { getCurrentUser, hasPermission } from '@/lib/auth';
import { getStockReceipts, createStockReceipt } from '@/features/inventory/services/inventory.service';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const allowed = user.roles.includes('system_management') || await hasPermission('inventory.view.all');
    if (!allowed) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });

    const receipts = await getStockReceipts();
    return NextResponse.json({ success: true, data: receipts });
  } catch (error: any) {
    console.error('API Receipts GET error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const allowed = user.roles.includes('system_management') || await hasPermission('stock_receipts.create.all');
    if (!allowed) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });

    const body = await request.json();
    const { code, purchaseOrderId, warehouseId, receiptDate, items, notes } = body;

    if (!code || !warehouseId || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ success: false, error: 'code, warehouseId, and non-empty items array are required' }, { status: 400 });
    }

    const receiptId = await createStockReceipt({
      code,
      purchaseOrderId,
      warehouseId,
      receiptDate,
      items,
      notes,
      userId: user.id
    });

    return NextResponse.json({ success: true, data: { id: receiptId } }, { status: 201 });
  } catch (error: any) {
    console.error('API Receipts POST error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

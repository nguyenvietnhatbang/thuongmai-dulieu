import { NextResponse } from 'next/server';
import { getCurrentUser, hasPermission } from '@/lib/auth';
import { getStockReceipts, createStockReceipt } from '@/features/inventory/services/inventory.service';
import { parsePagination, parseSort } from '@/lib/list-query';

export const dynamic = 'force-dynamic';

const receiptSorts = {
  code: 'sr.code',
  purchaseOrderCode: 'po.code',
  supplierName: 'supplierName',
  warehouseName: 'w.name',
  receiptDate: 'sr.receipt_date',
  totalQuantity: 'sr.total_quantity',
  totalAmount: 'sr.total_amount',
  status: 'sr.status',
};

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const allowed = user.roles.includes('system_management') || await hasPermission('inventory.view.all');
    if (!allowed) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const pagination = parsePagination(searchParams);
    const sort = parseSort(searchParams, receiptSorts, 'receiptDate');
    const receipts = await getStockReceipts({
      ...pagination,
      ...sort,
      search: searchParams.get('search') || undefined,
      status: searchParams.get('status') || undefined,
      warehouseId: searchParams.get('warehouseId') || undefined,
      supplierId: searchParams.get('supplierId') || undefined,
      qualityStatusId: searchParams.get('qualityStatusId') || undefined,
    });
    return NextResponse.json({ success: true, data: receipts.data, pagination: receipts.pagination });
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
    const {
      code,
      purchaseOrderId,
      supplierId,
      warehouseId,
      receiptDate,
      qualityStatusId,
      items,
      notes
    } = body;

    if (!code || !warehouseId || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ success: false, error: 'code, warehouseId, and non-empty items array are required' }, { status: 400 });
    }

    const receiptId = await createStockReceipt({
      code,
      purchaseOrderId,
      supplierId,
      warehouseId,
      receiptDate,
      qualityStatusId,
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

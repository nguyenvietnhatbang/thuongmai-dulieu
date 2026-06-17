import { NextResponse } from 'next/server';
import { getCurrentUser, hasPermission } from '@/lib/auth';
import { getPurchaseOrders, createPurchaseOrder } from '@/features/inventory/services/inventory.service';
import { parsePagination, parseSort } from '@/lib/list-query';

export const dynamic = 'force-dynamic';

const purchaseSorts = {
  code: 'po.code',
  supplierName: 's.name',
  purchaseDate: 'po.purchase_date',
  totalAmount: 'po.total_amount',
  status: 'po.status',
};

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const allowed = user.roles.includes('system_management') || await hasPermission('inventory.view.all');
    if (!allowed) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const pagination = parsePagination(searchParams);
    const sort = parseSort(searchParams, purchaseSorts, 'purchaseDate');
    const purchases = await getPurchaseOrders({
      ...pagination,
      ...sort,
      search: searchParams.get('search') || undefined,
      status: searchParams.get('status') || undefined,
      supplierId: searchParams.get('supplierId') || undefined,
    });
    return NextResponse.json({ success: true, data: purchases.data, pagination: purchases.pagination });
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

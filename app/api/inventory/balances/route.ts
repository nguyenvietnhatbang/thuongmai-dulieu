import { NextResponse } from 'next/server';
import { getCurrentUser, hasPermission } from '@/lib/auth';
import { getInventoryBalances } from '@/features/inventory/services/inventory.service';
import { parsePagination, parseSort } from '@/lib/list-query';

export const dynamic = 'force-dynamic';

const balanceSorts = {
  productName: 'p.name',
  productCode: 'p.code',
  warehouseName: 'w.name',
  quantityOnHand: 'b.quantity_on_hand',
  minQuantity: 'b.min_quantity',
};

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const allowed = user.roles.includes('system_management') || await hasPermission('inventory.view.all');
    if (!allowed) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const pagination = parsePagination(searchParams);
    const sort = parseSort(searchParams, balanceSorts, 'productName');
    const balances = await getInventoryBalances({
      ...pagination,
      ...sort,
      search: searchParams.get('search') || undefined,
      warehouseId: searchParams.get('warehouseId') || undefined,
      stockState: searchParams.get('stockState') || undefined,
    });
    return NextResponse.json({ success: true, data: balances.data, pagination: balances.pagination });
  } catch (error: any) {
    console.error('API Inventory Balances GET error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

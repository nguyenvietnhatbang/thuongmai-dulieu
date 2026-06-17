import { NextResponse } from 'next/server';
import { getCurrentUser, hasPermission } from '@/lib/auth';
import { getInventoryMovements } from '@/features/inventory/services/inventory.service';
import { parsePagination, parseSort } from '@/lib/list-query';

export const dynamic = 'force-dynamic';

const movementSorts = {
  createdAt: 'm.created_at',
  productName: 'p.name',
  productCode: 'p.code',
  warehouseName: 'w.name',
  movementType: 'm.movement_type',
  quantityDelta: 'm.quantity_delta',
  unitCost: 'm.unit_cost',
};

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const allowed = user.roles.includes('system_management') || await hasPermission('inventory.view.all');
    if (!allowed) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const pagination = parsePagination(searchParams);
    const sort = parseSort(searchParams, movementSorts, 'createdAt');
    const movements = await getInventoryMovements({
      ...pagination,
      ...sort,
      search: searchParams.get('search') || undefined,
      warehouseId: searchParams.get('warehouseId') || undefined,
      movementType: searchParams.get('movementType') || undefined,
    });
    return NextResponse.json({ success: true, data: movements.data, pagination: movements.pagination });
  } catch (error: any) {
    console.error('API Inventory Movements GET error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

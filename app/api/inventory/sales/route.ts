import { NextResponse } from 'next/server';
import { getCurrentUser, hasPermission } from '@/lib/auth';
import { getSalesOrders, createSalesOrder } from '@/features/inventory/services/inventory.service';
import { parsePagination, parseSort } from '@/lib/list-query';

export const dynamic = 'force-dynamic';

const salesSorts = {
  code: 'so.code',
  customerName: 'c.name',
  saleDate: 'so.sale_date',
  expectedDeliveryDate: 'so.expected_delivery_date',
  totalAmount: 'so.total_amount',
  paidAmount: 'so.paid_amount',
  debtAmount: 'so.debt_amount',
  status: 'so.status',
};

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const allowed = user.roles.includes('system_management') || await hasPermission('inventory.view.all') || await hasPermission('sales_orders.create.all');
    if (!allowed) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const pagination = parsePagination(searchParams);
    const sort = parseSort(searchParams, salesSorts, 'saleDate');
    const sales = await getSalesOrders({
      ...pagination,
      ...sort,
      search: searchParams.get('search') || undefined,
      status: searchParams.get('status') || undefined,
      customerId: searchParams.get('customerId') || undefined,
      warehouseId: searchParams.get('warehouseId') || undefined,
    });
    return NextResponse.json({ success: true, data: sales.data, pagination: sales.pagination });
  } catch (error: any) {
    console.error('API Sales GET error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const allowed = user.roles.includes('system_management') || await hasPermission('sales_orders.create.all');
    if (!allowed) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });

    const body = await request.json();
    const {
      code,
      customerId,
      contactId,
      saleDate,
      expectedDeliveryDate,
      warehouseId,
      paymentDueDate,
      paidAmount,
      items,
      notes
    } = body;

    if (!code || !customerId || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ success: false, error: 'code, customerId, and non-empty items array are required' }, { status: 400 });
    }

    const salesOrderId = await createSalesOrder({
      code,
      customerId,
      contactId,
      saleDate,
      expectedDeliveryDate,
      warehouseId,
      paymentDueDate,
      paidAmount: Number(paidAmount || 0),
      items,
      notes,
      userId: user.id
    });

    return NextResponse.json({ success: true, data: { id: salesOrderId } }, { status: 201 });
  } catch (error: any) {
    console.error('API Sales POST error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

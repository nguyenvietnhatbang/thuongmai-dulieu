import { NextResponse } from 'next/server';
import { getCurrentUser, hasPermission } from '@/lib/auth';
import { createStockIssue, getStockIssues } from '@/features/inventory/services/inventory.service';
import { parsePagination, parseSort } from '@/lib/list-query';

export const dynamic = 'force-dynamic';

const issueSorts = {
  code: 'si.code',
  salesOrderCode: 'so.code',
  customerName: 'c.name',
  warehouseName: 'w.name',
  issueDate: 'si.issue_date',
  totalQuantity: 'si.total_quantity',
  totalCost: 'si.total_cost',
  status: 'si.status',
};

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const allowed = user.roles.includes('system_management') ||
      await hasPermission('stock_issues.view.all') ||
      await hasPermission('inventory.view.all');
    if (!allowed) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const pagination = parsePagination(searchParams);
    const sort = parseSort(searchParams, issueSorts, 'issueDate');
    const issues = await getStockIssues({
      ...pagination,
      ...sort,
      search: searchParams.get('search') || undefined,
      status: searchParams.get('status') || undefined,
      warehouseId: searchParams.get('warehouseId') || undefined,
      salesOrderId: searchParams.get('salesOrderId') || undefined,
      customerId: searchParams.get('customerId') || undefined,
    });

    return NextResponse.json({ success: true, data: issues.data, pagination: issues.pagination });
  } catch (error: any) {
    console.error('API Stock Issues GET error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const allowed = user.roles.includes('system_management') || await hasPermission('stock_issues.create.all');
    if (!allowed) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });

    const body = await request.json();
    const { code, salesOrderId, customerId, warehouseId, issueDate, items, notes } = body;

    if (!code || !warehouseId || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ success: false, error: 'code, warehouseId, and non-empty items[] are required' }, { status: 400 });
    }

    const issueId = await createStockIssue({
      code,
      salesOrderId,
      customerId,
      warehouseId,
      issueDate,
      items,
      notes,
      userId: user.id,
    });

    return NextResponse.json({ success: true, data: { id: issueId } }, { status: 201 });
  } catch (error: any) {
    console.error('API Stock Issues POST error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

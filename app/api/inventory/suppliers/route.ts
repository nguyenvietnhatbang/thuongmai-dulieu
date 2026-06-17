import { NextResponse } from 'next/server';
import { getCurrentUser, hasPermission } from '@/lib/auth';
import { getSuppliers, createSupplier } from '@/features/inventory/services/inventory.service';
import { parsePagination, parseSort } from '@/lib/list-query';

export const dynamic = 'force-dynamic';

const supplierSorts = {
  code: 'code',
  name: 'name',
  email: 'email',
  status: 'status',
};

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const pagination = parsePagination(searchParams);
    const sort = parseSort(searchParams, supplierSorts, 'name');
    const suppliers = await getSuppliers({
      ...pagination,
      ...sort,
      search: searchParams.get('search') || undefined,
      status: searchParams.get('status') || undefined,
    });
    return NextResponse.json({ success: true, data: suppliers.data, pagination: suppliers.pagination });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const allowed = user.roles.includes('system_management') || await hasPermission('inventory.adjust.all');
    if (!allowed) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });

    const body = await request.json();
    const { code, name, phone, email, address, status } = body;

    if (!code || !name) {
      return NextResponse.json({ success: false, error: 'code and name are required' }, { status: 400 });
    }

    const supplier = await createSupplier({ code, name, phone, email, address, status: status || 'active' });
    return NextResponse.json({ success: true, data: supplier }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

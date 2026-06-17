import { NextResponse } from 'next/server';
import { getCurrentUser, getPermissionScope, hasPermission } from '@/lib/auth';
import { getCustomers, createCustomer } from '@/features/customers/services/customer.service';
import { parsePagination, parseSort } from '@/lib/list-query';

export const dynamic = 'force-dynamic';

/**
 * GET: Fetch a list of customers based on user's permission scopes
 */
export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // 1. Resolve RBAC Scope for viewing customers
    const scope = await getPermissionScope('customers', 'view');
    if (!scope) {
      return NextResponse.json({ success: false, error: 'Forbidden: You do not have permission to view customers' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || undefined;
    const status = searchParams.get('status') || undefined;
    const customerType = searchParams.get('customerType') || undefined;
    const pagination = parsePagination(searchParams);
    const sort = parseSort(searchParams, {
      createdAt: 'c.created_at',
      code: 'c.code',
      name: 'c.name',
      customerType: 'c.customer_type',
      ownerName: 'u.full_name',
      status: 'c.status',
    }, 'createdAt');

    // 2. Fetch customers within user scope bounds
    const result = await getCustomers({
      search,
      status,
      customerType,
      ...pagination,
      ...sort,
      scope: (scope === 'department' ? 'team' : scope) as 'own' | 'team' | 'all',
      currentUserDeptId: user.departmentId,
      currentUserId: user.id
    });

    return NextResponse.json({
      success: true,
      data: result.customers,
      pagination: {
        page: pagination.page,
        total: result.total,
        totalPages: Math.max(1, Math.ceil(result.total / pagination.limit)),
        limit: pagination.limit,
        offset: pagination.offset
      }
    });
  } catch (error: any) {
    console.error('API Customers GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch customers', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST: Create a new customer
 */
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Check permissions
    const allowed = await hasPermission('customers.create.all');
    if (!allowed) {
      return NextResponse.json({ success: false, error: 'Forbidden: You cannot create customers' }, { status: 403 });
    }

    const body = await request.json();
    const { code, name, customerType, ownerUserId, status, phone, email, taxCode, address, notes } = body;

    // Validation
    if (!code || !name || !customerType) {
      return NextResponse.json({ success: false, error: 'Missing required fields: code, name, customerType' }, { status: 400 });
    }

    if (!['service', 'commerce', 'both'].includes(customerType)) {
      return NextResponse.json({ success: false, error: 'Invalid customerType. Must be service, commerce, or both' }, { status: 400 });
    }

    // Call service to write to database
    const newCustomer = await createCustomer({
      code,
      name,
      customerType,
      ownerUserId,
      status,
      phone,
      email,
      taxCode,
      address,
      notes,
      userId: user.id
    });

    return NextResponse.json({
      success: true,
      data: newCustomer,
      message: 'Customer created successfully'
    }, { status: 201 });
  } catch (error: any) {
    console.error('API Customers POST error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create customer', details: error.message },
      { status: 500 }
    );
  }
}

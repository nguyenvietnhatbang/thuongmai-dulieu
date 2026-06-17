import { NextResponse } from 'next/server';
import { getCurrentUser, getPermissionScope, hasPermission } from '@/lib/auth';
import { getCustomerById, updateCustomer, deleteCustomer } from '@/features/customers/services/customer.service';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * Helper to verify if the current user can access a specific customer record
 * based on their permission scope
 */
async function canAccessCustomer(
  customerId: string,
  action: 'view' | 'update',
  userId: string,
  userDeptId: string | null,
  roles: string[]
): Promise<boolean> {
  if (roles.includes('system_management')) return true;

  const scope = await getPermissionScope('customers', action);
  if (!scope) return false;
  if (scope === 'all') return true;

  // Fetch record owner
  const ownerRes = await query('SELECT owner_user_id FROM app.customers WHERE id = $1', [customerId]);
  if (ownerRes.rows.length === 0) return false;
  const ownerId = ownerRes.rows[0].owner_user_id;

  if (scope === 'own') {
    return ownerId === userId;
  }

  if (scope === 'team' && userDeptId) {
    if (!ownerId) return false;
    // Check if owner is in the same department
    const ownerDeptRes = await query('SELECT department_id FROM app.users WHERE id = $1', [ownerId]);
    return ownerDeptRes.rows[0]?.department_id === userDeptId;
  }

  return false;
}

/**
 * GET: Retrieve details of a single customer
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Check row access
    const allowed = await canAccessCustomer(id, 'view', user.id, user.departmentId, user.roles);
    if (!allowed) {
      return NextResponse.json({ success: false, error: 'Forbidden: Access denied to this customer record' }, { status: 403 });
    }

    const customer = await getCustomerById(id);
    if (!customer) {
      return NextResponse.json({ success: false, error: 'Customer not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: customer
    });
  } catch (error: any) {
    console.error('API Customer GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve customer', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * PATCH: Update customer details
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Check row access for updates
    const allowed = await canAccessCustomer(id, 'update', user.id, user.departmentId, user.roles);
    if (!allowed) {
      return NextResponse.json({ success: false, error: 'Forbidden: You do not have permission to update this customer' }, { status: 403 });
    }

    const body = await request.json();

    const updated = await updateCustomer(id, body, user.id);
    return NextResponse.json({
      success: true,
      data: updated,
      message: 'Customer updated successfully'
    });
  } catch (error: any) {
    console.error('API Customer PATCH error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update customer', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE: Delete a customer (soft delete)
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Must have the delete all permission
    const allowed = await hasPermission('customers.delete.all');
    if (!allowed) {
      return NextResponse.json({ success: false, error: 'Forbidden: You do not have permission to delete customers' }, { status: 403 });
    }

    const { id } = await params;

    const deleted = await deleteCustomer(id, user.id);
    if (!deleted) {
      return NextResponse.json({ success: false, error: 'Customer not found or already deleted' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Customer deleted successfully'
    });
  } catch (error: any) {
    console.error('API Customer DELETE error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete customer', details: error.message },
      { status: 500 }
    );
  }
}

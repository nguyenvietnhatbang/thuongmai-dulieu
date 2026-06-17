import { NextResponse } from 'next/server';
import { getCurrentUser, getPermissionScope, hasPermission } from '@/lib/auth';
import { getContractById, updateContract } from '@/features/contracts/services/contract.service';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * Check row-level access for contracts
 */
async function canAccessContract(
  contractId: string,
  userId: string,
  userDeptId: string | null,
  roles: string[]
): Promise<boolean> {
  if (roles.includes('system_management')) return true;

  const scope = await getPermissionScope('contracts', 'view');
  if (!scope) return false;
  if (scope === 'all') return true;

  const res = await query('SELECT owner_user_id FROM app.contracts WHERE id = $1', [contractId]);
  if (res.rows.length === 0) return false;
  const ownerId = res.rows[0].owner_user_id;

  if (scope === 'own') {
    return ownerId === userId;
  }

  if (scope === 'team' && userDeptId) {
    if (!ownerId) return false;
    const ownerDeptRes = await query('SELECT department_id FROM app.users WHERE id = $1', [ownerId]);
    return ownerDeptRes.rows[0]?.department_id === userDeptId;
  }

  return false;
}

/**
 * GET: Retrieve details of a single contract with milestones
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

    const allowed = await canAccessContract(id, user.id, user.departmentId, user.roles);
    if (!allowed) {
      return NextResponse.json({ success: false, error: 'Forbidden: Access denied to this contract' }, { status: 403 });
    }

    const contract = await getContractById(id);
    if (!contract) {
      return NextResponse.json({ success: false, error: 'Contract not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: contract
    });
  } catch (error: any) {
    console.error('API Contract GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve contract', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * PATCH: Update contract status (e.g., signing it)
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

    // Must be authorized to edit contract
    const allowed = await canAccessContract(id, user.id, user.departmentId, user.roles);
    if (!allowed) {
      return NextResponse.json({ success: false, error: 'Forbidden: Access denied to edit this contract' }, { status: 403 });
    }

    const body = await request.json();

    // Enforce contracts.sign.all permission for signing contracts
    if (body.status === 'signed') {
      const canSign = user.roles.includes('system_management') || await hasPermission('contracts.sign.all');
      if (!canSign) {
        return NextResponse.json({ success: false, error: 'Forbidden: You do not have permission to sign contracts' }, { status: 403 });
      }
    }

    const updated = await updateContract(id, { ...body, userId: user.id });
    return NextResponse.json({
      success: true,
      data: updated,
      message: 'Contract updated successfully'
    });
  } catch (error: any) {
    console.error('API Contract PATCH error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update contract' },
      { status: 500 }
    );
  }
}

import { NextResponse } from 'next/server';
import { getCurrentUser, getPermissionScope, hasPermission } from '@/lib/auth';
import { getOpportunityById, updateOpportunity, deleteOpportunity } from '@/features/opportunities/services/opportunity.service';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * Check row-level access for opportunities
 */
async function canAccessOpportunity(
  oppId: string,
  userId: string,
  userDeptId: string | null,
  roles: string[]
): Promise<boolean> {
  if (roles.includes('system_management')) return true;

  const scope = await getPermissionScope('opportunities', 'view');
  if (!scope) return false;
  if (scope === 'all') return true;

  const res = await query('SELECT owner_user_id FROM app.opportunities WHERE id = $1', [oppId]);
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
 * GET: Retrieve a single opportunity
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

    const allowed = await canAccessOpportunity(id, user.id, user.departmentId, user.roles);
    if (!allowed) {
      return NextResponse.json({ success: false, error: 'Forbidden: Access denied to this opportunity' }, { status: 403 });
    }

    const opp = await getOpportunityById(id);
    if (!opp) {
      return NextResponse.json({ success: false, error: 'Opportunity not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: opp
    });
  } catch (error: any) {
    console.error('API Opportunity GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve opportunity', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * PATCH: Update an opportunity (includes changing stages)
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

    // Must be able to view/access the opportunity to edit it
    const allowed = await canAccessOpportunity(id, user.id, user.departmentId, user.roles);
    if (!allowed) {
      return NextResponse.json({ success: false, error: 'Forbidden: Access denied to edit this opportunity' }, { status: 403 });
    }

    const body = await request.json();

    const updated = await updateOpportunity(id, body, user.id);
    return NextResponse.json({
      success: true,
      data: updated,
      message: 'Opportunity updated successfully'
    });
  } catch (error: any) {
    console.error('API Opportunity PATCH error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update opportunity', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE: Delete an opportunity
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

    // Check basic delete permission (requires system management or general privileges)
    const canDel = user.roles.includes('system_management') || await hasPermission('opportunities.create.all');
    if (!canDel) {
      return NextResponse.json({ success: false, error: 'Forbidden: Permission denied' }, { status: 403 });
    }

    const { id } = await params;

    const deleted = await deleteOpportunity(id, user.id);
    if (!deleted) {
      return NextResponse.json({ success: false, error: 'Opportunity not found or already deleted' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Opportunity deleted successfully'
    });
  } catch (error: any) {
    console.error('API Opportunity DELETE error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete opportunity', details: error.message },
      { status: 500 }
    );
  }
}

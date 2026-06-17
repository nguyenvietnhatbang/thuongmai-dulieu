import { NextResponse } from 'next/server';
import { getCurrentUser, getPermissionScope } from '@/lib/auth';
import { completeReminder } from '@/features/customer-care/services/care.service';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

async function canAccessReminder(
  reminderId: string,
  userId: string,
  userDeptId: string | null,
  roles: string[]
): Promise<boolean> {
  if (roles.includes('system_management')) return true;

  const scope = await getPermissionScope('customer_care', 'view');
  if (!scope) return false;
  if (scope === 'all') return true;

  // Fetch reminder details
  const remRes = await query(`
    SELECT r.owner_user_id, u.department_id 
    FROM app.customer_care_reminders r
    LEFT JOIN app.users u ON r.owner_user_id = u.id
    WHERE r.id = $1 AND r.deleted_at IS NULL
  `, [reminderId]);
  if (remRes.rows.length === 0) return false;
  const { owner_user_id: ownerId, department_id: ownerDeptId } = remRes.rows[0];

  if (scope === 'own') {
    return ownerId === userId;
  }

  if (scope === 'team' || scope === 'department') {
    if (!userDeptId) return false;
    return ownerDeptId === userDeptId;
  }

  return false;
}

export async function POST(
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
    const allowed = await canAccessReminder(id, user.id, user.departmentId, user.roles);
    if (!allowed) {
      return NextResponse.json({ success: false, error: 'Forbidden: Access denied to this care reminder' }, { status: 403 });
    }

    const body = await request.json();
    const { result, status, nextCareDate, nextCareContent } = body;

    if (!result) {
      return NextResponse.json({ success: false, error: 'result is required' }, { status: 400 });
    }

    const updatedReminder = await completeReminder(id, {
      result,
      status,
      nextCareDate,
      nextCareContent,
      userId: user.id
    });

    return NextResponse.json({
      success: true,
      data: updatedReminder,
      message: 'Reminder completed successfully'
    });
  } catch (error: any) {
    console.error('API Customer Care Complete POST error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to complete reminder', details: error.message },
      { status: 500 }
    );
  }
}

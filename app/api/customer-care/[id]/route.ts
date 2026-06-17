import { NextResponse } from 'next/server';
import { getCurrentUser, getPermissionScope } from '@/lib/auth';
import { deleteReminder, updateReminder } from '@/features/customer-care/services/care.service';
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

  const remRes = await query(`
    SELECT r.owner_user_id, u.department_id
    FROM app.customer_care_reminders r
    LEFT JOIN app.users u ON r.owner_user_id = u.id
    WHERE r.id = $1 AND r.deleted_at IS NULL
  `, [reminderId]);
  if (remRes.rows.length === 0) return false;

  const { owner_user_id: ownerId, department_id: ownerDeptId } = remRes.rows[0];
  if (scope === 'own') return ownerId === userId;
  if ((scope === 'team' || scope === 'department') && userDeptId) return ownerDeptId === userDeptId;
  return false;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const allowed = await canAccessReminder(id, user.id, user.departmentId, user.roles);
    if (!allowed) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });

    const body = await request.json();
    const updated = await updateReminder(id, { ...body, userId: user.id });
    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error('API Customer Care PATCH error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to update reminder' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const allowed = await canAccessReminder(id, user.id, user.departmentId, user.roles);
    if (!allowed) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });

    const deleted = await deleteReminder(id, user.id);
    if (!deleted) return NextResponse.json({ success: false, error: 'Reminder not found' }, { status: 404 });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('API Customer Care DELETE error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to delete reminder' }, { status: 500 });
  }
}

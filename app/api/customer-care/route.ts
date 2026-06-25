import { NextResponse } from 'next/server';
import { getCurrentUser, getPermissionScope } from '@/lib/auth';
import { getReminders, createReminder } from '@/features/customer-care/services/care.service';
import { parsePagination, parseSort } from '@/lib/list-query';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const scope = await getPermissionScope('customer_care', 'view');
    if (!scope) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || undefined;
    const status = searchParams.get('status') || undefined;
    const pagination = parsePagination(searchParams);
    const sort = parseSort(searchParams, {
      reminderDate: 'r.reminder_date',
      customerName: 'c.name',
      ownerName: 'u.full_name',
      status: 'r.status',
      createdAt: 'r.created_at',
    }, 'reminderDate');

    const result = await getReminders({
      search,
      status,
      scope: (scope === 'department' ? 'team' : scope) as 'own' | 'team' | 'all',
      currentUserId: user.id,
      currentUserDeptId: user.departmentId,
      ...pagination,
      ...sort
    });

    return NextResponse.json({ success: true, data: result.data, pagination: result.pagination });
  } catch (error: any) {
    console.error('API Customer Care GET error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const scope = await getPermissionScope('customer_care', 'view');
    if (!scope) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });

    const body = await request.json();
    const { customerId, contactId, careTypeId, contractId, projectId, reminderDate, content, ownerUserId } = body;

    if (!customerId || !reminderDate || !content) {
      return NextResponse.json({ success: false, error: 'customerId, reminderDate, and content are required' }, { status: 400 });
    }

    const newReminder = await createReminder({
      customerId,
      contactId,
      careTypeId,
      contractId,
      projectId,
      reminderDate,
      content,
      ownerUserId: ownerUserId || user.id,
      userId: user.id
    });

    return NextResponse.json({ success: true, data: newReminder }, { status: 201 });
  } catch (error: any) {
    console.error('API Customer Care POST error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

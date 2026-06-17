import { NextResponse } from 'next/server';
import { getCurrentUser, getPermissionScope, hasPermission } from '@/lib/auth';
import { getReceivables, collectReceivable, remindCollector } from '@/features/receivables/services/receivable.service';
import { parsePagination, parseSort } from '@/lib/list-query';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const scope = await getPermissionScope('receivables', 'view');
    if (!scope) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || undefined;
    const status = searchParams.get('status') || undefined;
    const pagination = parsePagination(searchParams);
    const sort = parseSort(searchParams, {
      dueDate: 'r.due_date',
      code: 'r.code',
      customerName: 'c.name',
      amountDue: 'r.amount_due',
      remainingAmount: '(r.amount_due - r.amount_paid)',
      status: 'r.status',
    }, 'dueDate');

    const result = await getReceivables({
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
    console.error('API Receivables GET error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const allowed = user.roles.includes('system_management') || await hasPermission('receivables.update_status.all');
    if (!allowed) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });

    const body = await request.json();
    const { id, action, amountPaid, notes } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'id is required' }, { status: 400 });
    }

    if (action === 'remind') {
      const updated = await remindCollector(id, user.id);
      return NextResponse.json({ success: true, data: updated, message: 'Gửi nhắc nhở công nợ thành công!' });
    }

    if (amountPaid === undefined) {
      return NextResponse.json({ success: false, error: 'amountPaid is required' }, { status: 400 });
    }

    const updated = await collectReceivable(id, {
      amountPaid: Number(amountPaid),
      notes,
      userId: user.id
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error('API Receivables PATCH error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

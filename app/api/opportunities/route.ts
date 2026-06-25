import { NextResponse } from 'next/server';
import { getCurrentUser, getPermissionScope, hasPermission } from '@/lib/auth';
import { getOpportunities, createOpportunity } from '@/features/opportunities/services/opportunity.service';
import { parsePagination, parseSort } from '@/lib/list-query';

export const dynamic = 'force-dynamic';

/**
 * GET: Retrieve list of opportunities matching user's permission scope
 */
export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const scope = await getPermissionScope('opportunities', 'view');
    if (!scope) {
      return NextResponse.json({ success: false, error: 'Forbidden: Missing view permission' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || undefined;
    const stage = searchParams.get('stage') || undefined;
    const serviceId = searchParams.get('serviceId') || undefined;
    const pagination = parsePagination(searchParams);
    const sort = parseSort(searchParams, {
      createdAt: 'o.created_at',
      code: 'o.code',
      title: 'o.title',
      customerName: 'c.name',
      serviceName: 'service.name',
      expectedValue: 'o.expected_value',
      expectedCloseDate: 'o.expected_close_date',
      stage: 'o.stage',
    }, 'createdAt');

    const result = await getOpportunities({
      search,
      stage,
      serviceId,
      scope: (scope === 'department' ? 'team' : scope) as 'own' | 'team' | 'all',
      currentUserId: user.id,
      currentUserDeptId: user.departmentId,
      ...pagination,
      ...sort
    });

    return NextResponse.json({
      success: true,
      data: result.data,
      pagination: result.pagination
    });
  } catch (error: any) {
    console.error('API Opportunities GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch opportunities', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST: Create a new opportunity
 */
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const allowed = await hasPermission('opportunities.create.all');
    if (!allowed) {
      return NextResponse.json({ success: false, error: 'Forbidden: Missing creation permission' }, { status: 403 });
    }

    const body = await request.json();
    const { code, customerId, contactId, serviceId, title, needDescription, expectedValue, expectedCloseDate, ownerUserId, stage, notes } = body;

    if (!code || !customerId || !title) {
      return NextResponse.json({ success: false, error: 'Missing required fields: code, customerId, title' }, { status: 400 });
    }

    const newOpp = await createOpportunity({
      code,
      customerId,
      contactId,
      serviceId,
      title,
      needDescription,
      expectedValue: Number(expectedValue || 0),
      expectedCloseDate,
      ownerUserId,
      stage: stage || 'new',
      notes,
      userId: user.id
    });

    return NextResponse.json({
      success: true,
      data: newOpp,
      message: 'Opportunity created successfully'
    }, { status: 201 });
  } catch (error: any) {
    console.error('API Opportunities POST error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create opportunity', details: error.message },
      { status: 500 }
    );
  }
}

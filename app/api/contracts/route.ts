import { NextResponse } from 'next/server';
import { getCurrentUser, getPermissionScope } from '@/lib/auth';
import { getContracts } from '@/features/contracts/services/contract.service';
import { parsePagination, parseSort } from '@/lib/list-query';

export const dynamic = 'force-dynamic';

/**
 * GET: Retrieve list of contracts matching user's permission scope
 */
export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const scope = await getPermissionScope('contracts', 'view');
    if (!scope) {
      return NextResponse.json({ success: false, error: 'Forbidden: Missing view permission' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || undefined;
    const status = searchParams.get('status') || undefined;
    const pagination = parsePagination(searchParams);
    const sort = parseSort(searchParams, {
      createdAt: 'ctr.created_at',
      contractNumber: 'ctr.contract_number',
      customerName: 'c.name',
      contractValue: 'ctr.contract_value',
      signedDate: 'ctr.signed_date',
      status: 'ctr.status',
    }, 'createdAt');

    const result = await getContracts({
      search,
      status,
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
    console.error('API Contracts GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch contracts', details: error.message },
      { status: 500 }
    );
  }
}

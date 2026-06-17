import { NextResponse } from 'next/server';
import { getCurrentUser, getPermissionScope } from '@/lib/auth';
import { getProjects } from '@/features/projects/services/project.service';
import { parsePagination, parseSort } from '@/lib/list-query';

export const dynamic = 'force-dynamic';

/**
 * GET: Retrieve list of projects matching user's permission scope
 */
export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const scope = await getPermissionScope('projects', 'view');
    if (!scope) {
      return NextResponse.json({ success: false, error: 'Forbidden: Missing view permission' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || undefined;
    const status = searchParams.get('status') || undefined;
    const pagination = parsePagination(searchParams);
    const sort = parseSort(searchParams, {
      createdAt: 'p.created_at',
      code: 'p.code',
      name: 'p.name',
      customerName: 'c.name',
      progressPercent: 'p.progress_percent',
      status: 'p.status',
    }, 'createdAt');

    const result = await getProjects({
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
    console.error('API Projects GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch projects', details: error.message },
      { status: 500 }
    );
  }
}

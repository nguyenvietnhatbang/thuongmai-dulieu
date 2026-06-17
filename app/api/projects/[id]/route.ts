import { NextResponse } from 'next/server';
import { getCurrentUser, getPermissionScope } from '@/lib/auth';
import { getProjectById, updateProject, deleteProject } from '@/features/projects/services/project.service';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * Check row-level access for projects
 */
async function canAccessProject(
  projectId: string,
  userId: string,
  userDeptId: string | null,
  roles: string[]
): Promise<boolean> {
  if (roles.includes('system_management')) return true;

  const scope = await getPermissionScope('projects', 'view');
  if (!scope) return false;
  if (scope === 'all') return true;

  const res = await query('SELECT project_manager_user_id FROM app.projects WHERE id = $1', [projectId]);
  if (res.rows.length === 0) return false;
  const pmId = res.rows[0].project_manager_user_id;

  if (scope === 'own') {
    return pmId === userId;
  }

  if (scope === 'team' && userDeptId) {
    if (!pmId) return false;
    const pmDeptRes = await query('SELECT department_id FROM app.users WHERE id = $1', [pmId]);
    return pmDeptRes.rows[0]?.department_id === userDeptId;
  }

  return false;
}

/**
 * Check write permission for project
 */
async function canModifyProject(projectId: string, userId: string, roles: string[]): Promise<boolean> {
  if (roles.includes('system_management') || roles.includes('project_operation')) return true;

  const res = await query('SELECT project_manager_user_id FROM app.projects WHERE id = $1', [projectId]);
  if (res.rows.length === 0) return false;
  return res.rows[0].project_manager_user_id === userId;
}

/**
 * GET: Retrieve details of a single project
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

    const allowed = await canAccessProject(id, user.id, user.departmentId, user.roles);
    if (!allowed) {
      return NextResponse.json({ success: false, error: 'Forbidden: Access denied to this project' }, { status: 403 });
    }

    const project = await getProjectById(id);
    if (!project) {
      return NextResponse.json({ success: false, error: 'Project not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: project
    });
  } catch (error: any) {
    console.error('API Project GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve project', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * PATCH: Update project details
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

    const allowed = await canModifyProject(id, user.id, user.roles);
    if (!allowed) {
      return NextResponse.json({ success: false, error: 'Forbidden: Missing modify permissions' }, { status: 403 });
    }

    const body = await request.json();
    const updated = await updateProject(id, body, user.id);

    return NextResponse.json({
      success: true,
      data: updated,
      message: 'Dự án đã được cập nhật thành công!'
    });
  } catch (error: any) {
    console.error('API Project PATCH error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

/**
 * DELETE: Soft delete project
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

    const { id } = await params;

    const allowed = user.roles.includes('system_management');
    if (!allowed) {
      return NextResponse.json({ success: false, error: 'Forbidden: Only administrators can delete projects' }, { status: 403 });
    }

    const deleted = await deleteProject(id, user.id);
    return NextResponse.json({
      success: true,
      deleted,
      message: 'Đã xóa dự án triển khai thành công!'
    });
  } catch (error: any) {
    console.error('API Project DELETE error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

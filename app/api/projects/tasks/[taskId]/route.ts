import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { updateProjectTask } from '@/features/projects/services/project.service';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * Check if user has permission to update the task
 */
async function canUpdateTask(taskId: string, userId: string, roles: string[]): Promise<boolean> {
  if (roles.includes('system_management') || roles.includes('project_operation')) return true;

  // Assignees can update the task state of tasks assigned to them
  const res = await query('SELECT assignee_user_id FROM app.project_tasks WHERE id = $1', [taskId]);
  if (res.rows.length === 0) return false;
  return res.rows[0].assignee_user_id === userId;
}

/**
 * PATCH: Update task details or complete it
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { taskId } = await params;

    const allowed = await canUpdateTask(taskId, user.id, user.roles);
    if (!allowed) {
      return NextResponse.json({ success: false, error: 'Forbidden: Access denied to edit this task' }, { status: 403 });
    }

    const body = await request.json();

    const updated = await updateProjectTask(taskId, body, user.id);
    return NextResponse.json({
      success: true,
      data: updated,
      message: 'Task updated successfully'
    });
  } catch (error: any) {
    console.error('API Project Task PATCH error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update task', details: error.message },
      { status: 500 }
    );
  }
}

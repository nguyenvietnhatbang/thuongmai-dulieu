import { NextResponse } from 'next/server';
import { getCurrentUser, hasPermission } from '@/lib/auth';
import { getProjectTasks, createProjectTask } from '@/features/projects/services/project.service';

export const dynamic = 'force-dynamic';

/**
 * GET: Retrieve list of tasks for a project
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

    const tasks = await getProjectTasks(id);
    return NextResponse.json({
      success: true,
      data: tasks
    });
  } catch (error: any) {
    console.error('API Project Tasks GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch tasks', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST: Create a task in a project
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // PM and System Administrators can assign/create tasks
    const canCreate = user.roles.includes('system_management') || 
      user.roles.includes('project_operation') ||
      user.roles.includes('business_management') ||
      await hasPermission('projects.assign.team');

    if (!canCreate) {
      return NextResponse.json({ success: false, error: 'Forbidden: You cannot assign tasks' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const {
      customerId,
      title,
      description,
      assigneeUserId,
      startDate,
      dueDate,
      priority,
      progressPercent,
      result,
      collaboratorUserIds
    } = body;

    if (!title || !customerId) {
      return NextResponse.json({ success: false, error: 'Missing required fields: title, customerId' }, { status: 400 });
    }

    const newTask = await createProjectTask({
      projectId: id,
      customerId,
      title,
      description,
      assigneeUserId,
      startDate,
      dueDate,
      priority: priority || 'normal',
      progressPercent: Number(progressPercent || 0),
      result,
      collaboratorUserIds,
      userId: user.id
    });

    return NextResponse.json({
      success: true,
      data: newTask,
      message: 'Task created successfully'
    }, { status: 201 });
  } catch (error: any) {
    console.error('API Project Tasks POST error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create task', details: error.message },
      { status: 500 }
    );
  }
}
